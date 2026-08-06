import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  ADMIN_LOCAL_FOLDER,
  CURRENT_SCHEMA_VERSION,
  PROJECT_MANIFEST_FILE,
  TOOLBOX_LINK_NAME
} from '../constants';
import { AdminLocalContext, GitLocation, ProjectContext, ProjectManifest, ToolboxDefinition } from '../types';
import { ensureAdminLocalExcluded, resolveGitLocation } from '../services/gitService';
import { buildProjectContext, resolveWorkspaceFolder } from '../services/projectService';
import { StateService } from '../services/stateService';
import { ensureToolboxConfigured } from '../services/toolboxService';
import { detectLegacyStructure } from '../services/migrationService';
import { runMigrationWizard } from './migrationWizard';
import { repairToolboxLink } from '../services/linkService';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.promises.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readProjectManifest(adminLocalPath: string): Promise<ProjectManifest | undefined> {
  try {
    const raw = await fs.promises.readFile(path.join(adminLocalPath, PROJECT_MANIFEST_FILE), 'utf8');
    return JSON.parse(raw) as ProjectManifest;
  } catch {
    return undefined;
  }
}

export async function writeProjectManifest(adminLocalPath: string, manifest: ProjectManifest): Promise<void> {
  await fs.promises.writeFile(
    path.join(adminLocalPath, PROJECT_MANIFEST_FILE),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

function projectReadmeContent(): string {
  return `# .admin-local

.admin-local is a private, project-specific engineering workbench.

## ${TOOLBOX_LINK_NAME}/

Provides access to the centralized Admin Local Shared Toolbox.

## Ticket folders/

Contain scratch work, analysis, tests, documentation, experiments,
temporary scripts, and supporting material for individual work items.

## .ai.store

Contains project-local AI configuration.

---

Nothing inside .admin-local is committed through this repository's
local Git exclude configuration.
`;
}

function aiStoreTemplate(): string {
  return `# AI API Keys and Configuration
# This file is LOCAL ONLY and never committed to Git

# OpenAI
OPENAI_API_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Other AI Services
GEMINI_API_KEY=
COHERE_API_KEY=
HUGGINGFACE_API_KEY=

# Model Preferences
DEFAULT_MODEL=
TEMPERATURE=0.7
MAX_TOKENS=2000
`;
}

/** Creates `.admin-local` and its project-local boilerplate. Never overwrites existing files. */
export async function ensureProjectBoilerplate(adminLocalPath: string): Promise<void> {
  await fs.promises.mkdir(adminLocalPath, { recursive: true });

  const readmePath = path.join(adminLocalPath, 'README.md');
  if (!(await pathExists(readmePath))) {
    await fs.promises.writeFile(readmePath, projectReadmeContent(), 'utf8');
  }

  const aiStorePath = path.join(adminLocalPath, '.ai.store');
  if (!(await pathExists(aiStorePath))) {
    await fs.promises.writeFile(aiStorePath, aiStoreTemplate(), 'utf8');
  }
}

interface ExistingProject {
  project: ProjectContext;
  git: GitLocation;
  manifest: ProjectManifest | undefined;
  toolbox: ToolboxDefinition | undefined;
}

/** Lighter resolution for commands that operate on an already-initialized project. */
export async function resolveExistingProject(
  state: StateService,
  explorerUri?: vscode.Uri
): Promise<ExistingProject | undefined> {
  const workspaceFolder = await resolveWorkspaceFolder(explorerUri);
  if (!workspaceFolder) {
    return undefined;
  }

  const project = buildProjectContext(workspaceFolder);
  if (!(await pathExists(project.adminLocalPath))) {
    vscode.window.showErrorMessage(`Admin Local: ${ADMIN_LOCAL_FOLDER} does not exist. Run Initialize first.`);
    return undefined;
  }

  const git = await resolveGitLocation(project.rootPath);
  if (!git) {
    vscode.window.showErrorMessage('Admin Local: This workspace does not appear to be a Git repository.');
    return undefined;
  }

  const manifest = await readProjectManifest(project.adminLocalPath);
  const toolbox = manifest ? state.getToolbox(manifest.toolboxId) : state.getDefaultToolbox();

  return { project, git, manifest, toolbox };
}

/**
 * The common preparation function every setup-capable command calls: resolves the
 * project, ensures the Toolbox is configured, migrates a legacy layout if present,
 * ensures project boilerplate, links the Toolbox, and records the manifest.
 * Fully idempotent — safe to call on every command invocation.
 */
export async function ensureAdminLocalReady(
  state: StateService,
  explorerUri?: vscode.Uri
): Promise<AdminLocalContext | undefined> {
  const workspaceFolder = await resolveWorkspaceFolder(explorerUri);
  if (!workspaceFolder) {
    return undefined;
  }

  const project = buildProjectContext(workspaceFolder);

  const git = await resolveGitLocation(project.rootPath);
  if (!git) {
    vscode.window.showErrorMessage('Admin Local: This workspace does not appear to be a Git repository.');
    return undefined;
  }

  const toolbox = await ensureToolboxConfigured(state, git.workTreeRoot);
  if (!toolbox) {
    return undefined;
  }

  await ensureProjectBoilerplate(project.adminLocalPath);

  let manifest = await readProjectManifest(project.adminLocalPath);
  if (!manifest) {
    const legacyDirs = await detectLegacyStructure(project.adminLocalPath);
    if (legacyDirs.length > 0) {
      const migrated = await runMigrationWizard(project, toolbox, legacyDirs);
      if (!migrated) {
        return undefined;
      }
      manifest = migrated;
    }
  }

  await ensureAdminLocalExcluded(git.workTreeRoot);

  const linkStatus = await repairToolboxLink(project.toolboxLinkPath, toolbox.path);
  if (linkStatus !== 'valid') {
    vscode.window.showErrorMessage(
      `Admin Local: could not verify the Toolbox link at ${project.toolboxLinkPath}.`
    );
    return undefined;
  }

  if (!manifest) {
    manifest = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      toolboxId: toolbox.id,
      toolboxLinkName: TOOLBOX_LINK_NAME,
      initializedAt: new Date().toISOString()
    };
  }
  await writeProjectManifest(project.adminLocalPath, manifest);

  return { project, git, toolbox };
}

/** Prompts the user to pick one of the registered Toolboxes. Auto-selects when only one exists. */
export async function pickToolbox(
  state: StateService,
  title: string
): Promise<ToolboxDefinition | undefined> {
  const registry = state.getRegistry();
  if (registry.toolboxes.length === 0) {
    vscode.window.showErrorMessage('Admin Local: No Toolbox is registered yet. Run Create Toolbox first.');
    return undefined;
  }
  if (registry.toolboxes.length === 1) {
    return registry.toolboxes[0];
  }

  const picked = await vscode.window.showQuickPick(
    registry.toolboxes.map(t => ({
      label: t.name,
      description: t.id === registry.defaultToolboxId ? 'Default' : undefined,
      detail: t.path,
      toolbox: t
    })),
    { title }
  );
  return picked?.toolbox;
}
