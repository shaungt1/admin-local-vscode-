import * as path from 'path';
import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import {
  extractArchiveToTemp,
  mergeDirectoryInto,
  readArchiveMetadata,
  removeTempDir
} from '../services/archiveService';
import { establishToolboxAt } from '../services/toolboxService';
import { validateToolboxLocation } from '../services/locationService';
import { pickToolbox } from './shared';

const MERGE = 'Merge into Existing Toolbox';
const CREATE_NEW = 'Create New Toolbox from Archive';

export function registerImportToolboxCommand(
  context: vscode.ExtensionContext,
  state: StateService
): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.importToolbox', async () => {
    let tempDir: string | undefined;
    try {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { 'Admin Local Toolbox Archive': ['admloc'], 'All Files': ['*'] },
        title: 'Import Admin Local Toolbox Archive'
      });
      if (!fileUri || fileUri.length === 0) {
        return;
      }

      tempDir = await extractArchiveToTemp(fileUri[0].fsPath);
      const metadata = await readArchiveMetadata(tempDir);
      if (metadata.archiveType !== 'toolbox') {
        const answer = await vscode.window.showWarningMessage(
          `Admin Local: This archive is a "${metadata.archiveType}" archive, not a Toolbox archive. Import anyway?`,
          { modal: true },
          'Import Anyway'
        );
        if (answer !== 'Import Anyway') {
          return;
        }
      }

      const behavior = await vscode.window.showQuickPick([MERGE, CREATE_NEW], {
        title: 'How should this Toolbox archive be imported?'
      });
      if (!behavior) {
        return;
      }

      if (behavior === MERGE) {
        const target = await pickToolbox(state, 'Select the Toolbox to merge this archive into');
        if (!target) {
          return;
        }
        const report = await mergeDirectoryInto(tempDir, target.path);
        vscode.window.showInformationMessage(
          `Admin Local: Merge complete.\n\n` +
            `Copied: ${report.copied}\n` +
            `Skipped as identical: ${report.skippedIdentical}\n` +
            `Conflicts placed in conflicts/: ${report.conflicts}`
        );
        return;
      }

      // CREATE_NEW
      const name = await vscode.window.showInputBox({ title: 'Name for the new Toolbox' });
      if (!name) {
        return;
      }
      const selection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: 'Choose parent directory for the new Toolbox',
        openLabel: 'Use This Location'
      });
      if (!selection || selection.length === 0) {
        return;
      }
      const targetPath = path.join(selection[0].fsPath, name);
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
      const report = await mergeDirectoryInto(tempDir, toolbox.path);
      vscode.window.showInformationMessage(
        `Admin Local: Created Toolbox "${toolbox.name}" from archive (${report.copied} files imported).`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local import Toolbox failed: ${message}`);
      console.error('Admin Local import Toolbox error:', error);
    } finally {
      if (tempDir) {
        await removeTempDir(tempDir);
      }
    }
  });
}
