import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { pickToolbox } from './shared';

export function registerSetDefaultToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.setDefaultToolbox', async () => {
    try {
      const toolbox = await pickToolbox(state, 'Select the Toolbox to make default');
      if (!toolbox) {
        return;
      }
      await state.setDefaultToolbox(toolbox.id);
      vscode.window.showInformationMessage(`Admin Local: "${toolbox.name}" is now the default Toolbox.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local set default Toolbox failed: ${message}`);
      console.error('Admin Local set default Toolbox error:', error);
    }
  });
}
