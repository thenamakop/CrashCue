import { spawn, execSync } from "child_process";
import { Notifier } from "../../notifier/src/index.ts";
import Conf from "conf";
import fs from "fs";
import path from "path";
import os from "os";
import { installPowerShell, uninstallPowerShell } from "./install/powershell";

import { installGitBash, uninstallGitBash } from "./install/gitbash";

interface CliConfig {
  muted: boolean;
  soundPath: string;
  ignoreCommands: string[];
}

export class CLI {
  private notifier: Notifier;
  private config: Conf<CliConfig>;

  constructor() {
    this.notifier = new Notifier();
    this.config = new Conf<CliConfig>({
      projectName: "crashcue",
      defaults: {
        muted: false,
        soundPath: "",
        ignoreCommands: [],
      },
    });
  }

  public async run(args: string[]): Promise<number> {
    if (args[0] === "run-sound") {
      // Internal command for cross-shell support
      const sound = this.config.get("soundPath");
      try {
        await this.notifier.notify({ sound: sound || undefined });
      } catch (err: unknown) {
        // Silent failure in internal command
      }
      return 0;
    }

    if (this.config.get("muted")) {
      return this.executeCommand(args, false);
    }

    const commandStr = args.join(" ");
    const ignoreList = this.config.get("ignoreCommands") || [];

    // Simple check if command is in ignore list (could be more robust regex matching later)
    if (ignoreList.includes(commandStr)) {
      return this.executeCommand(args, false);
    }

    return this.executeCommand(args, true);
  }

