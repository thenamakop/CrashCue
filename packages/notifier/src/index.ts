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

    const platform = process.platform;

    if (platform === "win32") {
      // Enforce .wav only on Windows
      if (!soundPath.toLowerCase().endsWith(".wav")) {
        throw new Error("On Windows, CrashCue supports .wav files only.");
      }
      try {
        await this.playWavWindows(soundPath);
      } catch (err) {
        console.error(
          "Native playback failed, falling back to Node player:",
          err,
        );
        await this.playNodeFallback(soundPath);
      }
    } else {
      // Non-Windows (Darwin, Linux) - use Node player (which wraps afplay, aplay, etc.)
      await this.playNodeFallback(soundPath);
    }
  }

  private playWavWindows(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(__dirname, "../native-windows.ps1");

      if (!fs.existsSync(scriptPath)) {
        return reject(new Error("Native PowerShell script missing"));
      }

      const spawnArgs = [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-Path",
        filePath,
      ];

      const child = spawn("powershell.exe", spawnArgs, {
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
