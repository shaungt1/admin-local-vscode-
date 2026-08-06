import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ADMIN_LOCAL_FOLDER, DEFAULT_TOOLBOX_NAME } from '../constants';

export interface LocationValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Resolves the recommended physical Toolbox location for the current OS.
 * This is always a suggestion — the user can pick another path or an existing Toolbox.
 */
export function getRecommendedToolboxPath(): string {
  const documentsDir = path.join(os.homedir(), 'Documents');
  return path.join(documentsDir, DEFAULT_TOOLBOX_NAME);
}

function normalize(p: string): string {
  return path.normalize(p).replace(/[/\\]+$/, '');
}

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(normalize(parent), normalize(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Validates a candidate Toolbox location before it is created or accepted.
 * Does not create anything — pure inspection.
 */
export async function validateToolboxLocation(
  candidatePath: string,
  repositoryRoot?: string
): Promise<LocationValidationResult> {
  if (!path.isAbsolute(candidatePath)) {
    return { ok: false, reason: 'The Toolbox location must be an absolute path.' };
  }

  if (path.basename(candidatePath) === ADMIN_LOCAL_FOLDER) {
    return { ok: false, reason: `The Toolbox location cannot be named "${ADMIN_LOCAL_FOLDER}".` };
  }

  let stats: fs.Stats | undefined;
  try {
    stats = await fs.promises.stat(candidatePath);
  } catch {
    stats = undefined;
  }

  if (stats && !stats.isDirectory()) {
    return { ok: false, reason: 'The selected path is a file, not a directory.' };
  }

  const parent = path.dirname(candidatePath);
  try {
    await fs.promises.access(stats ? candidatePath : parent, fs.constants.W_OK);
  } catch {
    return { ok: false, reason: 'The selected location is not writable.' };
  }

  if (repositoryRoot) {
    const normalizedRepo = normalize(repositoryRoot);
    const normalizedCandidate = normalize(candidatePath);
    if (isInside(normalizedRepo, normalizedCandidate)) {
      return { ok: false, reason: 'The Toolbox location cannot be inside the current repository.' };
    }
    if (isInside(normalizedCandidate, normalizedRepo)) {
      return { ok: false, reason: 'The current repository cannot be inside the Toolbox location.' };
    }
  }

  return { ok: true };
}
