import * as vscode from "vscode";
import { provider } from "./provider";
import { eventEmitter, updateDecorations } from "./eventEmitter";
import { fileWatcher } from "./fileWatcher";
import {
  statusBar,
  projectStatusBar,
  updateStatusBar,
  updateProjectStatusBar,
  updateStatusBarOnChangeActiveTextEditor,
  updateStatusBarOnChangeTabs,
  updateStatusBarOnSaveTextDocument,
  updateStatusBarOnChangeConfiguration,
  updateProjectStatusBarOnFileChange,
  updateProjectStatusBarOnCreateFiles,
  updateProjectStatusBarOnDeleteFiles
} from "./statusBar";

vscode.workspace.onDidChangeWorkspaceFolders(() => updateDecorations());
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
    updateDecorations();
  }
});

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    provider,
    eventEmitter,
    fileWatcher,
    statusBar,
    projectStatusBar,
    updateStatusBarOnChangeActiveTextEditor,
    updateStatusBarOnChangeTabs,
    updateStatusBarOnSaveTextDocument,
    updateStatusBarOnChangeConfiguration,
    updateProjectStatusBarOnFileChange,
    updateProjectStatusBarOnCreateFiles,
    updateProjectStatusBarOnDeleteFiles
  );
  updateStatusBar();
  updateProjectStatusBar();
}

export function deactivate() {}
