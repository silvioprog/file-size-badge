import * as vscode from "vscode";
import { getFileSize, formatFileSize } from "../utils";
import { getLineCounts, formatLoc } from "../loc";

jest.mock("../utils");
jest.mock("../loc");
jest.mock("../provider", () => ({ provider: { dispose: jest.fn() } }));
jest.mock("../eventEmitter", () => ({
  eventEmitter: { dispose: jest.fn() },
  updateDecorations: jest.fn()
}));
jest.mock("../fileWatcher", () => ({ fileWatcher: { dispose: jest.fn() } }));
jest.mock("../cache", () => ({
  clearAll: jest.fn(),
  createCache: jest.fn(() => ({
    get: jest.fn(() => undefined),
    set: jest.fn()
  }))
}));
jest.mock("../statusBar", () => ({
  statusBar: { dispose: jest.fn() },
  updateStatusBar: jest.fn(),
  updateStatusBarOnChangeActiveTextEditor: { dispose: jest.fn() },
  updateStatusBarOnChangeTabs: { dispose: jest.fn() },
  updateStatusBarOnSaveTextDocument: { dispose: jest.fn() },
  updateStatusBarOnChangeConfiguration: { dispose: jest.fn() }
}));

let copyFileSizeHandler: (uri?: vscode.Uri) => Promise<void>;
let subscriptions: { dispose: () => void }[];

beforeAll(async () => {
  const mod = await import("../extension");
  subscriptions = [];
  const mockContext = {
    subscriptions
  } as unknown as vscode.ExtensionContext;
  mod.activate(mockContext);

  copyFileSizeHandler = (
    vscode.commands.registerCommand as jest.Mock
  ).mock.calls.find(
    ([name]: [string]) => name === "fileSizeBadge.copyFileSize"
  )?.[1];
});

describe("activate", () => {
  it("should track all disposables in subscriptions", () => {
    expect(subscriptions.length).toBe(16);
    expect(subscriptions.every((s) => typeof s.dispose === "function")).toBe(
      true
    );
  });
});

describe("copyFileSize command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = undefined;
  });

  it("should be registered", () => {
    expect(copyFileSizeHandler).toBeDefined();
  });

  it("should copy file size to clipboard", async () => {
    const uri = vscode.Uri.file("/path/to/file.txt");
    (getFileSize as jest.Mock).mockResolvedValue(1239);
    (formatFileSize as jest.Mock).mockReturnValue("1.21 KB");
    (getLineCounts as jest.Mock).mockResolvedValue({ total: 38, loc: 35 });
    (formatLoc as jest.Mock).mockReturnValue({
      text: "38 lines (35 loc) \u2022 1.21 KB",
      tooltip: "38 lines (35 loc) \u2022 1.21 KB"
    });

    await copyFileSizeHandler(uri);

    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith(
      "38 lines (35 loc) \u2022 1.21 KB"
    );
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      "Copied: 38 lines (35 loc) \u2022 1.21 KB"
    );
  });

  it("should do nothing when fileSize is null", async () => {
    const uri = vscode.Uri.file("/path/to/directory");
    (getFileSize as jest.Mock).mockResolvedValue(null);

    await copyFileSizeHandler(uri);

    expect(vscode.env.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("should use active editor when no URI provided", async () => {
    const mockUri = vscode.Uri.file("/path/to/active.txt");
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = { document: { uri: mockUri } };
    (getFileSize as jest.Mock).mockResolvedValue(512);
    (formatFileSize as jest.Mock).mockReturnValue("512 B");
    (getLineCounts as jest.Mock).mockResolvedValue(null);
    (formatLoc as jest.Mock).mockReturnValue({
      text: "512 B",
      tooltip: "512 B"
    });

    await copyFileSizeHandler();

    expect(getFileSize).toHaveBeenCalledWith("/path/to/active.txt");
    expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith("512 B");
  });

  it("should do nothing when no URI and no active editor", async () => {
    await copyFileSizeHandler();

    expect(getFileSize).not.toHaveBeenCalled();
    expect(vscode.env.clipboard.writeText).not.toHaveBeenCalled();
  });
});
