import * as vscode from "vscode";
import { formatFileSize, getFileSize } from "./utils";
import { formatLoc, getLineCounts } from "./loc";

vi.mock("./utils");
vi.mock("./loc");

let mockStatusBarItem: {
  text: string;
  tooltip: string;
  show: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
};
let statusBarModule: typeof import("./statusBar");

beforeAll(async () => {
  mockStatusBarItem = {
    text: "",
    tooltip: "",
    show: vi.fn(),
    hide: vi.fn()
  };
  vi.mocked(vscode.window.createStatusBarItem).mockReturnValue(
    mockStatusBarItem as unknown as vscode.StatusBarItem
  );
  statusBarModule = await import("./statusBar");
});

describe("statusBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = undefined;
    (
      vscode.window.tabGroups.activeTabGroup as { activeTab?: unknown }
    ).activeTab = undefined;
    mockStatusBarItem.text = "";
    mockStatusBarItem.tooltip = "";
    vi.mocked(getLineCounts).mockResolvedValue(null);
    vi.mocked(formatLoc).mockReturnValue({
      text: "1 KB",
      tooltip: "1 KB"
    });
  });

  it("should update status bar with file size when active editor has file URI", async () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = {
      document: { uri: mockUri }
    };
    vi.mocked(getFileSize).mockResolvedValue(1024);
    vi.mocked(formatFileSize).mockReturnValue("1 KB");
    vi.mocked(getLineCounts).mockResolvedValue(null);
    vi.mocked(formatLoc).mockReturnValue({
      text: "1 KB",
      tooltip: "1 KB"
    });

    await statusBarModule.updateStatusBar();

    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(getLineCounts).toHaveBeenCalledWith("/path/to/file.txt");
    expect(mockStatusBarItem.text).toBe("$(file) 1 KB");
    expect(mockStatusBarItem.tooltip).toBe("1 KB");
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it("should update status bar with LOC when line counts are available", async () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    (
      vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }
    ).activeTextEditor = {
      document: { uri: mockUri }
    };
    vi.mocked(getFileSize).mockResolvedValue(1239);
    vi.mocked(formatFileSize).mockReturnValue("1.21 KB");
    const lineCounts = { total: 38, loc: 35 };
    vi.mocked(getLineCounts).mockResolvedValue(lineCounts);
    vi.mocked(formatLoc).mockReturnValue({
      text: "38 lines (35 loc) \u2022 1.21 KB",
      tooltip: "38 lines (35 loc) \u2022 1.21 KB"
    });

    await statusBarModule.updateStatusBar();

    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(getLineCounts).toHaveBeenCalledWith("/path/to/file.txt");
    expect(formatLoc).toHaveBeenCalledWith({
      lineCounts,
      formattedFileSize: "1.21 KB"
    });
    expect(mockStatusBarItem.text).toBe(
      "$(file) 38 lines (35 loc) \u2022 1.21 KB"
    );
    expect(mockStatusBarItem.tooltip).toBe("38 lines (35 loc) \u2022 1.21 KB");
    expect(mockStatusBarItem.show).toHaveBeenCalled();
  });

  it("should hide status bar when no active editor", async () => {
    await statusBarModule.updateStatusBar();
    expect(mockStatusBarItem.hide).toHaveBeenCalled();
  });
});
