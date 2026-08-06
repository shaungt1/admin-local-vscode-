import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createProjectArchive,
  createToolboxArchive,
  extractArchiveToTemp,
  readArchiveMetadata,
  validateProjectImportEntries
} from '../src/services/archiveService';
import { createToolboxLink } from '../src/services/linkService';
import { makeTempDir, removeDir, writeFile } from './helpers';

test('createProjectArchive excludes the Toolbox link and includes project files', async () => {
  const adminLocalPath = await makeTempDir('export-project');
  const toolboxPath = await makeTempDir('export-toolbox-target');
  const outDir = await makeTempDir('export-out');
  try {
    await writeFile(path.join(adminLocalPath, 'README.md'), '# readme');
    await writeFile(path.join(adminLocalPath, 'BP-1427', 'notes.md'), 'notes');
    await writeFile(path.join(toolboxPath, 'prompts', 'shared.md'), 'shared prompt');
    await createToolboxLink(path.join(adminLocalPath, 'shared_toolbox'), toolboxPath);

    const destPath = path.join(outDir, 'project.admloc');
    const result = await createProjectArchive(adminLocalPath, destPath, false);

    assert.ok(result.fileCount >= 2);
    assert.ok(result.excluded.includes('shared_toolbox'));

    const extracted = await extractArchiveToTemp(destPath);
    try {
      assert.equal(fs.existsSync(path.join(extracted, 'shared_toolbox')), false);
      assert.equal(fs.existsSync(path.join(extracted, 'BP-1427', 'notes.md')), true);
      const metadata = await readArchiveMetadata(extracted);
      assert.equal(metadata.archiveType, 'project-workspace');
    } finally {
      await removeDir(extracted);
    }
  } finally {
    await removeDir(adminLocalPath);
    await removeDir(toolboxPath);
    await removeDir(outDir);
  }
});

test('createToolboxArchive includes Toolbox content with toolbox archive type', async () => {
  const toolboxPath = await makeTempDir('export-toolbox');
  const outDir = await makeTempDir('export-toolbox-out');
  try {
    await writeFile(path.join(toolboxPath, 'scripts', 'tool.js'), 'console.log(1)');
    const destPath = path.join(outDir, 'toolbox.admloc');
    await createToolboxArchive(toolboxPath, destPath);

    const extracted = await extractArchiveToTemp(destPath);
    try {
      assert.equal(fs.existsSync(path.join(extracted, 'scripts', 'tool.js')), true);
      const metadata = await readArchiveMetadata(extracted);
      assert.equal(metadata.archiveType, 'toolbox');
    } finally {
      await removeDir(extracted);
    }
  } finally {
    await removeDir(toolboxPath);
    await removeDir(outDir);
  }
});

test('validateProjectImportEntries rejects traversal, absolute-style, and reserved toolbox entries', async () => {
  const tempDir = await makeTempDir('import-validate');
  try {
    await writeFile(path.join(tempDir, 'ok.md'), 'fine');
    await fs.promises.mkdir(path.join(tempDir, 'shared_toolbox'), { recursive: true });
    await writeFile(path.join(tempDir, 'shared_toolbox', 'sneaky.md'), 'no');

    const { safe, rejected } = await validateProjectImportEntries(tempDir);

    assert.deepEqual(safe, ['ok.md']);
    assert.ok(rejected.some(r => r.relativePath.startsWith('shared_toolbox')));
  } finally {
    await removeDir(tempDir);
  }
});
