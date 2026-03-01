import { spawn } from "child_process";
import { Notifier } from "@crashcue/notifier";
import Conf from "conf";

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
      const child = spawn(args.join(" "), {
        shell: true,
        stdio: "inherit",
      });

      child.on("close", (code) => {
        const exitCode = code === null ? 1 : code;

        if (notifyOnFailure && exitCode !== 0) {
          // Play sound
          const sound = this.config.get("sound");
          this.notifier
            .notify({ sound: sound || undefined })
            .catch((err: unknown) => {
              console.error("CrashCue error:", err);
            });
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
}
