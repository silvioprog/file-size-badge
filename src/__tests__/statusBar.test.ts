import * as vscode from "vscode";
import { formatFileSize, getFileSize } from "../utils";
import { formatLoc, getLineCounts } from "../loc";

jest.mock("../utils");
jest.mock("../loc");

let mockStatusBarItem: {
  text: string;
  tooltip: string;
  show: jest.Mock;
  hide: jest.Mock;
};
let statusBarModule: typeof import("../statusBar");

beforeAll(async () => {
  mockStatusBarItem = {
    text: "",
    tooltip: "",
    show: jest.fn(),
    hide: jest.fn()
  };
  (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(
    mockStatusBarItem
  );
  statusBarModule = await import("../statusBar");
});

describe("statusBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = undefined;
    (
      vscode.window.tabGroups.activeTabGroup as { activeTab?: unknown }
    ).activeTab = undefined;
    mockStatusBarItem.text = "";
    mockStatusBarItem.tooltip = "";
    (getLineCounts as jest.Mock).mockReturnValue(null);
    (formatLoc as jest.Mock).mockReturnValue({
      text: "1 KB",
      tooltip: "1 KB"
    });
  });

  it("should update status bar with file size when active editor has file URI", () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = {
      document: { uri: mockUri }
    };
    (getFileSize as jest.Mock).mockReturnValue(1024);
    (formatFileSize as jest.Mock).mockReturnValue("1 KB");
    (getLineCounts as jest.Mock).mockReturnValue(null);
    (formatLoc as jest.Mock).mockReturnValue({
      text: "1 KB",
      tooltip: "1 KB"
    });

    statusBarModule.updateStatusBar();

    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(getLineCounts).toHaveBeenCalledWith("/path/to/file.txt");
    expect(mockStatusBarItem.text).toBe("$(file) 1 KB");
    expect(mockStatusBarItem.tooltip).toBe("1 KB");
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it("should update status bar with LOC when line counts are available", () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = {
      document: { uri: mockUri }
    };
    (getFileSize as jest.Mock).mockReturnValue(1239);
    (formatFileSize as jest.Mock).mockReturnValue("1.21 KB");
    const lineCounts = { total: 38, loc: 35 };
    (getLineCounts as jest.Mock).mockReturnValue(lineCounts);
    (formatLoc as jest.Mock).mockReturnValue({
      text: "38 lines (35 loc) • 1.21 KB",
      tooltip: "38 lines (35 loc) • 1.21 KB"
    });

    statusBarModule.updateStatusBar();

    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(getLineCounts).toHaveBeenCalledWith("/path/to/file.txt");
    expect(formatLoc).toHaveBeenCalledWith({
      lineCounts,
      formattedFileSize: "1.21 KB"
    });
    expect(mockStatusBarItem.text).toBe("$(file) 38 lines (35 loc) • 1.21 KB");
    expect(mockStatusBarItem.tooltip).toBe("38 lines (35 loc) • 1.21 KB");
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it("should hide status bar when no active editor", () => {
    statusBarModule.updateStatusBar();
    expect(mockStatusBarItem.hide).toHaveBeenCalled();
  });
});
