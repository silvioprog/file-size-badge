import * as vscode from "vscode";
import { invalidateAll } from "./cache";
import { updateDecorations } from "./eventEmitter";

vi.mock("./cache");
vi.mock("./eventEmitter");

let shouldExclude: (fsPath: string) => boolean;
let onCreateHandler: (uri: vscode.Uri) => void;
let onDeleteHandler: (uri: vscode.Uri) => void;
let onChangeHandler: (uri: vscode.Uri) => void;

beforeAll(async () => {
  const mod = await import("./fileWatcher");
  shouldExclude = mod.shouldExclude;

  const mockWatcher = vi.mocked(vscode.workspace.createFileSystemWatcher).mock
    .results[0].value;
  onCreateHandler = mockWatcher.onDidCreate.mock.calls[0][0];
  onDeleteHandler = mockWatcher.onDidDelete.mock.calls[0][0];
  onChangeHandler = mockWatcher.onDidChange.mock.calls[0][0];
});

describe("fileWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
      (section?: string) =>
        ({
          get: vi.fn((key: string, defaultValue?: unknown) => {
            if (section === "fileSizeBadge" && key === "excludedDirectories") {
              return [".git", "build", "dist", "node_modules"];
            }
            return defaultValue;
          })
        }) as unknown as vscode.WorkspaceConfiguration
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
      vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
        () =>
          ({
            get: vi.fn(() => [])
          }) as unknown as vscode.WorkspaceConfiguration
      );

      expect(shouldExclude("/project/node_modules/package.json")).toBe(false);
      expect(shouldExclude("/project/.git/config")).toBe(false);
    });

    it("should handle deeply nested excluded directories", () => {
      expect(shouldExclude("/a/b/c/node_modules/d/e/file.ts")).toBe(true);
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
