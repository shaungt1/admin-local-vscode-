# Admin Local

### Portable AI workflow toolkit for developers

**Export and import API keys, prompts, and scripts between projects without committing secrets to Git.**

---

## Purpose

Admin Local solves a critical problem in modern development: **managing sensitive configuration across multiple projects without compromising security.**

Every developer working with AI APIs, cloud services, or databases faces the same challenge. You need API keys, prompts, deployment scripts, and credentials available in each project—but you cannot commit them to Git. The result is wasted time recreating configurations, hunting for keys in old projects, or worse, accidentally committing secrets.

This extension provides a **Git-safe, portable solution** for keeping your development workflow consistent across all projects.

---

## How It Works

### The `.admin-local` Folder

Admin Local creates a dedicated folder in your workspace that is automatically excluded from Git tracking using `.git/info/exclude`.

**This means:**
- Your secrets never appear in `git status`
- Impossible to accidentally commit sensitive data
- No impact on your team—changes stay local to your machine
- No `.gitignore` pollution or merge conflicts

### Folder Structure

When you initialize Admin Local, it creates:

```
.admin-local/
  ├── README.md                    # Usage documentation
  ├── .ai.store                    # API keys (OpenAI, Anthropic, Gemini, Cohere, HuggingFace)
  ├── prompts/
  │   └── example-code-review.md   # Starter prompt template
  └── scripts/                     # Custom automation scripts
```

Everything inside `.admin-local` is yours to customize. Add credentials, build your prompt library, store deployment scripts—it stays local and secure.

### Export/Import Workflow

**Export** creates a timestamped `.admloc` archive:

```
project-name-admin-local-2026-03-30T14-25-10.admloc
```

**Import** restores your complete configuration:

1. Start a new project
2. Import your `.admloc` file
3. Instant access to all your API keys, prompts, and tools

**Save 30+ minutes per project** by eliminating manual setup.

---

## Commands

All commands available via right-click context menu in Explorer or Command Palette (`Ctrl+Shift+P`).

### (.Admin-Local) Initialize

Creates the `.admin-local` folder structure in your workspace and adds it to `.git/info/exclude`.

**Requirements:**
- Workspace must be open
- Git repository must exist (`.git` folder)

**Creates:**
- `.admin-local/` folder with subdirectories
- `.ai.store` file with API key template
- `prompts/` directory with example prompt
- `scripts/` directory for automation
- `README.md` with usage instructions

---

### (.Admin-Local) Export

Creates a timestamped, compressed `.admloc` archive of your `.admin-local` folder.

**File format:** `<project-name>-admin-local-<timestamp>.admloc`

**Use cases:**
- Backup your configuration
- Share keys/prompts across your own projects
- Version control your workflow tools (outside Git)

---

### (.Admin-Local) Import

Restores a `.admin-local` folder from an exported `.admloc` archive.

**Behavior:**
- Prompts for confirmation if folder already exists
- Extracts all files to `.admin-local/`
- Preserves directory structure

**Warning:** Importing will overwrite existing files in `.admin-local/`.

---

### (.Admin-Local) Destroy

Permanently deletes the `.admin-local` folder and all its contents.

**Behavior:**
- Requires confirmation before deletion
- Cannot be undone
- Does not remove entry from `.git/info/exclude`

---

## Use Cases

### AI Development

Store API keys, prompt libraries, and testing scripts for OpenAI, Anthropic, Gemini, Cohere, and other AI services.

**Example:**
```
.admin-local/
  ├── .ai.store
  ├── prompts/
  │   ├── code-review.md
  │   ├── documentation-generator.md
  │   └── test-case-writer.md
  └── scripts/
      └── llm-benchmark.sh
```

### Cloud Development (AWS, Azure, GCP)

Manage IAM credentials, deployment scripts, and environment-specific configurations.

**Example:**
```
.admin-local/
  ├── .aws-credentials
  ├── scripts/
  │   ├── deploy-staging.sh
  │   └── deploy-production.sh
  └── terraform-vars.tfvars
```

### Database Work

Store connection strings, authentication tokens, and seed data scripts.

**Example:**
```
.admin-local/
  ├── .db-passwords
  └── scripts/
      ├── seed-dev-data.sql
      └── reset-local-db.sh
```

---

## Security Model

### Git Exclusion

Admin Local uses `.git/info/exclude` instead of `.gitignore`.

**`.gitignore`:**
- Committed to repository
- Shared with team
- Visible in Git history
- Can be accidentally removed

**`.git/info/exclude`:**
- Local-only configuration
- Never committed or shared
- Invisible to other developers
- Cannot be accidentally pushed

Your `.admin-local` folder is **impossible to commit**, even by mistake.

### No Telemetry

This extension does not collect, transmit, or store any data. Your API keys, secrets, and configurations never leave your machine.

### Export Control

You control what gets exported. Only files inside `.admin-local/` are included in `.admloc` archives.

---

## Installation

### From VSIX File

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Click `...` (More Actions) → **Install from VSIX**
4. Select `admin-local-0.0.1.vsix`

### From Marketplace (Coming Soon)

1. Open Extensions (`Ctrl+Shift+X`)
2. Search **"Admin Local"**
3. Click **Install**

---

## Requirements

- VS Code version 1.109.0 or higher
- Git repository initialized in workspace
- Git CLI installed and available in PATH

