import path from "path";
import fs from "fs";
import {
  DEFAULT_SOUND_PATH,
  resolveSoundPath,
} from "../packages/shared-assets/src/index";

describe("Shared Assets Module", () => {
  test("DEFAULT_SOUND_PATH should resolve to an existing file", () => {
    expect(fs.existsSync(DEFAULT_SOUND_PATH)).toBe(true);
    expect(fs.statSync(DEFAULT_SOUND_PATH).isFile()).toBe(true);
    expect(path.extname(DEFAULT_SOUND_PATH)).toBe(".wav");
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when no custom path provided", () => {
    const result = resolveSoundPath();
    expect(result).toBe(DEFAULT_SOUND_PATH);
  });

  test("resolveSoundPath should return custom path when valid path provided", () => {
    // Use the default sound path as a valid custom path for testing
    const validPath = DEFAULT_SOUND_PATH;
    const result = resolveSoundPath(validPath);
    expect(result).toBe(validPath);
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when invalid custom path provided", () => {
    const invalidPath = path.resolve(__dirname, "non-existent-file.mp3");
    const result = resolveSoundPath(invalidPath);
    expect(result).toBe(DEFAULT_SOUND_PATH);
  });

  test("resolveSoundPath should return DEFAULT_SOUND_PATH when custom path is a directory", () => {
    const dirPath = path.resolve(__dirname);
    const result = resolveSoundPath(dirPath);
    expect(result).toBe(DEFAULT_SOUND_PATH);
  });

  test("DEFAULT_SOUND_PATH should be absolute", () => {
    expect(path.isAbsolute(DEFAULT_SOUND_PATH)).toBe(true);
  });
});
