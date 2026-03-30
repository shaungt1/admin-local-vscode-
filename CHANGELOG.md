# Changelog

All notable changes to the "Admin Local" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-03-27

### Added
- Initial release of Admin Local extension
- Command: `Admin Local: Initialize` to create `.admin-local` folder
- Automatic addition of `.admin-local/` to `.git/info/exclude`
- Error handling for non-Git workspaces
- Verification of successful initialization
- Support for Windows, macOS, and Linux
- Comprehensive README documentation

### Features
- Creates `.admin-local` directory in workspace root
- Ensures `.git/info/exclude` file exists
- Adds ignore entry only if not already present
- Provides user feedback through VS Code notifications
- Handles edge cases (no workspace, not a Git repo, permission errors)

### Security
- Safe file operations with proper error handling
- Read/write verification to prevent silent failures
- No modification of `.gitignore` or tracked Git files
