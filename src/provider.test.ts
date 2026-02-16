import * as vscode from "vscode";
import { getFileSize, formatFileSize, formatBadgeFileSize } from "./utils";
import { getLineCounts, formatLoc } from "./loc";
import { shouldExclude } from "./fileWatcher";

vi.mock("./utils");
vi.mock("./loc");
vi.mock("./fileWatcher");
vi.mock("./eventEmitter");

let provideFileDecoration: (
  uri: vscode.Uri,
  token: vscode.CancellationToken
) => Promise<{ badge: string; tooltip: string } | undefined>;

beforeAll(async () => {
  await import("./provider");
  provideFileDecoration = vi.mocked(
    vscode.window.registerFileDecorationProvider
  ).mock.calls[0][0].provideFileDecoration;
});

const createToken = (cancelled = false) =>
  ({
    isCancellationRequested: cancelled,
    onCancellationRequested: vi.fn()
  }) as unknown as vscode.CancellationToken;

describe("provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shouldExclude).mockReturnValue(false);
  });

  it("should register file decoration provider", () => {
    expect(provideFileDecoration).toBeDefined();
  });

  it("should return badge and tooltip for a normal file", async () => {
    const uri = vscode.Uri.file("/path/to/file.txt");
    vi.mocked(getFileSize).mockResolvedValue(1239);
    vi.mocked(formatBadgeFileSize).mockReturnValue("1K");
    vi.mocked(formatFileSize).mockReturnValue("1.21 KB");
    vi.mocked(getLineCounts).mockResolvedValue({ total: 38, loc: 35 });
    vi.mocked(formatLoc).mockReturnValue({
      text: "38 lines (35 loc) \u2022 1.21 KB",
      tooltip: "38 lines (35 loc) \u2022 1.21 KB"
    });

    const result = await provideFileDecoration(uri, createToken());

    expect(result).toEqual({
      badge: "1K",
      tooltip: "38 lines (35 loc) \u2022 1.21 KB"
    });
    expect(getFileSize).toHaveBeenCalledWith("/path/to/file.txt");
    expect(getLineCounts).toHaveBeenCalledWith("/path/to/file.txt", {
      fileSize: 1239,
      token: expect.objectContaining({ isCancellationRequested: false })
    });
    expect(formatLoc).toHaveBeenCalledWith({
      lineCounts: { total: 38, loc: 35 },
      formattedFileSize: "1.21 KB"
    });
  });

  it("should return undefined for non-file scheme", async () => {
    const uri = { scheme: "git", fsPath: "/path/to/file.txt" } as vscode.Uri;

    const result = await provideFileDecoration(uri, createToken());

    expect(result).toBeUndefined();
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it("should return undefined for excluded files", async () => {
    const uri = vscode.Uri.file("/project/node_modules/package.json");
    vi.mocked(shouldExclude).mockReturnValue(true);

    const result = await provideFileDecoration(uri, createToken());

    expect(result).toBeUndefined();
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it("should return undefined when token is already cancelled", async () => {
    const uri = vscode.Uri.file("/path/to/file.txt");

    const result = await provideFileDecoration(uri, createToken(true));

    expect(result).toBeUndefined();
    expect(getFileSize).not.toHaveBeenCalled();
  });

  it("should return undefined when cancelled after getFileSize", async () => {
    const uri = vscode.Uri.file("/path/to/file.txt");
    let cancelled = false;
    const token = {
      get isCancellationRequested() {
        return cancelled;
      },
      onCancellationRequested: vi.fn()
    } as unknown as vscode.CancellationToken;

    vi.mocked(getFileSize).mockImplementation(async () => {
      cancelled = true;
      return 1024;
    });

    const result = await provideFileDecoration(uri, token);

    expect(result).toBeUndefined();
    expect(getLineCounts).not.toHaveBeenCalled();
  });

  it("should return undefined when cancelled after getLineCounts", async () => {
    const uri = vscode.Uri.file("/path/to/file.txt");
    let cancelled = false;
    const token = {
      get isCancellationRequested() {
        return cancelled;
      },
      onCancellationRequested: vi.fn()
    } as unknown as vscode.CancellationToken;

    vi.mocked(getFileSize).mockResolvedValue(1024);
    vi.mocked(getLineCounts).mockImplementation(async () => {
      cancelled = true;
      return { total: 10, loc: 8 };
    });

    const result = await provideFileDecoration(uri, token);

    expect(result).toBeUndefined();
  });

  it("should return undefined when fileSize is null", async () => {
    const uri = vscode.Uri.file("/path/to/directory");
    vi.mocked(getFileSize).mockResolvedValue(null);

    const result = await provideFileDecoration(uri, createToken());

    expect(result).toBeUndefined();
    expect(getLineCounts).not.toHaveBeenCalled();
  });

  it("should return badge and tooltip when lineCounts is null", async () => {
    const uri = vscode.Uri.file("/path/to/image.png");
    vi.mocked(getFileSize).mockResolvedValue(2048);
    vi.mocked(formatBadgeFileSize).mockReturnValue("2K");
    vi.mocked(formatFileSize).mockReturnValue("2 KB");
    vi.mocked(getLineCounts).mockResolvedValue(null);
    vi.mocked(formatLoc).mockReturnValue({
      text: "2 KB",
      tooltip: "2 KB"
    });

    const result = await provideFileDecoration(uri, createToken());

    expect(result).toEqual({
      badge: "2K",
      tooltip: "2 KB"
    });
    expect(formatLoc).toHaveBeenCalledWith({
      lineCounts: null,
      formattedFileSize: "2 KB"
    });
  });
});
