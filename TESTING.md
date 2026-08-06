# Testing Guide for Admin Local Extension

This guide covers the automated test suite plus the manual scenarios needed to validate the centralized Toolbox architecture before distribution.

## Automated Tests

```bash
npm test
```

Runs `test/*.test.ts` (compiled via `tsconfig.test.json`) under Node's built-in test runner. These exercise the pure filesystem/Git/archive/migration services directly, with no VS Code host required, using real temp directories, real `git` commands, and real filesystem links (junctions on Windows). Current coverage:

- **`stateService`** — empty registry shape, adding/removing/updating Toolboxes, default-Toolbox fallback when the current default is removed.
- **`locationService`** — recommended path shape, rejects relative paths, rejects a path literally named `.admin-local`, rejects an existing file, rejects a Toolbox location inside the current repository (and vice versa).
- **`linkService`** — missing / valid / wrong-target / occupied-file / occupied-directory classification, link creation and repair, refusal to delete a real directory.
- **`migrationService`** — legacy-folder detection (only the five recognized names, only when no v2 manifest exists), copy-new / skip-identical / conflict-isolate behavior, backup folder creation, safe to detect again after migrating.
- **`archiveService`** — project export excludes the Toolbox link, Toolbox export includes Toolbox content, archive type is recorded correctly, import validation rejects path traversal and entries targeting the reserved `shared_toolbox` name.
- **`gitService`** — resolves a normal repository, resolves a Git worktree with a `.git` pointer file, returns `undefined` for a non-Git directory, adds the exclude entry once and never duplicates it.

Run `npm run compile:test` alone if you only want the TypeScript check without executing tests.

## Manual Pre-Testing Setup

1. **Build the extension**:
   ```bash
   npm install
   npm run compile
   ```
2. **Launch Extension Development Host**:
   - Open this project in VS Code
   - Press `F5` (or Run > Start Debugging)
   - A new VS Code window opens with the extension loaded

## Manual Test Scenarios

### ✅ Test 1: First-Time Toolbox Setup + Initialize

**Setup:** Open a fresh Git repository. No Toolbox has been configured yet on this machine/profile.

**Steps:**
1. Right-click in Explorer → `(.Admin-Local) Initialize`
2. Choose **Use Recommended Location**

**Expected Result:**
- ✓ `Documents/Admin Local Shared Toolbox/` is created with `docs/`, `key-store/`, `prompts/`, `scripts/`, `skills/`
- ✓ `.admin-local-toolbox.json` exists inside it
- ✓ `.admin-local/` is created in the repository with `README.md`, `.ai.store`, `.admin-local-project.json`, `shared_toolbox/`
- ✓ `.admin-local/shared_toolbox` is a junction (Windows) / symlink (macOS, Linux) pointing at the Toolbox
- ✓ `.git/info/exclude` contains `.admin-local/`
- ✓ Success message shows both paths

---

### ✅ Test 2: Re-running Initialize Is a No-Op

**Setup:** Run Test 1 first.

**Steps:** Run `(.Admin-Local) Initialize` again in the same repository.

**Expected Result:**
- ✓ No duplicate `.git/info/exclude` entries
- ✓ No files overwritten (README.md / .ai.store untouched if edited)
- ✓ Same Toolbox link, same manifest

---

### ✅ Test 3: Second Repository Uses the Existing Toolbox Automatically

**Setup:** Toolbox already configured from Test 1. Open a second, different Git repository.

**Steps:** Run `(.Admin-Local) Initialize`.

**Expected Result:**
- ✓ No first-time setup wizard shown again
- ✓ `.admin-local/shared_toolbox` in the new repository points at the same physical Toolbox

---

### ✅ Test 4: Two-Repository Shared-File Proof

This is the core acceptance test for the whole feature.

**Steps:**
1. Initialize `project-a` and `project-b` against the same Toolbox.
2. In `project-a`, create `.admin-local/shared_toolbox/scripts/shared-test.js` with some content.
3. Open the same path from `project-b` — content matches.
4. Edit the file from `project-b`.
5. Open `Documents/Admin Local Shared Toolbox/scripts/shared-test.js` directly — it reflects Project B's edit.
6. Open the file from `project-a` again — it also reflects Project B's edit.

**Expected Result:** All three paths are the same physical file; nothing is copied or synced with a delay.

---

