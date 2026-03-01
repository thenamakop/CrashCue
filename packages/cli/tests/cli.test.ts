import { CLI } from "../src/cli";
import { Notifier } from "@crashcue/notifier";
import { spawn } from "child_process";
import Conf from "conf";

// Mock Notifier
jest.mock("@crashcue/notifier", () => {
  return {
    Notifier: jest.fn().mockImplementation(() => {
      return {
        notify: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

// Mock spawn
jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

// Mock Conf
const mockConf = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  store: {},
};

jest.mock("conf", () => {
  return jest.fn().mockImplementation(() => mockConf);
});

describe("CrashCue CLI (Windows-Safe)", () => {
  let cli: CLI;
  let mockNotifier: any;
  let mockSpawn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifier = new Notifier();
    mockSpawn = spawn as jest.Mock;

    // Default spawn behavior: success
    mockSpawn.mockReturnValue({
      on: jest.fn((event, cb) => {
        if (event === "close") cb(0);
      }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      unref: jest.fn(),
      kill: jest.fn(),
    });

    // Ensure mockNotifier.notify returns a promise that resolves
    mockNotifier.notify = jest.fn().mockResolvedValue(undefined);

    cli = new CLI();
    // Inject the mocked notifier
    (cli as any).notifier = mockNotifier;
  });

  describe("run command", () => {
    test("should execute command and preserve exit code 0", async () => {
      const exitCode = await cli.run(["echo", "hello"]);
      expect(exitCode).toBe(0);
      expect(mockNotifier.notify).not.toHaveBeenCalled();
    });

    test("should execute command and trigger notifier on failure (exit code 2)", async () => {
      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(2);
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      // Re-instantiate CLI to ensure config is fresh if needed, but mainly to reset spawn behavior
      // However, config mocking is global.

      const exitCode = await cli.run(["false"]);
      expect(exitCode).toBe(2);
      expect(mockNotifier.notify).toHaveBeenCalled();
    });

    test("should support Windows paths with spaces in run", async () => {
      await cli.run(['"C:\\Program Files\\app.exe"']);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining("C:\\Program Files\\app.exe"),
        expect.objectContaining({ shell: true }),
      );
    });

    test("should ignore commands in ignoreCommands list", async () => {
      mockConf.get.mockReturnValue(["git status"]);

      // Even if it fails
      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1);
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      const exitCode = await cli.run(["git", "status"]);
      expect(exitCode).toBe(1);
      expect(mockNotifier.notify).not.toHaveBeenCalled();
    });

    test("should handle spawn error gracefully", async () => {
      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "error") cb(new Error("Spawn error"));
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      // Should return exit code 1 on error and notify if notifyOnFailure is true (default in run)
      const exitCode = await cli.run(["fail-cmd"]);
      expect(exitCode).toBe(1);
      // Error event triggers notify
      expect(mockNotifier.notify).toHaveBeenCalled();
    });
  });

  describe("mute/unmute commands", () => {
    test("mute should set muted config to true", async () => {
      await cli.mute();
      expect(mockConf.set).toHaveBeenCalledWith("muted", true);
    });

    test("unmute should set muted config to false", async () => {
      await cli.unmute();
      expect(mockConf.set).toHaveBeenCalledWith("muted", false);
    });

    test("run should check mute status", async () => {
      mockConf.get.mockReturnValue(true); // muted = true

      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1);
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      await cli.run(["fail"]);
      expect(mockNotifier.notify).not.toHaveBeenCalled();
    });
  });

  describe("config command", () => {
    test("set-sound should update sound config", async () => {
      const newSound = "C:\\custom\\sound.mp3";
      await cli.setSound(newSound);
      expect(mockConf.set).toHaveBeenCalledWith("sound", newSound);
    });
  });

  describe("test command", () => {
    test("test should trigger notifier test mode", async () => {
      await cli.test();
      expect(mockNotifier.notify).toHaveBeenCalledWith(
        expect.objectContaining({ test: true }),
      );
    });
  });
});
