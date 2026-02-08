import { readFile } from "fs/promises";
import * as vscode from "vscode";
import { isBinaryFile } from "isbinaryfile";
import { formatLoc, getLineCounts } from "../loc";

jest.mock("fs/promises", () => ({
  readFile: jest.fn()
}));
jest.mock("vscode");
jest.mock("isbinaryfile");

describe("loc", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isBinaryFile as jest.Mock).mockResolvedValue(false);
    (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
      (section?: string) => {
        if (section === "fileSizeBadge.loc") {
          return {
            get: jest.fn((key: string, defaultValue: any) => {
              if (key === "showInTooltips") return defaultValue ?? true;
              if (key === "showInStatusBar") return defaultValue ?? true;
              return defaultValue;
            })
          };
        }

        return {
          get: jest.fn((key: string, defaultValue: any) => defaultValue)
        };
      }
    );
  });

  describe("getLineCounts", () => {
    it("should return line counts for a valid file", async () => {
      const content = "line 1\nline 2\nline 3";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 3, loc: 3 });
      expect(readFile).toHaveBeenCalledWith("/path/to/file.txt", "utf8");
    });

    it("should exclude blank lines from LOC count", async () => {
      const content = "line 1\n\nline 2\n  \nline 3";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 5, loc: 3 });
    });

    it("should handle files with only blank lines", async () => {
      const content = "\n\n  \n\t\n";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 5, loc: 0 });
    });

    it("should handle empty files", async () => {
      const content = "";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 1, loc: 0 });
    });

    it("should handle files with Windows line endings (CRLF)", async () => {
      const content = "line 1\r\nline 2\r\nline 3";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 3, loc: 3 });
    });

    it("should handle files with mixed line endings", async () => {
      const content = "line 1\nline 2\r\nline 3\n";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 4, loc: 3 });
    });

    it("should return null when file does not exist", async () => {
      (readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

      const result = await getLineCounts("/path/to/nonexistent.txt");
      expect(result).toBeNull();
    });

    it("should return null when readFile throws any error", async () => {
      (readFile as jest.Mock).mockRejectedValue(new Error("Permission denied"));

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toBeNull();
    });

    it("should handle files with trailing newline", async () => {
      const content = "line 1\nline 2\nline 3\n";
      (readFile as jest.Mock).mockResolvedValue(content);

      const result = await getLineCounts("/path/to/file.txt");
      expect(result).toEqual({ total: 4, loc: 3 });
    });

    it("should return null for binary files", async () => {
      (isBinaryFile as jest.Mock).mockResolvedValue(true);

      const result = await getLineCounts("/path/to/image.png");
      expect(result).toBeNull();
      expect(readFile).not.toHaveBeenCalled();
    });
  });

  describe("formatLoc", () => {
    it("should return both text and tooltip with LOC when enabled and lineCounts available", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: jest.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            };
          }

          return { get: jest.fn() };
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("38 lines (35 loc) \u2022 1.21 KB");
      expect(result.tooltip).toBe("38 lines (35 loc) \u2022 1.21 KB");
    });

    it("should return only file size for text when showInStatusBar is false", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: jest.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return false;
                return true;
              })
            };
          }

          return { get: jest.fn() };
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("1.21 KB");
      expect(result.tooltip).toBe("38 lines (35 loc) \u2022 1.21 KB");
    });

    it("should return only file size for tooltip when showInTooltips is false", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: jest.fn((key: string) => {
                if (key === "showInTooltips") return false;
                if (key === "showInStatusBar") return true;
                return true;
              })
            };
          }

          return { get: jest.fn() };
        }
      );

      const lineCounts = { total: 38, loc: 35 };
      const result = formatLoc({ lineCounts, formattedFileSize: "1.21 KB" });
      expect(result.text).toBe("38 lines (35 loc) \u2022 1.21 KB");
      expect(result.tooltip).toBe("1.21 KB");
    });

    it("should return only file size for both when lineCounts is null", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: jest.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            };
          }

          return { get: jest.fn() };
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
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => {
          if (section === "fileSizeBadge.loc") {
            return {
              get: jest.fn((key: string) => {
                if (key === "showInTooltips") return true;
                if (key === "showInStatusBar") return true;
                return true;
              })
            };
          }

          return { get: jest.fn() };
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
