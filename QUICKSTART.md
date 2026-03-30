# 🚀 Admin Local VS Code Extension - Complete Guide

## What You Have

A **production-ready VS Code extension** that creates a local-only `.admin-local` folder and ensures Git ignores it through `.git/info/exclude`.

## 📁 Project Structure

```
admin-local-vscode/
├── 📄 package.json              Main extension manifest
├── 📄 tsconfig.json             TypeScript configuration
├── 📁 src/
│   └── 📄 extension.ts          Extension source code
├── 📁 .vscode/
│   ├── 📄 launch.json           Debug configuration
│   ├── 📄 tasks.json            Build tasks
│   └── 📄 extensions.json       Recommended extensions
├── 📄 README.md                 User documentation
├── 📄 SETUP.md                  Detailed build guide
├── 📄 TESTING.md                Complete testing guide
├── 📄 CONTRIBUTING.md           Contribution guidelines
├── 📄 CHANGELOG.md              Version history
├── 📄 LICENSE                   MIT License
├── 📄 build.sh                  Linux/Mac build script
├── 📄 build.bat                 Windows build script
├── 📄 .gitignore               Git ignore rules
└── 📄 .vscodeignore            VSIX packaging rules
```

## ⚡ Quick Start (3 Steps)

### 1️⃣ Install Dependencies

**Windows (PowerShell or Git Bash):**
```cmd
npm install
```

**Mac/Linux:**
```bash
npm install
```

**Or use the build script:**
- Windows: `build.bat`
- Mac/Linux: `sh build.sh`

### 2️⃣ Compile TypeScript

```bash
npm run compile
```

This creates `dist/extension.js` from `src/extension.ts`.

### 3️⃣ Test the Extension

1. Open this project in VS Code
2. Press `F5` (Start Debugging)
3. A new **Extension Development Host** window opens
4. In the new window:
   - Open any Git repository
   - Press `Ctrl+Shift+P`
   - Run: **Admin Local: Initialize**
5. Verify: `.admin-local/` folder is created and ignored by Git

✅ **It works!**

## 📦 Package for Distribution

### Create VSIX File

```bash
# Install packaging tool (one time)
npm install -g @vscode/vsce

# Package the extension
npx @vscode/vsce package
```

**Output:** `admin-local-0.0.1.vsix`

### Distribute Privately

1. **Share the .vsix file** with your team
2. **They install it:**
   - Open VS Code
   - Extensions view → `...` → Install from VSIX
   - Select the `.vsix` file
3. **Done!** They can now use the extension

### Publish to Marketplace (Optional)

