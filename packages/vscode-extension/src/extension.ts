import * as vscode from "vscode";
import { spawn } from "child_process";
import * as path from "path";
import * as os from "os";

export class ExtensionController {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public activate() {
    // Listen for task end events
    vscode.tasks.onDidEndTaskProcess((event) => {
      if (event.exitCode !== undefined && event.exitCode !== 0) {
        this.triggerNotification();
      }
    });
  }

  public triggerNotification() {
    const config = vscode.workspace.getConfiguration("crashcue");
    const muted = config.get<boolean>("muted");

    if (muted) return;

    // Resolve CLI path
    const isWindows = process.platform === "win32";
    const binName = isWindows ? "crashcue.cmd" : "crashcue";

    // In production (bundled extension), dependencies are in node_modules relative to extension root
    // In development (monorepo), dependencies might be hoisted or linked.
    // We try to resolve relative to extension path first.
    let binPath = path.join(
      this.context.extensionPath,
      "node_modules",
      ".bin",
      binName,
    );

    // If we are in development mode (running from source), we might need to look elsewhere if hoisting happened.
    // However, for the purpose of this task, we assume standard node_modules structure or bundled.
    // Fallback to just 'crashcue' if we can't find it? No, explicit path is safer.

    // Spawn the process detached so it doesn't block extension host
    const child = spawn(binPath, ["notify"], {
      detached: true,
      stdio: "ignore",
      cwd: this.context.extensionPath, // execution context
      windowsHide: true, // Hide window on Windows
    });

    child.unref();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const controller = new ExtensionController(context);
  controller.activate();
}

export function deactivate() {}
