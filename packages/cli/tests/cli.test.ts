import { CLI } from "../src/cli";
import { Notifier } from "@crashcue/notifier";
import { spawn, execSync } from "child_process";
import Conf from "conf";
import fs from "fs";
import path from "path";

// Hoist mocks to ensure they are available
jest.mock("@crashcue/notifier");
jest.mock("child_process");
jest.mock("conf");
jest.mock("fs");

describe("CrashCue CLI (Windows-Safe)", () => {
  let cli: CLI;
  let mockNotifier: any;
  let mockSpawn: jest.Mock;
  let mockExecSync: jest.Mock;
  let mockConf: any;

  beforeEach(() => {
    jest.clearAllMocks();

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

    (execSync as unknown as jest.Mock).mockImplementation((cmd: string) => {
      if (cmd.includes("reg query")) return "AutoRun REG_SZ native-windows.ps1";
      if (cmd.includes("pwsh")) return "C:\\mock\\profile.ps1";
      return "";
    });

    (Conf as unknown as jest.Mock).mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      store: {},
      path: "C:\\mock\\config.json",
    }));

    // Mock FS default behavior
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("<crashcue-start>");

    cli = new CLI();

    // Access the mocked dependencies
    mockNotifier = (cli as any).notifier;
    mockConf = (cli as any).config;
    mockSpawn = spawn as unknown as jest.Mock;
    mockExecSync = execSync as unknown as jest.Mock;
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
      // Mock win32 for this test to ensure win32 quoting if applicable
      Object.defineProperty(process, "platform", { value: "win32" });

      const cmd = '"C:\\Program Files\\app.exe"';
      await cli.run([cmd]);
      expect(mockSpawn).toHaveBeenCalledWith(
        cmd,
        [],
        expect.objectContaining({ shell: true }),
      );
    });

    test("should quote arguments correctly on Windows", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const args = ["echo", "hello world", ""];
      await cli.run(args);
      expect(mockSpawn).toHaveBeenCalledWith(
        "echo",
        ['"hello world"', '""'],
        expect.objectContaining({ shell: true }),
      );
    });

    test("should quote arguments correctly on Unix", async () => {
      Object.defineProperty(process, "platform", { value: "linux" });
      const args = ["echo", "hello world", "don't", ""];
      await cli.run(args);
      expect(mockSpawn).toHaveBeenCalledWith(
        "echo",
        ["'hello world'", "'don'\\''t'", "''"],
        expect.objectContaining({ shell: true }),
      );
    });

    test("should ignore commands in ignoreCommands list", async () => {
      mockConf.get.mockReturnValue(["git status"]);

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

      const exitCode = await cli.run(["fail-cmd"]);
      expect(exitCode).toBe(1);
      expect(mockNotifier.notify).toHaveBeenCalled();
    });

    test("should handle rapid repeated failures", async () => {
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
      Object.defineProperty(process, "platform", {
        value: "win32",
      });

      const complexCmd = ["node", "-e", 'console.log("hello world")'];
      await cli.run(complexCmd);
      expect(mockSpawn).toHaveBeenCalledWith(
        "node",
        expect.arrayContaining(['"-e"', '"console.log(\\"hello world\\")"']),
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
      Object.defineProperty(process, "platform", { value: "linux" });
      const newSound = "C:\\custom\\sound.mp3";
      await cli.setSound(newSound);
      expect(mockConf.set).toHaveBeenCalledWith("sound", expect.any(String));
    });

    test("set-sound should enforce .wav on Windows", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await cli.setSound("C:\\sound.mp3");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("only .wav files are supported"),
      );
      expect(mockConf.set).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("set-sound should validate file existence", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await cli.setSound("missing.wav");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("File not found"),
      );
      expect(mockConf.set).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("get-sound should print current sound", async () => {
      mockConf.get.mockReturnValue("C:\\sound.wav");
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await cli.getSound();
      expect(consoleSpy).toHaveBeenCalledWith("C:\\sound.wav");

      consoleSpy.mockRestore();
    });

    test("get-sound should print default if none set", async () => {
      mockConf.get.mockReturnValue(undefined);
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await cli.getSound();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Default sound"),
      );

      consoleSpy.mockRestore();
    });

    test("reset should clear config", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      await cli.resetConfig();
      expect(mockConf.clear).toHaveBeenCalled();
      consoleSpy.mockRestore();
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

  describe("Management Commands", () => {
    test("install should run install-all-shells.js", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      await cli.install();
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("install-all-shells.js"),
        expect.anything(),
      );
      consoleSpy.mockRestore();
    });

    test("install should abort if package not found", async () => {
      jest.spyOn(cli as any, "getNotifierPackagePath").mockReturnValue("");
      await cli.install();
      expect(mockExecSync).not.toHaveBeenCalled();
    });

    test("install should handle failure gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("Install failed");
      });
      await cli.install();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Installation failed"),
      );
      consoleSpy.mockRestore();
      logSpy.mockRestore();
    });

    test("uninstall should run uninstall-all-shells.js", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      await cli.uninstall();
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("uninstall-all-shells.js"),
        expect.anything(),
      );
      consoleSpy.mockRestore();
    });

    test("uninstall should abort if package not found", async () => {
      jest.spyOn(cli as any, "getNotifierPackagePath").mockReturnValue("");
      await cli.uninstall();
      expect(mockExecSync).not.toHaveBeenCalled();
    });

    test("uninstall should handle failure gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("Uninstall failed");
      });
      await cli.uninstall();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Uninstallation failed"),
      );
      consoleSpy.mockRestore();
      logSpy.mockRestore();
    });

    test("status should display configuration and run doctor", async () => {
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const doctorSpy = jest
        .spyOn(cli, "doctor")
        .mockImplementation(async () => {});

      await cli.status();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("CrashCue Status"),
      );
      expect(doctorSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test("doctor should check integrations on Windows (Success path)", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      // Mock sound config existence
      mockConf.get.mockReturnValue("C:\\sound.wav");

      await cli.doctor();

      // Should check native script
      expect(fs.existsSync).toHaveBeenCalledWith(
        expect.stringContaining("native-windows.ps1"),
      );

      // Should check PS profile
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("pwsh"),
        expect.anything(),
      );

      // Should check CMD registry
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("reg query"),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });

    test("doctor should handle missing components (Failure path)", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      // Mock missing components
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes("pwsh")) throw new Error("pwsh not found");
        if (cmd.includes("reg query")) throw new Error("reg not found");
        return "";
      });

      await cli.doctor();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Native Windows Script MISSING"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("PowerShell 7 not detected"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("CMD AutoRun integration MISSING"),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Git Bash .bashrc not found"),
      );

      consoleSpy.mockRestore();
    });

    test("doctor should skip native check if package not found", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      jest.spyOn(cli as any, "getNotifierPackagePath").mockReturnValue("");

      await cli.doctor();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Native Windows Script"),
      );

      consoleSpy.mockRestore();
    });

    test("doctor should report missing profile content", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // Profile exists but empty
      (fs.readFileSync as jest.Mock).mockReturnValue("");

      await cli.doctor();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("PowerShell 7 Profile integration MISSING"),
      );

      consoleSpy.mockRestore();
    });

    test("doctor should handle exceptions in checks", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      // Force FS error for Git Bash check
      (fs.existsSync as jest.Mock).mockImplementation((p) => {
        if (typeof p === "string" && p.includes(".bashrc")) {
          throw new Error("FS Error");
        }
        return true;
      });

      await cli.doctor();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Git Bash check failed"),
      );

      consoleSpy.mockRestore();
    });

    test("doctor should handle package resolution failure", async () => {
      Object.defineProperty(process, "platform", { value: "win32" });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      jest.spyOn(cli as any, "getNotifierPackagePath").mockReturnValue("");

      await cli.doctor();

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
