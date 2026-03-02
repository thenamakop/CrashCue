import fs from "fs";
import path from "path";
import os from "os";

export async function installGitBash(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ Git Bash integration only supported on Windows");
    return;
  }

  console.log("📦 Installing CrashCue Git Bash Integration...");

  // 1. Prepare Paths
  const bashrcPath = path.join(os.homedir(), ".bashrc");
  const backupPath = `${bashrcPath}.crashcue.bak`;

  let notifierPath = "";
  try {
    const notifierPkg = require.resolve("../../../notifier/package.json");
    notifierPath = path.dirname(notifierPkg);
  } catch (e) {
    notifierPath = path.resolve(__dirname, "../../../notifier");
  }

  const nativeScriptPath = path.join(notifierPath, "native-windows.ps1");
  const soundPath = path.resolve(notifierPath, "../../assets/faahhhhhh.wav");

  // Escape paths for Bash (forward slashes)
  const escapedScriptPath = nativeScriptPath.split(path.sep).join("/");
  const escapedSoundPath = soundPath.split(path.sep).join("/");

  // 2. Backup Profile
  if (fs.existsSync(bashrcPath)) {
    try {
      fs.copyFileSync(bashrcPath, backupPath);
      console.log(`   💾 Backed up profile to: ${backupPath}`);
    } catch (e) {
      console.warn("   ⚠️ Failed to backup profile.");
    }
  } else {
    // Create new
    fs.writeFileSync(bashrcPath, "", "utf8");
  }

  // 3. Construct Injection Block
  const startMarker = "# <crashcue-start>";
  const endMarker = "# <crashcue-end>";

  // Use PROMPT_COMMAND with direct PowerShell invocation for low latency
  // Using 'start' to launch independently might be even faster but 'powershell ... &' is standard async
  // Note: We use 'powershell.exe' specifically (Windows PowerShell) as it's always available
  const block = `${startMarker}
crashcue_prompt() {
    local EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${escapedScriptPath}" -Path "${escapedSoundPath}" >/dev/null 2>&1 &
    fi
}
if [[ ! "$PROMPT_COMMAND" =~ "crashcue_prompt" ]]; then
    PROMPT_COMMAND="crashcue_prompt;$PROMPT_COMMAND"
fi
${endMarker}`;

  // 4. Read & Modify .bashrc
  try {
    let content = fs.readFileSync(bashrcPath, "utf8");

    // Idempotency: Replace or Append
    const regex = new RegExp(
      `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "g",
    );

    if (regex.test(content)) {
      content = content.replace(regex, block);
      console.log("   ✅ Updated existing Git Bash integration.");
    } else {
      if (content && !content.endsWith("\n")) {
        content += "\n";
      }
      content += block + "\n";
      console.log("   ✅ Injected Git Bash integration.");
    }

    fs.writeFileSync(bashrcPath, content, "utf8");
    console.log(`   📄 Profile: ${bashrcPath}`);
  } catch (err: any) {
    console.error(`   ❌ Failed to update Git Bash profile: ${err.message}`);
  }
}

export async function uninstallGitBash(): Promise<void> {
  if (process.platform !== "win32") {
    console.log("❌ Git Bash integration only supported on Windows");
    return;
  }

  console.log("🗑 Uninstalling CrashCue Git Bash Integration...");

  const bashrcPath = path.join(os.homedir(), ".bashrc");
  if (!fs.existsSync(bashrcPath)) {
    console.log("   ⚠️ Profile not found. Nothing to uninstall.");
    return;
  }

  const startMarker = "# <crashcue-start>";
  const endMarker = "# <crashcue-end>";
  const regex = new RegExp(
    `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\r?\\n?`,
    "g",
  );

  try {
    let content = fs.readFileSync(bashrcPath, "utf8");

    if (regex.test(content)) {
      content = content.replace(regex, "");
      fs.writeFileSync(bashrcPath, content, "utf8");
      console.log(`   ✅ Removed integration from: ${bashrcPath}`);
    } else {
      console.log("   ℹ️ No integration found to remove.");
    }
  } catch (err: any) {
    console.error(`   ❌ Failed to uninstall: ${err.message}`);
  }
}
