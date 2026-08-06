import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { isValidToolbox } from '../services/toolboxService';
import { pickToolbox } from './shared';

export function registerOpenToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.openToolbox', async () => {
    try {
      const toolbox = await pickToolbox(state, 'Select Toolbox to Open');
      if (!toolbox) {
        return;
      }
      if (!(await isValidToolbox(toolbox))) {
        vscode.window.showErrorMessage(`Admin Local: Toolbox path could not be verified: ${toolbox.path}`);
        return;
      }
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(toolbox.path));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local open Toolbox failed: ${message}`);
      console.error('Admin Local open Toolbox error:', error);
    }
  });
}
