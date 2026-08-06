import * as path from 'path';
import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { validateToolboxLocation } from '../services/locationService';
import { repairToolboxLink } from '../services/linkService';
import { resolveWorkspaceFolder, buildProjectContext } from '../services/projectService';
import { pickToolbox } from './shared';

const USE_EXISTING_FOLDER = 'Use Existing Folder';
const CREATE_NEW_HERE = 'Create New Toolbox Here';

export function registerChangeToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.changeToolbox', async () => {
    try {
      const toolbox = await pickToolbox(state, 'Select the Toolbox to change the location of');
      if (!toolbox) {
        return;
      }

      const choice = await vscode.window.showQuickPick([USE_EXISTING_FOLDER, CREATE_NEW_HERE], {
        title: `Change location for "${toolbox.name}"`
      });
      if (!choice) {
        return;
      }

      const selection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: choice === USE_EXISTING_FOLDER ? 'Select the existing Toolbox folder' : 'Choose parent directory',
        openLabel: 'Select'
      });
      if (!selection || selection.length === 0) {
        return;
      }

      const newPath = choice === CREATE_NEW_HERE
        ? path.join(selection[0].fsPath, toolbox.name)
        : selection[0].fsPath;

      const validation = await validateToolboxLocation(newPath);
      if (!validation.ok) {
        vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
        return;
      }

      const updated = { ...toolbox, path: newPath, updatedAt: new Date().toISOString() };
      await state.updateToolbox(updated);

      vscode.window.showInformationMessage(
        `Admin Local: "${toolbox.name}" now points to ${newPath}.\n\n` +
          `Existing project links keep pointing at the old location until repaired. ` +
          `Open projects can be fixed with (.Admin-Local) Repair Toolbox Link.`
      );

      const workspaceFolder = await resolveWorkspaceFolder();
      if (workspaceFolder) {
        const answer = await vscode.window.showInformationMessage(
          'Repair the current project\'s Toolbox link now?',
          'Repair Now',
          'Later'
        );
        if (answer === 'Repair Now') {
          const project = buildProjectContext(workspaceFolder);
          await repairToolboxLink(project.toolboxLinkPath, newPath);
          vscode.window.showInformationMessage('Admin Local: Toolbox link repaired.');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local change Toolbox location failed: ${message}`);
      console.error('Admin Local change Toolbox location error:', error);
    }
  });
}
