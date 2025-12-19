import * as vscode from "vscode";
import { updateDecorations } from "./eventEmitter";

const getExcludedDirs = () =>
  vscode.workspace
    .getConfiguration("fileSizeBadge")
    .get<string[]>("excludedDirectories", []);

const shouldExclude = (fsPath: string) => {
  const normalizedPath = fsPath.replace(/\\/g, "/");

  return getExcludedDirs().some(
    (dir) =>
      normalizedPath.includes(`/${dir}/`) || normalizedPath.endsWith(`/${dir}`)
  );
};

export const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");

fileWatcher.onDidCreate((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    updateDecorations(uri);
  }
});

fileWatcher.onDidDelete((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    updateDecorations(uri);
  }
});

fileWatcher.onDidChange((uri) => {
  if (!shouldExclude(uri.fsPath)) {
    updateDecorations(uri);
  }
});
