@echo off
REM Quick build script for Admin Local VS Code Extension (Windows)

echo.
echo ========================================
echo   Admin Local - Quick Build Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo         Download from: https://nodejs.org/
    exit /b 1
)

echo [OK] Node.js is installed
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)

echo [OK] npm is installed
npm --version
echo.

REM Install dependencies
echo [STEP 1/2] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Compile TypeScript
echo [STEP 2/2] Compiling TypeScript...
call npm run compile
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed
    exit /b 1
)
echo [OK] Compilation successful
echo.

REM Verify output
if not exist "dist\extension.js" (
    echo [ERROR] dist\extension.js not found
    exit /b 1
)

echo [OK] Output verified: dist\extension.js exists
echo.
echo ========================================
echo   BUILD COMPLETE
echo ========================================
echo.
echo Next steps:
echo   1. Press F5 in VS Code to test
echo   2. Or run: npx @vscode/vsce package
echo      to create a .vsix file
echo.
pause
