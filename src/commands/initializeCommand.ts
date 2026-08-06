import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { ensureAdminLocalReady } from './shared';

export function registerInitializeCommand(context: vscode.ExtensionContext, state: StateService): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.init', async (explorerUri?: vscode.Uri) => {
    try {
      const ready = await ensureAdminLocalReady(state, explorerUri);
      if (!ready) {
        return;
      }
      vscode.window.showInformationMessage(
        `Admin Local initialized.\n\n` +
          `Project workspace:\n${ready.project.adminLocalPath}\n\n` +
          `Toolbox:\n${ready.toolbox.path}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local initialize failed: ${message}`);
      console.error('Admin Local initialize error:', error);
    }
  });
}
