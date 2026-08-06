import * as fs from 'fs';
import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { inspectToolboxLink, removeToolboxLinkOnly } from '../services/linkService';
import { resolveExistingProject } from './shared';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

export function registerDestroyCommand(context: vscode.ExtensionContext, state: StateService): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.delete', async (explorerUri?: vscode.Uri) => {
    try {
      const existing = await resolveExistingProject(state, explorerUri);
      if (!existing) {
        return;
      }
      const { project, toolbox } = existing;

      const answer = await vscode.window.showWarningMessage(
        `This removes the current repository's .admin-local workspace.\n\n` +
          `The centralized Admin Local Shared Toolbox will not be deleted.`,
        { modal: true },
        'Destroy Project Workspace'
      );
      if (answer !== 'Destroy Project Workspace') {
        return;
      }

      if (await pathExists(project.toolboxLinkPath)) {
        const expectedTarget = toolbox?.path ?? project.toolboxLinkPath;
        const status = await inspectToolboxLink(project.toolboxLinkPath, expectedTarget);
        if (status === 'occupied-directory') {
          vscode.window.showErrorMessage(
            `Admin Local: A normal folder occupies ${project.toolboxLinkPath}. Refusing to delete it automatically. Cancelled.`
          );
          return;
        }
        if (status !== 'occupied-file') {
          await removeToolboxLinkOnly(project.toolboxLinkPath);
        }
      }

      await fs.promises.rm(project.adminLocalPath, { recursive: true, force: true });

      const toolboxStillExists = toolbox ? await pathExists(toolbox.path) : true;
      vscode.window.showInformationMessage(
        `Admin Local: Project workspace removed.` +
          (toolbox
            ? toolboxStillExists
              ? ` The Toolbox at ${toolbox.path} is unaffected.`
              : ' Warning: the registered Toolbox path could not be verified.'
            : '')
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local destroy failed: ${message}`);
      console.error('Admin Local destroy error:', error);
    }
  });
}
