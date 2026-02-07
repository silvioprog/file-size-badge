import * as vscode from "vscode";
import { formatFileSize, getFileSize } from "./utils";
import { shouldExclude } from "./fileWatcher";
import { formatLoc, getLineCounts } from "./loc";

const getUri = () => {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor?.document.uri.scheme === "file") {
    return activeEditor.document.uri;
  }
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (activeTab?.input instanceof vscode.TabInputText) {
    return activeTab.input.uri;
  }
  if (activeTab?.input instanceof vscode.TabInputTextDiff) {
    return activeTab.input.modified;
  }
  if (activeTab?.input instanceof vscode.TabInputNotebook) {
    return activeTab.input.uri;
  }
  if (activeTab?.input) {
    const input = activeTab.input as { uri?: vscode.Uri };
    if (input.uri instanceof vscode.Uri) {
      return input.uri;
    }
  }
};

const getStatusBarConfig = () => {
  const config = vscode.workspace.getConfiguration("fileSizeBadge.statusBar");
  const alignment = config.get<keyof typeof vscode.StatusBarAlignment>(
    "alignment",
    "Left"
  );
  const priority = config.get<number>("priority");

  return [vscode.StatusBarAlignment[alignment], priority] as const;
};

// Using `let` instead of `const` because the status bar must be recreated when
// alignment or priority change (these are immutable constructor parameters in VS Code's API).
// A Proxy was considered but rejected for simplicity - this direct approach is clearer.
export let statusBar = vscode.window.createStatusBarItem(
  ...getStatusBarConfig()
);

export const updateStatusBar = async () => {
  const uri = getUri();
  if (!uri || uri.scheme !== "file") {
    statusBar.hide();
    return;
  }
  if (shouldExclude(uri.fsPath)) {
    statusBar.hide();
    return;
  }
  const fileSize = await getFileSize(uri.fsPath);
  if (fileSize === null) {
    statusBar.hide();
    return;
  }
  const loc = formatLoc({
    lineCounts: await getLineCounts(uri.fsPath, { fileSize }),
    formattedFileSize: formatFileSize(fileSize)
  });
  statusBar.text = `$(file) ${loc.text}`;
  statusBar.tooltip = loc.tooltip;
  statusBar.show();
};

export const recreateStatusBar = () => {
  statusBar.dispose();
  statusBar = vscode.window.createStatusBarItem(...getStatusBarConfig());
  updateStatusBar();
};

export const updateStatusBarOnChangeActiveTextEditor =
  vscode.window.onDidChangeActiveTextEditor(updateStatusBar);

export const updateStatusBarOnChangeTabs =
  vscode.window.tabGroups.onDidChangeTabs(() => updateStatusBar());

export const updateStatusBarOnSaveTextDocument =
  vscode.workspace.onDidSaveTextDocument(() => updateStatusBar());

export const updateStatusBarOnChangeConfiguration =
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("fileSizeBadge.statusBar")) {
      recreateStatusBar();
    } else if (e.affectsConfiguration("fileSizeBadge.loc")) {
      updateStatusBar();
    }
  });
