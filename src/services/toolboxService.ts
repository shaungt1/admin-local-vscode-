import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_TOOLBOX_NAME,
  TOOLBOX_DIRECTORIES,
  TOOLBOX_IDENTITY_FILE
} from '../constants';
import { ToolboxDefinition, ToolboxIdentity } from '../types';
import { StateService } from './stateService';
import { getRecommendedToolboxPath, validateToolboxLocation } from './locationService';

const USE_RECOMMENDED = 'Use Recommended Location';
const CHOOSE_ANOTHER = 'Choose Another Location';
const USE_EXISTING = 'Use Existing Toolbox';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readIdentity(toolboxPath: string): Promise<ToolboxIdentity | undefined> {
  const identityPath = path.join(toolboxPath, TOOLBOX_IDENTITY_FILE);
  try {
    const raw = await fs.promises.readFile(identityPath, 'utf8');
    return JSON.parse(raw) as ToolboxIdentity;
  } catch {
    return undefined;
  }
}

async function writeIdentity(toolboxPath: string, identity: ToolboxIdentity): Promise<void> {
  const identityPath = path.join(toolboxPath, TOOLBOX_IDENTITY_FILE);
  await fs.promises.writeFile(identityPath, JSON.stringify(identity, null, 2), 'utf8');
}

/** Creates the Toolbox root and its five predefined subdirectories. Idempotent. */
export async function createToolboxDirectories(toolboxPath: string): Promise<void> {
  await fs.promises.mkdir(toolboxPath, { recursive: true });
  for (const dir of TOOLBOX_DIRECTORIES) {
    await fs.promises.mkdir(path.join(toolboxPath, dir), { recursive: true });
  }
}

/**
 * Creates (or adopts) a physical Toolbox at `targetPath`, registers it, and returns its definition.
 * Idempotent: running this twice against the same path never erases existing content.
 */
export async function establishToolboxAt(
  targetPath: string,
  name: string,
  state: StateService,
  makeDefault: boolean
): Promise<ToolboxDefinition> {
  await createToolboxDirectories(targetPath);

  let identity = await readIdentity(targetPath);
  const nowIso = new Date().toISOString();
  if (!identity) {
    identity = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      toolboxId: crypto.randomUUID(),
      name,
      createdAt: nowIso
    };
    await writeIdentity(targetPath, identity);
  }

  let definition = state.getToolbox(identity.toolboxId);
  if (!definition) {
    definition = {
      id: identity.toolboxId,
      name: identity.name,
      path: targetPath,
      createdAt: identity.createdAt
    };
    await state.addToolbox(definition);
  } else if (definition.path !== targetPath) {
    definition = { ...definition, path: targetPath, updatedAt: nowIso };
    await state.updateToolbox(definition);
  }

  if (makeDefault) {
    await state.setDefaultToolbox(definition.id);
  }

  return definition;
}

async function isValidToolbox(toolbox: ToolboxDefinition): Promise<boolean> {
  if (!(await pathExists(toolbox.path))) {
    return false;
  }
  const identity = await readIdentity(toolbox.path);
  return identity?.toolboxId === toolbox.id;
}

async function runFirstTimeSetup(
  state: StateService,
  repositoryRoot: string | undefined
): Promise<ToolboxDefinition | undefined> {
  const recommended = getRecommendedToolboxPath();

  const choice = await vscode.window.showInformationMessage(
    `Admin Local needs a permanent Toolbox location.\n\nRecommended:\n${recommended}`,
    { modal: true },
    USE_RECOMMENDED,
    CHOOSE_ANOTHER,
    USE_EXISTING
  );

  if (!choice) {
    return undefined;
  }

  if (choice === USE_RECOMMENDED) {
    const validation = await validateToolboxLocation(recommended, repositoryRoot);
    if (!validation.ok) {
      vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
      return undefined;
    }
    return establishToolboxAt(recommended, DEFAULT_TOOLBOX_NAME, state, true);
  }

  if (choice === CHOOSE_ANOTHER) {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Choose where the Admin Local Shared Toolbox will be created',
      openLabel: 'Use This Location'
    });
    if (!selection || selection.length === 0) {
      return undefined;
    }
    let chosenPath = selection[0].fsPath;
    if (path.basename(chosenPath) !== DEFAULT_TOOLBOX_NAME) {
      chosenPath = path.join(chosenPath, DEFAULT_TOOLBOX_NAME);
    }
    const validation = await validateToolboxLocation(chosenPath, repositoryRoot);
    if (!validation.ok) {
      vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
      return undefined;
    }
    return establishToolboxAt(chosenPath, DEFAULT_TOOLBOX_NAME, state, true);
  }

  // USE_EXISTING
  const selection = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'Select the existing Admin Local Shared Toolbox folder',
    openLabel: 'Use This Toolbox'
  });
  if (!selection || selection.length === 0) {
    return undefined;
  }
  const chosenPath = selection[0].fsPath;
  const validation = await validateToolboxLocation(chosenPath, repositoryRoot);
  if (!validation.ok) {
    vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
    return undefined;
  }
  const name = path.basename(chosenPath) || DEFAULT_TOOLBOX_NAME;
  return establishToolboxAt(chosenPath, name, state, true);
}

