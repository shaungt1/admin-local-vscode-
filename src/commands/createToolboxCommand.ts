import * as path from 'path';
import * as vscode from 'vscode';
import { DEFAULT_TOOLBOX_NAME } from '../constants';
import { StateService } from '../services/stateService';
import { establishToolboxAt } from '../services/toolboxService';
import { getRecommendedToolboxPath, validateToolboxLocation } from '../services/locationService';

export function registerCreateToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.createToolbox', async () => {
    try {
      const name = await vscode.window.showInputBox({
        title: 'Name for the new Toolbox',
        value: DEFAULT_TOOLBOX_NAME,
        prompt: 'This name identifies the Toolbox when more than one is registered'
      });
      if (!name) {
        return;
      }

      const recommended = getRecommendedToolboxPath();
      const useRecommended = 'Use Recommended Location';
      const chooseAnother = 'Choose Another Location';
      const choice = await vscode.window.showQuickPick([useRecommended, chooseAnother], {
        title: `Recommended location:\n${recommended}`
      });
      if (!choice) {
        return;
      }

      let targetPath = recommended;
      if (choice === chooseAnother) {
        const selection = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          title: 'Choose where the new Toolbox will be created',
          openLabel: 'Use This Location'
        });
        if (!selection || selection.length === 0) {
          return;
        }
        targetPath = path.basename(selection[0].fsPath) === name
          ? selection[0].fsPath
          : path.join(selection[0].fsPath, name);
      }

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

      const toolbox = await establishToolboxAt(targetPath, name, state, makeDefault);
      vscode.window.showInformationMessage(`Admin Local: Created Toolbox "${toolbox.name}" at ${toolbox.path}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local create Toolbox failed: ${message}`);
      console.error('Admin Local create Toolbox error:', error);
    }
  });
}
