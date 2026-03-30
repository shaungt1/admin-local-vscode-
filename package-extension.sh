#!/bin/bash
# Package the VS Code extension

echo "📦 Packaging Admin Local Extension..."
echo ""

# Make sure we're compiled
npm run compile

echo ""
echo "Creating .vsix package..."
echo ""

# Package with vsce (auto-confirm)
echo "y" | npx @vscode/vsce package

echo ""
echo "✅ Done! Look for admin-local-0.0.1.vsix in this folder"
