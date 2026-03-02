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
      'powershell -NoProfile -Command "$PROFILE.CurrentUserCurrentHost"',
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
  } catch (e) {
    console.log("⚠️ PowerShell not found. Skipping.");
    return;
  }

  if (!profilePath) {
    console.log("⚠️ Could not determine PowerShell profile path.");
    return;
  }

  // 2. Prepare Paths
  let notifierPath = "";
  try {
    const notifierPkg = require.resolve("@crashcue/notifier/package.json");
    notifierPath = path.dirname(notifierPkg);
  } catch (e) {
    notifierPath = path.resolve(__dirname, "../../../notifier");
  }

  const nativeScriptPath = path.join(notifierPath, "native-windows.ps1");
  const soundPath = path.resolve(notifierPath, "../../assets/faahhhhhh.wav");

  // 3. Backup Profile
  if (fs.existsSync(profilePath)) {
    try {
      const backupPath = `${profilePath}.crashcue.bak`;
      fs.copyFileSync(profilePath, backupPath);
      console.log(`💾 Backed up profile to: ${backupPath}`);
    } catch (e) {
      console.warn("⚠️ Failed to backup profile.");
    }
  } else {
    // Create directory if needed
    const profileDir = path.dirname(profilePath);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
  }

  // 4. Construct Injection Block
  const startMarker = "# <crashcue-start>";
  const endMarker = "# <crashcue-end>";

  const block = `${startMarker}
$CrashCueNotifierPS = "${nativeScriptPath}"
$CrashCueSoundPath = "${soundPath}"

$global:CrashCueLastErrorCount = 0
$global:CrashCueLastTriggerTime = Get-Date

function Invoke-CrashCue {
$now = Get-Date
$delta = ($now - $global:CrashCueLastTriggerTime).TotalMilliseconds
if ($delta -gt 150) {
try {
if (Test-Path $CrashCueNotifierPS) {
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CrashCueNotifierPS -Path $CrashCueSoundPath \`
> $null 2>&1
}
} catch {}
$global:CrashCueLastTriggerTime = $now
}
}

function global:prompt {
$currentErrorCount = $Error.Count
$nativeExit = $LASTEXITCODE

$hadNewError = $currentErrorCount -gt $global:CrashCueLastErrorCount
$nativeFailed = $nativeExit -ne 0

if ($hadNewError -or $nativeFailed) {
    Invoke-CrashCue
}

$global:CrashCueLastErrorCount = $Error.Count
$global:LASTEXITCODE = 0

"PS $($executionContext.SessionState.Path.CurrentLocation)> "

}
${endMarker}`;

  // 5. Read & Modify Profile
  try {
    let content = "";
    if (fs.existsSync(profilePath)) {
      content = fs.readFileSync(profilePath, "utf8");
    }

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
      'powershell -NoProfile -Command "$PROFILE.CurrentUserCurrentHost"',
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
  } catch (e) {
    console.log("⚠️ PowerShell not found. Nothing to uninstall.");
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
