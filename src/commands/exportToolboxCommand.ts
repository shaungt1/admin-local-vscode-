import * as path from 'path';
import * as vscode from 'vscode';
import { TOOLBOX_ARCHIVE_PREFIX } from '../constants';
import { StateService } from '../services/stateService';
import { createToolboxArchive } from '../services/archiveService';
import { pickToolbox } from './shared';

export function registerExportToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.exportToolbox', async () => {
    try {
      const toolbox = await pickToolbox(state, 'Select the Toolbox to export');
      if (!toolbox) {
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${TOOLBOX_ARCHIVE_PREFIX}${timestamp}.admloc`;

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(toolbox.path, '..', fileName)),
        filters: { 'Admin Local Toolbox Archive': ['admloc'], 'All Files': ['*'] }
      });
      if (!saveUri) {
        return;
      }

      const bytes = await createToolboxArchive(toolbox.path, saveUri.fsPath);
      vscode.window.showInformationMessage(
        `Admin Local: Exported Toolbox "${toolbox.name}" to ${path.basename(saveUri.fsPath)} (${(bytes / 1024).toFixed(1)} KB).`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local export Toolbox failed: ${message}`);
      console.error('Admin Local export Toolbox error:', error);
    }
  });
}
