const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('CrashCue: Starting cross-shell integration...');

// Windows Only
if (process.platform !== 'win32') {
  console.log('CrashCue: Skipping shell integration (non-Windows).');
  process.exit(0);
}

// Helper to run scripts
const runScript = (scriptName) => {
  const scriptPath = path.resolve(__dirname, scriptName);
  try {
    console.log(`CrashCue: Running ${scriptName}...`);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`CrashCue: Failed to execute ${scriptName}:`, err.message);
  }
};

// 1. PowerShell 7
runScript('install-ps7.js');

// 2. CMD
runScript('install-cmd.js');

// 3. Git Bash
runScript('install-gitbash.js');

console.log('CrashCue: Cross-shell integration complete.');
