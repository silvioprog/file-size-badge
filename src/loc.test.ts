import { readFile } from "fs/promises";
import * as vscode from "vscode";
import { isBinaryFile } from "isbinaryfile";
import { formatLoc, getLineCounts } from "./loc";

vi.mock("fs/promises", () => ({
  readFile: vi.fn()
}));
vi.mock("isbinaryfile", () => ({
  isBinaryFile: vi.fn()
}));

describe("loc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isBinaryFile).mockResolvedValue(false);
    vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
      (section?: string) => {
        if (section === "fileSizeBadge.loc") {
          return {
            get: vi.fn((key: string, defaultValue?: unknown) => {
              if (key === "showInTooltips") return defaultValue ?? true;
              if (key === "showInStatusBar") return defaultValue ?? true;
              return defaultValue;
            })
          } as unknown as vscode.WorkspaceConfiguration;
        }

        return {
          get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue)
        } as unknown as vscode.WorkspaceConfiguration;
      }
    );
  });

  describe("getLineCounts", () => {
    it("should return line counts for a valid file", async () => {
      const content = "line 1\nline 2\nline 3";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 3, loc: 3 });
      expect(readFile).toHaveBeenCalledWith("/path/to/file.txt", "utf8");
    });

    it("should exclude blank lines from LOC count", async () => {
      const content = "line 1\n\nline 2\n  \nline 3";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 5, loc: 3 });
    });

    it("should handle files with only blank lines", async () => {
      const content = "\n\n  \n\t\n";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 5, loc: 0 });
    });

    it("should handle empty files", async () => {
      const content = "";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 1, loc: 0 });
    });

    it("should handle files with Windows line endings (CRLF)", async () => {
      const content = "line 1\r\nline 2\r\nline 3";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 3, loc: 3 });
    });

    it("should handle files with mixed line endings", async () => {
      const content = "line 1\nline 2\r\nline 3\n";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 4, loc: 3 });
    });

    it("should return null when file does not exist", async () => {
      vi.mocked(readFile).mockRejectedValue(new Error("File not found"));

      const result = await getLineCounts("/path/to/nonexistent.txt");
      expect(result).toBeNull();
    });

    it("should return null when readFile throws any error", async () => {
      vi.mocked(readFile).mockRejectedValue(new Error("Permission denied"));

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toBeNull();
    });

    it("should handle files with trailing newline", async () => {
      const content = "line 1\nline 2\nline 3\n";
      vi.mocked(readFile).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 4, loc: 3 });
    });

    it("should return null for binary files", async () => {
      vi.mocked(isBinaryFile).mockResolvedValue(true);

      const result = await getLineCounts("/path/to/image.png");
      expect(result).toBeNull();
      expect(readFile).not.toHaveBeenCalled();
    });
  });

  describe("formatLoc", () => {
    it("should return both text and tooltip with LOC when enabled and lineCounts available", () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: vi.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            } as unknown as vscode.WorkspaceConfiguration;
          }

          return { get: vi.fn() } as unknown as vscode.WorkspaceConfiguration;
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("38 lines (35 loc) \u2022 1.21 KB");
      expect(result.tooltip).toBe("38 lines (35 loc) \u2022 1.21 KB");
    });

    it("should return only file size for text when showInStatusBar is false", () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: vi.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return false;
                return true;
              })
            } as unknown as vscode.WorkspaceConfiguration;
          }

          return { get: vi.fn() } as unknown as vscode.WorkspaceConfiguration;
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("1.21 KB");
      expect(result.tooltip).toBe("38 lines (35 loc) \u2022 1.21 KB");
    });

    it("should return only file size for tooltip when showInTooltips is false", () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: vi.fn((key: string) => {
                if (key === "showInTooltips") return false;
                if (key === "showInStatusBar") return true;
                return true;
              })
            } as unknown as vscode.WorkspaceConfiguration;
          }

          return { get: vi.fn() } as unknown as vscode.WorkspaceConfiguration;
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("38 lines (35 loc) \u2022 1.21 KB");
      expect(result.tooltip).toBe("1.21 KB");
    });

    it("should return only file size for both when lineCounts is null", () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: vi.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            } as unknown as vscode.WorkspaceConfiguration;
          }

          return { get: vi.fn() } as unknown as vscode.WorkspaceConfiguration;
        }
      );

      const result = formatLoc({
        lineCounts: null,
        formattedFileSize: "1.21 KB"
      });
      expect(result.text).toBe("1.21 KB");
      expect(result.tooltip).toBe("1.21 KB");
    });

    it("should return only file size for both when lineCounts is undefined", () => {
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: vi.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            } as unknown as vscode.WorkspaceConfiguration;
          }

          return { get: vi.fn() } as unknown as vscode.WorkspaceConfiguration;
        }
      );

      const result = formatLoc({
        lineCounts: undefined,
        formattedFileSize: "1.21 KB"
      });
      expect(result.text).toBe("1.21 KB");
      expect(result.tooltip).toBe("1.21 KB");
    });
  });
});
