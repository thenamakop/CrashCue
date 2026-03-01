import { spawn, execSync } from "child_process";
import { Notifier } from "@crashcue/notifier";
import Conf from "conf";
import fs from "fs";
import path from "path";
import os from "os";

interface CliConfig {
  muted: boolean;
  sound: string;
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
        sound: "",
        ignoreCommands: [],
      },
    });
  }

  public async run(args: string[]): Promise<number> {
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
          const sound = this.config.get("sound");
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
    this.config.set("sound", path);
    console.log(`Sound set to: ${path} 🎵`);
  }

  public async test(): Promise<void> {
    console.log("Playing test sound... 🔊");
    await this.notifier.notify({ test: true });
  }

  private getNotifierPackagePath(): string {
    try {
      return path.dirname(require.resolve("@crashcue/notifier/package.json"));
    } catch (e) {
      console.error("Could not locate @crashcue/notifier package.");
      return "";
    }
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
      const configSound = this.config.get("sound");
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
      try {
        const psProfile = execSync('pwsh -NoProfile -Command "$PROFILE"', {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        if (psProfile && fs.existsSync(psProfile)) {
          const content = fs.readFileSync(psProfile, "utf8");
          if (content.includes("<crashcue-start>")) {
            console.log("✅ PowerShell 7 Profile integration found");
          } else {
            console.log("❌ PowerShell 7 Profile integration MISSING");
          }
        } else {
          console.log("❌ PowerShell 7 Profile file not found");
        }
      } catch (e) {
        console.log("⚠️  PowerShell 7 not detected or check failed");
      }

      // CMD
      try {
        const reg = execSync(
          'reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun',
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
        );
        if (reg.includes("native-windows.ps1")) {
          console.log("✅ CMD AutoRun integration found");
        } else {
          console.log("❌ CMD AutoRun integration MISSING");
        }
      } catch (e) {
        // If reg query fails, key likely missing
        console.log("❌ CMD AutoRun integration MISSING");
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

  public async install(): Promise<void> {
    console.log("📦 Installing CrashCue Shell Integrations...");
    const notifierPath = this.getNotifierPackagePath();
    if (!notifierPath) return;

    const script = path.join(notifierPath, "install-all-shells.js");
    try {
      execSync(`node "${script}"`, { stdio: "inherit" });
      console.log("\n✅ Installation complete!");
    } catch (e) {
      console.error("\n❌ Installation failed");
    }
  }

  public async uninstall(): Promise<void> {
    console.log("🗑 Uninstalling CrashCue Shell Integrations...");
    const notifierPath = this.getNotifierPackagePath();
    if (!notifierPath) return;

    const script = path.join(notifierPath, "uninstall-all-shells.js");
    try {
      execSync(`node "${script}"`, { stdio: "inherit" });
      console.log("\n✅ Uninstallation complete!");
    } catch (e) {
      console.error("\n❌ Uninstallation failed");
    }
  }

  public async status(): Promise<void> {
    console.log("📊 CrashCue Status\n");
    const muted = this.config.get("muted");
    console.log(`Enabled: ${!muted}`);
    console.log(`Sound: ${this.config.get("sound") || "Default"}`);
    const ignore = this.config.get("ignoreCommands");
    console.log(
      `Ignore List: ${ignore && ignore.length > 0 ? ignore.join(", ") : "None"}`,
    );
    console.log(`Config Path: ${(this.config as any).path}\n`);

    await this.doctor();
  }
}
