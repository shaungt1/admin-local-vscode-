import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';
import { detectLegacyStructure, performMigration } from '../src/services/migrationService';
import { makeTempDir, removeDir, writeFile } from './helpers';

test('detectLegacyStructure finds only recognized reusable folders', async () => {
  const adminLocalPath = await makeTempDir('legacy-detect');
  try {
    await writeFile(path.join(adminLocalPath, 'prompts', 'a.md'), 'a');
    await writeFile(path.join(adminLocalPath, 'scripts', 'b.js'), 'b');
    await fs.promises.mkdir(path.join(adminLocalPath, 'BP-1427-fix-callback'), { recursive: true });

    const found = await detectLegacyStructure(adminLocalPath);
    assert.deepEqual(found.sort(), ['prompts', 'scripts']);
  } finally {
    await removeDir(adminLocalPath);
  }
});

test('detectLegacyStructure returns nothing when a project manifest already exists', async () => {
  const adminLocalPath = await makeTempDir('legacy-already-migrated');
  try {
    await writeFile(path.join(adminLocalPath, 'prompts', 'a.md'), 'a');
    await writeFile(path.join(adminLocalPath, '.admin-local-project.json'), '{}');

    const found = await detectLegacyStructure(adminLocalPath);
    assert.deepEqual(found, []);
  } finally {
    await removeDir(adminLocalPath);
  }
});

test('performMigration copies new files, skips identical, and files conflicts separately', async () => {
  const adminLocalPath = await makeTempDir('migrate-project');
  const toolboxPath = await makeTempDir('migrate-toolbox');
  try {
    await writeFile(path.join(adminLocalPath, 'prompts', 'new-file.md'), 'new content');
    await writeFile(path.join(adminLocalPath, 'prompts', 'identical.md'), 'same content');
    await writeFile(path.join(toolboxPath, 'prompts', 'identical.md'), 'same content');
    await writeFile(path.join(adminLocalPath, 'prompts', 'conflict.md'), 'project version');
    await writeFile(path.join(toolboxPath, 'prompts', 'conflict.md'), 'toolbox version');

    const report = await performMigration(adminLocalPath, ['prompts'], toolboxPath, 'demo-project');

    assert.equal(report.copied, 1);
    assert.equal(report.skippedIdentical, 1);
    assert.equal(report.conflicts, 1);

    // Originals moved into a backup, not left in place.
    assert.equal(fs.existsSync(path.join(adminLocalPath, 'prompts')), false);
    assert.ok(fs.existsSync(path.join(report.backupPath, 'prompts', 'new-file.md')));

    // The toolbox's own conflicting file was never overwritten.
    const toolboxConflictContent = await fs.promises.readFile(
      path.join(toolboxPath, 'prompts', 'conflict.md'),
      'utf8'
    );
    assert.equal(toolboxConflictContent, 'toolbox version');

    const newFileContent = await fs.promises.readFile(path.join(toolboxPath, 'prompts', 'new-file.md'), 'utf8');
    assert.equal(newFileContent, 'new content');
  } finally {
    await removeDir(adminLocalPath);
    await removeDir(toolboxPath);
  }
});

test('performMigration is safe to inspect again after rerun would find nothing legacy left', async () => {
  const adminLocalPath = await makeTempDir('migrate-rerun');
  const toolboxPath = await makeTempDir('migrate-rerun-toolbox');
  try {
    await writeFile(path.join(adminLocalPath, 'scripts', 'tool.js'), 'console.log(1)');
    await performMigration(adminLocalPath, ['scripts'], toolboxPath, 'demo-project');

    const legacyAfter = await detectLegacyStructure(adminLocalPath);
    assert.deepEqual(legacyAfter, []);
  } finally {
    await removeDir(adminLocalPath);
    await removeDir(toolboxPath);
  }
});
