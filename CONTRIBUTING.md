# Contributing to Admin Local

Thank you for your interest in contributing to Admin Local! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** - Summarize the problem
2. **Description** - What happened vs. what you expected
3. **Steps to reproduce** - Exact steps to trigger the bug
4. **Environment** - OS, VS Code version, Git version
5. **Screenshots** - If applicable
6. **Error messages** - Full error text from Developer Tools console

### Suggesting Enhancements

For feature requests:

1. **Check existing issues** - Avoid duplicates
2. **Describe the use case** - Why is this needed?
3. **Proposed solution** - How should it work?
4. **Alternatives** - Other approaches you considered

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**:
   - Run the extension in Extension Development Host
   - Test on Windows/Mac/Linux if possible
   - Verify error handling
5. **Commit with clear messages**:
   ```bash
   git commit -m "Add: Feature description"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Pull Request Guidelines

- **One feature per PR** - Keep changes focused
- **Update documentation** - README, CHANGELOG, code comments
- **Follow code style** - Match existing patterns
- **No formatting-only changes** - Unless specifically discussed
- **Test your changes** - Include testing steps in PR description

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

Quick start:
```bash
git clone https://github.com/your-username/admin-local-vscode.git
cd admin-local-vscode
npm install
npm run compile
# Press F5 in VS Code to test
```

## Code Style

### TypeScript

- Use **TypeScript** for all code
- Enable strict type checking
- Avoid `any` types
- Use meaningful variable names
- Add JSDoc comments for public functions

### Formatting

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Line length**: ~100 characters max

### Example

```typescript
/**
 * Creates the admin-local folder and adds it to Git exclude
 */
async function initializeAdminLocal(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  
  // Implementation...
}
```

## Project Structure

```
admin-local-vscode/
├── src/
│   └── extension.ts      # Main extension logic
├── .vscode/              # VS Code configuration
├── dist/                 # Compiled output
└── package.json          # Extension manifest
```

## Testing

### Manual Testing

1. Launch Extension Development Host (`F5`)
2. Test scenarios:
   - ✅ Valid Git repository
   - ❌ No workspace open
   - ❌ Not a Git repository
   - ✅ `.admin-local` already exists
   - ✅ `.git/info/exclude` already has entry
   - ✅ First-time initialization
   - ❌ Permission denied
   - ❌ `.admin-local` is a file, not folder

### All tests should pass on:
- Windows (Git Bash/WSL)
- macOS
- Linux

## Adding New Features

### Before Starting

1. **Open an issue** - Discuss the feature first
2. **Wait for feedback** - Ensure it aligns with project goals
3. **Get approval** - Maintainers will green-light it

### Implementation Checklist

- [ ] Code implements feature correctly
- [ ] Error handling added
- [ ] User feedback (messages) added
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] Tested manually in Extension Development Host
- [ ] Tested on target platforms
- [ ] No breaking changes (or clearly documented)

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
Add: New feature description
Fix: Bug description
Update: Documentation or dependency update
Refactor: Code restructuring without behavior change
Remove: Removed feature/code
```

Examples:
```
Add: Support for multi-root workspaces
Fix: Handle permission errors on Windows
Update: README with installation instructions
Refactor: Extract Git operations into separate functions
```

## Release Process (Maintainers)

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with changes
3. **Commit**: `git commit -m "Release v0.0.2"`
4. **Tag**: `git tag v0.0.2`
5. **Push**: `git push && git push --tags`
6. **Package**: `npx @vscode/vsce package`
7. **Publish**: `npx @vscode/vsce publish`

## Questions?

If you have questions:

1. Check [README.md](README.md) and [SETUP.md](SETUP.md)
2. Search existing issues
3. Open a new issue with the "question" label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
