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

    test("should use PowerShell SoundPlayer for .wav files on Windows", async () => {
      const wavPath = "C:\\path\\to\\sound.wav";
      await notifier.notify({ sound: wavPath });

      // Escaped single quotes: ' -> ''
      // Our test path has no quotes, so it's just the path
      const expectedCommand = `(New-Object System.Media.SoundPlayer '${wavPath}').PlaySync();`;

      expect(spawn).toHaveBeenCalledWith(
        "powershell.exe",
        ["-NoProfile", "-Command", expectedCommand],
        expect.objectContaining({
          windowsHide: true,
          stdio: "ignore",
        }),
      );
    });

    test("should escape single quotes in path for PowerShell", async () => {
      const wavPath = "C:\\path\\to\\can't stop.wav";
      await notifier.notify({ sound: wavPath });

      // Expected escape: can't -> can''t
      const expectedPath = "C:\\path\\to\\can''t stop.wav";
      const expectedCommand = `(New-Object System.Media.SoundPlayer '${expectedPath}').PlaySync();`;

      expect(spawn).toHaveBeenCalledWith(
        "powershell.exe",
        ["-NoProfile", "-Command", expectedCommand],
        expect.anything(),
      );
    });

    test("should throw error for .mp3 files on Windows", async () => {
      const mp3Path = "C:\\path\\to\\sound.mp3";
      await expect(notifier.notify({ sound: mp3Path })).rejects.toThrow(
        "On Windows, CrashCue supports .wav files only.",
      );

      expect(mockPlay).not.toHaveBeenCalled();
      expect(spawn).not.toHaveBeenCalled();
    });

    test("should throw error for unknown extensions on Windows", async () => {
      const unknownPath = "C:\\path\\to\\sound.unknown";
      await expect(notifier.notify({ sound: unknownPath })).rejects.toThrow(
        "On Windows, CrashCue supports .wav files only.",
      );
    });

    test("should fallback to DEFAULT_SOUND_PATH if invalid path provided", async () => {
      const invalidPath = "C:\\invalid\\path.wav";
      // Mock fs.existsSync to return false for invalidPath and true for DEFAULT_SOUND_PATH
      jest.spyOn(fs, "existsSync").mockImplementation((p) => {
        if (p === invalidPath) return false;
        return true; // Assume others exist
      });
      jest.spyOn(fs, "statSync").mockImplementation((p) => {
        return { isFile: () => true } as fs.Stats;
      });

      await notifier.notify({ sound: invalidPath });

      // Should play default sound
      // DEFAULT_SOUND_PATH is now .wav, so it should use PowerShell
      const expectedCommand = `(New-Object System.Media.SoundPlayer '${DEFAULT_SOUND_PATH.replace(/'/g, "''")}').PlaySync();`;

      expect(spawn).toHaveBeenCalledWith(
        "powershell.exe",
        ["-NoProfile", "-Command", expectedCommand],
        expect.anything(),
      );
    });

    test("should reject if PowerShell SoundPlayer fails", async () => {
      // Mock spawn to fail
      (spawn as jest.Mock).mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1); // Exit code 1
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
      });

      const wavPath = "C:\\path\\to\\sound.wav";
      await expect(notifier.notify({ sound: wavPath })).rejects.toThrow(
        "PowerShell exited with code 1",
      );
    });

    test("should reject if PowerShell spawn errors", async () => {
      // Mock spawn to error
      (spawn as jest.Mock).mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "error") cb(new Error("Spawn failed"));
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
      });

      const wavPath = "C:\\path\\to\\sound.wav";
      await expect(notifier.notify({ sound: wavPath })).rejects.toThrow(
        "Spawn failed",
      );
    });

    test("--test flag should use default asset", async () => {
      await notifier.notify({ test: true });
      // DEFAULT_SOUND_PATH is .wav, so PowerShell
      expect(spawn).toHaveBeenCalled();
    });

    test("should start IPC server on Windows", () => {
      // Just ensure it doesn't crash, as it's a stub
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
