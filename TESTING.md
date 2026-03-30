# Testing Guide for Admin Local Extension

This guide covers all test scenarios to ensure the extension works correctly before distribution.

## Pre-Testing Setup

1. **Build the extension**:
   ```bash
   npm install
   npm run compile
   ```

2. **Launch Extension Development Host**:
   - Open this project in VS Code
   - Press `F5` (or Run > Start Debugging)
   - A new VS Code window opens with the extension loaded

## Test Scenarios

### ✅ Test 1: Happy Path - First Time Initialization

**Setup:**
- Open a Git repository

**Steps:**
1. Press `Ctrl+Shift+P` (Command Palette)
2. Type: `Admin Local: Initialize`
3. Run the command

**Expected Result:**
- ✓ Message: "Initialized .admin-local and added it to .git/info/exclude"
- ✓ `.admin-local/` folder exists in workspace root
- ✓ `.git/info/exclude` contains `.admin-local/` line
- ✓ No changes to `.gitignore`

**Verification:**
```bash
# Check folder exists
ls -la | grep .admin-local

# Check Git exclude entry
cat .git/info/exclude | grep .admin-local

# Verify Git ignores it
git status # Should not show .admin-local
echo "test" > .admin-local/test.txt
git status # Still should not show .admin-local
```

---

### ✅ Test 2: Already Initialized

**Setup:**
- Run Test 1 first
- `.admin-local` and exclude entry already exist

**Steps:**
1. Run `Admin Local: Initialize` again

**Expected Result:**
- ✓ Message: ".admin-local already exists and is already in .git/info/exclude"
- ✓ No duplicate entries in `.git/info/exclude`
- ✓ `.admin-local` folder unchanged

**Verification:**
```bash
# Check for duplicate entries (should only appear once)
grep -c "\.admin-local/" .git/info/exclude
# Output: 1
```

---

### ❌ Test 3: No Workspace Open

**Setup:**
- Close all workspace folders
- Have no folder open in VS Code

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ❌ Error message: "Admin Local: No workspace folder is open."
- ✓ Command fails gracefully
- ✓ No folders created

---

### ❌ Test 4: Not a Git Repository

**Setup:**
- Create a new folder (not a Git repo)
- Open it in VS Code

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ❌ Error message: "Admin Local: This workspace does not appear to be a Git repository."
- ✓ No `.admin-local` folder created
- ✓ Command fails gracefully

---

### ❌ Test 5: .admin-local Exists as a File

**Setup:**
- Open a Git repository
- Create a file named `.admin-local` (not a folder):
  ```bash
  touch .admin-local
  ```

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ❌ Error message: "Admin Local: .admin-local exists but is not a directory."
- ✓ File is not deleted or overwritten
- ✓ No entry added to exclude

**Cleanup:**
```bash
rm .admin-local
```

---

### ✅ Test 6: .git/info Folder Doesn't Exist

**Setup:**
- Open a Git repository
- Delete `.git/info` folder:
  ```bash
  rm -rf .git/info
  ```

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ✓ `.git/info/` folder is created
- ✓ `.git/info/exclude` file is created
- ✓ `.admin-local/` entry is added
- ✓ Success message shown

---

### ✅ Test 7: .git/info/exclude Doesn't Exist

**Setup:**
- Open a Git repository
- `.git/info` exists but `exclude` file doesn't:
  ```bash
  rm .git/info/exclude
  ```

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ✓ `.git/info/exclude` is created
- ✓ `.admin-local/` entry is added
- ✓ Success message shown

---

### ✅ Test 8: Existing Content in exclude File

**Setup:**
- Open a Git repository  
- Add content to `.git/info/exclude`:
  ```bash
  echo "temp/" > .git/info/exclude
  echo "*.log" >> .git/info/exclude
  ```

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ✓ Existing content is preserved
- ✓ `.admin-local/` is added on a new line
- ✓ File format is correct

**Verification:**
```bash
cat .git/info/exclude
# Should show:
# temp/
# *.log
# .admin-local/
```

---

### ✅ Test 9: Multi-Root Workspace

**Setup:**
- Open multiple folders in one workspace
- Ensure first folder is a Git repository

**Steps:**
1. Run `Admin Local: Initialize`

**Expected Result:**
- ✓ Uses the first workspace folder
- ✓ `.admin-local` created in first folder
- ✓ Success message shown

---

### ✅ Test 10: Packaged VSIX Installation

**Setup:**
- Package extension:
  ```bash
  npx @vscode/vsce package
  ```
- Install the `.vsix` in a clean VS Code instance

**Steps:**
1. Install: Extensions → ... → Install from VSIX
2. Reload VS Code
3. Open a Git repository
4. Run `Admin Local: Initialize`

**Expected Result:**
- ✓ Extension appears in Extensions list
- ✓ Command is available
- ✓ Functions identically to development version

---

## Platform-Specific Testing

### Windows

Test on:
- [ ] Windows 10
- [ ] Windows 11
- [ ] Git Bash
- [ ] PowerShell (with Git)
- [ ] WSL

### macOS

Test on:
- [ ] macOS 12+ (Monterey or newer)
- [ ] Terminal app

### Linux

Test on:
- [ ] Ubuntu 20.04+
- [ ] Fedora
- [ ] Other distros

---

## Error Handling Verification

### Permission Denied

**Setup:**
- Make `.git/info` read-only:
  ```bash
  chmod 444 .git/info
  ```

**Steps:**
1. Run `Admin Local: Initialize`

**Expected:**
- ❌ Error message with permission details

**Cleanup:**
```bash
chmod 755 .git/info
```

---

## Regression Testing Checklist

Before each release, verify:

- [ ] Fresh Git repo initialization works
- [ ] Already-initialized repo shows correct message
- [ ] No workspace error is clear
- [ ] Non-Git repo error is clear
- [ ] File conflict is handled
- [ ] No duplicate entries in exclude
- [ ] Packaged VSIX works identically
- [ ] All three platforms tested (Windows/Mac/Linux)
- [ ] VS Code Developer Tools shows no console errors
- [ ] Extension can be uninstalled cleanly

---

## Performance Testing

- [ ] Extension activates quickly (<100ms)
- [ ] Command runs quickly (<500ms on average)
- [ ] No memory leaks after repeated runs
- [ ] No file handles left open

---

## Automated Testing (Future)

Consider adding:
- Unit tests for file operations
- Integration tests for VS Code API
- CI/CD pipeline tests
- Cross-platform automated tests

---

## Reporting Bugs

If a test fails:

1. **Document**:
   - OS and version
   - VS Code version
   - Git version
   - Exact steps to reproduce
   - Expected vs actual result
   - Screenshots/error messages

2. **Check console**:
   - Help → Toggle Developer Tools
   - Look for errors in Console tab

3. **Create issue** with all details

---

## Sign-Off Checklist

Before releasing:

- [ ] All happy path tests pass
- [ ] All error cases handled gracefully
- [ ] Tested on Windows
- [ ] Tested on macOS
- [ ] Tested on Linux
- [ ] VSIX package tested
- [ ] Documentation is accurate
- [ ] CHANGELOG updated
- [ ] No console errors
- [ ] Extension uninstalls cleanly

---

**Testing complete?** You're ready to distribute! 🎉
