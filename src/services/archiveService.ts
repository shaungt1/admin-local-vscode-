import archiver from 'archiver';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import extract from 'extract-zip';
import { ARCHIVE_METADATA_FILE, TOOLBOX_LINK_NAME } from '../constants';
import { ArchiveMetadata, ArchiveType } from '../types';

interface WalkResult {
  included: { relativePath: string; absolutePath: string }[];
  excluded: string[];
}

/**
 * Walks `.admin-local` using `lstat` so it never follows the Toolbox link (or any other
 * filesystem link) into the physical Toolbox. Only regular project-local files/dirs are included.
 */
export async function listProjectEntries(
  adminLocalPath: string,
  includeLegacyBackups: boolean
): Promise<WalkResult> {
  const included: WalkResult['included'] = [];
  const excluded: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      const relativePath = path.relative(adminLocalPath, absolutePath).split(path.sep).join('/');

      if (relativePath === TOOLBOX_LINK_NAME) {
        excluded.push(relativePath);
        continue;
      }
      if (!includeLegacyBackups && /^legacy-toolbox-backup-/.test(entry.name) && dir === adminLocalPath) {
        excluded.push(relativePath);
        continue;
      }

      const lst = await fs.promises.lstat(absolutePath);
      if (lst.isSymbolicLink()) {
        excluded.push(relativePath);
        continue;
      }
      if (lst.isDirectory()) {
        included.push({ relativePath, absolutePath });
        await walk(absolutePath);
      } else if (lst.isFile()) {
        included.push({ relativePath, absolutePath });
      }
    }
  }

  await walk(adminLocalPath);
  return { included, excluded };
}

function metadataFor(archiveType: ArchiveType): ArchiveMetadata {
  return {
    archiveType,
    schemaVersion: 2,
    createdAt: new Date().toISOString()
  };
}

async function writeZip(
  destPath: string,
  metadata: ArchiveMetadata,
  addEntries: (archive: archiver.Archiver) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', err => reject(err));
    archive.pipe(output);

    archive.append(JSON.stringify(metadata, null, 2), { name: ARCHIVE_METADATA_FILE });
    addEntries(archive);

    archive.finalize();
  });
}

export async function createProjectArchive(
  adminLocalPath: string,
  destPath: string,
  includeLegacyBackups: boolean
): Promise<{ bytes: number; fileCount: number; excluded: string[] }> {
  const { included, excluded } = await listProjectEntries(adminLocalPath, includeLegacyBackups);
  const files = included.filter(e => fs.statSync(e.absolutePath).isFile());

  const bytes = await writeZip(destPath, metadataFor('project-workspace'), archive => {
    for (const file of files) {
      archive.file(file.absolutePath, { name: file.relativePath });
    }
  });

  return { bytes, fileCount: files.length, excluded };
}

export async function createToolboxArchive(toolboxPath: string, destPath: string): Promise<number> {
  return writeZip(destPath, metadataFor('toolbox'), archive => {
    archive.directory(toolboxPath, false);
  });
}

export async function extractArchiveToTemp(archivePath: string): Promise<string> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'admin-local-import-'));
  await extract(archivePath, { dir: tempDir });
  return tempDir;
}

export async function readArchiveMetadata(tempDir: string): Promise<ArchiveMetadata> {
  const metadataPath = path.join(tempDir, ARCHIVE_METADATA_FILE);
  try {
    const raw = await fs.promises.readFile(metadataPath, 'utf8');
    return JSON.parse(raw) as ArchiveMetadata;
  } catch {
    return { archiveType: 'legacy-project-workspace', schemaVersion: 1, createdAt: new Date(0).toISOString() };
  }
}

export interface ImportValidation {
  safe: string[];
  rejected: { relativePath: string; reason: string }[];
}

/**
 * Validates every extracted archive entry before anything is copied into the live
 * `.admin-local` directory. Rejects traversal, absolute paths, links, and anything
 * targeting the Toolbox link name.
 */
export async function validateProjectImportEntries(tempDir: string): Promise<ImportValidation> {
  const safe: string[] = [];
  const rejected: ImportValidation['rejected'] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(dir, entry.name);
      const relativePath = path.relative(tempDir, absolutePath).split(path.sep).join('/');

      if (relativePath === ARCHIVE_METADATA_FILE) {
        continue;
      }
      if (path.isAbsolute(relativePath) || relativePath.split('/').includes('..')) {
        rejected.push({ relativePath, reason: 'path traversal or absolute path' });
        continue;
      }
      if (relativePath === TOOLBOX_LINK_NAME || relativePath.startsWith(`${TOOLBOX_LINK_NAME}/`)) {
        rejected.push({ relativePath, reason: 'targets the reserved Toolbox link name' });
        continue;
      }

      const lst = await fs.promises.lstat(absolutePath);
      if (lst.isSymbolicLink()) {
        rejected.push({ relativePath, reason: 'filesystem link entries are not allowed' });
        continue;
      }
      if (lst.isDirectory()) {
        await walk(absolutePath);
      } else if (lst.isFile()) {
        safe.push(relativePath);
      }
    }
  }

  await walk(tempDir);
  return { safe, rejected };
}

export async function copyApprovedFiles(
  tempDir: string,
  adminLocalPath: string,
  relativePaths: string[]
): Promise<void> {
  for (const relativePath of relativePaths) {
    const source = path.join(tempDir, relativePath);
    const destination = path.join(adminLocalPath, relativePath);
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(source, destination);
  }
}

export async function removeTempDir(tempDir: string): Promise<void> {
  await fs.promises.rm(tempDir, { recursive: true, force: true });
}

export interface MergeReport {
  copied: number;
  skippedIdentical: number;
  conflicts: number;
  conflictFiles: string[];
}

async function sha256File(filePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Merges `sourceDir` into `destDir`: copies new files, skips byte-identical files,
 * and places conflicting files into a `conflicts/` subfolder rather than overwriting.
 * Used for "Merge into Existing Toolbox" imports.
 */
export async function mergeDirectoryInto(sourceDir: string, destDir: string): Promise<MergeReport> {
  const report: MergeReport = { copied: 0, skippedIdentical: 0, conflicts: 0, conflictFiles: [] };

  async function walk(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const sourcePath = path.join(dir, entry.name);
      const relativePath = path.relative(sourceDir, sourcePath);
      if (relativePath === ARCHIVE_METADATA_FILE) {
        continue;
      }
      const destinationPath = path.join(destDir, relativePath);

      if (entry.isDirectory()) {
        await walk(sourcePath);
        continue;
      }

      let destExists = true;
      try {
        await fs.promises.access(destinationPath);
      } catch {
        destExists = false;
      }

      if (!destExists) {
        await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.promises.copyFile(sourcePath, destinationPath);
        report.copied++;
        continue;
      }

      const [sourceHash, destHash] = await Promise.all([sha256File(sourcePath), sha256File(destinationPath)]);
      if (sourceHash === destHash) {
        report.skippedIdentical++;
        continue;
      }

      const conflictPath = path.join(destDir, 'conflicts', relativePath);
      await fs.promises.mkdir(path.dirname(conflictPath), { recursive: true });
      await fs.promises.copyFile(sourcePath, conflictPath);
      report.conflicts++;
      report.conflictFiles.push(relativePath);
    }
  }

  await walk(sourceDir);
  return report;
}
