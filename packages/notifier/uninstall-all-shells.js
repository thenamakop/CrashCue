const { execSync } = require("child_process");
const path = require("path");

if (process.platform !== "win32") {
  process.exit(0);
}

// Helper to run scripts
const runScript = (scriptName) => {
  const scriptPath = path.resolve(__dirname, scriptName);
  try {
    console.log(`CrashCue: Removing ${scriptName}...`);
    execSync(`node "${scriptPath}"`, { stdio: "inherit" });
  } catch (err) {
    console.warn(`CrashCue: Failed to execute ${scriptName}:`, err.message);
  }
};

runScript("uninstall-ps7.js");
// runScript('uninstall-cmd.js');
runScript("uninstall-gitbash.js");

console.log("CrashCue: Cross-shell uninstallation complete.");
