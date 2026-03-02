const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("CrashCue: Starting cross-shell integration...");

// Windows Only
if (process.platform !== "win32") {
  console.log("CrashCue: Skipping shell integration (non-Windows).");
  process.exit(0);
}

// Helper to run scripts
const runScript = (scriptName) => {
  const scriptPath = path.resolve(__dirname, scriptName);
  try {
    console.log(`CrashCue: Running ${scriptName}...`);
    execSync(`node "${scriptPath}"`, { stdio: "inherit" });
  } catch (err) {
    console.warn(`CrashCue: Failed to execute ${scriptName}:`, err.message);
  }
};

// 1. PowerShell 7
// The new CLI package handles this logic more robustly in packages/cli/src/install/powershell.ts
// But for postinstall, we can try to use the CLI logic if available or skip if we want to rely on manual 'crashcue install'
// However, the requirement is to use the CLI installer.
// Since install-ps7.js was deleted, we should remove this call or point to the new logic if accessible.
// The prompt implies we should rely on the new template.
// Let's remove the legacy script call.
// runScript('install-ps7.js');

// 2. CMD
// CMD support removed in v0.2.0 due to interactive shell limitations.
// runScript("install-cmd.js");

// 3. Git Bash
runScript("install-gitbash.js");

console.log("CrashCue: Cross-shell integration complete.");
