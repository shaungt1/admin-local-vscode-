import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { GIT_EXCLUDE_ENTRY } from '../constants';
import { GitLocation } from '../types';

const execFileAsync = promisify(execFile);

async function runGit(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

/**
 * Resolves the real Git work tree root and administrative (`.git`) directory for `workspacePath`.
 * Uses Git itself rather than assuming `.git` is a plain directory, so worktrees and
 * `.git` pointer files resolve correctly.
 */
export async function resolveGitLocation(workspacePath: string): Promise<GitLocation | undefined> {
  try {
    const workTreeRoot = await runGit(workspacePath, ['rev-parse', '--show-toplevel']);
    const gitPathOutput = await runGit(workspacePath, ['rev-parse', '--git-path', 'info/exclude']);
    const excludePath = path.isAbsolute(gitPathOutput)
      ? gitPathOutput
      : path.resolve(workTreeRoot, gitPathOutput);
    const gitDirectory = path.dirname(path.dirname(excludePath));
    return {
      workTreeRoot: path.normalize(workTreeRoot),
      gitDirectory: path.normalize(gitDirectory)
    };
  } catch {
    return undefined;
  }
}

export async function resolveExcludePath(workTreeRoot: string): Promise<string> {
  const gitPathOutput = await runGit(workTreeRoot, ['rev-parse', '--git-path', 'info/exclude']);
  return path.isAbsolute(gitPathOutput) ? gitPathOutput : path.resolve(workTreeRoot, gitPathOutput);
}

/** Adds exactly one `.admin-local/` entry to the repository's local (untracked) exclude file. */
export async function ensureAdminLocalExcluded(workTreeRoot: string): Promise<'added' | 'already-present'> {
  const excludePath = await resolveExcludePath(workTreeRoot);
  await fs.promises.mkdir(path.dirname(excludePath), { recursive: true });

  let current = '';
  try {
    current = await fs.promises.readFile(excludePath, 'utf8');
  } catch {
    current = '';
  }

  const lines = current.split(/\r?\n/);
  if (lines.includes(GIT_EXCLUDE_ENTRY) || lines.includes(GIT_EXCLUDE_ENTRY.replace(/\/$/, ''))) {
    return 'already-present';
  }

  const next = current.length === 0 || current.endsWith('\n')
    ? current + GIT_EXCLUDE_ENTRY + '\n'
    : current + '\n' + GIT_EXCLUDE_ENTRY + '\n';

  await fs.promises.writeFile(excludePath, next, 'utf8');
  return 'added';
}