### ✅ Test 5: Legacy Repository Migration (Upgrade Path)

**Setup:** A repository initialized by the pre-0.1.0 extension, containing `.admin-local/{docs,key-store,prompts,scripts}` directly (no `.admin-local-project.json`).

**Steps:** Run `(.Admin-Local) Initialize`.

**Expected Result:**
- ✓ Migration wizard appears, listing the detected legacy folders
- ✓ **Migrate Reusable Files and Link Toolbox**: files copy into the Toolbox; identical destination files are skipped; conflicting files are copied under a `<name>.project-<repo>.<date>.<ext>` name instead of overwriting; originals move into `.admin-local/legacy-toolbox-backup-<timestamp>/` (never deleted automatically); `shared_toolbox` link is created; manifest records `migratedFromSchema`/`migratedAt`
- ✓ Re-running Initialize afterward does not show the migration wizard again
- ✓ Ticket folders, `README.md`, `.ai.store`, and any unrecognized folders are untouched by migration

---

### ✅ Test 6: Open Toolbox / Repair Toolbox Link

**Steps:**
1. Run `(.Admin-Local) Open Toolbox` — the physical folder opens in the OS file browser.
2. Manually delete `.admin-local/shared_toolbox` (or rename the Toolbox folder to simulate a broken link), then run `(.Admin-Local) Repair Toolbox Link`.

**Expected Result:**
- ✓ Repair reports the link status before and after
- ✓ A real file or real directory occupying `shared_toolbox` is never deleted automatically — the command errors out with the exact path instead

---

### ✅ Test 7: Copy Prompt Searches the Toolbox and Ticket Folders

**Setup:** Add a `.md` file under `shared_toolbox/prompts/` and another under a ticket folder's own `prompts/` subfolder.

**Steps:** Run `(.Admin-Local) Copy Prompt to Clipboard`.

**Expected Result:**
- ✓ Both prompts appear, labeled `[Toolbox]` and `[<ticket-folder-name>]` respectively
- ✓ Selecting one copies its content to the clipboard

---

### ✅ Test 8: Export / Import Project Workspace Excludes the Toolbox

**Steps:**
1. Run `(.Admin-Local) Export Project Workspace`, save the `.admloc` file.
2. Inspect the archive contents — confirm no `shared_toolbox/` entries.
3. In a different (or cleaned) repository, run `(.Admin-Local) Import Project Workspace` and select the archive.

**Expected Result:**
- ✓ Export excludes `shared_toolbox` and reports it under "Excluded"
- ✓ Import copies only project-local files, then verifies/creates the Toolbox link separately
- ✓ An archive entry that tries to target `shared_toolbox`, use `../` traversal, or an absolute path is rejected and reported, not imported

---

### ✅ Test 9: Export / Import Toolbox Are Separate From Project Archives

**Steps:**
1. Run `(.Admin-Local) Export Toolbox` — produces an `admin-local-toolbox-<timestamp>.admloc` file distinct from project exports.
2. Run `(.Admin-Local) Import Toolbox` against it, choosing **Merge into Existing Toolbox**.

**Expected Result:**
- ✓ Toolbox archive metadata records `"archiveType": "toolbox"`
- ✓ Merge copies new files, skips identical ones, and places conflicts under a `conflicts/` folder rather than overwriting

---

### ✅ Test 10: Destroy Project Workspace Preserves the Toolbox

**Steps:** Run `(.Admin-Local) Destroy Project Workspace` and confirm.

**Expected Result:**
- ✓ Warning explicitly states the Toolbox will not be deleted
- ✓ `.admin-local/shared_toolbox` (a link) is unlinked, then the rest of `.admin-local` is removed
- ✓ The physical Toolbox and any other repository linked to it are unaffected
- ✓ If `shared_toolbox` is somehow a real directory (not a link), Destroy refuses to delete it automatically and says so

---

### ✅ Test 11: Multiple Toolboxes

**Steps:**
1. Run `(.Admin-Local) Create Toolbox`, give it a different name/location, decline to make it default.
2. Run `(.Admin-Local) Initialize` in a new repository — a picker now appears listing both Toolboxes plus "Create New Toolbox" / "Use Existing Toolbox".
3. Run `(.Admin-Local) Set Default Toolbox` and switch the default.
4. Run `(.Admin-Local) Change Toolbox Location` on one of them, then repair an open project's link.

