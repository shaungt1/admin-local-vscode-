import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PROJECT_ARCHIVE_EXTENSION } from '../constants';
import { StateService } from '../services/stateService';
import { createProjectArchive } from '../services/archiveService';
import { resolveExistingProject } from './shared';

export function registerExportProjectCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.export', async (explorerUri?: vscode.Uri) => {
    try {
      const existing = await resolveExistingProject(state, explorerUri);
      if (!existing) {
        return;
      }
      const { project } = existing;

      let includeLegacyBackups = false;
      const topLevel = await fs.promises.readdir(project.adminLocalPath, { withFileTypes: true });
      const hasBackup = topLevel.some(e => e.isDirectory() && /^legacy-toolbox-backup-/.test(e.name));
      if (hasBackup) {
        const choice = await vscode.window.showQuickPick(['No (default)', 'Yes'], {
          title: 'Include legacy migration backup in this export?',
          placeHolder: 'The legacy backup folder can be large and is normally left out'
        });
        includeLegacyBackups = choice === 'Yes';
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const projectName = path.basename(project.rootPath);
      const fileName = `${projectName}-admin-local-${timestamp}${PROJECT_ARCHIVE_EXTENSION}`;

      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(project.rootPath, fileName)),
        filters: { 'Admin Local Project Archive': [PROJECT_ARCHIVE_EXTENSION.slice(1)], 'All Files': ['*'] }
      });
      if (!saveUri) {
        return;
      }

      const result = await createProjectArchive(project.adminLocalPath, saveUri.fsPath, includeLegacyBackups);

      vscode.window.showInformationMessage(
        `Admin Local: Exported ${result.fileCount} project files to ${path.basename(saveUri.fsPath)} ` +
          `(${(result.bytes / 1024).toFixed(1)} KB). Excluded: ${result.excluded.join(', ') || 'none'}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local export failed: ${message}`);
      console.error('Admin Local export error:', error);
    }
  });
}
