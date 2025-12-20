export const window = {
  activeTextEditor: undefined as { document: { uri: Uri } } | undefined,
  tabGroups: {
    activeTabGroup: {
      activeTab: undefined as unknown
    },
    onDidChangeTabs: jest.fn(() => ({
      dispose: jest.fn()
    }))
  },
  createStatusBarItem: jest.fn(() => ({
    text: "",
    tooltip: "",
    show: jest.fn(),
    hide: jest.fn()
  })),
  registerFileDecorationProvider: jest.fn(() => ({
    dispose: jest.fn()
  })),
  onDidChangeActiveTextEditor: jest.fn(() => ({
    dispose: jest.fn()
  }))
};

export const workspace = {
  createFileSystemWatcher: jest.fn(() => ({
    onDidCreate: jest.fn(),
    onDidDelete: jest.fn(),
    onDidChange: jest.fn(),
    dispose: jest.fn()
  })),
  getConfiguration: jest.fn((section?: string) => ({
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (section === "fileSizeBadge") {
        if (key === "excludedDirectories") {
          return defaultValue || [".git", "build", "dist", "node_modules"];
        }
      }
      if (section === "fileSizeBadge.statusBar") {
        if (key === "alignment") {
          return defaultValue !== undefined ? defaultValue : "Left";
        }
        if (key === "priority") {
          return defaultValue !== undefined ? defaultValue : null;
        }
      }
      return defaultValue;
    })
  })),
  onDidSaveTextDocument: jest.fn(() => ({
    dispose: jest.fn()
  })),
  onDidChangeConfiguration: jest.fn(() => ({
    dispose: jest.fn()
  }))
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

export class Uri {
  constructor(
    public scheme: string,
    public fsPath: string
  ) {}
  static file(path: string) {
    return new Uri("file", path);
  }
}

export class EventEmitter<T> {
  private listeners: Array<(data: T) => void> = [];

  event = (listener: (data: T) => void) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
    };
  };

  fire(data: T) {
    this.listeners.forEach((listener) => listener(data));
  }

  dispose() {
    this.listeners = [];
  }
}

export class TabInputText {
  constructor(public uri: { scheme: string; fsPath: string }) {}
}

export class TabInputTextDiff {
  constructor(
    public modified: { scheme: string; fsPath: string },
    public original: { scheme: string; fsPath: string }
  ) {}
}

export class TabInputNotebook {
  constructor(
    public uri: { scheme: string; fsPath: string },
    public notebookType: string = "jupyter"
  ) {}
}

export default {
  window,
  workspace,
  StatusBarAlignment,
  Uri,
  EventEmitter,
  TabInputText,
  TabInputTextDiff,
  TabInputNotebook
};
