# Command Reference

Every command below is prefixed `(.Admin-Local)` in the Command Palette and category `Admin Local`. Project commands also appear on the Explorer right-click menu; Toolbox administration commands are Command Palette only (they don't need a repository open).

---

## Project commands

### (.Admin-Local) Initialize

The main command — sets up or verifies everything for the current repository.

**What it does, in order:**
1. Resolves which repository you mean (the right-clicked folder, or the only open workspace, or a picker if you have several open).
2. Confirms it's a real Git working tree (via `git rev-parse`, so worktrees and `.git` pointer files work too).
3. If no Toolbox is registered yet on this computer/profile: shows the first-time setup dialog — **Use Recommended Location**, **Choose Another Location**, or **Use Existing Toolbox**.
4. If the repository has the old-style layout (`docs/`, `key-store/`, `prompts/`, `scripts/` directly inside `.admin-local`, no manifest yet): shows the migration wizard.
5. Creates `.admin-local` (if missing) with `README.md` and `.ai.store`.
6. Creates or repairs the `.admin-local/shared_toolbox` link.
7. Adds `.admin-local/` to `.git/info/exclude` (once — never duplicated).
8. Writes/updates `.admin-local/.admin-local-project.json`.

Safe to run repeatedly — once everything above is already correct, running it again just confirms that and does nothing destructive.

### (.Admin-Local) Open Toolbox

Reveals the physical Toolbox folder in your OS file browser (Explorer/Finder). If you have more than one registered Toolbox, asks which one first. Works even without a repository open.

### (.Admin-Local) Repair Toolbox Link

Checks `.admin-local/shared_toolbox` and reports its status (missing / valid / broken / wrong-target / a real file or folder is in the way), then fixes it if it's a link problem. If a real file or folder is occupying that path, it stops and tells you the exact path instead of deleting anything.

### (.Admin-Local) Copy Prompt to Clipboard

Searches `<Toolbox>/prompts/**` plus any ticket folder in the current repo that has its own `prompts` or `prompt` subfolder. Shows a picker with each result labeled by where it came from (`[Toolbox]` vs. e.g. `[BP-1427-fix-callback]`), then copies the file you pick to your clipboard.

### (.Admin-Local) Export Project Workspace

Archives this repository's private `.admin-local` content — ticket folders, `README.md`, `.ai.store`, the manifest — into a timestamped `.admloc` zip. Walks the folder using `lstat` and explicitly skips `shared_toolbox`, so the Toolbox link and its target are never included, no matter how large the Toolbox is. Optionally asks whether to include a leftover migration backup folder, since those can be large.

### (.Admin-Local) Import Project Workspace

Restores project-local content from a `.admloc` archive: extracts to a temp folder first, rejects any entry that tries to write outside the folder (`../`), use an absolute path, target `shared_toolbox`, or is itself a filesystem link — then asks before overwriting anything that already exists, copies the rest in, and re-verifies the Toolbox link afterward. Accepts both the new archive format and old `.admloc` files from pre-0.1.0 versions.

### (.Admin-Local) Destroy Project Workspace

Deletes this repository's `.admin-local` folder. First confirms with a warning that explicitly states the Toolbox will *not* be deleted, then unlinks `shared_toolbox` (removes just the link entry, never the real target), then removes the rest of `.admin-local`. If `shared_toolbox` turns out to be a real folder rather than a link (shouldn't normally happen), it refuses to delete it automatically and tells you.

---

## Toolbox administration

These don't require a repository to be open, and mostly matter once you have (or want) more than one Toolbox.

### (.Admin-Local) Create Toolbox

Creates an additional, separate physical Toolbox — useful if you want to keep, say, client work isolated from your personal prompts/scripts. Asks for a name and a location, creates the five standard folders (`docs`, `key-store`, `prompts`, `scripts`, `skills`), and asks whether to make it your default.

### (.Admin-Local) Use Existing Toolbox

Registers a Toolbox folder that already exists on disk instead of creating a new one — e.g. one you made on another machine and copied over, or one left behind after reinstalling VS Code (it has its own `.admin-local-toolbox.json` identity file, so the extension recognizes it).

### (.Admin-Local) Set Default Toolbox

Only relevant with 2+ registered Toolboxes: picks which one **Initialize** uses automatically for new repositories. Doesn't affect repositories already linked to a different Toolbox.

### (.Admin-Local) Change Toolbox Location

Repoints a registered Toolbox at a different physical folder — either an existing folder or a new one you create on the spot. After changing it, offers to immediately repair the currently open repository's link; any other repository still linked to the old path needs **Repair Toolbox Link** run on it separately.

### (.Admin-Local) Export Toolbox

Archives an *entire* physical Toolbox — every prompt, script, doc, key-store file, and skill — into its own `.admloc` file, clearly separate from a project export so you never accidentally back up your whole Toolbox while meaning to export one ticket's scratch work.

### (.Admin-Local) Import Toolbox

Takes a Toolbox archive and asks: **Merge into Existing Toolbox** (new files copied in, identical files skipped, conflicting files placed under a `conflicts/` subfolder rather than overwritten) or **Create New Toolbox from Archive** (asks for a name/location, creates it, then imports everything into it).

---

## What's proven vs. what's implemented

Everything above has been hands-on tested on Windows, including a real legacy-repository migration. It's also implemented and unit-tested for macOS/Linux (directory symbolic links instead of junctions) but not yet run on real Mac/Linux hardware — see the Platform Support section in [README.md](README.md).
