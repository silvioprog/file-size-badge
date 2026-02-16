import { readFile } from "fs/promises";
import * as vscode from "vscode";
import { isBinaryFile } from "isbinaryfile";

const MAX_LOC_FILE_SIZE = 5 * 1024 * 1024;

const getLocConfig = () => {
  const config = vscode.workspace.getConfiguration("fileSizeBadge.loc");

  return {
    showInStatusBar: config.get<boolean>("showInStatusBar", true),
    showInTooltips: config.get<boolean>("showInTooltips", true)
  };
};

const getLineCountsFromDocument = (doc: vscode.TextDocument) => ({
  total: doc.lineCount,
  loc: Array.from({ length: doc.lineCount }, (_, i) => i).filter(
    (i) => doc.lineAt(i).text.trim().length > 0
  ).length
});

export const getLineCounts = async (
  fsPath: string,
  options?: { fileSize?: number; token?: vscode.CancellationToken }
) => {
  try {
    const uri = vscode.Uri.file(fsPath);
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document.uri.toString() === uri.toString()) {
      return getLineCountsFromDocument(activeEditor.document);
    }
    const openDoc = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString()
    );
    if (openDoc) {
      return getLineCountsFromDocument(openDoc);
    }
    if (options?.fileSize && options.fileSize > MAX_LOC_FILE_SIZE) {
      return null;
    }
    if (options?.token?.isCancellationRequested) return null;
    if (await isBinaryFile(fsPath)) {
      return null;
    }
    if (options?.token?.isCancellationRequested) return null;
    const content = await readFile(fsPath, "utf8");
    const lines = content.split(/\r?\n/);

    return {
      total: lines.length,
      loc: lines.filter((line) => line.trim().length > 0).length
    };
  } catch {
    return null;
  }
};

export const formatLoc = ({
  lineCounts,
  formattedFileSize
}: {
  lineCounts?: { total: number; loc: number } | null;
  formattedFileSize: string;
}) => {
  const config = getLocConfig();
  if (!lineCounts) {
    return {
      text: formattedFileSize,
      tooltip: formattedFileSize
    };
  }
  const text = `${lineCounts.total} lines (${lineCounts.loc} loc) • ${formattedFileSize}`;

  return {
    text: config.showInStatusBar ? text : formattedFileSize,
    tooltip: config.showInTooltips ? text : formattedFileSize
  };
};
