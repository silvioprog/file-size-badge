import fs from "fs";
import * as vscode from "vscode";
import { isBinaryFileSync } from "isbinaryfile";

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

export const getLineCounts = (fsPath: string) => {
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
    if (isBinaryFileSync(fsPath)) {
      return null;
    }
    const lines = fs.readFileSync(fsPath, "utf8").split(/\r?\n/);

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
