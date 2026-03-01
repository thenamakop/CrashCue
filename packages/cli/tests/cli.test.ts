import { CLI } from "../src/cli";
import { Notifier } from "@crashcue/notifier";
import { spawn } from "child_process";
import Conf from "conf";

// Hoist mocks to ensure they are available
jest.mock("@crashcue/notifier");
jest.mock("child_process");
jest.mock("conf");

describe("CrashCue CLI (Windows-Safe)", () => {
  let cli: CLI;
  let mockNotifier: any;
  let mockSpawn: jest.Mock;
  let mockConf: any;

  beforeEach(() => {
    // Implement mocks afresh for each test to handle resetMocks: true
    (Notifier as unknown as jest.Mock).mockImplementation(() => ({
      notify: jest.fn().mockResolvedValue(undefined),
    }));

    (spawn as unknown as jest.Mock).mockReturnValue({
      on: jest.fn((event, cb) => {
        if (event === "close") cb(0);
      }),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      unref: jest.fn(),
      kill: jest.fn(),
    });

    (Conf as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      store: {},
    }));

    cli = new CLI();

    // Access the mocked dependencies
    mockNotifier = (cli as any).notifier;
    mockConf = (cli as any).config;
    mockSpawn = spawn as unknown as jest.Mock;
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
      mockConf.get.mockReturnValue(false); // Ensure muted is false

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

    test("should handle rapid repeated failures", async () => {
      // Simulate rapid failures
      const promises = [];

      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1);
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      for (let i = 0; i < 5; i++) {
        promises.push(cli.run(["false"]));
      }

      await Promise.all(promises);
      expect(mockNotifier.notify).toHaveBeenCalledTimes(5);
    });

    test("should handle complex command strings on Windows", async () => {
      const complexCmd = 'echo "hello world" && exit 1';
      await cli.run([complexCmd]);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining(complexCmd),
        expect.objectContaining({ shell: true }),
      );
    });

    test("should log error if notifier fails", async () => {
      mockNotifier.notify.mockRejectedValue(new Error("Notify failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

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

      // Wait for promise resolution chain in the background
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        "CrashCue error:",
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    test("should handle signal kill (null exit code)", async () => {
      mockSpawn.mockReturnValue({
        on: jest.fn((event, cb) => {
          if (event === "close") cb(null);
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        unref: jest.fn(),
        kill: jest.fn(),
      });

      const exitCode = await cli.run(["kill-me"]);
      expect(exitCode).toBe(1);
    });

    test("should handle undefined ignoreCommands config", async () => {
      mockConf.get.mockReturnValue(undefined);
      const exitCode = await cli.run(["echo", "hello"]);
      expect(exitCode).toBe(0);
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
