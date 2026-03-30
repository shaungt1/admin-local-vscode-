@echo off
echo.
echo ========================================
echo   Packaging Admin Local Extension
echo ========================================
echo.

echo [STEP 1/2] Compiling...
call npm run compile

echo.
echo [STEP 2/2] Creating .vsix package...
echo.

echo y| npx @vscode/vsce package

echo.
echo ========================================
echo   DONE!
echo ========================================
echo.
echo Look for: admin-local-0.0.1.vsix
echo.
pause
