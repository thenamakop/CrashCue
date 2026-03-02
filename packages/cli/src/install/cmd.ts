import { execSync } from "child_process";
import path from "path";

export async function installCMD(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ CMD integration only supported on Windows");
    return;
  }

  console.log("📦 Installing CrashCue CMD Integration...");

  // The CMD payload uses the new internal command `crashcue run-sound`
  // We use `call` to ensure it executes properly within the context
  const cmdPayload = `if errorlevel 1 call crashcue run-sound`;

  try {
    // 1. Read current AutoRun
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

    // 2. Check for existing integration
    if (currentAutoRun.includes("crashcue run-sound")) {
      console.log("   ✅ CMD integration already present.");
      return;
    }

    // 3. Append payload
    let newAutoRun = currentAutoRun;
    if (newAutoRun && !newAutoRun.endsWith("&")) {
      newAutoRun += " & ";
    }
    newAutoRun += cmdPayload;

    // 4. Write back
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

  const cmdPayload = `if errorlevel 1 call crashcue run-sound`;

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

    if (!currentAutoRun.includes("crashcue run-sound")) {
      console.log("   ℹ️ No CMD integration found.");
      return;
    }

    // Remove our payload
    // We need to handle potential leading " & " or trailing " & "
    // Simple replace might leave dangling "&"
    let newAutoRun = currentAutoRun.replace(cmdPayload, "").trim();

    // Clean up dangling ampersands
    // Remove leading/trailing "&" and handle " & "
    newAutoRun = newAutoRun.replace(/^&|&$/g, "").trim();
    // Also remove double ampersands " &  & " -> " & "
    newAutoRun = newAutoRun.replace(/&\s*&/g, "&").trim();

    const escapedAutoRun = newAutoRun.replace(/"/g, '\\"');

    // If empty, delete the value or set to empty string.
    // reg add ... /d "" sets it to empty string.
    execSync(
      `reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "${escapedAutoRun}" /f`,
      { stdio: "ignore" },
    );

    console.log("   ✅ CMD integration removed.");
  } catch (err: any) {
    console.error(`   ❌ Failed to uninstall CMD integration: ${err.message}`);
  }
}
