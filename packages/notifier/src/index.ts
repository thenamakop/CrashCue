import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import player from "play-sound";

function resolveSharedAssets() {
  // 1) try to require the workspace package (dev / local workspace)
  try {
    // Use require to avoid static import errors when package not present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require("@crashcue/shared-assets");
    if (pkg) return pkg;
  } catch (_) {
    // ignore - fallthrough
  }

  // 2) fallback to bundled assets added by prepack
  // In packaged structure: dist/index.js -> assets/ is at ../assets/
  // In source structure: src/index.ts -> assets/ is at ../assets/
  // In root bundle: packages/cli/dist/index.js -> assets/ is at ../../../assets/
  const candidates = [
    path.resolve(__dirname, "..", "assets"),
    path.resolve(__dirname, "../../..", "assets"),
    path.resolve(__dirname, "../../notifier/assets"), // From cli/dist to notifier/assets
  ];

  for (const assetsDir of candidates) {
    // console.log("Notifier checking assets at:", assetsDir);
    if (fs.existsSync(assetsDir)) {
      return {
        DEFAULT_SOUND_PATH: path.join(assetsDir, "faahhhhhh.wav"),
        resolveSoundPath: (customPath?: string) => {
          if (customPath) {
            const resolvedPath = path.resolve(customPath);
            if (
              fs.existsSync(resolvedPath) &&
              fs.statSync(resolvedPath).isFile()
            ) {
              return resolvedPath;
            }
          }
          return path.join(assetsDir, "faahhhhhh.wav");
        },
      };
    }
  }

  // 3) final error if neither found
  console.error(
    "Notifier failed to resolve shared assets. Checked:",
    candidates,
  );
  throw new Error(
    "Cannot resolve shared assets. Expected installed @crashcue/shared-assets or bundled packages/notifier/assets/",
  );
}

// Usage: const sharedAssets = resolveSharedAssets();
const { DEFAULT_SOUND_PATH, resolveSoundPath } = resolveSharedAssets();

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
      // Check multiple possible locations for the script
      // 1. Dev/Monorepo: ../native-windows.ps1 (relative to src/dist)
      // 2. Bundled CLI: ../../notifier/native-windows.ps1 (relative to packages/cli/dist)
      const candidates = [
        path.resolve(__dirname, "../native-windows.ps1"),
        path.resolve(__dirname, "../../notifier/native-windows.ps1"),
      ];

      let scriptPath = "";
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          scriptPath = candidate;
          break;
        }
      }

      if (!scriptPath) {
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
