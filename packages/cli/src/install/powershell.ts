import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function installPowerShell(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ PowerShell integration only supported on Windows");
    return;
  }

  console.log("📦 Installing CrashCue PowerShell Integration...");

  // 1. Detect PowerShell 7 & Profile Path
  let profilePath: string;
  try {
    profilePath = execSync(
      'pwsh -NoProfile -Command "$PROFILE.CurrentUserCurrentHost"',
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
  } catch (e) {
    console.log("⚠️ PowerShell 7 (pwsh) not found. Skipping.");
    return;
  }

  if (!profilePath) {
    console.log("⚠️ Could not determine PowerShell 7 profile path.");
    return;
  }

  // 2. Prepare Paths
  // Resolve absolute paths dynamically from this file location
  // packages/cli/src/install/powershell.ts -> packages/notifier/native-windows.ps1
  // We need to be careful about where this runs from.
  // Ideally, we find the notifier package path first.
  let notifierPath = "";
  try {
    const notifierPkg = require.resolve("@crashcue/notifier/package.json");
    notifierPath = path.dirname(notifierPkg);
  } catch (e) {
    // Fallback relative resolution if not installed as package
    notifierPath = path.resolve(__dirname, "../../../notifier");
  }

  const nativeScriptPath = path.join(notifierPath, "native-windows.ps1");
  const soundPath = path.resolve(notifierPath, "../../assets/faahhhhhh.wav");

  // 3. Construct Injection Block with Debounce & Error Stack Logic
  const startMarker = "# <crashcue-start>";
  const endMarker = "# <crashcue-end>";

  const block = `${startMarker}
# CrashCue PowerShell Integration
$CrashCueNotifierPS = "${nativeScriptPath}"
$CrashCueSoundPath  = "${soundPath}"

# Initialize state
if ($null -eq $global:CrashCueLastCheck) { $global:CrashCueLastCheck = 0 }
if ($null -eq $global:CrashCueLastErrorCount) { $global:CrashCueLastErrorCount = 0 }

function global:prompt {
    $currentExit = $LASTEXITCODE
    $currentErrorCount = $Error.Count
    $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()

    # Logic:
    # 1. Exit code is non-zero OR
    # 2. Error count increased (catch-all for some PS errors that don't set exit code)
    # AND
    # 3. Debounce: at least 500ms since last check to avoid double-trigger
    
    $shouldPlay = ($currentExit -ne 0 -or $currentErrorCount -gt $global:CrashCueLastErrorCount)
    $isDebounced = ($now - $global:CrashCueLastCheck) -gt 500

    if ($shouldPlay -and $isDebounced) {
        try {
            if (Test-Path $CrashCueNotifierPS) {
                # Run native notifier silently
                powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CrashCueNotifierPS -Path $CrashCueSoundPath > $null 2>&1
            }
        } catch {}
        
        # Update state
        $global:CrashCueLastCheck = $now
    }

    # Sync error count
    $global:CrashCueLastErrorCount = $currentErrorCount
    
    # Reset exit code to avoid persistent error state in prompt
    $global:LASTEXITCODE = 0
    
    # Standard prompt output
    "PS $($executionContext.SessionState.Path.CurrentLocation)> "
}
${endMarker}`;

  // 4. Read & Modify Profile
  try {
    const profileDir = path.dirname(profilePath);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    let content = "";
    if (fs.existsSync(profilePath)) {
      content = fs.readFileSync(profilePath, "utf8");
    }

    // Idempotency: Replace or Append
    // Escape markers for regex
    const regex = new RegExp(
      `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "g",
    );

    if (regex.test(content)) {
      content = content.replace(regex, block);
      console.log("✅ Updated existing PowerShell integration.");
    } else {
      if (content && !content.endsWith("\n")) {
        content += "\n";
      }
      content += block + "\n";
      console.log("✅ Injected PowerShell integration.");
    }

    fs.writeFileSync(profilePath, content, "utf8");
    console.log(`📄 Profile: ${profilePath}`);
  } catch (err: any) {
    console.error(`❌ Failed to update profile: ${err.message}`);
  }
}

export async function uninstallPowerShell(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ PowerShell integration only supported on Windows");
    return;
  }

  console.log("🗑 Uninstalling CrashCue PowerShell Integration...");

  let profilePath: string;
  try {
    profilePath = execSync(
      'pwsh -NoProfile -Command "$PROFILE.CurrentUserCurrentHost"',
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
  } catch (e) {
    console.log("⚠️ PowerShell 7 not found. Nothing to uninstall.");
    return;
  }

  if (!profilePath || !fs.existsSync(profilePath)) {
    console.log("⚠️ Profile not found. Nothing to uninstall.");
    return;
  }

  const startMarker = "# <crashcue-start>";
  const endMarker = "# <crashcue-end>";
  const regex = new RegExp(
    `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?\\n?`,
    "g",
  );

  try {
    let content = fs.readFileSync(profilePath, "utf8");

    if (regex.test(content)) {
      content = content.replace(regex, "");
      fs.writeFileSync(profilePath, content, "utf8");
      console.log(`✅ Removed integration from: ${profilePath}`);
    } else {
      console.log("ℹ️ No integration found to remove.");
    }
  } catch (err: any) {
    console.error(`❌ Failed to uninstall: ${err.message}`);
  }
}
