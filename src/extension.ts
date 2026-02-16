import * as vscode from "vscode";
import { provider } from "./provider";
import { eventEmitter, updateDecorations } from "./eventEmitter";
import { fileWatcher } from "./fileWatcher";
import { clearAll } from "./cache";
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
  context.subscriptions.push(
    provider,
    eventEmitter,
    fileWatcher,
    statusBar,
    updateStatusBarOnChangeActiveTextEditor,
    updateStatusBarOnChangeTabs,
    updateStatusBarOnSaveTextDocument,
    updateStatusBarOnChangeConfiguration
  );
  updateStatusBar();
}

export function deactivate() {}
