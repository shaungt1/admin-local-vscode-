import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Activates the Admin Local extension
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('admin-local.init', async () => {
    try {
      // Get the first workspace folder
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const gitPath = path.join(rootPath, '.git');
      const adminLocalPath = path.join(rootPath, '.admin-local');

      // Check if this is a Git repository
      if (!fs.existsSync(gitPath)) {
        vscode.window.showErrorMessage('Admin Local: This workspace does not appear to be a Git repository.');
        return;
      }

      const gitInfoPath = path.join(gitPath, 'info');
      const excludePath = path.join(gitInfoPath, 'exclude');

      // Create .admin-local folder if it doesn't exist
      let folderCreated = false;
      if (fs.existsSync(adminLocalPath)) {
        const stats = fs.statSync(adminLocalPath);
        if (!stats.isDirectory()) {
          vscode.window.showErrorMessage('Admin Local: .admin-local exists but is not a directory.');
          return;
        }
      } else {
        fs.mkdirSync(adminLocalPath, { recursive: true });
        folderCreated = true;
      }

      // Create welcome file if folder was just created
      if (folderCreated) {
        const welcomeFile = path.join(adminLocalPath, 'README.md');
        const welcomeContent = `# Welcome to .admin-local

This is your **local-only** folder for storing sensitive and personal files.

## What is this folder for?

Store anything that should **never** be committed to Git:

- 🔑 API keys, tokens, credentials
- 🛠️ Local scripts and tooling
- 📝 Test data or scratch files
- ⚙️ Machine-specific configs
- 🐛 Debugging artifacts
- 💡 Personal notes and ideas

## Why is it safe?

This folder is ignored using \`.git/info/exclude\`, which means:

✅ **Local only** - The ignore rule exists only on your machine  
✅ **Never committed** - Impossible to accidentally push to Git  
✅ **Zero team impact** - Other developers won't see your files  
✅ **Not in .gitignore** - No changes to the repository

## How to use it

Just drop files in here! They'll automatically be ignored by Git.

Examples:
\`\`\`
.admin-local/
  ├── secrets.env          # Environment variables
  ├── test-api-keys.txt    # API credentials
  ├── scratch.js           # Quick experiments
  ├── debug.log            # Log files
  └── notes.md             # Personal notes
\`\`\`

---

**Created by Admin Local extension** | [Learn More](https://github.com/your-username/admin-local-vscode)
`;
        
        fs.writeFileSync(welcomeFile, welcomeContent, 'utf8');
      }

      // Create .git/info directory if it doesn't exist
      if (!fs.existsSync(gitInfoPath)) {
        fs.mkdirSync(gitInfoPath, { recursive: true });
      }

      // Create .git/info/exclude if it doesn't exist
      if (!fs.existsSync(excludePath)) {
        fs.writeFileSync(excludePath, '', 'utf8');
      }

      // Add .admin-local/ to exclude file if not already present
      const entry = '.admin-local/';
      const current = fs.readFileSync(excludePath, 'utf8');
      const lines = current.split(/\r?\n/);

      if (!lines.includes(entry)) {
        const next = current.endsWith('\n') || current.length === 0
          ? current + entry + '\n'
          : current + '\n' + entry + '\n';

        fs.writeFileSync(excludePath, next, 'utf8');
        
        vscode.window.showInformationMessage(
          'Admin Local: Initialized .admin-local and added it to .git/info/exclude'
        );
      } else {
        vscode.window.showInformationMessage(
          'Admin Local: .admin-local already exists and is already in .git/info/exclude'
        );
      }

      // Verify the setup
      const verifyExclude = fs.readFileSync(excludePath, 'utf8');
      const verifyLines = verifyExclude.split(/\r?\n/);
      
      if (!verifyLines.includes(entry)) {
        vscode.window.showWarningMessage(
          'Admin Local: Warning - Verification failed. The ignore entry may not have been written correctly.'
        );
      }

      if (!fs.existsSync(adminLocalPath) || !fs.statSync(adminLocalPath).isDirectory()) {
        vscode.window.showWarningMessage(
          'Admin Local: Warning - Verification failed. The .admin-local folder may not exist.'
        );
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local failed: ${message}`);
      console.error('Admin Local error:', error);
    }
  });

  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate() {}
