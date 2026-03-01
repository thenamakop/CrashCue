import fs from "fs";
import path from "path";
import os from "os";

const SHELL_SNIPPETS_DIR = path.join(__dirname, "shell-snippets");
const POWERSHELL_SNIPPET_PATH = path.join(SHELL_SNIPPETS_DIR, "powershell.ps1");

export class ShellInstaller {
  public static getPowerShellProfilePath(): string | null {
    if (process.platform !== "win32") return null;

    // In a real environment, we might execute 'echo $PROFILE' in powershell to get the exact path
    // For now, we simulate standard locations or rely on env vars if available.
    // PowerShell Core: Documents/PowerShell/Microsoft.PowerShell_profile.ps1
    // Windows PowerShell: Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1

    const documentsDir = path.join(os.homedir(), "Documents");
    const psCoreProfile = path.join(
      documentsDir,
      "PowerShell",
      "Microsoft.PowerShell_profile.ps1",
    );
    const winPsProfile = path.join(
      documentsDir,
      "WindowsPowerShell",
      "Microsoft.PowerShell_profile.ps1",
    );

    if (fs.existsSync(path.dirname(psCoreProfile))) return psCoreProfile;
    if (fs.existsSync(path.dirname(winPsProfile))) return winPsProfile;

    // Default to PS Core path if folders don't exist, we might create them
    return psCoreProfile;
  }

  public static async installPowerShell(): Promise<void> {
    const profilePath = this.getPowerShellProfilePath();
    if (!profilePath) {
      console.error("Could not determine PowerShell profile path.");
      return;
    }

    this.backupProfile(profilePath);

    const snippetTemplate = fs.readFileSync(POWERSHELL_SNIPPET_PATH, "utf8");

    // Resolve absolute paths
    const rootDir = path.resolve(__dirname, "..");

    // Path to native-windows.ps1
    const nativeScriptPath = path.join(
      rootDir,
      "packages",
      "notifier",
      "native-windows.ps1",
    );

    // Path to sound asset
    const soundPath = path.join(rootDir, "assets", "faahhhhhh.wav");

    let snippet = snippetTemplate.replace(
      "{{NATIVE_SCRIPT_PATH}}",
      nativeScriptPath,
    );
    snippet = snippet.replace("{{SOUND_PATH}}", soundPath);

    const startMarker = "# <crashcue-start>";
    const endMarker = "# <crashcue-end>";
    const wrappedSnippet = `\n${startMarker}\n${snippet}\n${endMarker}\n`;

    let profileContent = "";
    if (fs.existsSync(profilePath)) {
      profileContent = fs.readFileSync(profilePath, "utf8");
    } else {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(profilePath), { recursive: true });
    }

    // Idempotency check
    if (profileContent.includes(startMarker)) {
      console.log("CrashCue already installed in PowerShell profile.");
      // Optionally update it
      const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "g");
      profileContent = profileContent.replace(regex, wrappedSnippet.trim());
    } else {
      profileContent += wrappedSnippet;
    }

    fs.writeFileSync(profilePath, profileContent, "utf8");
    console.log(`Installed CrashCue to ${profilePath}`);
  }

  public static async uninstallPowerShell(): Promise<void> {
    const profilePath = this.getPowerShellProfilePath();
    if (!profilePath || !fs.existsSync(profilePath)) {
      console.log("No PowerShell profile found to uninstall from.");
      return;
    }

    this.backupProfile(profilePath);

    let profileContent = fs.readFileSync(profilePath, "utf8");
    const startMarker = "# <crashcue-start>";
    const endMarker = "# <crashcue-end>";
    const regex = new RegExp(
      `\\n?${startMarker}[\\s\\S]*?${endMarker}\\n?`,
      "g",
    );

    if (regex.test(profileContent)) {
      profileContent = profileContent.replace(regex, "");
      fs.writeFileSync(profilePath, profileContent, "utf8");
      console.log(`Uninstalled CrashCue from ${profilePath}`);
    } else {
      console.log("CrashCue not found in PowerShell profile.");
    }
  }

  private static backupProfile(profilePath: string): void {
    if (!fs.existsSync(profilePath)) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `${profilePath}.${timestamp}.bak`;
    fs.copyFileSync(profilePath, backupPath);
    console.log(`Backed up profile to ${backupPath}`);
  }
}

// Simple CLI entry point
if (require.main === module) {
  const action = process.argv[2];
  if (action === "install") {
    ShellInstaller.installPowerShell().catch(console.error);
  } else if (action === "uninstall") {
    ShellInstaller.uninstallPowerShell().catch(console.error);
  } else {
    console.log("Usage: ts-node install-shell.ts [install|uninstall]");
  }
}
