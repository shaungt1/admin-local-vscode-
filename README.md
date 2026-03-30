# Admin Local

A VS Code extension that creates a local-only `.admin-local` folder in your Git repository and ensures it's ignored using `.git/info/exclude`.

## What is Admin Local?

**Admin Local** is a local-only folder inside a project used to store sensitive or personal development files that must never be committed to Git.

### How it works

The extension:
1. Creates a `.admin-local/` folder in your workspace root
2. Adds `.admin-local/` to `.git/info/exclude` (a Git ignore file that exists only on your machine)
3. Never modifies `.gitignore` - the ignore rule stays local to your repository clone

### What to use it for

- **API keys, tokens, credentials** - Keep secrets local without risk
- **Local scripts and tooling** - Machine-specific utilities
- **Test data or scratch files** - Experimental data that shouldn't be shared
- **Machine-specific configs** - Personal development settings
- **Debugging artifacts** - Logs, dumps, profiling data

### Key Benefits

✅ **Local-only ignore** - Unlike `.gitignore`, this affects only your machine  
✅ **Zero team impact** - Other developers won't see or be affected by your ignore rules  
✅ **Safe by design** - Impossible to accidentally commit sensitive files  
✅ **One-click setup** - No manual Git configuration needed

## Usage

### Initialize Admin Local

1. Open a Git repository in VS Code
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
3. Run the command: **Admin Local: Initialize**
4. Done! The `.admin-local` folder is created and ignored

### What happens when you run the command

```
✓ Creates .admin-local/ folder in workspace root
✓ Creates .git/info/ directory if it doesn't exist
✓ Creates .git/info/exclude file if it doesn't exist
✓ Adds .admin-local/ entry to .git/info/exclude
✓ Verifies the setup is correct
```

If `.admin-local` already exists, the extension will ensure it's properly ignored without recreating it.

## Requirements

- **Git repository** - Your workspace must be a Git repository
- **VS Code** - Version 1.109.0 or higher
- **Git installed** - Git must be available in your environment

## Error Handling

The extension handles common edge cases:

- ❌ **No workspace open** - Shows error message
- ❌ **Not a Git repository** - Shows error message  
- ❌ **Permission issues** - Shows detailed error message
- ❌ **`.admin-local` is a file** - Shows error if name conflict exists
- ✅ **Already initialized** - Shows success message without duplicating entries

## Installation

### From VSIX file (Private/Team Distribution)

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the `...` menu → **Install from VSIX...**
5. Select the downloaded `.vsix` file

### From VS Code Marketplace (Once Published)

1. Open Extensions view (`Ctrl+Shift+X`)
2. Search for "Admin Local"
3. Click **Install**

## Development

### Build from source

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Test the extension

1. Open this project in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, open a Git repository
4. Run **Admin Local: Initialize** from Command Palette
5. Verify `.admin-local` folder and `.git/info/exclude` entry

### Package as VSIX

```bash
# Install vsce if you haven't already
npm install -g @vscode/vsce

# Package the extension
npx @vscode/vsce package

# This creates admin-local-0.0.1.vsix
```

## How is this different from .gitignore?

| Feature | `.gitignore` | `.git/info/exclude` (Admin Local) |
|---------|-------------|-----------------------------------|
| **Scope** | Whole team/repo | Only your local machine |
| **Committed** | Yes, tracked by Git | No, stays local |
| **Use case** | Project-wide ignore rules | Personal/sensitive files |
| **Team impact** | Affects everyone | Affects only you |

## Platform Support

✅ **Windows** - Fully supported (Git Bash/WSL recommended for scripts)  
✅ **macOS** - Fully supported  
✅ **Linux** - Fully supported  
✅ **Remote/WSL** - Supported

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

If you encounter issues:

1. Ensure you're in a Git repository
2. Check that Git is installed and in your PATH
3. Verify you have write permissions to the workspace
4. Check the VS Code Developer Tools console for errors (`Help > Toggle Developer Tools`)

---

**Make your development environment truly local with Admin Local!** 🚀
