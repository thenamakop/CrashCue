import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import { DEFAULT_SOUND_PATH, resolveSoundPath } from "@crashcue/shared-assets";
import player from "play-sound";

export interface NotifierOptions {
  sound?: string;
  volume?: number;
  test?: boolean;
}

export class Notifier extends EventEmitter {
  private player: any;

  constructor() {
    super();
    this.player = player({});
  }

  public async notify(options: NotifierOptions = {}): Promise<void> {
    let soundPath: string;

    if (options.test) {
      soundPath = DEFAULT_SOUND_PATH;
    } else {
      soundPath = resolveSoundPath(options.sound);
    }

    // Resolve again just in case resolveSoundPath didn't catch existence (it does, but to be safe)
    if (!fs.existsSync(soundPath)) {
      soundPath = DEFAULT_SOUND_PATH;
    }

    const ext = path.extname(soundPath).toLowerCase();
    const platform = process.platform;

    if (platform === "win32") {
      if (ext === ".wav") {
        await this.playWavWindows(soundPath);
      } else if (ext === ".mp3") {
        await this.playNodeFallback(soundPath);
      } else {
        // Fallback for unknown extensions, try node player
        await this.playNodeFallback(soundPath);
      }
    } else {
      // Non-Windows (Darwin, Linux) - use Node player (which wraps afplay, aplay, etc.)
      await this.playNodeFallback(soundPath);
    }
  }

  private playWavWindows(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Escape backslashes for PowerShell string
      // Replace \ with \\
      const escapedPath = filePath.replace(/\\/g, "\\\\");

      // PowerShell command to play system sound
      // (New-Object System.Media.SoundPlayer 'path').PlaySync()
      const psCommand = `(New-Object System.Media.SoundPlayer "${escapedPath}").PlaySync()`;

      const child = spawn("powershell", ["-c", psCommand], {
        windowsHide: true,
        stdio: "ignore",
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PowerShell exited with code ${code}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }

  private playNodeFallback(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.player.play(filePath, (err: any) => {
        if (err) {
          // Try to reject, but play-sound sometimes returns error on success if player output is non-empty
          // But for now, we assume err is real error.
          // Actually, let's just resolve if it worked.
          // However, we want to be robust.
          // If fallback fails, we might want to try default asset if we weren't already.
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Stub for Named Pipe IPC (Windows only)
  public startIpcServer(): void {
    if (process.platform === "win32") {
      // Implementation stub
      // net.createServer(...)
    }
  }
}
