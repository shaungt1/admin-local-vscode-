import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

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

      // Create folder structure if folder was just created
      if (folderCreated) {
        // Create subdirectories
        const promptsPath = path.join(adminLocalPath, 'prompts');
        const scriptsPath = path.join(adminLocalPath, 'scripts');
        const docsPath = path.join(adminLocalPath, 'docs');
        const keyStorePath = path.join(adminLocalPath, 'key-store');
        
        fs.mkdirSync(promptsPath, { recursive: true });
        fs.mkdirSync(scriptsPath, { recursive: true });
        fs.mkdirSync(docsPath, { recursive: true });
        fs.mkdirSync(keyStorePath, { recursive: true });
        
        // Create .ai.store file
        const aiStorePath = path.join(adminLocalPath, '.ai.store');
        const aiStoreContent = `# AI API Keys and Configuration
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
        fs.writeFileSync(aiStorePath, aiStoreContent, 'utf8');
        
        // Create welcome README
        const welcomeFile = path.join(adminLocalPath, 'README.md');
        const welcomeContent = `# .admin-local

**Local-only workspace for AI development**

## Folder Structure

\`\`\`
.admin-local/
  ├── README.md
  ├── .ai.store
  ├── docs/
  ├── key-store/
  ├── prompts/
  └── scripts/
\`\`\`

## .ai.store

AI API keys and configuration. Never committed to Git.

## docs/

Planning documents and task lists for AI/LLM coordination.

## key-store/

Secure storage for credentials, tokens, and connection strings.

## prompts/

Reusable AI prompts and templates.

## scripts/

Automation scripts and utilities.

---

**Security**: Uses \`.git/info/exclude\` - impossible to commit.
`;
        
        fs.writeFileSync(welcomeFile, welcomeContent, 'utf8');
        
        // Create INFO.md files for each folder
        const promptsInfo = path.join(promptsPath, 'INFO.md');
        const promptsInfoContent = `# 💡 Prompts

Reusable AI prompts and templates for development workflows.

**Right-click → (.Admin-Local) Copy Prompt to Clipboard**

Paste directly into VS Code Chat (Ctrl+V) to use your custom prompts.
`;
        fs.writeFileSync(promptsInfo, promptsInfoContent, 'utf8');

        const scriptsInfo = path.join(scriptsPath, 'INFO.md');
        const scriptsInfoContent = `# 📦 Scripts

Toolbox for developers.

## Contents

- 🔧 **Shell Scripts** - Automation and utility commands
- 🔌 **Connection Scripts** - API and service integrations
- 📋 **Tool Scripts** - Developer utilities and helpers

**Note:** This folder is excluded from version control to maintain local-only configurations.
`;
        fs.writeFileSync(scriptsInfo, scriptsInfoContent, 'utf8');

        const docsInfo = path.join(docsPath, 'INFO.md');
        const docsInfoContent = `# 📋 Planning & Documentation

This folder contains planning documents and task lists used by AI/LLM agents to coordinate and execute tasks.

## Contents

- 📝 **Task Lists** - Structured task definitions and execution plans
- 🎯 **Planning Docs** - Strategy, workflows, and project organization
- 🔑 **Configuration** - API keys, prompts, and environment settings
- 📦 **Scripts** - Automation and utility scripts

Use this modular structure to maintain clean separation of concerns while enabling collaborative AI planning and execution.
`;
        fs.writeFileSync(docsInfo, docsInfoContent, 'utf8');

        const keyStoreInfo = path.join(keyStorePath, 'INFO.md');
        const keyStoreInfoContent = `# 🔐 Key Store

Secure storage for sensitive credentials and access tokens used during development.

**Contents:**
- API keys and tokens
- Database connection strings
- Authentication credentials
- Environment variables
- Access passwords

> ⚠️ **This will never get committed**
`;
        fs.writeFileSync(keyStoreInfo, keyStoreInfoContent, 'utf8');
        
        // Create example prompt
        const examplePrompt = path.join(promptsPath, 'prompt_exe.md');
        const exampleContent = `# Code Review Prompt

You are an expert code reviewer. Analyze the provided code and give feedback on:

1. **Code Quality**: Readability, maintainability, best practices
2. **Performance**: Potential bottlenecks or optimizations
3. **Security**: Vulnerabilities or security concerns
4. **Testing**: Test coverage and edge cases
5. **Documentation**: Comments and clarity

Provide specific, actionable suggestions.
`;
        fs.writeFileSync(examplePrompt, exampleContent, 'utf8');
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

  // Delete command
  const deleteCommand = vscode.commands.registerCommand('admin-local.delete', async () => {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const adminLocalPath = path.join(rootPath, '.admin-local');

      if (!fs.existsSync(adminLocalPath)) {
        vscode.window.showInformationMessage('Admin Local: Folder does not exist.');
        return;
      }

      // Confirm deletion
      const answer = await vscode.window.showWarningMessage(
        'Delete .admin-local folder and all its contents? This cannot be undone.',
        { modal: true },
        'Delete'
      );

      if (answer !== 'Delete') {
        return;
      }

      // Delete the folder recursively
      fs.rmSync(adminLocalPath, { recursive: true, force: true });

      vscode.window.showInformationMessage('Admin Local: Folder deleted successfully.');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local delete failed: ${message}`);
      console.error('Admin Local delete error:', error);
    }
  });

  context.subscriptions.push(deleteCommand);

  // Export command
  const exportCommand = vscode.commands.registerCommand('admin-local.export', async () => {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const adminLocalPath = path.join(rootPath, '.admin-local');

      if (!fs.existsSync(adminLocalPath)) {
        vscode.window.showErrorMessage('Admin Local: Folder does not exist. Initialize it first.');
        return;
      }

      // Create timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const projectName = path.basename(rootPath);
      const fileName = `${projectName}-admin-local-${timestamp}.admloc`;

      // Ask user where to save
      const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(path.join(rootPath, fileName)),
        filters: {
          'Admin Local Archive': ['admloc'],
          'All Files': ['*']
        }
      });

      if (!saveUri) {
        return;
      }

      // Create zip archive
      const output = fs.createWriteStream(saveUri.fsPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        vscode.window.showInformationMessage(
          `Admin Local: Exported to ${path.basename(saveUri.fsPath)} (${(archive.pointer() / 1024).toFixed(1)} KB)`
        );
      });

      archive.on('error', (err: Error) => {
        throw err;
      });

      archive.pipe(output);
      archive.directory(adminLocalPath, false);
      await archive.finalize();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local export failed: ${message}`);
      console.error('Admin Local export error:', error);
    }
  });

  context.subscriptions.push(exportCommand);

  // Import command
  const importCommand = vscode.commands.registerCommand('admin-local.import', async () => {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const adminLocalPath = path.join(rootPath, '.admin-local');

      // Check if folder already exists
      if (fs.existsSync(adminLocalPath)) {
        const answer = await vscode.window.showWarningMessage(
          'Admin Local: Folder already exists. Importing will overwrite existing files. Continue?',
          { modal: true },
          'Overwrite'
        );

        if (answer !== 'Overwrite') {
          return;
        }
      }

      // Ask user to select file
      const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          'Admin Local Archive': ['admloc'],
          'All Files': ['*']
        },
        title: 'Import Admin Local Archive'
      });

      if (!fileUri || fileUri.length === 0) {
        return;
      }

      // Create folder if it doesn't exist
      if (!fs.existsSync(adminLocalPath)) {
        fs.mkdirSync(adminLocalPath, { recursive: true });
      }

      // Extract archive
      await extract(fileUri[0].fsPath, { dir: adminLocalPath });

      vscode.window.showInformationMessage('Admin Local: Import completed successfully.');

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local import failed: ${message}`);
      console.error('Admin Local import error:', error);
    }
  });

  context.subscriptions.push(importCommand);

  // Copy Prompt command
  const copyPromptCommand = vscode.commands.registerCommand('admin-local.copyPrompt', async () => {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('Admin Local: No workspace folder is open.');
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const adminLocalPath = path.join(rootPath, '.admin-local');
      const promptsPath = path.join(adminLocalPath, 'prompts');

      if (!fs.existsSync(promptsPath)) {
        vscode.window.showErrorMessage('Admin Local: Prompts folder does not exist. Initialize Admin Local first.');
        return;
      }

      // Read all .md files from prompts folder
      const files = fs.readdirSync(promptsPath)
        .filter(file => file.endsWith('.md'))
        .sort();

      if (files.length === 0) {
        vscode.window.showInformationMessage('Admin Local: No prompts found in prompts folder.');
        return;
      }

      // Show Quick Pick menu
      const selected = await vscode.window.showQuickPick(
        files.map(file => ({
          label: file,
          description: path.join('.admin-local', 'prompts', file)
        })),
        {
          placeHolder: 'Select a prompt to copy to clipboard',
          title: 'Admin Local Prompts'
        }
      );

      if (!selected) {
        return;
      }

      // Read file content
      const filePath = path.join(promptsPath, selected.label);
      const content = fs.readFileSync(filePath, 'utf8');

      // Copy to clipboard
      await vscode.env.clipboard.writeText(content);

      vscode.window.showInformationMessage(
        `Admin Local: Copied "${selected.label}" to clipboard. Press Ctrl+V to paste.`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Admin Local copy prompt failed: ${message}`);
      console.error('Admin Local copy prompt error:', error);
    }
  });

  context.subscriptions.push(copyPromptCommand);
}

/**
 * Deactivates the extension
 */
export function deactivate() {}
