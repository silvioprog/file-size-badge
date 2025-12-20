import * as vscode from "vscode";
import { provider } from "./provider";
import { eventEmitter, updateDecorations } from "./eventEmitter";
import { fileWatcher } from "./fileWatcher";
import {
  statusBar,
  updateStatusBar,
  updateStatusBarOnChangeActiveTextEditor,
  updateStatusBarOnChangeTabs,
  updateStatusBarOnSaveTextDocument,
  updateStatusBarOnChangeConfiguration
} from "./statusBar";

vscode.workspace.onDidChangeWorkspaceFolders(() => updateDecorations());
vscode.workspace.onDidCreateFiles(({ files }) => updateDecorations([...files]));
vscode.workspace.onDidDeleteFiles(({ files }) => updateDecorations([...files]));
vscode.workspace.onDidRenameFiles(({ files }) =>
  updateDecorations([
    ...files.map(({ oldUri }) => oldUri),
    ...files.map(({ newUri }) => newUri)
  ])
);
vscode.workspace.onDidSaveTextDocument(({ uri }) => updateDecorations(uri));
vscode.workspace.onDidOpenTextDocument(({ uri }) => updateDecorations(uri));
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration("fileSizeBadge")) {
    updateDecorations();
  }
});

export function activate({ subscriptions }: vscode.ExtensionContext) {
  subscriptions.push(
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
