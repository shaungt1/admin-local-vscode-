import * as fs from 'fs';
import * as path from 'path';
import { TOOLBOX_LINK_NAME } from '../constants';
import { PromptItem } from '../types';

async function collectMarkdown(root: string, dir: string, out: string[]): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdown(root, full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push(full);
    }
  }
}

function toPromptItems(root: string, files: string[], source: string): PromptItem[] {
  return files
    .map(absolutePath => ({
      label: path.basename(absolutePath),
      absolutePath,
      relativePath: path.relative(root, absolutePath).split(path.sep).join('/'),
      source
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/**
 * Searches `<toolbox>/prompts/**` and any project-local folder named `prompts` or
 * `prompt` (e.g. inside a ticket folder). Never requires a project-local prompts folder.
 */
export async function findPrompts(toolboxPath: string, adminLocalPath: string): Promise<PromptItem[]> {
  const results: PromptItem[] = [];

  const toolboxPromptsDir = path.join(toolboxPath, 'prompts');
  const toolboxFiles: string[] = [];
  await collectMarkdown(toolboxPromptsDir, toolboxPromptsDir, toolboxFiles);
  results.push(...toPromptItems(toolboxPromptsDir, toolboxFiles, '[Toolbox]'));

  let topLevel: fs.Dirent[];
  try {
    topLevel = await fs.promises.readdir(adminLocalPath, { withFileTypes: true });
  } catch {
    topLevel = [];
  }

  for (const entry of topLevel) {
    if (!entry.isDirectory() || entry.name === TOOLBOX_LINK_NAME) {
      continue;
    }
    const ticketDir = path.join(adminLocalPath, entry.name);
    for (const promptDirName of ['prompts', 'prompt']) {
      const candidate = path.join(ticketDir, promptDirName);
      try {
        const stat = await fs.promises.lstat(candidate);
        if (!stat.isDirectory()) {
          continue;
        }
      } catch {
        continue;
      }
      const files: string[] = [];
      await collectMarkdown(candidate, candidate, files);
      results.push(...toPromptItems(candidate, files, `[${entry.name}]`));
    }
  }

  return results;
}
