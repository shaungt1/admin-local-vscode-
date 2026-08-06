import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ensureAdminLocalExcluded, resolveGitLocation } from '../src/services/gitService';
import { makeTempDir, removeDir } from './helpers';

const execFileAsync = promisify(execFile);

async function initRepo(dir: string): Promise<void> {
  await execFileAsync('git', ['init'], { cwd: dir });
  await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  await execFileAsync('git', ['config', 'user.name', 'Test'], { cwd: dir });
}

test('resolveGitLocation resolves the work tree root of a normal repository', async () => {
  const repoRoot = await makeTempDir('git-normal');
  try {
    await initRepo(repoRoot);
    const location = await resolveGitLocation(repoRoot);
    assert.ok(location);
    assert.equal(fs.realpathSync.native(location!.workTreeRoot), fs.realpathSync.native(repoRoot));
  } finally {
    await removeDir(repoRoot);
  }
});

test('resolveGitLocation returns undefined for a non-Git directory', async () => {
  const dir = await makeTempDir('git-none');
  try {
    const location = await resolveGitLocation(dir);
    assert.equal(location, undefined);
  } finally {
    await removeDir(dir);
  }
});

test('ensureAdminLocalExcluded adds the entry once and does not duplicate it', async () => {
  const repoRoot = await makeTempDir('git-exclude');
  try {
    await initRepo(repoRoot);

    const first = await ensureAdminLocalExcluded(repoRoot);
    assert.equal(first, 'added');

    const second = await ensureAdminLocalExcluded(repoRoot);
    assert.equal(second, 'already-present');

    const excludeContent = await fs.promises.readFile(path.join(repoRoot, '.git', 'info', 'exclude'), 'utf8');
    const occurrences = excludeContent.split('\n').filter(line => line === '.admin-local/').length;
    assert.equal(occurrences, 1);
  } finally {
    await removeDir(repoRoot);
  }
});

test('resolveGitLocation resolves a Git worktree with a .git pointer file', async () => {
  const repoRoot = await makeTempDir('git-worktree-main');
  const worktreeParent = await makeTempDir('git-worktree-linked');
  try {
    await initRepo(repoRoot);
    await fs.promises.writeFile(path.join(repoRoot, 'file.txt'), 'content');
    await execFileAsync('git', ['add', '.'], { cwd: repoRoot });
    await execFileAsync('git', ['commit', '-m', 'initial'], { cwd: repoRoot });

    const worktreePath = path.join(worktreeParent, 'linked');
    await execFileAsync('git', ['worktree', 'add', '-b', 'feature-branch', worktreePath], { cwd: repoRoot });

    const gitEntry = await fs.promises.stat(path.join(worktreePath, '.git'));
    assert.ok(gitEntry.isFile(), 'worktree .git should be a pointer file, not a directory');

    const location = await resolveGitLocation(worktreePath);
    assert.ok(location);
    assert.equal(fs.realpathSync.native(location!.workTreeRoot), fs.realpathSync.native(worktreePath));

    const excludeResult = await ensureAdminLocalExcluded(worktreePath);
    assert.equal(excludeResult, 'added');
  } finally {
    await removeDir(repoRoot);
    await removeDir(worktreeParent);
  }
});
