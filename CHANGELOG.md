# Changelog

All notable changes to the "Admin Local" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-06

### Added
- Centralized, computer-wide **Admin Local Shared Toolbox**: one physical folder (`docs`, `key-store`, `prompts`, `scripts`, `skills`) linked into every repository as `.admin-local/shared_toolbox`, instead of a separate copy per project.
- Multi-Toolbox support: a default Toolbox per computer, with optional additional named Toolboxes (e.g. Personal, Client work).
- One-time, transactional migration wizard for repositories created by pre-0.1.0 versions: reusable folders are copied into the Toolbox (skipping identical files, isolating conflicts), the originals are moved to a timestamped local backup, and nothing is deleted automatically.
- New commands: `(.Admin-Local) Open Toolbox`, `Create Toolbox`, `Use Existing Toolbox`, `Set Default Toolbox`, `Change Toolbox Location`, `Repair Toolbox Link`, `Export Toolbox`, `Import Toolbox`.
- Correct Git repository resolution via `git rev-parse`, supporting worktrees and `.git` pointer files (not just plain `.git` directories).
- Correct multi-root workspace and Explorer-context-menu resolution (previously always used the first workspace folder).
- Automated test suite (Node's built-in test runner) covering state, location, filesystem-link, migration, archive, and Git-exclude behavior.

### Changed
- `(.Admin-Local) Export` / `Import` are now explicitly project-workspace only and never touch the Toolbox link or its target; a project export walks `.admin-local` with `lstat` and refuses to follow filesystem links.
- `(.Admin-Local) Destroy` now only removes the current repository's `.admin-local` workbench; it unlinks the Toolbox link entry but never deletes a real Toolbox directory.
- `(.Admin-Local) Copy Prompt to Clipboard` now searches the centralized Toolbox's `prompts/` folder plus any project ticket folder containing a `prompts`/`prompt` subfolder, and labels each result by its source.
- `src/extension.ts` refactored from a single 497-line file into `services/` and `commands/` modules; existing command IDs (`admin-local.init`, `.delete`, `.export`, `.import`, `.copyPrompt`) are preserved and repointed to the new implementations, so existing keybindings/menus keep working.

### Upgrade notes
- Existing users update through the normal VS Code extension update flow — no uninstall, no manual `.admin-local` changes required.
- The first Admin Local command run after upgrading configures the computer-wide Toolbox (recommended location, or your own), then migrates the current repository if it uses the older per-project folder layout.

### Platform verification status
- **Windows**: hands-on verified — Toolbox setup, directory-junction linking, and the full legacy migration flow were run end-to-end against real repositories.
- **macOS / Linux**: implemented (directory symbolic links via the same `linkService` code path) and covered by the automated test suite, but not yet run on an actual Mac or Linux machine. Please report any platform-specific issues.

## [0.0.1] - 2026-03-27

### Added
- Initial release of Admin Local extension
- Command: `Admin Local: Initialize` to create `.admin-local` folder
- Automatic addition of `.admin-local/` to `.git/info/exclude`
- Error handling for non-Git workspaces
- Verification of successful initialization
- Support for Windows, macOS, and Linux
- Comprehensive README documentation

### Features
- Creates `.admin-local` directory in workspace root
- Ensures `.git/info/exclude` file exists
- Adds ignore entry only if not already present
- Provides user feedback through VS Code notifications
- Handles edge cases (no workspace, not a Git repo, permission errors)

### Security
- Safe file operations with proper error handling
- Read/write verification to prevent silent failures
- No modification of `.gitignore` or tracked Git files
