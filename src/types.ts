import * as vscode from 'vscode';

export interface ToolboxDefinition {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ToolboxRegistry {
  schemaVersion: number;
  defaultToolboxId: string | null;
  toolboxes: ToolboxDefinition[];
}

export interface ToolboxIdentity {
  schemaVersion: number;
  toolboxId: string;
  name: string;
  createdAt: string;
}

export interface ProjectManifest {
  schemaVersion: number;
  toolboxId: string;
  toolboxLinkName: string;
  initializedAt: string;
  migratedFromSchema?: number;
  migratedAt?: string;
}

export type ToolboxLinkStatus =
  | 'missing'
  | 'valid'
  | 'broken'
  | 'wrong-target'
  | 'occupied-file'
  | 'occupied-directory';

export interface GitLocation {
  workTreeRoot: string;
  gitDirectory: string;
}

export interface ProjectContext {
  workspaceFolder: vscode.WorkspaceFolder;
  rootPath: string;
  adminLocalPath: string;
  toolboxLinkPath: string;
}

export interface AdminLocalContext {
  project: ProjectContext;
  git: GitLocation;
  toolbox: ToolboxDefinition;
}

export interface MigrationInventoryEntry {
  relativePath: string;
  sourcePath: string;
  destinationPath: string;
  sha256: string;
}

export type MigrationFileOutcome = 'copied' | 'skipped-identical' | 'conflict';

export interface MigrationReportEntry {
  relativePath: string;
  outcome: MigrationFileOutcome;
  conflictPath?: string;
}

export interface MigrationReport {
  copied: number;
  skippedIdentical: number;
  conflicts: number;
  entries: MigrationReportEntry[];
  backupPath: string;
}

export interface PromptItem {
  label: string;
  absolutePath: string;
  relativePath: string;
  source: string;
}

export type ArchiveType =
  | 'project-workspace'
  | 'toolbox'
  | 'legacy-project-workspace';

export interface ArchiveMetadata {
  archiveType: ArchiveType;
  schemaVersion: number;
  createdAt: string;
}
