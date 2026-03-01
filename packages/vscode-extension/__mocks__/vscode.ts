export const window = {
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn(),
  })),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
};

export const tasks = {
  onDidEndTaskProcess: jest.fn(),
};

export const commands = {
  registerCommand: jest.fn(),
};

export const ExtensionContext = jest.fn();

export const Uri = {
  file: jest.fn(),
  parse: jest.fn(),
};

export const Range = jest.fn();
export const Position = jest.fn();
export const Location = jest.fn();
