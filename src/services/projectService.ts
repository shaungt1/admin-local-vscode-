import * as path from 'path';
import * as vscode from 'vscode';
import { ADMIN_LOCAL_FOLDER, TOOLBOX_LINK_NAME } from '../constants';
import { ProjectContext } from '../types';

/**
 * Resolves the workspace folder a command should operate on.
 * Prefers the Explorer right-click URI; falls back to the single open workspace,
 * or a Quick Pick when multiple workspaces are open and no URI was supplied.
 */
export async function resolveWorkspaceFolder(
  explorerUri?: vscode.Uri
): Promise<vscode.WorkspaceFolder | undefined> {
  if (explorerUri) {
    const containing = vscode.workspace.getWorkspaceFolder(explorerUri);
    if (containing) {
      return containing;
    }
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  const picked = await vscode.window.showQuickPick(
    folders.map(folder => ({
      label: folder.name,
      description: folder.uri.fsPath,
      folder
    })),
    {
      title: 'Select Workspace',
      placeHolder: 'Multiple workspaces are open — choose which one to use'
    }
  );

  return picked?.folder;
}

export function buildProjectContext(workspaceFolder: vscode.WorkspaceFolder): ProjectContext {
  const rootPath = workspaceFolder.uri.fsPath;
  const adminLocalPath = path.join(rootPath, ADMIN_LOCAL_FOLDER);
  return {
    workspaceFolder,
    rootPath,
    adminLocalPath,
    toolboxLinkPath: path.join(adminLocalPath, TOOLBOX_LINK_NAME)
  };
}
