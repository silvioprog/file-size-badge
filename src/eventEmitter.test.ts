import * as vscode from "vscode";
import {
  eventEmitter,
  updateDecorations,
  onDidChangeFileDecorations
} from "./eventEmitter";

describe("eventEmitter", () => {
  beforeEach(() => {
    eventEmitter.dispose();
  });

  it("should fire event when updateDecorations is called", () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations(mockUri);

    expect(listener).toHaveBeenCalledWith(mockUri);
    expect(listener).toHaveBeenCalledTimes(1);

    disposable.dispose();
  });
});
