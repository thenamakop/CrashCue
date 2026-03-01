import * as vscode from "vscode";
import { ExtensionController, activate, deactivate } from "../src/extension";
import { spawn } from "child_process";

// Mock VSCode
const mockOnDidEndTaskProcess = jest.fn();
const mockGetConfiguration = jest.fn();

jest.mock(
  "vscode",
  () => ({
    tasks: {
      onDidEndTaskProcess: (cb: any) => mockOnDidEndTaskProcess(cb),
    },
    workspace: {
      getConfiguration: (section: string) => ({
        get: (key: string) => mockGetConfiguration(section, key),
      }),
    },
    window: {
      onDidCloseTerminal: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

describe("VSCode Extension", () => {
  let context: any;
  let controller: ExtensionController;

  beforeEach(() => {
    jest.clearAllMocks();
    context = {
      subscriptions: [],
      extensionPath: "/mock/path/to/extension",
    };
    controller = new ExtensionController(context);

    // Mock default config
    mockGetConfiguration.mockImplementation((section, key) => {
      if (section === "crashcue") {
        if (key === "muted") return false;
        if (key === "soundPath") return "default";
      }
      return undefined;
    });

    // Mock spawn
    (spawn as jest.Mock).mockReturnValue({
      unref: jest.fn(),
      on: jest.fn(),
    });
  });

  test("should register task end event listener on activate", () => {
    controller.activate();
    expect(mockOnDidEndTaskProcess).toHaveBeenCalled();
  });

  test("should trigger notification when task exits with non-zero code", () => {
    controller.activate();

    // Simulate event callback
    const callback = mockOnDidEndTaskProcess.mock.calls[0][0];
    callback({ exitCode: 1 }); // Failure

    expect(spawn).toHaveBeenCalled();
  });

  test("should NOT trigger notification when task exits with zero code", () => {
    controller.activate();

    const callback = mockOnDidEndTaskProcess.mock.calls[0][0];
    callback({ exitCode: 0 }); // Success

    expect(spawn).not.toHaveBeenCalled();
  });

  test("should respect muted setting", () => {
    mockGetConfiguration.mockImplementation((section, key) => {
      if (key === "muted") return true;
      return undefined;
    });

    controller.activate();
    const callback = mockOnDidEndTaskProcess.mock.calls[0][0];
    callback({ exitCode: 1 });

    expect(spawn).not.toHaveBeenCalled();
  });

  test("should use correct command on Windows", () => {
    Object.defineProperty(process, "platform", {
      value: "win32",
    });

    controller.activate();
    const callback = mockOnDidEndTaskProcess.mock.calls[0][0];
    callback({ exitCode: 1 });

    expect(spawn).toHaveBeenCalledWith(
      expect.stringMatching(/crashcue(\.cmd)?$/),
      expect.arrayContaining(["notify"]),
      expect.any(Object),
    );
  });

  test("should use correct command on Linux/Mac", () => {
    Object.defineProperty(process, "platform", {
      value: "linux",
    });

    controller.activate();
    const callback = mockOnDidEndTaskProcess.mock.calls[0][0];
    callback({ exitCode: 1 });

    expect(spawn).toHaveBeenCalledWith(
      expect.stringMatching(/crashcue$/),
      expect.arrayContaining(["notify"]),
      expect.any(Object),
    );
  });

  test("should handle extension activation", () => {
    activate(context);
    // Check if listener was registered
    expect(mockOnDidEndTaskProcess).toHaveBeenCalled();
  });

  test("should handle extension deactivation", () => {
    // Just ensure it doesn't crash
    expect(() => deactivate()).not.toThrow();
  });
});
