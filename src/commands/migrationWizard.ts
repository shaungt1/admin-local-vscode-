import * as path from 'path';
import * as vscode from 'vscode';
import { CURRENT_SCHEMA_VERSION, LEGACY_SCHEMA_VERSION, TOOLBOX_LINK_NAME } from '../constants';
import { ProjectContext, ProjectManifest, ToolboxDefinition } from '../types';
import { performMigration } from '../services/migrationService';

const MIGRATE = 'Migrate Reusable Files and Link Toolbox';
const LINK_ONLY = 'Link Toolbox Without Migrating';
const REVIEW = 'Review Migration';

function baseManifest(toolbox: ToolboxDefinition): ProjectManifest {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    toolboxId: toolbox.id,
    toolboxLinkName: TOOLBOX_LINK_NAME,
    initializedAt: new Date().toISOString()
  };
}

/**
 * Presents the one-time legacy-migration choice for a repository using the pre-Toolbox
 * layout. Returns the resulting project manifest, or undefined if the user cancelled.
 */
export async function runMigrationWizard(
  project: ProjectContext,
  toolbox: ToolboxDefinition,
  legacyDirs: string[]
): Promise<ProjectManifest | undefined> {
  const choice = await vscode.window.showInformationMessage(
    `This repository uses the older Admin Local folder structure.\n\n` +
      `Reusable folders were found:\n\n${legacyDirs.join('\n')}\n\n` +
      `Selected Toolbox:\n${toolbox.path}`,
    { modal: true },
    MIGRATE,
    LINK_ONLY,
    REVIEW
  );

  if (!choice) {
    return undefined;
  }

  if (choice === REVIEW) {
    await vscode.window.showInformationMessage(
      `Folders that would be migrated into the Toolbox:\n\n${legacyDirs
        .map(dir => `${dir}/  →  ${path.join(toolbox.path, dir)}`)
        .join('\n')}`,
      { modal: true }
    );
    return runMigrationWizard(project, toolbox, legacyDirs);
  }

  if (choice === LINK_ONLY) {
    return baseManifest(toolbox);
  }

  // MIGRATE
  const projectName = path.basename(project.rootPath);
  const report = await performMigration(project.adminLocalPath, legacyDirs, toolbox.path, projectName);

  await vscode.window.showInformationMessage(
    `Migration complete.\n\n` +
      `Copied: ${report.copied} files\n` +
      `Skipped as identical: ${report.skippedIdentical} files\n` +
      `Conflicts requiring review: ${report.conflicts} files\n` +
      `Legacy backup: ${report.backupPath}`,
    { modal: true }
  );

  return {
    ...baseManifest(toolbox),
    migratedFromSchema: LEGACY_SCHEMA_VERSION,
    migratedAt: new Date().toISOString()
  };
}
