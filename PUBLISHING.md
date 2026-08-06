# Publishing and Updating Admin Local

This file covers two separate things:

1. **Does publishing an update happen automatically?** — No. You always have to run a publish command yourself; nothing pushes a new version to the Marketplace on its own.
2. **The exact steps to ship an update**, and what existing users experience when you do.

---

## Is updating automatic?

**No — from your side, publishing is always a manual, explicit action.** There is no CI/CD configured in this repository and no scheduled or automatic publish step. A new version reaches the Marketplace only when someone runs `vsce publish` (or uploads a `.vsix` through the Marketplace management UI) after bumping the version.

**From the end user's side, receiving an update *is* automatic**, once you've published it:
- If they installed from the Marketplace and have extension auto-update enabled (the VS Code default), VS Code downloads and installs the new version in the background and just prompts a reload.
- If they have auto-update disabled, they see an "Update" button on the extension in the Extensions view.
- If they installed a `.vsix` manually, they install your newer `.vsix` **over** the old one the same way they installed it the first time — no uninstall step, and their existing `.admin-local` folders and Toolbox are left untouched by the install itself.

So: you publish manually, they receive it automatically (or with one click) — never the reverse.

---

## Prerequisites (one-time, already partially done for this project)

- **Publisher ID**: `shaun-pritchard` (already set in `package.json`). If this is the very first publish ever for this publisher, create the account first at https://marketplace.visualstudio.com/manage.
- **Personal Access Token (PAT)**: created at https://dev.azure.com/ → User Settings → Personal Access Tokens, with **Marketplace → Manage** scope, org set to "All accessible organizations". Treat this like a password — do not commit it.
- **vsce** (via `npx`, no global install required): `npx @vscode/vsce --version` to confirm it resolves.

Log in once per machine (stores the PAT locally, not in the repo):
```bash
npx @vscode/vsce login shaun-pritchard
```

---

## Steps to release an update

### 1. Land the change on `main`

Merge the feature branch (e.g. `feature/shared-toolbox`) into `main` only after:
- `npm run compile` succeeds
- `npm test` passes
- The manual scenarios in `TESTING.md` most relevant to the change have been run
- `CHANGELOG.md` has a new version entry describing what changed and any upgrade notes

### 2. Confirm the version number

`package.json`'s `"version"` field is the version that ships. Bump it following semver *before* packaging — `vsce package`/`publish` will refuse to reuse a version that's already on the Marketplace.

```bash
git checkout main
git pull origin main
```

### 3. Build and smoke-test the exact artifact you're about to ship

```bash
npm install
npm run compile
npm test
npx @vscode/vsce package
```

This produces `admin-local-<version>.vsix` in the repo root.

**Install it over the currently-published version** (do not uninstall the old one first) and re-run the key manual scenarios from `TESTING.md`, especially:
- Test 15 (packaged VSIX installs over an existing version cleanly)
- Test 5 (legacy migration still triggers correctly for a repository initialized by the version you're replacing)
- Test 1–4 (Toolbox setup + the two-repository shared-file proof)

### 4. Publish

Two options — pick the one that matches whether you already bumped the version in `package.json`:

**A. Version already bumped in `package.json`:**
```bash
npx @vscode/vsce publish
```

**B. Let vsce bump it for you** (also commits and tags):
```bash
npx @vscode/vsce publish patch   # 0.1.0 → 0.1.1
npx @vscode/vsce publish minor   # 0.1.0 → 0.2.0
npx @vscode/vsce publish major   # 0.1.0 → 1.0.0
```

Either way, `vsce publish` runs `vscode:prepublish` (→ `npm run compile`) itself before uploading, so the Marketplace always gets a freshly compiled build.

### 5. Verify the listing

- Check https://marketplace.visualstudio.com/items?itemName=shaun-pritchard.admin-local shows the new version (propagation is usually near-instant, occasionally a few minutes).
- Install the Marketplace version fresh in a throwaway profile (`code --profile temp-check --install-extension shaun-pritchard.admin-local`) and run Initialize once, to catch anything that only breaks through the real Marketplace download path.

### 6. Keep the previous VSIX

Don't delete the `.vsix` from the prior release — keep it (e.g. attached to a GitHub Release) as a rollback path. If a published version needs to be pulled, use "Unpublish" from the Marketplace management page as a last resort; it does not un-install the extension from users who already have it, it only stops new installs/updates.

---

## What existing users see, concretely

```
Existing extension version installed
             ↓
VS Code updates to the new version (automatically, or via one click)
             ↓
Existing .admin-local folders and the physical Toolbox are untouched
             ↓
User runs any (.Admin-Local) command
             ↓
Extension checks the global Toolbox registry (schemaVersion 2)
             ↓
No valid Toolbox yet → one-time computer setup (recommended/choose/existing)
             ↓
Repository still has the pre-0.1.0 per-project folders → one-time migration offer
             ↓
Every command after that runs normally, using the now-linked Toolbox
```

Nothing here requires the user to uninstall, manually delete files, or re-run Initialize on every repository at once — each repository migrates the first time it's actually used after the update, exactly as described in `CHANGELOG.md`.
