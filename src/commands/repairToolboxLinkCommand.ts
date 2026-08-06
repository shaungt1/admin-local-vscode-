import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { inspectToolboxLink, repairToolboxLink } from '../services/linkService';
import { pickToolbox, resolveExistingProject } from './shared';

export function registerRepairToolboxLinkCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.repairToolboxLink', async (explorerUri?: vscode.Uri) => {
    try {
      const existing = await resolveExistingProject(state, explorerUri);
      if (!existing) {
        return;
      }
      const { project } = existing;
      let toolbox = existing.toolbox;
      if (!toolbox) {
        toolbox = await pickToolbox(state, 'Select the Toolbox this project should link to');
        if (!toolbox) {
          return;
        }
      }

      const beforeStatus = await inspectToolboxLink(project.toolboxLinkPath, toolbox.path);
      if (beforeStatus === 'occupied-file' || beforeStatus === 'occupied-directory') {
        vscode.window.showErrorMessage(
          `Admin Local: A normal ${beforeStatus === 'occupied-file' ? 'file' : 'folder'} occupies ` +
            `${project.toolboxLinkPath}. Remove or rename it manually, then repair again.`
        );
        return;
      }

      const afterStatus = await repairToolboxLink(project.toolboxLinkPath, toolbox.path);
      vscode.window.showInformationMessage(
        `Admin Local: Toolbox link status was "${beforeStatus}", now "${afterStatus}".`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local repair Toolbox link failed: ${message}`);
      console.error('Admin Local repair Toolbox link error:', error);
    }
  });
}