async function chooseAmongMultipleToolboxes(
  state: StateService,
  repositoryRoot: string | undefined
): Promise<ToolboxDefinition | undefined> {
  const registry = state.getRegistry();
  const CREATE_NEW = 'Create New Toolbox';
  const USE_OTHER_EXISTING = 'Use Existing Toolbox';

  interface ToolboxPickItem {
    label: string;
    description?: string;
    detail?: string;
    toolbox?: ToolboxDefinition;
  }

  const items: ToolboxPickItem[] = registry.toolboxes.map(t => ({
    label: t.name,
    description: t.id === registry.defaultToolboxId ? 'Default' : undefined,
    detail: t.path,
    toolbox: t
  }));
  items.push({ label: CREATE_NEW });
  items.push({ label: USE_OTHER_EXISTING });

  const picked = await vscode.window.showQuickPick(items, {
    title: 'Select Toolbox for this repository',
    placeHolder: 'Choose which Admin Local Shared Toolbox this repository should use'
  });

  if (!picked) {
    return undefined;
  }

  if (picked.toolbox) {
    return picked.toolbox;
  }

  if (picked.label === CREATE_NEW) {
    return runFirstTimeSetup(state, repositoryRoot);
  }

  // USE_OTHER_EXISTING
  const selection = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'Select an existing Admin Local Shared Toolbox folder',
    openLabel: 'Use This Toolbox'
  });
  if (!selection || selection.length === 0) {
    return undefined;
  }
  const chosenPath = selection[0].fsPath;
  const validation = await validateToolboxLocation(chosenPath, repositoryRoot);
  if (!validation.ok) {
    vscode.window.showErrorMessage(`Admin Local: ${validation.reason}`);
    return undefined;
  }
  const name = path.basename(chosenPath) || DEFAULT_TOOLBOX_NAME;
  return establishToolboxAt(chosenPath, name, state, false);
}

/**
 * Ensures a valid Toolbox is configured and returns it, running first-time setup
 * or the multi-Toolbox picker as needed. Idempotent when a valid default already exists.
 */
export async function ensureToolboxConfigured(
  state: StateService,
  repositoryRoot?: string
): Promise<ToolboxDefinition | undefined> {
  const remoteName = vscode.env.remoteName;
  if (remoteName) {
    vscode.window.showErrorMessage(
      `Admin Local Toolbox setup is currently supported only for local Windows, macOS, and Linux workspaces.\n\nThis workspace is running through: ${remoteName}`
    );
    return undefined;
  }

  const defaultToolbox = state.getDefaultToolbox();
  if (defaultToolbox && (await isValidToolbox(defaultToolbox))) {
    return defaultToolbox;
  }

  const registry = state.getRegistry();
  const validExisting: ToolboxDefinition[] = [];
  for (const toolbox of registry.toolboxes) {
    if (await isValidToolbox(toolbox)) {
      validExisting.push(toolbox);
    }
  }

  if (validExisting.length === 1) {
    if (registry.defaultToolboxId !== validExisting[0].id) {
      await state.setDefaultToolbox(validExisting[0].id);
    }
    return validExisting[0];
  }

  if (validExisting.length > 1) {
    return chooseAmongMultipleToolboxes(state, repositoryRoot);
  }

  return runFirstTimeSetup(state, repositoryRoot);
}

export { readIdentity as readToolboxIdentity, writeIdentity as writeToolboxIdentity, isValidToolbox };
