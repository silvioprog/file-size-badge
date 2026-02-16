import * as vscode from "vscode";
import {
  eventEmitter,
  updateDecorations,
  onDidChangeFileDecorations
} from "./eventEmitter";

describe("eventEmitter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    eventEmitter.dispose();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should fire event after debounce period", () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations(mockUri);
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([mockUri]);

    disposable.dispose();
  });

  it("should batch multiple URIs within debounce window", () => {
    const uri1 = vscode.Uri.file("/path/to/file1.txt");
    const uri2 = vscode.Uri.file("/path/to/file2.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations(uri1);
    updateDecorations(uri2);

    vi.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([uri1, uri2]);

    disposable.dispose();
  });

  it("should fire undefined for refresh all", () => {
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations();

    vi.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledWith(undefined);

    disposable.dispose();
  });

  it("should use refresh all when mixed with specific URIs", () => {
    const mockUri = vscode.Uri.file("/path/to/file.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations(mockUri);
    updateDecorations(); // refresh all supersedes

    vi.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(undefined);

    disposable.dispose();
  });

  it("should accept URI arrays", () => {
    const uri1 = vscode.Uri.file("/path/to/file1.txt");
    const uri2 = vscode.Uri.file("/path/to/file2.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations([uri1, uri2]);

    vi.advanceTimersByTime(150);
    expect(listener).toHaveBeenCalledWith([uri1, uri2]);

    disposable.dispose();
  });

  it("should reset after firing", () => {
    const uri1 = vscode.Uri.file("/path/to/file1.txt");
    const uri2 = vscode.Uri.file("/path/to/file2.txt");
    const listener = vi.fn();
    const disposable = onDidChangeFileDecorations(listener);

    updateDecorations(uri1);
    vi.advanceTimersByTime(150);

    updateDecorations(uri2);
    vi.advanceTimersByTime(150);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, [uri1]);
    expect(listener).toHaveBeenNthCalledWith(2, [uri2]);

    disposable.dispose();
  });
});
