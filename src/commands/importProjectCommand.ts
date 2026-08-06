import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PROJECT_ARCHIVE_EXTENSION } from '../constants';
import { StateService } from '../services/stateService';
import {
  copyApprovedFiles,
  extractArchiveToTemp,
  readArchiveMetadata,
  removeTempDir,
  validateProjectImportEntries
} from '../services/archiveService';
import { resolveWorkspaceFolder, buildProjectContext } from '../services/projectService';
import { ensureAdminLocalReady, ensureProjectBoilerplate } from './shared';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

export function registerImportProjectCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.import', async (explorerUri?: vscode.Uri) => {
    let tempDir: string | undefined;
    try {
      const workspaceFolder = await resolveWorkspaceFolder(explorerUri);
      if (!workspaceFolder) {
        return;
      }
      const project = buildProjectContext(workspaceFolder);

      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'Admin Local Project Archive': [PROJECT_ARCHIVE_EXTENSION.slice(1)], 'All Files': ['*'] },
        title: 'Import Admin Local Project Workspace Archive'
      });
      if (!fileUri || fileUri.length === 0) {
        return;
      }

      tempDir = await extractArchiveToTemp(fileUri[0].fsPath);
      const metadata = await readArchiveMetadata(tempDir);
      if (metadata.archiveType !== 'project-workspace' && metadata.archiveType !== 'legacy-project-workspace') {
        vscode.window.showErrorMessage(
          `Admin Local: This archive is a "${metadata.archiveType}" archive, not a project workspace archive.`
        );
        return;
      }

      const { safe, rejected } = await validateProjectImportEntries(tempDir);
      if (rejected.length > 0) {
        vscode.window.showWarningMessage(
          `Admin Local: Skipped ${rejected.length} unsafe archive entr${rejected.length === 1 ? 'y' : 'ies'}: ` +
            rejected.map(r => `${r.relativePath} (${r.reason})`).join(', ')
        );
      }
      if (safe.length === 0) {
        vscode.window.showInformationMessage('Admin Local: Nothing to import.');
        return;
      }

      await ensureProjectBoilerplate(project.adminLocalPath);

      const conflicts: string[] = [];
      for (const relativePath of safe) {
        if (await pathExists(path.join(project.adminLocalPath, relativePath))) {
          conflicts.push(relativePath);
        }
      }
      if (conflicts.length > 0) {
        const answer = await vscode.window.showWarningMessage(
          `Admin Local: ${conflicts.length} file(s) already exist and will be overwritten by this import. Continue?`,
          { modal: true },
          'Overwrite'
        );
        if (answer !== 'Overwrite') {
          return;
        }
      }

      await copyApprovedFiles(tempDir, project.adminLocalPath, safe);

      const ready = await ensureAdminLocalReady(state, workspaceFolder.uri);
      if (!ready) {
        vscode.window.showWarningMessage(
          'Admin Local: Files were imported, but the Toolbox link could not be verified. Run Initialize or Repair Toolbox Link.'
        );
        return;
      }

      vscode.window.showInformationMessage(`Admin Local: Imported ${safe.length} project files.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local import failed: ${message}`);
      console.error('Admin Local import error:', error);
    } finally {
      if (tempDir) {
        await removeTempDir(tempDir);
      }
    }
  });
}
