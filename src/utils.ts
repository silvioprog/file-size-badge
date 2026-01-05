import fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { shouldExclude } from "./fileWatcher";

export const getFileSize = (path: string): number | null => {
  try {
    const stat = fs.statSync(path);
    if (!stat.isFile()) return null;
    return stat.size;
  } catch {
    return null;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(1);
    return `${kb.replace(/\.0$/, "")} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `${mb.replace(/\.0$/, "")} MB`;
  }
  if (bytes < 1024 * 1024 * 1024 * 1024) {
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(1);
    return `${gb.replace(/\.0$/, "")} GB`;
  }
  const tb = (bytes / 1024 / 1024 / 1024 / 1024).toFixed(1);
  return `${tb.replace(/\.0$/, "")} TB`;
};

export const formatBadgeFileSize = (bytes: number): string => {
  // Badges accepts only 2 characters

  if (bytes < 10) return `${bytes}B`;
  if (bytes < 1024) return "ⓘ";
  const kb = Math.round(bytes / 1024);
  if (kb < 10) return `${kb}K`;
  if (kb < 100) return "ⓘ";
  const mb = Math.round(bytes / (1024 * 1024));
  if (mb === 0) return "ⓘ";
  if (mb < 10) return `${mb}M`;
  if (mb < 100) return "ⓘ";
  const gb = Math.round(bytes / (1024 * 1024 * 1024));
  if (gb === 0) return "ⓘ";
  if (gb < 10) return `${gb}G`;
  if (gb < 100) return "ⓘ";
  const tb = Math.round(bytes / (1024 * 1024 * 1024 * 1024));
  if (tb === 0) return "ⓘ";
  if (tb < 10) return `${tb}T`;
  return "ⓘ";
};

export const getTotalProjectSize = (): number => {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) return 0;
  let total = 0;
  const walk = (dir: string) => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (shouldExclude(fullPath)) continue;
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          total += stat.size;
        } else if (stat.isDirectory()) {
          walk(fullPath);
        }
      }
    } catch {
      // Ignore errors, e.g., permission issues
    }
  };
  walk(root);
  return total;
};
