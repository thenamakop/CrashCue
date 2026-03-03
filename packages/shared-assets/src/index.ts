import path from "path";
import fs from "fs";

export function resolveAssetsDir(): string {
  const override = process.env.CRASHCUE_TEST_ASSETS_PATH;
  if (override) return path.resolve(override);

  return path.resolve(__dirname, "assets");
}

export const DEFAULT_SOUND_PATH = path.resolve(
  resolveAssetsDir(),
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