**Expected Result:** Each project records which Toolbox it uses in its own manifest; switching the default does not affect already-initialized repositories until they're repaired.

---

### ❌ Test 12: No Workspace Open / Not a Git Repository

**Expected Result (unchanged from prior versions):**
- ❌ "Admin Local: No workspace folder is open." when nothing is open
- ❌ "Admin Local: This workspace does not appear to be a Git repository." for a non-Git folder — resolved via `git rev-parse --show-toplevel`, not by checking for a `.git` directory directly, so this also correctly rejects folders with a stray `.git` file that isn't a real worktree pointer

---

### ✅ Test 13: Remote Workspace Is Explicitly Rejected

**Setup:** Open a workspace through Remote-SSH, a Dev Container, Codespaces, or WSL.

**Steps:** Run `(.Admin-Local) Initialize`.

**Expected Result:**
- ❌ Clear message stating Toolbox setup is only supported for local Windows/macOS/Linux workspaces, naming the detected remote (`vscode.env.remoteName`)
- ✓ No Toolbox is created inside the remote/container filesystem

---

### ✅ Test 14: Multi-Root Workspace and Explorer Context Resolution

**Setup:** Open a multi-root workspace with two or more Git repositories.

**Steps:**
1. Run `(.Admin-Local) Initialize` from the Command Palette (no Explorer selection).
2. Right-click a specific folder in Explorer and run `(.Admin-Local) Initialize` from the context menu.

**Expected Result:**
- ✓ Command Palette invocation shows a Quick Pick listing every workspace folder's name and full path
- ✓ Explorer right-click uses the workspace folder containing the clicked item, not always the first one

---

### ✅ Test 15: Packaged VSIX Installation Over an Existing Version

**Setup:**
```bash
npm run compile
npx @vscode/vsce package
```

**Steps:**
1. Install the previous published version (e.g. 0.0.3) and initialize a repository with it.
2. Install the new `.vsix` **over** it (Extensions → `...` → Install from VSIX) — do not uninstall first.
3. Reload VS Code.
4. Open the repository initialized under the old version and run any Admin Local command.

**Expected Result:**
- ✓ No uninstall required; existing `.admin-local` content is untouched immediately after the update
- ✓ First command run triggers Toolbox setup, then offers migration for that repository
- ✓ All commands function identically to the development-host version

---

## Platform-Specific Testing

### Windows
- [ ] Windows 10 / 11
- [ ] `.admin-local/shared_toolbox` is a directory **junction** (no elevated terminal required)
- [ ] Git Bash / PowerShell / WSL terminals all see the same linked content

### macOS
- [ ] `.admin-local/shared_toolbox` is a directory **symbolic link**
- [ ] Finder and VS Code Explorer show identical contents

### Linux
- [ ] `.admin-local/shared_toolbox` is a directory **symbolic link**
- [ ] Recommended location falls back correctly when `~/Documents` doesn't exist

---

## Regression Testing Checklist

Before each release, verify:

- [ ] `npm test` passes
- [ ] Fresh Git repo initialization works (Test 1)
- [ ] Re-running Initialize is a no-op (Test 2)
- [ ] Two-repository shared-file proof passes (Test 4)
- [ ] Legacy migration is safe, non-destructive, and doesn't repeat (Test 5)
- [ ] Export/Import never touch the Toolbox link (Tests 8–9)
- [ ] Destroy never deletes the physical Toolbox (Test 10)
- [ ] No workspace / non-Git / remote-workspace errors are clear (Tests 12–13)
- [ ] Packaged VSIX installs over the previous published version cleanly (Test 15)
- [ ] Windows/macOS/Linux platform checks above pass
- [ ] VS Code Developer Tools shows no console errors

---

## Reporting Bugs

If a test fails, document: OS and version, VS Code version, Git version, exact steps, expected vs. actual result, and any console errors (`Help → Toggle Developer Tools`).

---

## Sign-Off Checklist

Before releasing:

- [ ] All automated tests pass (`npm test`)
- [ ] All manual scenarios above pass
- [ ] Tested on Windows, macOS, and Linux
- [ ] VSIX package tested by installing over the previously published version
- [ ] Documentation is accurate (README, CHANGELOG, this file)
- [ ] No console errors

---

**Testing complete?** You're ready to distribute! 🎉
