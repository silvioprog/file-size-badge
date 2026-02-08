import * as vscode from "vscode";
import { formatBadgeFileSize, formatFileSize, getFileSize } from "./utils";
import { onDidChangeFileDecorations } from "./eventEmitter";
import { shouldExclude } from "./fileWatcher";
import { formatLoc, getLineCounts } from "./loc";

export const provider = vscode.window.registerFileDecorationProvider({
  async provideFileDecoration(uri, token) {
    if (uri.scheme !== "file" || shouldExclude(uri.fsPath)) return;
    if (token.isCancellationRequested) return;
    const fileSize = await getFileSize(uri.fsPath);
    if (fileSize === null) return;
    if (token.isCancellationRequested) return;

    return {
      badge: formatBadgeFileSize(fileSize),
      tooltip: formatLoc({
        lineCounts: await getLineCounts(uri.fsPath),
        formattedFileSize: formatFileSize(fileSize)
      }).tooltip
    };
  },
  onDidChangeFileDecorations
});
