import { vi } from "vitest";

export const window = {
  activeTextEditor: undefined as { document: { uri: Uri } } | undefined,
  tabGroups: {
    activeTabGroup: {
      activeTab: undefined as unknown
    },
    onDidChangeTabs: vi.fn(() => ({
      dispose: vi.fn()
    }))
  },
  createStatusBarItem: vi.fn(() => ({
    text: "",
    tooltip: "",
    show: vi.fn(),
    hide: vi.fn()
  })),
  registerFileDecorationProvider: vi.fn(() => ({
    dispose: vi.fn()
  })),
  onDidChangeActiveTextEditor: vi.fn(() => ({
    dispose: vi.fn()
  }))
};

export const workspace = {
  createFileSystemWatcher: vi.fn(() => ({
    onDidCreate: vi.fn(),
    onDidDelete: vi.fn(),
    onDidChange: vi.fn(),
    dispose: vi.fn()
  })),
  getConfiguration: vi.fn((section?: string) => ({
    get: vi.fn((key: string, defaultValue?: unknown) => {
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
      if (section === "fileSizeBadge.loc") {
        if (key === "showInTooltips") {
          return defaultValue !== undefined ? defaultValue : true;
        }
        if (key === "showInStatusBar") {
          return defaultValue !== undefined ? defaultValue : true;
        }
      }

      return defaultValue;
    })
  })),
  textDocuments: [],
  onDidSaveTextDocument: vi.fn(() => ({
    dispose: vi.fn()
  })),
  onDidChangeConfiguration: vi.fn(() => ({
    dispose: vi.fn()
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
  toString() {
    return `${this.scheme}://${this.fsPath}`;
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
