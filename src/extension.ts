import * as vscode from "vscode";
import { provider } from "./provider";
import { eventEmitter, updateDecorations } from "./eventEmitter";
import { fileWatcher } from "./fileWatcher";
import { clearAll } from "./cache";
import { formatFileSize, getFileSize } from "./utils";
import { formatLoc, getLineCounts } from "./loc";
import {
  statusBar,
  updateStatusBar,
  updateStatusBarOnChangeActiveTextEditor,
  updateStatusBarOnChangeTabs,
  updateStatusBarOnSaveTextDocument,
  updateStatusBarOnChangeConfiguration
} from "./statusBar";

vscode.workspace.onDidChangeWorkspaceFolders(() => {
  clearAll();
  updateDecorations();
});
vscode.workspace.onDidCreateFiles((e) => updateDecorations([...e.files]));
vscode.workspace.onDidDeleteFiles((e) => updateDecorations([...e.files]));
vscode.workspace.onDidRenameFiles((e) =>
  updateDecorations([
    ...e.files.map((file) => file.oldUri),
    ...e.files.map((file) => file.newUri)
  ])
);
vscode.workspace.onDidSaveTextDocument((e) => updateDecorations(e.uri));
vscode.workspace.onDidOpenTextDocument((e) => updateDecorations(e.uri));
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("fileSizeBadge")) {
    clearAll();
    updateDecorations();
  }
});

export function activate(context: vscode.ExtensionContext) {
  const copyFileSizeCommand = vscode.commands.registerCommand(
    "fileSizeBadge.copyFileSize",
    async (uri?: vscode.Uri) => {
      if (!uri) {
        const editor = vscode.window.activeTextEditor;
        if (editor?.document.uri.scheme === "file") {
          uri = editor.document.uri;
        }
      }
      if (!uri || uri.scheme !== "file") return;
      const fileSize = await getFileSize(uri.fsPath);
      if (fileSize === null) return;
      const loc = formatLoc({
        lineCounts: await getLineCounts(uri.fsPath, { fileSize }),
        formattedFileSize: formatFileSize(fileSize)
      });
      await vscode.env.clipboard.writeText(loc.tooltip);
      vscode.window.showInformationMessage(`Copied: ${loc.tooltip}`);
    }
  );

  context.subscriptions.push(
    provider,
    eventEmitter,
    fileWatcher,
    statusBar,
    copyFileSizeCommand,
    updateStatusBarOnChangeActiveTextEditor,
    updateStatusBarOnChangeTabs,
    updateStatusBarOnSaveTextDocument,
    updateStatusBarOnChangeConfiguration
  );
  updateStatusBar();
}

export function deactivate() {}