See [SETUP.md](SETUP.md#publishing-to-vs-code-marketplace) for full instructions.

Quick version:
1. Create publisher account at [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. Get a Personal Access Token from [Azure DevOps](https://dev.azure.com/)
3. Update `package.json`: change `"publisher": "your-name"` to your publisher ID
4. Login: `npx @vscode/vsce login your-publisher-id`
5. Publish: `npx @vscode/vsce publish`

## 🧪 Testing Checklist

Before distributing, test these scenarios (see [TESTING.md](TESTING.md) for details):

- ✅ Happy path: First-time initialization
- ✅ Already initialized (no duplicate entries)
- ❌ No workspace open (shows error)
- ❌ Not a Git repo (shows error)
- ❌ `.admin-local` exists as file (shows error)
- ✅ Missing `.git/info` folder (creates it)
- ✅ Packaged VSIX works

**Platforms to test:**
- Windows (Git Bash/PowerShell/WSL)
- macOS
- Linux

## 🛠️ Development Workflow

### Active Development

1. **Start watch mode:**
   ```bash
   npm run watch
   ```

2. **Make changes** to `src/extension.ts`

3. **In Extension Development Host:**
   - Press `Ctrl+R` (Reload Window)
   - Test your changes

### Debug with Breakpoints

1. Set breakpoints in `src/extension.ts`
2. Press `F5`
3. Run the command
4. VS Code will pause at breakpoints

## 📋 Common Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Compile once | `npm run compile` |
| Compile & watch | `npm run watch` |
| Launch debugger | Press `F5` in VS Code |
| Package VSIX | `npx @vscode/vsce package` |
| Publish to Marketplace | `npx @vscode/vsce publish` |

## 📝 Customization

### Change Folder Name

Edit [src/extension.ts](src/extension.ts):

```typescript
const adminLocalPath = path.join(rootPath, '.admin-local');
// Change to:
const adminLocalPath = path.join(rootPath, '.my-folder');
```

And update the exclude entry:

```typescript
const entry = '.admin-local/';
// Change to:
const entry = '.my-folder/';
```

### Add More Commands

1. **In [package.json](package.json)**, add to `contributes.commands`:
   ```json
   {
     "command": "admin-local.status",
     "title": "Admin Local: Check Status"
   }
   ```

2. **In [src/extension.ts](src/extension.ts)**, register the command:
   ```typescript
   const statusCommand = vscode.commands.registerCommand('admin-local.status', async () => {
     // Your code here
   });
   context.subscriptions.push(statusCommand);
   ```

### Add Configuration Settings

In [package.json](package.json), add `contributes.configuration`:

```json
"contributes": {
  "configuration": {
    "title": "Admin Local",
    "properties": {
      "admin-local.folderName": {
        "type": "string",
        "default": ".admin-local",
        "description": "Name of the local folder"
      }
    }
  }
}
```

Then read it in code:
```typescript
const config = vscode.workspace.getConfiguration('admin-local');
const folderName = config.get<string>('folderName', '.admin-local');
```

## 🐛 Troubleshooting

### "Cannot find module 'vscode'"

**Fix:** Run `npm install`

### Compilation Errors

**Fix:**
```bash
rm -rf node_modules dist
npm install
npm run compile
```

### Extension Not Loading

1. Check `dist/extension.js` exists
2. Verify `package.json` → `"main": "./dist/extension.js"`
3. Open Developer Tools: `Help` → `Toggle Developer Tools`
4. Look for errors in Console tab

### VSIX Too Large

Check `.vscodeignore` excludes:
- `src/`
- `node_modules/`
- `.vscode-test/`
- `*.ts` files

## 📚 Resources

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | User documentation |
| [SETUP.md](SETUP.md) | Detailed build & publish guide |
| [TESTING.md](TESTING.md) | Complete testing scenarios |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

**Official VS Code Docs:**
- [Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## 🎯 Next Steps

### For Immediate Use:

1. ✅ Run `npm install`
2. ✅ Run `npm run compile`
3. ✅ Press `F5` to test
4. ✅ Run `npx @vscode/vsce package`
5. ✅ Share the `.vsix` with your team

### For Production Release:

1. ✅ Complete testing (see [TESTING.md](TESTING.md))
2. ✅ Update `publisher` in `package.json`
3. ✅ Create publisher account
4. ✅ Publish to Marketplace

### For Enhancement:

- Add command to check status
- Add multi-root workspace support
- Add configuration settings
- Add unit tests
- Add telemetry (optional)
- Create extension icon

## 🔒 Security Note

This extension:
- ✅ Only writes to `.admin-local/` and `.git/info/exclude`
- ✅ Never modifies `.gitignore` or committed files
- ✅ Never transmits data
- ✅ No telemetry included
- ✅ No external dependencies (only dev dependencies)

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## ✅ Production Checklist

Before distributing:

- [ ] `npm install` completed successfully
- [ ] `npm run compile` produces `dist/extension.js`
- [ ] Extension tested in Development Host
- [ ] All test scenarios pass (see [TESTING.md](TESTING.md))
- [ ] README reviewed and accurate
- [ ] CHANGELOG updated
- [ ] `package.json` has correct publisher
- [ ] VSIX packaged successfully
- [ ] VSIX tested in clean VS Code install

---

## 🎉 You're Ready!

Your VS Code extension is **production-ready**. Just run:

```bash
npm install && npm run compile && npx @vscode/vsce package
```

Then share `admin-local-0.0.1.vsix` or publish to the Marketplace!

**Questions?** See the detailed guides in the links above.
