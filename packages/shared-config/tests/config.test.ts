import path from "path";
import fs from "fs";
import os from "os";
import { ConfigLoader } from "../src/index";
import { DEFAULT_SOUND_PATH } from "@crashcue/shared-assets";

jest.mock("os");

describe("Config Loader (Windows-Aware)", () => {
  const mockUserProfile = "C:\\Users\\TestUser";
  const mockCwd = "C:\\Projects\\TestProject";

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
    (os.homedir as jest.Mock).mockReturnValue(mockUserProfile);

    // Mock process.cwd
    jest.spyOn(process, "cwd").mockReturnValue(mockCwd);

    // Mock fs
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(fs, "readFileSync").mockReturnValue("{}");
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
});
