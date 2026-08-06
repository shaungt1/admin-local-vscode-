export const CURRENT_SCHEMA_VERSION = 2;

export const ADMIN_LOCAL_FOLDER = '.admin-local';

/** Name of the filesystem link inside `.admin-local` that opens the centralized Toolbox. */
export const TOOLBOX_LINK_NAME = 'shared_toolbox';

export const TOOLBOX_IDENTITY_FILE = '.admin-local-toolbox.json';

export const PROJECT_MANIFEST_FILE = '.admin-local-project.json';

/** Human-facing name of the physical, computer-wide Toolbox folder. */
export const DEFAULT_TOOLBOX_NAME = 'Admin Local Shared Toolbox';

export const TOOLBOX_DIRECTORIES = [
  'docs',
  'key-store',
  'prompts',
  'scripts',
  'skills'
] as const;

/** Legacy per-repository folders that older versions created directly inside `.admin-local`. */
export const LEGACY_REUSABLE_DIRECTORIES = [
  'docs',
  'key-store',
  'prompts',
  'scripts',
  'skills'
] as const;

export const TOOLBOX_REGISTRY_STATE_KEY = 'adminLocal.toolboxRegistry';

export const LEGACY_SCHEMA_VERSION = 1;

export const GIT_EXCLUDE_ENTRY = '.admin-local/';

export const PROJECT_ARCHIVE_EXTENSION = '.admloc';
export const TOOLBOX_ARCHIVE_PREFIX = 'admin-local-toolbox-';
export const ARCHIVE_METADATA_FILE = '.admin-local-archive.json';
