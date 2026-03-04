declare module "vscode" {
  export interface ExtensionContext {
    extensionPath: string;
  }

  export interface TaskProcessEndEvent {
    exitCode?: number;
  }

  export const tasks: {
    onDidEndTaskProcess: (
      listener: (event: TaskProcessEndEvent) => void,
    ) => unknown;
  };

  export const workspace: {
    getConfiguration: (section?: string) => {
      get: <T>(key: string) => T | undefined;
      update: (...args: any[]) => unknown;
    };
    onDidChangeConfiguration: (...args: any[]) => unknown;
  };

  export const window: any;
  export const commands: any;
  export const Uri: any;
  export const Range: any;
  export const Position: any;
  export const Location: any;
}
