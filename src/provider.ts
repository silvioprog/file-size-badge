import * as vscode from "vscode";
import { formatBadgeFileSize, formatFileSize, getFileSize } from "./utils";
import { onDidChangeFileDecorations } from "./eventEmitter";
import { shouldExclude } from "./fileWatcher";
import { formatLoc, getLineCounts } from "./loc";

export const provider = vscode.window.registerFileDecorationProvider({
  provideFileDecoration(uri) {
    if (uri.scheme !== "file" || shouldExclude(uri.fsPath)) return;
    const fileSize = getFileSize(uri.fsPath);
    if (fileSize === null) return;

    return {
      badge: formatBadgeFileSize(fileSize),
      tooltip: formatLoc({
        lineCounts: getLineCounts(uri.fsPath),
        formattedFileSize: formatFileSize(fileSize)
      }).tooltip
    };
  },
  onDidChangeFileDecorations
});
