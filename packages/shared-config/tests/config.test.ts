import path from "path";
import fs from "fs";
import os from "os";

jest.mock("os");

describe("Config Loader (Windows-Aware)", () => {
  let ConfigLoader: typeof import("../src/index").ConfigLoader;
  let DEFAULT_SOUND_PATH: string;
  const mockUserProfile = "C:\\Users\\TestUser";
  const mockCwd = "C:\\Projects\\TestProject";
  const realAssetsDir = path.resolve(
    __dirname,
    "..",
    "..",
    "shared-assets",
    "assets",
  );

  // Setup paths using path.join for cross-platform consistency in test expectations,
  // but the implementation logic specifically uses Windows conventions where applicable.
  const globalConfigPath = path.join(
    mockUserProfile,
    ".config",
    "crashcue",
    "config.json",
  );
  const workspaceConfigPath = path.join(mockCwd, ".crashcue.json");

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment
    process.env.USERPROFILE = mockUserProfile;
    process.env.CRASHCUE_TEST_ASSETS_PATH = realAssetsDir;
    (os.homedir as jest.Mock).mockReturnValue(mockUserProfile);

    // Mock process.cwd
    jest.spyOn(process, "cwd").mockReturnValue(mockCwd);

    // Mock fs
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(fs, "readFileSync").mockReturnValue("{}");

    jest.resetModules();
    ({ ConfigLoader } =
      require("../src/index") as typeof import("../src/index"));
    ({ DEFAULT_SOUND_PATH } =
      require("../../shared-assets/src/index") as typeof import("../../shared-assets/src/index"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.CRASHCUE_TEST_ASSETS_PATH;
  });

  test("should resolve global config path using USERPROFILE on Windows", () => {
    // We can't easily test private methods, but we can verify behavior
    jest.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p === globalConfigPath) return true;
      return false;
    });
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify({ sound: "global.mp3" }));

    const config = ConfigLoader.loadConfig();
    expect(config.sound).toBe("global.mp3");
    expect(fs.readFileSync).toHaveBeenCalledWith(globalConfigPath, "utf8");
  });

  test("should resolve workspace config path", () => {
    jest.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p === workspaceConfigPath) return true;
      return false;
    });
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(JSON.stringify({ sound: "workspace.mp3" }));

    const config = ConfigLoader.loadConfig();
    expect(config.sound).toBe("workspace.mp3");
    expect(fs.readFileSync).toHaveBeenCalledWith(workspaceConfigPath, "utf8");
  });

  test("workspace config should take precedence over global config", () => {
    jest.spyOn(fs, "existsSync").mockImplementation((p) => {
      if (p === globalConfigPath) return true;
      if (p === workspaceConfigPath) return true;
      return false;
    });

    jest.spyOn(fs, "readFileSync").mockImplementation((p) => {
      if (p === globalConfigPath)
        return JSON.stringify({ sound: "global.mp3", muted: false });
      if (p === workspaceConfigPath)
        return JSON.stringify({ sound: "workspace.mp3" });
      return "{}";
    });

    const config = ConfigLoader.loadConfig();
    expect(config.sound).toBe("workspace.mp3");
    expect(config.muted).toBe(false); // Inherited from global
  });

  test('"sound": "default" should resolve to DEFAULT_SOUND_PATH', () => {
    const result = ConfigLoader.resolveSound("default");
    expect(result).toBe(DEFAULT_SOUND_PATH);
  });

  test("should fallback to DEFAULT_SOUND_PATH for invalid paths", () => {
    // ConfigLoader.resolveSound delegates to resolveSoundPath, which checks fs.existsSync.
    // We need to verify this delegation or re-test the behavior.
    // Since we are mocking resolveSoundPath implicitly via shared-assets behavior (or rather importing real one),
    // we should mock fs.existsSync/statSync for the path validation if we want to test logic here.

    const invalidPath = "C:\\Invalid\\Path.mp3";

    // Mock fs to say invalidPath does not exist
    jest.spyOn(fs, "existsSync").mockImplementation(() => false); // All paths fail existence check

    const result = ConfigLoader.resolveSound(invalidPath);
    expect(result).toBe(DEFAULT_SOUND_PATH);
  });

  test("should handle malformed JSON gracefully", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    // Mock malformed JSON
    jest.spyOn(fs, "readFileSync").mockReturnValue("{ invalid json }");

    // Should not throw and return empty config (or partial if merged)
    const config = ConfigLoader.loadConfig();
    expect(config).toEqual({});
  });
});
