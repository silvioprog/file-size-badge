import * as vscode from "vscode";

type Uri = vscode.Uri | vscode.Uri[] | undefined;

const DEBOUNCE_MS = 150;

export const eventEmitter = new vscode.EventEmitter<Uri>();

export const onDidChangeFileDecorations = eventEmitter.event;

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let pendingUris: vscode.Uri[] = [];
let refreshAll = false;

export const updateDecorations = (uri?: Uri) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  if (uri === undefined) {
    refreshAll = true;
  } else if (!refreshAll) {
    const uris = Array.isArray(uri) ? uri : [uri];
    pendingUris.push(...uris);
  }

  debounceTimer = setTimeout(() => {
    const uris = refreshAll ? undefined : [...pendingUris];
    pendingUris = [];
    refreshAll = false;
    debounceTimer = undefined;
    eventEmitter.fire(uris);
  }, DEBOUNCE_MS);
};
