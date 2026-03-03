import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import player from "play-sound";

/**
 * Resolve shared assets for the notifier package.
 * Tries several candidate locations in order:
 *  1) installed package: require.resolve('@crashcue/shared-assets')
 *  2) module-relative: ../assets (inside notifier package)
 *  3) alternate module-relative: ../../notifier/assets
 *  4) monorepo candidate: <cwd>/packages/notifier/assets
 *  5) root assets candidate: <cwd>/assets
 *
 * Returns the absolute directory path on success, throws on failure.
 */
function resolveSharedAssets(): {
  DEFAULT_SOUND_PATH: string;
  resolveSoundPath: (customPath?: string) => string;
} {
  // helper to log
  const log = (msg: string) => {
    // small logs help debugging in tests and runtime
    // eslint-disable-next-line no-console
    console.log(msg);
  };

  let assetsDir: string | undefined;

  // 1) installed package via require.resolve
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve("@crashcue/shared-assets");
    const pkgDir = path.dirname(resolved);
    if (fs.existsSync(pkgDir)) {
      log(`Resolved shared-assets via package: ${pkgDir}`);
      assetsDir = pkgDir;
    }
  } catch {
    // not installed — continue
  }

  if (!assetsDir) {
    // 2) module-relative (notifier package layout)
    const moduleRelative = path.resolve(__dirname, "../assets");
    log(`Checking module-relative candidate: ${moduleRelative}`);
    if (fs.existsSync(moduleRelative)) assetsDir = moduleRelative;
  }

  if (!assetsDir) {
    // 3) alternate module-relative (two-up / different build layouts)
    const altModuleRelative = path.resolve(__dirname, "../../notifier/assets");
    log(`Checking alternate module-relative candidate: ${altModuleRelative}`);
    if (fs.existsSync(altModuleRelative)) assetsDir = altModuleRelative;
  }

  if (!assetsDir) {
    // 4) monorepo candidate relative to current working directory
    const monorepoCandidate = path.resolve(
      process.cwd(),
      "packages",
      "notifier",
      "assets",
    );
    log(`Checking monorepo candidate: ${monorepoCandidate}`);
    if (fs.existsSync(monorepoCandidate)) assetsDir = monorepoCandidate;
  }

  if (!assetsDir) {
    // 5) root assets candidate
    const rootAssetsCandidate = path.resolve(process.cwd(), "assets");
    log(`Checking root assets candidate: ${rootAssetsCandidate}`);
    if (fs.existsSync(rootAssetsCandidate)) assetsDir = rootAssetsCandidate;
  }

  if (assetsDir) {
    const defaultSound = path.join(assetsDir, "faahhhhhh.wav");
    return {
      DEFAULT_SOUND_PATH: defaultSound,
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
        return defaultSound;
      },
    };
  }

  // none found — log and throw
  const candidates = [
    "require('@crashcue/shared-assets')",
    path.resolve(__dirname, "../assets"),
    path.resolve(__dirname, "../../notifier/assets"),
    path.resolve(process.cwd(), "packages", "notifier", "assets"),
    path.resolve(process.cwd(), "assets"),
  ];
  // eslint-disable-next-line no-console
  console.error(
    "Notifier failed to resolve shared assets. Checked:",
    candidates,
  );
  throw new Error(
    "Cannot resolve shared assets. Expected installed @crashcue/shared-assets or bundled packages/notifier/assets/",
  );
}

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
    // Lazy resolution
    const { DEFAULT_SOUND_PATH, resolveSoundPath } = resolveSharedAssets();

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
