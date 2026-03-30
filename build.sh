#!/bin/bash
# Quick build script for Admin Local VS Code Extension

echo "🚀 Admin Local - Quick Build Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

echo "✓ Compilation successful"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist/ folder not found"
    exit 1
fi

if [ ! -f "dist/extension.js" ]; then
    echo "❌ Error: dist/extension.js not found"
    exit 1
fi

echo "✓ Output verified: dist/extension.js exists"
echo ""

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Press F5 in VS Code to test the extension"
echo "2. Or run: npx @vscode/vsce package"
echo "   to create a .vsix file for distribution"
echo ""
