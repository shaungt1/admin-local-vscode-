# Setup and Build Guide

This guide walks you through setting up, building, testing, and packaging the Admin Local VS Code extension.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (v1.109.0 or higher) - [Download here](https://code.visualstudio.com/)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- VS Code extension API types
- Node.js type definitions

### 2. Compile the Extension

```bash
npm run compile
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### 3. Test the Extension

1. Open this project in VS Code
2. Press `F5` or go to `Run and Debug` view
3. Click "Run Extension" (or use the launch configuration)
4. A new **Extension Development Host** window opens
5. In the new window:
   - Open a Git repository
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Run command: **Admin Local: Initialize**
6. Verify:
   - `.admin-local` folder is created
   - `.git/info/exclude` contains `.admin-local/`

### 4. Development Workflow

For active development, run the TypeScript compiler in watch mode:

```bash
npm run watch
```

Now when you make changes:
1. Save your files
2. In the Extension Development Host window, run: `Developer: Reload Window` (`Ctrl+R`)
3. Test your changes immediately

## Building for Distribution

### Package as VSIX

To create a `.vsix` file for distribution:

1. **Install vsce** (VS Code Extension Manager):
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Package the extension**:
   ```bash
   npx @vscode/vsce package
   ```

3. **Output**: This creates `admin-local-0.0.1.vsix` in the root directory

### Install VSIX Locally

To test the packaged extension:

1. In VS Code, go to Extensions view (`Ctrl+Shift+X`)
2. Click the `...` menu → **Install from VSIX...**
3. Select `admin-local-0.0.1.vsix`
4. Reload VS Code
5. Test the extension in a real workspace

## Publishing to VS Code Marketplace

### Prerequisites

1. **Create a Publisher Account**:
   - Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
   - Sign in with Microsoft account
   - Create a publisher ID

2. **Get Personal Access Token (PAT)**:
   - Go to [Azure DevOps](https://dev.azure.com/)
   - Create a PAT with **Marketplace (Manage)** scope
   - Save the token securely

### Update package.json

Replace `"publisher": "your-name"` with your publisher ID:

```json
{
  "publisher": "your-publisher-id"
}
```

### Publish

```bash
# Login (use your PAT when prompted)
npx @vscode/vsce login your-publisher-id

# Publish
npx @vscode/vsce publish
```

The extension is now live on the Marketplace!

## Project Structure

```
admin-local-vscode/
├── .vscode/                  # VS Code configuration
│   ├── launch.json          # Debug configurations
│   ├── tasks.json           # Build tasks
│   └── extensions.json      # Recommended extensions
├── src/                     # Source code
│   └── extension.ts         # Main extension code
├── dist/                    # Compiled JavaScript (generated)
├── node_modules/            # Dependencies (generated)
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── .gitignore              # Git ignore rules
├── .vscodeignore           # Files to exclude from VSIX
├── README.md               # User documentation
├── CHANGELOG.md            # Version history
├── LICENSE                 # MIT License
└── SETUP.md                # This file
```

## Configuration Files Explained

### package.json
- Extension metadata (name, version, description)
- Commands and contribution points
- Dependencies and build scripts
- VS Code engine version

### tsconfig.json
- TypeScript compiler options
- Output directory (`dist/`)
- Target ES version
- Module system (CommonJS)

### .vscodeignore
- Excludes source files from VSIX package
- Reduces package size
- Only `dist/`, `README.md`, `package.json`, etc. are included

### .vscode/launch.json
- Debug configurations
- `F5` launches Extension Development Host
- Automatically compiles before debugging

## Troubleshooting

### Error: "Cannot find module 'vscode'"

**Solution**: Run `npm install` to install dependencies.

### Compilation Errors

**Solution**: 
```bash
# Clean build
rm -rf dist/
npm run compile
```

### Extension Not Loading

**Solution**:
1. Check `dist/extension.js` exists
2. Verify `package.json` has correct `main` path
3. Check VS Code console for errors: `Help > Toggle Developer Tools`

### VSIX Package Too Large

**Solution**: Check `.vscodeignore` is excluding:
- `src/`
- `node_modules/`
- `.vscode-test/`
- `*.ts` files

## Version Management

To release a new version:

1. **Update version** in `package.json`:
   ```json
   {
     "version": "0.0.2"
   }
   ```

2. **Update CHANGELOG.md** with changes

3. **Package** new version:
   ```bash
   npx @vscode/vsce package
   ```

4. **Publish** (if on Marketplace):
   ```bash
   npx @vscode/vsce publish
   ```

Or use semantic versioning shortcuts:
```bash
npx @vscode/vsce publish patch  # 0.0.1 → 0.0.2
npx @vscode/vsce publish minor  # 0.0.2 → 0.1.0
npx @vscode/vsce publish major  # 0.1.0 → 1.0.0
```

## Team Distribution (Private VSIX)

If you don't want to publish publicly:

1. **Package** the extension:
   ```bash
   npx @vscode/vsce package
   ```

2. **Share** the `.vsix` file with your team:
   - Email
   - Internal file server
   - Private GitHub release

3. **Team members install** via:
   - Extensions view → `...` → Install from VSIX
   - Command line: `code --install-extension admin-local-0.0.1.vsix`

## Continuous Integration

For automated builds, add to your CI pipeline:

```bash
# Install dependencies
npm ci

# Compile
npm run compile

# Package
npx @vscode/vsce package
```

## Next Steps

- Add unit tests
- Set up ESLint for code quality
- Add multi-root workspace support
- Create extension settings/configuration
- Add telemetry (optional)

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [VSCE Documentation](https://github.com/microsoft/vscode-vsce)

---

**Ready to build!** 🚀 Run `npm install` and `npm run compile` to get started.
