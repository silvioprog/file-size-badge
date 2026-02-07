import * as vscode from "vscode";
import { updateDecorations } from "./eventEmitter";
import { invalidateAll } from "./cache";

const getExcludedDirsConfig = () =>
  vscode.workspace
    .getConfiguration("fileSizeBadge")
    .get<string[]>("excludedDirectories", []);

export const shouldExclude = (fsPath: string) => {
  const normalizedPath = fsPath.replace(/\\/g, "/");

  return getExcludedDirsConfig().some(
    (dir) =>
      normalizedPath.includes(`/${dir}/`) || normalizedPath.endsWith(`/${dir}`)
  );
};

export const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");

fileWatcher.onDidCreate((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    invalidateAll(uri.fsPath);
    updateDecorations(uri);
  }
});

fileWatcher.onDidDelete((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    invalidateAll(uri.fsPath);
    updateDecorations(uri);
  }
});

fileWatcher.onDidChange((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    invalidateAll(uri.fsPath);
    updateDecorations(uri);
  }
});
