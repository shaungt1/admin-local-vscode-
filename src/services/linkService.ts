import * as fs from 'fs';
import * as path from 'path';
import { ToolboxLinkStatus } from '../types';

function normalizeForComparison(p: string): string {
  const normalized = path.normalize(p).replace(/[/\\]+$/, '');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

async function resolveRealPath(target: string): Promise<string | undefined> {
  try {
    return await fs.promises.realpath(target);
  } catch {
    return undefined;
  }
}

/**
 * Inspects `linkPath` (without following it first) and classifies its relationship
 * to `expectedTarget`. Always uses `lstat`, never only `stat`, so a real directory
 * is never mistaken for a link.
 */
export async function inspectToolboxLink(
  linkPath: string,
  expectedTarget: string
): Promise<ToolboxLinkStatus> {
  let lst: fs.Stats;
  try {
    lst = await fs.promises.lstat(linkPath);
  } catch {
    return 'missing';
  }

  if (lst.isSymbolicLink()) {
    const resolved = await resolveRealPath(linkPath);
    if (!resolved) {
      return 'broken';
    }
    const resolvedTarget = (await resolveRealPath(expectedTarget)) ?? expectedTarget;
    return normalizeForComparison(resolved) === normalizeForComparison(resolvedTarget)
      ? 'valid'
      : 'wrong-target';
  }

  if (lst.isDirectory()) {
    // Junctions and symlinks are already reported as isSymbolicLink() above (libuv detects
    // reparse points on Windows too), so reaching here means a genuine, non-link directory.
    return 'occupied-directory';
  }

  return 'occupied-file';
}

/** Creates the Toolbox link. Caller must have already confirmed the path is safe to create. */
export async function createToolboxLink(linkPath: string, targetPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(linkPath), { recursive: true });
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  await fs.promises.symlink(targetPath, linkPath, linkType);
}

/** Removes only a confirmed link entry — never a real file or real directory. */
export async function removeToolboxLinkOnly(linkPath: string): Promise<void> {
  const lst = await fs.promises.lstat(linkPath);
  if (!lst.isSymbolicLink()) {
    throw new Error(`Refusing to remove "${linkPath}": it is not a filesystem link.`);
  }
  await fs.promises.unlink(linkPath);
}

export async function repairToolboxLink(linkPath: string, targetPath: string): Promise<ToolboxLinkStatus> {
  const status = await inspectToolboxLink(linkPath, targetPath);
  if (status === 'occupied-file' || status === 'occupied-directory') {
    throw new Error(
      `A normal ${status === 'occupied-file' ? 'file' : 'folder'} already exists at:\n\n${linkPath}`
    );
  }
  if (status === 'broken' || status === 'wrong-target') {
    await removeToolboxLinkOnly(linkPath);
  }
  if (status !== 'valid') {
    await createToolboxLink(linkPath, targetPath);
  }
  return inspectToolboxLink(linkPath, targetPath);
}

export function backupFolderName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `toolbox-backup-${timestamp}`;
}