  private executeCommand(
    args: string[],
    notifyOnFailure: boolean,
  ): Promise<number> {
    return new Promise((resolve) => {
      // Windows-safe execution: spawn needs to run in a shell for complex commands or simple executables sometimes
      // { shell: true } is generally safer for "running a command string" behavior on Windows
      const [cmd, ...cmdArgs] = args;

      const quote = (arg: string): string => {
        if (process.platform === "win32") {
          // Windows cmd.exe quoting
          if (arg === "") return '""';
          // Escape double quotes
          let escaped = arg.replace(/"/g, '\\"');
          return `"${escaped}"`;
        } else {
          // Unix sh quoting
          if (arg === "") return "''";
          // Escape single quotes
          return `'${arg.replace(/'/g, "'\\''")}'`;
        }
      };

      // We must quote arguments because shell: true means they are joined into a command string
      const quotedArgs = cmdArgs.map(quote);

      const child = spawn(cmd, quotedArgs, {
        shell: true,
        stdio: "inherit",
      });

      child.on("close", async (code) => {
        const exitCode = code === null ? 1 : code;

        if (notifyOnFailure && exitCode !== 0) {
          // Play sound
          const sound = this.config.get("soundPath");
          try {
            await this.notifier.notify({ sound: sound || undefined });
          } catch (err: unknown) {
            console.error("CrashCue error:", err);
          }
        }

        resolve(exitCode);
      });

      child.on("error", (err) => {
        // Command failed to start
        if (notifyOnFailure) {
          this.notifier.notify().catch(() => {});
        }
        resolve(1);
      });
    });
  }

  public async mute(): Promise<void> {
    this.config.set("muted", true);
    console.log("CrashCue muted 🔕");
  }

  public async unmute(): Promise<void> {
    this.config.set("muted", false);
    console.log("CrashCue unmuted 🔊");
  }

  public async setSound(path: string): Promise<void> {
    if (process.platform === "win32" && !path.toLowerCase().endsWith(".wav")) {
      console.error("❌ On Windows, only .wav files are supported.");
      return;
    }
    if (!fs.existsSync(path)) {
      console.error(`❌ File not found: ${path}`);
      return;
    }
    const absolutePath = require("path").resolve(path);
    this.config.set("soundPath", absolutePath);
    console.log(`Sound set to: ${absolutePath} 🎵`);
  }

  public async showConfig(): Promise<void> {
    const sound = this.config.get("soundPath");
    if (sound) {
      console.log(`Sound: ${sound}`);
    } else {
      console.log("Sound: Default (none configured)");
    }
  }

  public async resetConfig(): Promise<void> {
    this.config.clear();
    console.log("Configuration reset to defaults 🔄");
  }

  public async test(): Promise<void> {
    console.log("Playing test sound... 🔊");
    await this.notifier.notify({ test: true });
  }

  private getNotifierPackagePath(): string {
    // When bundled, __dirname is packages/cli/dist (or similar)
    // We need to find packages/notifier relative to where we are running or installed

    // In dev (monorepo): ../../notifier
    let notifierPath = path.resolve(__dirname, "../../notifier");
    if (fs.existsSync(path.join(notifierPath, "package.json"))) {
      return notifierPath;
    }

    // In prod (installed): we are in packages/cli/dist
    // But wait, "files" includes packages/notifier/native-windows.ps1 directly mapped?
    // "files": [ "packages/cli/dist", "packages/notifier/native-windows.ps1" ]
    // This maps the structure 1:1 inside the tarball.

    // So if __dirname is .../node_modules/crashcue/packages/cli/dist
    // Then notifier script is at .../node_modules/crashcue/packages/notifier/native-windows.ps1

    notifierPath = path.resolve(__dirname, "../../notifier");
    // We check for the script directly now since package.json might not be there if excluded
    if (fs.existsSync(path.join(notifierPath, "native-windows.ps1"))) {
      return notifierPath;
    }

    console.error("Could not locate CrashCue notifier files.");
    return "";
  }

  public async doctor(): Promise<void> {
    console.log("🏥 CrashCue Doctor\n");

    const platform = process.platform;
    console.log(`Platform: ${platform}`);

    // 1. Check Native Script (Windows)
    if (platform === "win32") {
      try {
        const notifierPath = this.getNotifierPackagePath();
        if (notifierPath) {
          const nativeScript = path.join(notifierPath, "native-windows.ps1");
          if (fs.existsSync(nativeScript)) {
            console.log("✅ Native Windows Script found");
          } else {
            console.log("❌ Native Windows Script MISSING");
          }
        }
      } catch (e) {
        console.log("❌ Could not check native script");
      }
    }

    // 2. Check Default WAV
    try {
      const configSound = this.config.get("soundPath");
      if (configSound) {
        if (fs.existsSync(configSound)) {
          console.log(`✅ Configured sound exists: ${configSound}`);
        } else {
          console.log(`❌ Configured sound MISSING: ${configSound}`);
        }
      } else {
        console.log("ℹ️  Using default sound configuration");
      }
    } catch (e) {}

    // 3. Check Shell Integrations (Windows)
    if (platform === "win32") {
      // PowerShell
      const SHELLS = [
        { name: "Windows PowerShell", cmd: "powershell" },
        { name: "PowerShell Core (pwsh)", cmd: "pwsh" },
      ];

      for (const shell of SHELLS) {
        try {
          const psProfile = execSync(
            `${shell.cmd} -NoProfile -Command "$PROFILE"`,
            {
              encoding: "utf8",
              stdio: ["ignore", "pipe", "ignore"],
            },
          ).trim();

          if (psProfile && fs.existsSync(psProfile)) {
            const content = fs.readFileSync(psProfile, "utf8");
            if (content.includes("<crashcue-start>")) {
              const hasNewTemplate = content.includes("Template Version: 2");
              if (hasNewTemplate) {
                console.log(`✅ ${shell.name} Profile integration found (v2)`);
              } else {
                console.log(
                  `⚠️ ${shell.name} Profile integration found (OUTDATED)`,
                );
                console.log("   Run 'crashcue install powershell' to upgrade.");
              }
            } else {
              console.log(`❌ ${shell.name} Profile integration MISSING`);
            }
          } else {
            // Profile file doesn't exist yet, which is normal if not installed
            console.log(`❌ ${shell.name} Profile file not found`);
          }
        } catch (e) {
          // Shell might not be installed
          // console.log(`⚠️  ${shell.name} not detected`);
        }
      }

      // Git Bash
      try {
        const bashrc = path.join(os.homedir(), ".bashrc");
        if (fs.existsSync(bashrc)) {
          const content = fs.readFileSync(bashrc, "utf8");
          if (content.includes("<crashcue-start>")) {
            console.log("✅ Git Bash (.bashrc) integration found");
          } else {
            console.log("❌ Git Bash (.bashrc) integration MISSING");
          }
        } else {
          console.log("❌ Git Bash .bashrc not found");
        }
      } catch (e) {
        console.log("⚠️  Git Bash check failed");
      }
    }
  }

  public async install(shell?: string): Promise<void> {
    console.log("📦 Installing CrashCue Shell Integrations...");

    // 1. Install PowerShell
    if (!shell || shell === "powershell") {
      try {
        await installPowerShell();
      } catch (e: any) {
        console.error(`❌ PowerShell installation failed: ${e.message}`);
      }
    }

    // 3. Install Git Bash
    if (!shell || shell === "gitbash") {
      try {
        await installGitBash();
      } catch (e: any) {
        console.error(`❌ Git Bash installation failed: ${e.message}`);
      }
    }

    if (!shell) {
      console.log("\n✅ All integrations checked.");
    }
  }

  public async uninstall(shell?: string): Promise<void> {
    console.log("🗑 Uninstalling CrashCue Shell Integrations...");

    // 1. Uninstall PowerShell
    if (!shell || shell === "powershell") {
      try {
        await uninstallPowerShell();
      } catch (e: any) {
        console.error(`❌ PowerShell uninstallation failed: ${e.message}`);
      }
    }

    // 2. Uninstall CMD (Removed)
    // if (!shell || shell === "cmd") {
    //   try {
    //     await uninstallCMD();
    //   } catch (e: any) {
    //     console.error(`❌ CMD uninstallation failed: ${e.message}`);
    //   }
    // }

    // 3. Uninstall Git Bash
    if (!shell || shell === "gitbash") {
      try {
        await uninstallGitBash();
      } catch (e: any) {
        console.error(`❌ Git Bash uninstallation failed: ${e.message}`);
      }
    }

    if (!shell) {
      console.log("\n✅ All integrations removed.");
    }
  }

  public async status(): Promise<void> {
    console.log("📊 CrashCue Status\n");
    const muted = this.config.get("muted");
    console.log(`Enabled: ${!muted}`);
    console.log(`Sound: ${this.config.get("soundPath") || "Default"}`);
    const ignore = this.config.get("ignoreCommands");
    console.log(
      `Ignore List: ${ignore && ignore.length > 0 ? ignore.join(", ") : "None"}`,
    );
    console.log(`Config Path: ${(this.config as any).path}\n`);

    await this.doctor();
  }
}
