import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_TOOLBOX_NAME } from '../constants';
import { StateService } from '../services/stateService';
import { establishToolboxAt } from '../services/toolboxService';
import { validateToolboxLocation } from '../services/locationService';

export function registerUseExistingToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.useExistingToolbox', async () => {
    try {
      const selection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: 'Select an existing Admin Local Shared Toolbox folder',
        openLabel: 'Use This Toolbox'
      });
      if (!selection || selection.length === 0) {
        return;
      }
      const targetPath = selection[0].fsPath;

      const validation = await validateToolboxLocation(targetPath);
      if (!validation.ok) {
        vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
        return;
      }

      const registry = state.getRegistry();
      let makeDefault = registry.toolboxes.length === 0;
      if (!makeDefault) {
        const answer = await vscode.window.showQuickPick(['No', 'Yes'], {
          title: 'Make this the default Toolbox?'
        });
        makeDefault = answer === 'Yes';
      }

      const name = path.basename(targetPath) || DEFAULT_TOOLBOX_NAME;
      const toolbox = await establishToolboxAt(targetPath, name, state, makeDefault);
      vscode.window.showInformationMessage(`Admin Local: Registered existing Toolbox "${toolbox.name}" at ${toolbox.path}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local use existing Toolbox failed: ${message}`);
      console.error('Admin Local use existing Toolbox error:', error);
    }
  });
}
