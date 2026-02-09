import * as vscode from "vscode";

beforeAll(async () => {
  await import("./provider");
});

describe("provider", () => {
  it("should register file decoration provider", () => {
    expect(vscode.window.registerFileDecorationProvider).toHaveBeenCalled();
  });
});
