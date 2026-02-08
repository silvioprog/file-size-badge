import * as vscode from "vscode";
import { updateDecorations } from "./eventEmitter";
import { invalidateAll } from "./cache";

const getExcludedDirsConfig = () =>
  vscode.workspace
    .getConfiguration("fileSizeBadge")
    .get<string[]>("excludedDirectories", []);

const getExcludedGlobsConfig = () =>
  vscode.workspace
    .getConfiguration("fileSizeBadge")
    .get<string[]>("excludedGlobs", []);

export const matchesGlob = (
  normalizedPath: string,
  pattern: string
): boolean => {
  let regex = "";
  let i = 0;
  while (i < pattern.length) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") {
        regex += "(?:.+/)?";
        i += 3;
      } else {
        regex += ".*";
        i += 2;
      }
    } else if (c === "*") {
      regex += "[^/]*";
      i++;
    } else if (c === "?") {
      regex += "[^/]";
      i++;
    } else if (".+^${}()|[]\\".includes(c)) {
      regex += "\\" + c;
      i++;
    } else {
      regex += c;
      i++;
    }
  }
  return new RegExp(`(?:^|/)${regex}$`).test(normalizedPath);
};

export const shouldExclude = (fsPath: string) => {
  const normalizedPath = fsPath.replace(/\\/g, "/");

  if (
    getExcludedDirsConfig().some(
      (dir) =>
        normalizedPath.includes(`/${dir}/`) ||
        normalizedPath.endsWith(`/${dir}`)
    )
  ) {
    return true;
  }

  return getExcludedGlobsConfig().some((pattern) =>
    matchesGlob(normalizedPath, pattern)
  );
};

export const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");

const handleFileEvent = (uri: vscode.Uri) => {
  if (!shouldExclude(uri.fsPath)) {
    invalidateAll(uri.fsPath);
    updateDecorations(uri);
  }
};

fileWatcher.onDidCreate(handleFileEvent);
fileWatcher.onDidDelete(handleFileEvent);
fileWatcher.onDidChange(handleFileEvent);
