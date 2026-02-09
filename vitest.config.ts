import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    alias: {
      vscode: resolve(import.meta.dirname, "./mock/vscode.ts")
    }
  }
});
