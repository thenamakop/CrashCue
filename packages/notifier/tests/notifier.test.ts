import { Notifier } from "../src/index";
import path from "path";
import fs from "fs";
import { DEFAULT_SOUND_PATH } from "@crashcue/shared-assets";
import { spawn } from "child_process";

// Mock spawn
jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

// Mock play-sound
const mockPlay = jest.fn();
jest.mock("play-sound", () => {
  return () => ({
    play: mockPlay,
  });
});

describe("Notifier (Windows-First)", () => {
  let notifier: Notifier;
  const originalPlatform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    notifier = new Notifier();

    // Default spawn mock implementation to simulate success
    (spawn as jest.Mock).mockReturnValue({
      on: jest.fn((event, cb) => {
        if (event === "close") cb(0);
      }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      unref: jest.fn(),
    });

    // Default play-sound mock
    mockPlay.mockImplementation(
      (file: string, optsOrCb: any, cb?: (err?: any) => void) => {
        let callback = cb;
        if (typeof optsOrCb === "function") {
          callback = optsOrCb;
        }
        if (callback) callback();
      },
    );

    // Mock fs to always return true for existence by default to avoid fallback logic triggered by missing files
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest
      .spyOn(fs, "statSync")
      .mockReturnValue({ isFile: () => true } as fs.Stats);
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", {
      value: originalPlatform,
    });
  });

  const setPlatform = (platform: string) => {
    Object.defineProperty(process, "platform", {
      value: platform,
    });
  };

  test("should detect win32 platform", () => {
    setPlatform("win32");
    expect(process.platform).toBe("win32");
  });

  test("should detect darwin platform", () => {
    setPlatform("darwin");
    expect(process.platform).toBe("darwin");
  });

  test("should detect linux platform", () => {
    setPlatform("linux");
    expect(process.platform).toBe("linux");
  });

  describe("Windows Playback Logic", () => {
    beforeEach(() => {
      setPlatform("win32");
    });

    test("should use native-windows.ps1 script if available on Windows", async () => {
      const wavPath = "C:\\path\\to\\sound.wav";

      // Mock script existence
      jest.spyOn(fs, "existsSync").mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith("native-windows.ps1"))
          return true;
        return true; // Default
      });

      await notifier.notify({ sound: wavPath });

      expect(spawn).toHaveBeenCalledWith(
        "powershell.exe",
        expect.arrayContaining([
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          expect.stringContaining("native-windows.ps1"),
          "-Path",
          wavPath,
        ]),
        expect.objectContaining({
          windowsHide: true,
          stdio: "ignore",
        }),
      );
    });

    test("should fallback to Node player if script missing on Windows", async () => {
      const wavPath = "C:\\path\\to\\sound.wav";

      // Mock script missing
      jest.spyOn(fs, "existsSync").mockImplementation((p: any) => {
        if (typeof p === "string" && p.endsWith("native-windows.ps1"))
          return false;
        return true; // Default
      });

      // Spy on console.error to avoid cluttering test output
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await notifier.notify({ sound: wavPath });

      // Should not spawn
      expect(spawn).not.toHaveBeenCalled();
      // Should call Node player
      expect(mockPlay).toHaveBeenCalledWith(wavPath, expect.any(Function));
      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith(
        "Native playback failed, falling back to Node player:",
        expect.any(Error),
      );
    });

    test("should fallback to Node player if native script exits with error code", async () => {
      const wavPath = "C:\\path\\to\\sound.wav";

      // Mock script exists
      jest.spyOn(fs, "existsSync").mockReturnValue(true);

      // Mock spawn to fail
      (spawn as jest.Mock).mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1); // Exit code 1
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await notifier.notify({ sound: wavPath });

      expect(spawn).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalledWith(wavPath, expect.any(Function));
      expect(consoleSpy).toHaveBeenCalled();
    });

    test("should fallback to Node player if spawn errors", async () => {
      const wavPath = "C:\\path\\to\\sound.wav";

      jest.spyOn(fs, "existsSync").mockReturnValue(true);

      // Mock spawn to error
      (spawn as jest.Mock).mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "error") cb(new Error("Spawn failed"));
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
      });

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await notifier.notify({ sound: wavPath });

      expect(spawn).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalledWith(wavPath, expect.any(Function));
    });

    test("should throw error for .mp3 files on Windows", async () => {
      const mp3Path = "C:\\path\\to\\sound.mp3";
      await expect(notifier.notify({ sound: mp3Path })).rejects.toThrow(
        "On Windows, CrashCue supports .wav files only.",
      );

      expect(mockPlay).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    });

    test("should fallback to DEFAULT_SOUND_PATH if invalid path provided", async () => {
      const invalidPath = "C:\\invalid\\path.wav";

      // Mock fs.existsSync to return false for invalidPath and true for others
      jest.spyOn(fs, "existsSync").mockImplementation((p: any) => {
        if (p === invalidPath) return false;
        return true;
      });
      jest.spyOn(fs, "statSync").mockImplementation((p) => {
        return { isFile: () => true } as fs.Stats;
      });

      await notifier.notify({ sound: invalidPath });

      // Should play default sound using native script (happy path)
      expect(spawn).toHaveBeenCalledWith(
        "powershell.exe",
        expect.arrayContaining([
          "-File",
          expect.stringContaining("native-windows.ps1"),
          "-Path",
          DEFAULT_SOUND_PATH,
        ]),
        expect.anything(),
      );
    });

    test("--test flag should use default asset", async () => {
      await notifier.notify({ test: true });
      expect(spawn).toHaveBeenCalled();
    });

    test("should start IPC server on Windows", () => {
      expect(() => notifier.startIpcServer()).not.toThrow();
    });
  });

  describe("Non-Windows Playback Logic", () => {
    beforeEach(() => {
      setPlatform("linux");
    });

    test("should use Node player for all files on Linux", async () => {
      const wavPath = "/path/to/sound.wav";
      const resolvedPath = path.resolve(wavPath);
      await notifier.notify({ sound: wavPath });

      expect(mockPlay).toHaveBeenCalledWith(resolvedPath, expect.any(Function));
      expect(spawn).not.toHaveBeenCalled();
    });

    test("should use Node player for .mp3 files on Linux", async () => {
      const mp3Path = "/path/to/sound.mp3";
      const resolvedPath = path.resolve(mp3Path);
      await notifier.notify({ sound: mp3Path });

      expect(mockPlay).toHaveBeenCalledWith(resolvedPath, expect.any(Function));
    });

    test("should use Node player for all files on Darwin", async () => {
      setPlatform("darwin");
      const mp3Path = "/path/to/sound.mp3";
      const resolvedPath = path.resolve(mp3Path);
      await notifier.notify({ sound: mp3Path });

      expect(mockPlay).toHaveBeenCalledWith(resolvedPath, expect.any(Function));
      expect(spawn).not.toHaveBeenCalled();
    });

    test("should not start IPC server on Non-Windows", () => {
      // Just ensure it doesn't crash/do anything
      expect(() => notifier.startIpcServer()).not.toThrow();
    });
  });
});
