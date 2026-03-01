import path from "path";
import fs from "fs";

/**
 * Returns the absolute path to the project root.
 * This assumes the structure is:
 * root/
 *   packages/
 *     shared-assets/
 *       src/
 *         index.ts (source)
 *       dist/
 *         index.js (compiled)
 *
 * So from source: ../../../
 * From dist: ../../../
 *
 * However, depending on where it's run from, relying on __dirname is safest if we know the relative position.
 * The assets are in root/assets/
 */
const getProjectRoot = (): string => {
  // Navigate up from packages/shared-assets/src (or dist) to the root
  // In src: __dirname is .../packages/shared-assets/src
  // In dist: __dirname is .../packages/shared-assets/dist
  // Both are 3 levels deep from root if we consider packages/shared-assets/src|dist
  return path.resolve(__dirname, "..", "..", "..");
};

export const DEFAULT_SOUND_PATH = path.resolve(
  getProjectRoot(),
  "assets",
  "faahhhhhh.wav",
);

/**
 * Resolves the sound path.
 * If a custom path is provided and valid, returns it.
 * Otherwise, returns the default sound path.
 *
 * @param customPath - Optional custom path to a sound file.
 * @returns The resolved absolute path to the sound file.
 */
export const resolveSoundPath = (customPath?: string): string => {
  if (customPath) {
    const resolvedPath = path.resolve(customPath);
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return resolvedPath;
    }
  }
  return DEFAULT_SOUND_PATH;
};
