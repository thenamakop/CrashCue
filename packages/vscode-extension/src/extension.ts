import * as vscode from "vscode";
import { spawn } from "child_process";

export class ExtensionController {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public activate() {
    // Listen for task end events
    vscode.tasks.onDidEndTaskProcess((event: vscode.TaskProcessEndEvent) => {
      if (event.exitCode !== undefined && event.exitCode !== 0) {
        this.triggerNotification();
      }
    });
  }

  public triggerNotification() {
    const config = vscode.workspace.getConfiguration("crashcue");
    const muted = config.get<boolean>("muted");

    if (muted) return;

    // Spawn the process detached so it doesn't block extension host
    const child = spawn("crashcue", ["test"], {
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
