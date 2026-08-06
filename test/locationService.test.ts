import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as path from 'path';
import { getRecommendedToolboxPath, validateToolboxLocation } from '../src/services/locationService';
import { makeTempDir, removeDir } from './helpers';

test('getRecommendedToolboxPath returns an absolute path under Documents', () => {
  const recommended = getRecommendedToolboxPath();
  assert.ok(path.isAbsolute(recommended));
  assert.ok(recommended.includes('Documents'));
  assert.ok(recommended.endsWith('Admin Local Shared Toolbox'));
});

test('validateToolboxLocation rejects relative paths', async () => {
  const result = await validateToolboxLocation('relative/path');
  assert.equal(result.ok, false);
});

test('validateToolboxLocation rejects a path literally named .admin-local', async () => {
  const result = await validateToolboxLocation(path.join(process.cwd(), '.admin-local'));
  assert.equal(result.ok, false);
});

test('validateToolboxLocation accepts a new absolute directory', async () => {
  const parent = await makeTempDir('location-ok');
  try {
    const candidate = path.join(parent, 'Admin Local Shared Toolbox');
    const result = await validateToolboxLocation(candidate);
    assert.equal(result.ok, true);
  } finally {
    await removeDir(parent);
  }
});

test('validateToolboxLocation rejects an existing regular file', async () => {
  const parent = await makeTempDir('location-file');
  try {
    const fs = await import('fs');
    const filePath = path.join(parent, 'not-a-directory');
    await fs.promises.writeFile(filePath, 'x');
    const result = await validateToolboxLocation(filePath);
    assert.equal(result.ok, false);
  } finally {
    await removeDir(parent);
  }
});

test('validateToolboxLocation rejects a location inside the current repository', async () => {
  const repoRoot = await makeTempDir('repo');
  try {
    const candidate = path.join(repoRoot, 'nested', 'Admin Local Shared Toolbox');
    const result = await validateToolboxLocation(candidate, repoRoot);
    assert.equal(result.ok, false);
  } finally {
    await removeDir(repoRoot);
  }
});

test('validateToolboxLocation rejects a repository nested inside the Toolbox', async () => {
  const toolboxPath = await makeTempDir('toolbox-outer');
  try {
    const repoRoot = path.join(toolboxPath, 'some-repo');
    const result = await validateToolboxLocation(toolboxPath, repoRoot);
    assert.equal(result.ok, false);
  } finally {
    await removeDir(toolboxPath);
  }
});
