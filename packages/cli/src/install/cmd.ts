import { execSync } from "child_process";
import path from "path";

export async function installCMD(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ CMD integration only supported on Windows");
    return;
  }

  console.log("📦 Installing CrashCue CMD Integration...");

  // 1. Prepare Paths
  let notifierPath = "";
  try {
    const notifierPkg = require.resolve("@crashcue/notifier/package.json");
    notifierPath = path.dirname(notifierPkg);
  } catch (e) {
    notifierPath = path.resolve(__dirname, "../../../notifier");
  }

  const nativeScriptPath = path.join(notifierPath, "native-windows.ps1");
  const soundPath = path.resolve(notifierPath, "../../assets/faahhhhhh.wav");

  // The CMD payload uses direct PowerShell invocation for reliability and speed
  // We use `call` to ensure it executes properly within the context
  // Use powershell.exe directly to avoid 'crashcue' PATH dependency
  const cmdPayload = `if errorlevel 1 powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${nativeScriptPath}" -Path "${soundPath}"`;

  try {
    // 2. Read current AutoRun
    let currentAutoRun = "";
    try {
      const output = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun',
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      );
      const match = output.match(/AutoRun\s+REG_\w+\s+(.*)/);
      if (match && match[1]) {
        currentAutoRun = match[1].trim();
      }
    } catch (e) {
      // Key might not exist
    }

    // 3. Check for existing integration
    // Check for "native-windows.ps1" which indicates our direct payload
    if (currentAutoRun.includes("native-windows.ps1")) {
      console.log("   ✅ CMD integration already present.");
      return;
    }

    // Remove legacy payload if present
    if (currentAutoRun.includes("crashcue run-sound")) {
      console.log("   ℹ️ Upgrading legacy CMD integration...");
      currentAutoRun = currentAutoRun
        .replace(/if errorlevel 1 call crashcue run-sound/g, "")
        .trim();
      // Clean up &
      currentAutoRun = currentAutoRun.replace(/^&|&$/g, "").trim();
      currentAutoRun = currentAutoRun.replace(/&\s*&/g, "&").trim();
    }

    // 4. Append payload
    let newAutoRun = currentAutoRun;
    if (newAutoRun && !newAutoRun.endsWith("&")) {
      newAutoRun += " & ";
    }
    newAutoRun += cmdPayload;

    // 5. Write back
    // Escape double quotes for the command line
    const escapedAutoRun = newAutoRun.replace(/"/g, '\\"');

    execSync(
      `reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "${escapedAutoRun}" /f`,
      {
        stdio: "ignore",
      },
    );

    console.log("   ✅ CMD integration configured.");
  } catch (err: any) {
    console.error(`   ❌ Failed to configure CMD integration: ${err.message}`);
  }
}

export async function uninstallCMD(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ CMD integration only supported on Windows");
    return;
  }

  console.log("🗑 Uninstalling CrashCue CMD Integration...");

  try {
    let currentAutoRun = "";
    try {
      const output = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun',
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      );
      const match = output.match(/AutoRun\s+REG_\w+\s+(.*)/);
      if (match && match[1]) {
        currentAutoRun = match[1].trim();
      }
    } catch (e) {
      console.log("   ℹ️ AutoRun key not found.");
      return;
    }

    if (
      !currentAutoRun.includes("native-windows.ps1") &&
      !currentAutoRun.includes("crashcue run-sound")
    ) {
      console.log("   ℹ️ No CMD integration found.");
      return;
    }

    // Remove our payload (both legacy and new)
    // Regex is tricky with paths, so we might need to be careful
    // The new payload contains paths which might vary? No, they are absolute but deterministic per install.
    // However, simplest is to remove the specific string if we can reconstruct it, OR regex match the pattern.
    // The pattern is: if errorlevel 1 powershell.exe ... native-windows.ps1 ...

    // Let's try to remove by splitting on '&' and filtering
    const parts = currentAutoRun.split("&").map((p) => p.trim());
    const keptParts = parts.filter((p) => {
      return (
        !p.includes("native-windows.ps1") && !p.includes("crashcue run-sound")
      );
    });

    let newAutoRun = keptParts.join(" & ");

    const escapedAutoRun = newAutoRun.replace(/"/g, '\\"');

    // If empty, delete the value or set to empty string.
    execSync(
      `reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "${escapedAutoRun}" /f`,
      { stdio: "ignore" },
    );

    console.log("   ✅ CMD integration removed.");
  } catch (err: any) {
    console.error(`   ❌ Failed to uninstall CMD integration: ${err.message}`);
  }
}
