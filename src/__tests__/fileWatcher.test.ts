import * as vscode from "vscode";
import { invalidateAll } from "../cache";
import { updateDecorations } from "../eventEmitter";

jest.mock("../cache");
jest.mock("../eventEmitter");

let shouldExclude: (fsPath: string) => boolean;
let matchesGlob: (normalizedPath: string, pattern: string) => boolean;
let onCreateHandler: (uri: vscode.Uri) => void;
let onDeleteHandler: (uri: vscode.Uri) => void;
let onChangeHandler: (uri: vscode.Uri) => void;

beforeAll(async () => {
  const mod = await import("../fileWatcher");
  shouldExclude = mod.shouldExclude;
  matchesGlob = mod.matchesGlob;

  const mockWatcher = (vscode.workspace.createFileSystemWatcher as jest.Mock)
    .mock.results[0].value;
  onCreateHandler = mockWatcher.onDidCreate.mock.calls[0][0];
  onDeleteHandler = mockWatcher.onDidDelete.mock.calls[0][0];
  onChangeHandler = mockWatcher.onDidChange.mock.calls[0][0];
});

describe("fileWatcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
      (section?: string) => ({
        get: jest.fn((key: string, defaultValue?: unknown) => {
          if (section === "fileSizeBadge" && key === "excludedDirectories") {
            return [".git", "build", "dist", "node_modules"];
          }
          if (section === "fileSizeBadge" && key === "excludedGlobs") {
            return [];
          }
          return defaultValue;
        })
      })
    );
  });

  it("should create file system watcher for all files", () => {
    expect(onCreateHandler).toBeDefined();
    expect(onDeleteHandler).toBeDefined();
    expect(onChangeHandler).toBeDefined();
  });

  describe("shouldExclude", () => {
    it("should exclude paths containing configured directories", () => {
      expect(shouldExclude("/project/node_modules/package.json")).toBe(true);
      expect(shouldExclude("/project/.git/config")).toBe(true);
      expect(shouldExclude("/project/dist/bundle.js")).toBe(true);
      expect(shouldExclude("/project/build/output.js")).toBe(true);
    });

    it("should not exclude paths without configured directories", () => {
      expect(shouldExclude("/project/src/index.ts")).toBe(false);
      expect(shouldExclude("/project/README.md")).toBe(false);
    });

    it("should exclude paths ending with configured directory", () => {
      expect(shouldExclude("/project/node_modules")).toBe(true);
      expect(shouldExclude("/project/.git")).toBe(true);
    });

    it("should not match partial directory names", () => {
      expect(shouldExclude("/project/node_modules_backup/file.txt")).toBe(
        false
      );
      expect(shouldExclude("/project/dist-old/file.txt")).toBe(false);
      expect(shouldExclude("/project/buildtools/file.txt")).toBe(false);
    });

    it("should handle Windows-style backslash paths", () => {
      expect(shouldExclude("C:\\project\\node_modules\\package.json")).toBe(
        true
      );
      expect(shouldExclude("C:\\project\\.git\\config")).toBe(true);
    });

    it("should not exclude any path when config is empty", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        () => ({
          get: jest.fn(() => [])
        })
      );

      expect(shouldExclude("/project/node_modules/package.json")).toBe(false);
      expect(shouldExclude("/project/.git/config")).toBe(false);
    });

    it("should handle deeply nested excluded directories", () => {
      expect(shouldExclude("/a/b/c/node_modules/d/e/file.ts")).toBe(true);
    });

    it("should exclude paths matching glob patterns", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => ({
          get: jest.fn((key: string, defaultValue?: unknown) => {
            if (section === "fileSizeBadge" && key === "excludedDirectories") {
              return [];
            }
            if (section === "fileSizeBadge" && key === "excludedGlobs") {
              return ["**/*.min.js", "**/*.map"];
            }
            return defaultValue;
          })
        })
      );

      expect(shouldExclude("/project/dist/app.min.js")).toBe(true);
      expect(shouldExclude("/project/src/bundle.js.map")).toBe(true);
      expect(shouldExclude("/project/src/index.ts")).toBe(false);
    });

    it("should check both directories and globs", () => {
      (vscode.workspace.getConfiguration as jest.Mock).mockImplementation(
        (section?: string) => ({
          get: jest.fn((key: string, defaultValue?: unknown) => {
            if (section === "fileSizeBadge" && key === "excludedDirectories") {
              return ["node_modules"];
            }
            if (section === "fileSizeBadge" && key === "excludedGlobs") {
              return ["**/*.map"];
            }
            return defaultValue;
          })
        })
      );

      expect(shouldExclude("/project/node_modules/pkg.json")).toBe(true);
      expect(shouldExclude("/project/src/bundle.js.map")).toBe(true);
      expect(shouldExclude("/project/src/index.ts")).toBe(false);
    });
  });

  describe("matchesGlob", () => {
    it("should match **/*.ext patterns at any depth", () => {
      expect(matchesGlob("/project/dist/app.min.js", "**/*.min.js")).toBe(true);
      expect(matchesGlob("/a/b/c/d/file.map", "**/*.map")).toBe(true);
      expect(matchesGlob("/project/file.map", "**/*.map")).toBe(true);
    });

    it("should match *.ext patterns in any directory", () => {
      expect(matchesGlob("/project/src/file.log", "*.log")).toBe(true);
      expect(matchesGlob("/project/error.log", "*.log")).toBe(true);
    });

    it("should not match when extension differs", () => {
      expect(matchesGlob("/project/src/file.ts", "**/*.js")).toBe(false);
      expect(matchesGlob("/project/src/file.map.bak", "**/*.map")).toBe(false);
    });

    it("should match **/dir/** patterns for directory contents", () => {
      expect(
        matchesGlob(
          "/project/coverage/lcov-report/index.html",
          "**/coverage/**"
        )
      ).toBe(true);
      expect(
        matchesGlob("/project/coverage/coverage.json", "**/coverage/**")
      ).toBe(true);
    });

    it("should match ? wildcard for single characters", () => {
      expect(matchesGlob("/project/file1.txt", "file?.txt")).toBe(true);
      expect(matchesGlob("/project/fileAB.txt", "file?.txt")).toBe(false);
    });

    it("should escape regex special characters in patterns", () => {
      expect(matchesGlob("/project/file.min.js", "*.min.js")).toBe(true);
      expect(matchesGlob("/project/filexminyjs", "*.min.js")).toBe(false);
    });

    it("should match exact filenames", () => {
      expect(matchesGlob("/project/.DS_Store", ".DS_Store")).toBe(true);
      expect(matchesGlob("/project/sub/.DS_Store", ".DS_Store")).toBe(true);
      expect(matchesGlob("/project/.DS_Store_v2", ".DS_Store")).toBe(false);
    });

    it("should handle ** without trailing slash", () => {
      expect(matchesGlob("/project/coverage", "**/coverage")).toBe(true);
      expect(matchesGlob("/a/b/coverage", "**/coverage")).toBe(true);
    });
  });

  describe("event handlers", () => {
    it("should invalidate cache and update decorations on file create", () => {
      const uri = vscode.Uri.file("/project/src/new-file.ts");
      onCreateHandler(uri);

      expect(invalidateAll).toHaveBeenCalledWith("/project/src/new-file.ts");
      expect(updateDecorations).toHaveBeenCalledWith(uri);
    });

    it("should invalidate cache and update decorations on file delete", () => {
      const uri = vscode.Uri.file("/project/src/deleted-file.ts");
      onDeleteHandler(uri);

      expect(invalidateAll).toHaveBeenCalledWith(
        "/project/src/deleted-file.ts"
      );
      expect(updateDecorations).toHaveBeenCalledWith(uri);
    });

    it("should invalidate cache and update decorations on file change", () => {
      const uri = vscode.Uri.file("/project/src/changed-file.ts");
      onChangeHandler(uri);

      expect(invalidateAll).toHaveBeenCalledWith(
        "/project/src/changed-file.ts"
      );
      expect(updateDecorations).toHaveBeenCalledWith(uri);
    });

    it("should skip excluded paths on create", () => {
      const uri = vscode.Uri.file("/project/node_modules/package.json");
      onCreateHandler(uri);

      expect(invalidateAll).not.toHaveBeenCalled();
      expect(updateDecorations).not.toHaveBeenCalled();
    });

    it("should skip excluded paths on delete", () => {
      const uri = vscode.Uri.file("/project/node_modules/package.json");
      onDeleteHandler(uri);

      expect(invalidateAll).not.toHaveBeenCalled();
      expect(updateDecorations).not.toHaveBeenCalled();
    });

    it("should skip excluded paths on change", () => {
      const uri = vscode.Uri.file("/project/.git/HEAD");
      onChangeHandler(uri);

      expect(invalidateAll).not.toHaveBeenCalled();
      expect(updateDecorations).not.toHaveBeenCalled();
    });
  });
});
