import * as fs from 'fs';
import * as vscode from 'vscode';
import { StateService } from '../services/stateService';
import { findPrompts } from '../services/promptService';
import { ensureAdminLocalReady } from './shared';

export function registerCopyPromptCommand(context: vscode.ExtensionContext, state: StateService): vscode.Disposable {
  return vscode.commands.registerCommand('admin-local.copyPrompt', async (explorerUri?: vscode.Uri) => {
    try {
      const ready = await ensureAdminLocalReady(state, explorerUri);
      if (!ready) {
        return;
      }

      const prompts = await findPrompts(ready.toolbox.path, ready.project.adminLocalPath);
      if (prompts.length === 0) {
        vscode.window.showInformationMessage(
          `Admin Local: No prompts found in ${ready.toolbox.path}/prompts or in project ticket folders.`
        );
        return;
      }

      const selected = await vscode.window.showQuickPick(
        prompts.map(prompt => ({
          label: `${prompt.source} ${prompt.relativePath}`,
          description: prompt.absolutePath,
          prompt
        })),
        { placeHolder: 'Select a prompt to copy to clipboard', title: 'Admin Local Prompts' }
      );
      if (!selected) {
        return;
      }

      const content = await fs.promises.readFile(selected.prompt.absolutePath, 'utf8');
      await vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(
        `Admin Local: Copied "${selected.prompt.label}" to clipboard. Press Ctrl+V to paste.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local copy prompt failed: ${message}`);
      console.error('Admin Local copy prompt error:', error);
    }
  });
}