---

## Troubleshooting

**"No workspace folder is open"**  
Solution: Open a folder in VS Code before running Admin Local commands.

**"Not a Git repository"**  
Solution: Initialize Git in your workspace: `git init`

**"Permission denied" errors**  
Solution: Ensure you have write permissions to the workspace directory.

**Commands not visible in right-click menu**  
Solution: Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window").

**Advanced debugging:**  
Open VS Code Developer Tools: Help → Toggle Developer Tools (`Ctrl+Shift+I`)  
Check the Console tab for error messages.

---

## For Developers

### Build from Source

```bash
git clone https://github.com/your-username/admin-local-vscode
cd admin-local-vscode
npm install
npm run compile
```

### Development Workflow

```bash
npm run watch    # Watch mode for development
```

Press **F5** to launch Extension Development Host.

### Package Extension

```bash
npm install -g @vscode/vsce
vsce package --no-git-tag-version
```

Outputs: `admin-local-0.0.1.vsix`

---

## Contributing

Issues and pull requests welcome.  
**Repository:** [GitHub](https://github.com/your-username/admin-local-vscode)

---

## License

MIT License  
**Created by Shaun Allen Pritchard**

---

**Admin Local** — Because your secrets belong to you, not Git.


**The reason this extension exists:** Move your workflow between projects effortlessly.

**Export** from a finished project:
```
Right-click → Admin Local: Export Archive
→ Saves: project-name-admin-local-2026-03-30T12-30-45.admloc
```

**Import** into a new project:
```
Right-click → Admin Local: Import Archive
→ Select your .admloc file
→ Done! All keys, prompts, scripts restored
```

**Real-world workflow:**
1. Finish a TypeScript project with AI features
2. Export your .admin-local (API keys, prompts, scripts)
3. Start a new Python project tomorrow
4. Import → Instant access to all your AI tools
5. **Save 30 minutes of setup**

### 🔒 **Git-Safe Storage**
Uses `.git/info/exclude` - your secrets are **impossible to commit**.
- Never shows in `git status`
- Never appears in commits
- Zero risk of accidentally pushing API keys

### 📁 **Smart Folder Structure**
Auto-created on first initialization:
```
.admin-local/
  ├── .ai.store            # AI API keys (OpenAI, Anthropic, etc.)
  ├── prompts/             # Your prompt library
  │   └── example-code-review.md
  ├── scripts/             # Helper scripts & automation
  └── README.md            # Usage guide
```

### 🎯 **Right-Click Everything**
All commands in Explorer context menu:
- **Initialize** - Create folder structure
- **Export Archive** - Save as portable .admloc file
- **Import Archive** - Restore from .admloc
- **Delete Folder** - Clean removal

## 🚀 Quick Start

**Right-click in Explorer** → **Admin Local: Initialize**

Or use Command Palette (`Ctrl+Shift+P`):
```
Admin Local: Initialize
Admin Local: Export Archive
Admin Local: Import Archive
Admin Local: Delete Folder
```

## 📖 Use Cases

### AI Development Workflows
```bash
.admin-local/.ai.store         # Store OpenAI/Anthropic API keys
.admin-local/prompts/          # Build your prompt library
.admin-local/scripts/llm-test.sh  # Test scripts for AI APIs
```

### AWS & Cloud Development
```bash
.admin-local/.aws-credentials  # IAM keys
.admin-local/scripts/deploy.sh # Deployment scripts
```

### Database Work
```bash
.admin-local/.db-passwords     # Connection strings
.admin-local/scripts/seed.sql  # Test data
```

## 💾 Export/Import

**Export** your .admin-local folder to move between projects:
1. Right-click → **Admin Local: Export Archive**
2. Saves as `project-name-admin-local-2026-03-30T12-30-45.admloc`
3. Timestamped, zipped, ready to share (safely!)

**Import** to restore or copy to another project:
1. Right-click → **Admin Local: Import Archive**
2. Select your `.admloc` file
3. All files restored to `.admin-local/`

## 🔐 Security

- ✅ **Never committed** - Uses .git/info/exclude (local-only)
- ✅ **Team-safe** - Zero impact on other developers
- ✅ **Export control** - Only you decide what to export/import
- ✅ **No telemetry** - Your data stays on your machine

## 📋 Requirements

- VS Code 1.109.0+
- Git repository
- Git installed

## 📦 Installation

**Option 1: VSIX File**
1. Extensions (`Ctrl+Shift+X`) → `...` → **Install from VSIX**

**Option 2: Marketplace** (coming soon)
1. Search "Admin Local" in Extensions

## 🛠️ For Developers

```bash
npm install      # Install dependencies
npm run compile  # Build
npm run watch    # Dev mode
vsce package     # Create .vsix
```

## 📄 License

MIT - Created by Shaun Allen Pritchard

## 🤝 Contributing

Issues and PRs welcome! Visit [GitHub](https://github.com/your-username/admin-local-vscode)

---

**Admin Local** - Because your AI keys belong to you, not Git.

If you encounter issues:

1. Ensure you're in a Git repository
2. Check that Git is installed and in your PATH
3. Verify you have write permissions to the workspace
4. Check the VS Code Developer Tools console for errors (`Help > Toggle Developer Tools`)

---

**Make your development environment truly local with Admin Local!** 🚀
