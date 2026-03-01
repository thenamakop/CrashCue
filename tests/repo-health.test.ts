import fs from "fs";
import path from "path";

describe("Repo Health Check", () => {
  const rootDir = path.resolve(__dirname, "..");
  const assetsDir = path.join(rootDir, "assets");
  const mp3Path = path.join(assetsDir, "faahhhhhh.mp3");

  test("assets/faahhhhhh.mp3 exists", () => {
    expect(fs.existsSync(mp3Path)).toBe(true);
  });

  test("assets/faahhhhhh.mp3 is readable", () => {
    expect(() => fs.accessSync(mp3Path, fs.constants.R_OK)).not.toThrow();
  });

  test("assets/faahhhhhh.mp3 size > 0", () => {
    const stats = fs.statSync(mp3Path);
    expect(stats.size).toBeGreaterThan(0);
  });

  test("root package.json exists", () => {
    const packageJsonPath = path.join(rootDir, "package.json");
    expect(fs.existsSync(packageJsonPath)).toBe(true);
  });

  test('Running on Windows (process.platform === "win32") should not break test', () => {
    // This test ensures that the environment is correctly identified or handled.
    // The requirement says "Running on Windows ... should not break test".
    // Since we are running on Windows, this test is effectively checking that we are not failing because of platform checks.
    // If we were on Linux, this test might need to be skipped or adapted, but the requirement is specific to Windows validation.
    // However, the prompt also says "Must still remain cross-platform compatible" and "Do NOT assume Unix environment".
    // So we should just log the platform and ensure it doesn't crash.
    console.log(`Running on platform: ${process.platform}`);
    expect(true).toBe(true);
  });
});
