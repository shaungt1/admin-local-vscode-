import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { LEGACY_REUSABLE_DIRECTORIES, PROJECT_MANIFEST_FILE } from '../constants';
import { MigrationInventoryEntry, MigrationReport, MigrationReportEntry } from '../types';
import { backupFolderName } from './linkService';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects the pre-Toolbox layout: one or more of the five recognized reusable folders
 * directly inside `.admin-local`, with no schema-2 project manifest yet.
 * Never treats ticket folders, notes, or unrecognized folders as legacy.
 */
export async function detectLegacyStructure(adminLocalPath: string): Promise<string[]> {
  const manifestPath = path.join(adminLocalPath, PROJECT_MANIFEST_FILE);
  if (await pathExists(manifestPath)) {
    return [];
  }

  const found: string[] = [];
  for (const dir of LEGACY_REUSABLE_DIRECTORIES) {
    const candidate = path.join(adminLocalPath, dir);
    try {
      const stat = await fs.promises.stat(candidate);
      if (stat.isDirectory()) {
        found.push(dir);
      }
    } catch {
      // absent — not an error, just not legacy content
    }
  }
  return found;
}

async function sha256File(filePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function walkFiles(root: string, dir: string, out: string[]): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      await walkFiles(root, full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

export async function buildMigrationInventory(
  adminLocalPath: string,
  legacyDirs: string[],
  toolboxPath: string
): Promise<MigrationInventoryEntry[]> {
  const entries: MigrationInventoryEntry[] = [];
  for (const dir of legacyDirs) {
    const sourceDir = path.join(adminLocalPath, dir);
    const files: string[] = [];
    await walkFiles(sourceDir, sourceDir, files);
    for (const sourcePath of files) {
      const relativePath = path.relative(adminLocalPath, sourcePath);
      const destinationPath = path.join(toolboxPath, path.relative(adminLocalPath, sourcePath));
      entries.push({
        relativePath,
        sourcePath,
        destinationPath,
        sha256: await sha256File(sourcePath)
      });
    }
  }
  return entries;
}

function conflictDestination(destinationPath: string, projectName: string): string {
  const dir = path.dirname(destinationPath);
  const ext = path.extname(destinationPath);
  const base = path.basename(destinationPath, ext);
  const date = new Date().toISOString().slice(0, 10);
  return path.join(dir, `${base}.project-${projectName}.${date}${ext}`);
}

/**
 * Performs the transactional migration: copy new/changed files into the Toolbox,
 * skip byte-identical destinations, rename conflicts instead of overwriting, then
 * move the original legacy folders into a timestamped backup. Never deletes the backup.
 */
export async function performMigration(
  adminLocalPath: string,
  legacyDirs: string[],
  toolboxPath: string,
  projectName: string
): Promise<MigrationReport> {
  const inventory = await buildMigrationInventory(adminLocalPath, legacyDirs, toolboxPath);
  const reportEntries: MigrationReportEntry[] = [];
  let copied = 0;
  let skippedIdentical = 0;
  let conflicts = 0;

  for (const item of inventory) {
    const destExists = await pathExists(item.destinationPath);
    if (!destExists) {
      await fs.promises.mkdir(path.dirname(item.destinationPath), { recursive: true });
      await fs.promises.copyFile(item.sourcePath, item.destinationPath);
      copied++;
      reportEntries.push({ relativePath: item.relativePath, outcome: 'copied' });
      continue;
    }

    const destHash = await sha256File(item.destinationPath);
    if (destHash === item.sha256) {
      skippedIdentical++;
      reportEntries.push({ relativePath: item.relativePath, outcome: 'skipped-identical' });
      continue;
    }

    const conflictPath = conflictDestination(item.destinationPath, projectName);
    await fs.promises.mkdir(path.dirname(conflictPath), { recursive: true });
    await fs.promises.copyFile(item.sourcePath, conflictPath);
    conflicts++;
    reportEntries.push({ relativePath: item.relativePath, outcome: 'conflict', conflictPath });
  }

  const backupPath = path.join(adminLocalPath, `legacy-${backupFolderName()}`);
  await fs.promises.mkdir(backupPath, { recursive: true });
  for (const dir of legacyDirs) {
    const sourceDir = path.join(adminLocalPath, dir);
    const backupDir = path.join(backupPath, dir);
    await fs.promises.rename(sourceDir, backupDir);
  }

  return {
    copied,
    skippedIdentical,
    conflicts,
    entries: reportEntries,
    backupPath
  };
}
