import type { Stats } from "node:fs";
import fs from "fs/promises";
import { getFileSize, formatFileSize, formatBadgeFileSize } from "./utils";
import { clearAll } from "./cache";

vi.mock("fs/promises", () => ({
  default: { stat: vi.fn() }
}));

describe("utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAll();
  });

  describe("getFileSize", () => {
    it("should return file size for a valid file", async () => {
      const mockStat = {
        isFile: () => true,
        size: 1024
      } as unknown as Stats;
      vi.mocked(fs.stat).mockResolvedValue(mockStat);

      const result = await getFileSize("/path/to/file.txt");
      expect(result).toBe(1024);
      expect(fs.stat).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should return null for a directory", async () => {
      const mockStat = {
        isFile: () => false,
        size: 1024
      } as unknown as Stats;
      vi.mocked(fs.stat).mockResolvedValue(mockStat);

      const result = await getFileSize("/path/to/directory");
      expect(result).toBeNull();
    });

    it("should return null when file does not exist", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("File not found"));

      const result = await getFileSize("/path/to/nonexistent.txt");
      expect(result).toBeNull();
    });

    it("should return null when stat throws any error", async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error("Permission denied"));

      const result = await getFileSize("/path/to/file.txt");
      expect(result).toBeNull();
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes less than 1024 as B", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(512)).toBe("512 B");
      expect(formatFileSize(1023)).toBe("1023 B");
    });

    it("should format bytes between 1024 and 1MB as KB", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1024 * 512)).toBe("512 KB");
      expect(formatFileSize(1024 * 1024 - 1)).toBe("1024 KB");
    });

    it("should format bytes between 1MB and 1GB as MB", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
      expect(formatFileSize(1024 * 1024 * 512)).toBe("512 MB");
      expect(formatFileSize(1024 * 1024 * 1024 - 1)).toBe("1024 MB");
    });

    it("should format bytes between 1GB and 1TB as GB", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe("2.5 GB");
      expect(formatFileSize(1024 * 1024 * 1024 * 10)).toBe("10 GB");
      expect(formatFileSize(1024 * 1024 * 1024 * 1024 - 1)).toBe("1024 GB");
    });

    it("should format bytes 1TB and above as TB", () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
      expect(formatFileSize(1024 * 1024 * 1024 * 1024 * 2.5)).toBe("2.5 TB");
      expect(formatFileSize(1024 * 1024 * 1024 * 1024 * 10)).toBe("10 TB");
    });
  });

  describe("formatBadgeFileSize", () => {
    it("should format bytes less than 10 as B", () => {
      expect(formatBadgeFileSize(0)).toBe("0B");
      expect(formatBadgeFileSize(5)).toBe("5B");
      expect(formatBadgeFileSize(9)).toBe("9B");
    });

    it("should return \u24d8 for bytes between 10 and 1024", () => {
      expect(formatBadgeFileSize(10)).toBe("\u24d8");
      expect(formatBadgeFileSize(100)).toBe("\u24d8");
      expect(formatBadgeFileSize(1023)).toBe("\u24d8");
    });

    it("should format KB less than 10 as K", () => {
      expect(formatBadgeFileSize(1024)).toBe("1K");
      expect(formatBadgeFileSize(1024 * 5)).toBe("5K");
      expect(formatBadgeFileSize(1024 * 9)).toBe("9K");
    });

    it("should return \u24d8 for KB between 10 and 100", () => {
      expect(formatBadgeFileSize(1024 * 10)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 50)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 99)).toBe("\u24d8");
    });

    it("should format MB less than 10 as M", () => {
      expect(formatBadgeFileSize(1024 * 1024)).toBe("1M");
      expect(formatBadgeFileSize(1024 * 1024 * 5)).toBe("5M");
      expect(formatBadgeFileSize(1024 * 1024 * 9)).toBe("9M");
    });

    it("should return \u24d8 for MB between 10 and 100", () => {
      expect(formatBadgeFileSize(1024 * 1024 * 10)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 1024 * 50)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 1024 * 99)).toBe("\u24d8");
    });

    it("should format GB less than 10 as G", () => {
      expect(formatBadgeFileSize(1024 * 1024 * 1024)).toBe("1G");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 5)).toBe("5G");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 9)).toBe("9G");
    });

    it("should return \u24d8 for GB between 10 and 100", () => {
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 10)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 50)).toBe("\u24d8");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 99)).toBe("\u24d8");
    });

    it("should format TB less than 10 as T", () => {
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 1024)).toBe("1T");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 1024 * 5)).toBe("5T");
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 1024 * 9)).toBe("9T");
    });

    it("should return \u24d8 for TB 10 and above", () => {
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 1024 * 10)).toBe(
        "\u24d8"
      );
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 1024 * 100)).toBe(
        "\u24d8"
      );
    });

    it("should return \u24d8 when MB rounds to 0", () => {
      // 100KB doesn't fit in badge format (>= 100KB shows \u24d8), and rounds to 0MB
      expect(formatBadgeFileSize(1024 * 100)).toBe("\u24d8");
    });

    it("should return \u24d8 when GB rounds to 0", () => {
      // 100MB doesn't fit in badge format (>= 100MB shows \u24d8), and rounds to 0GB
      expect(formatBadgeFileSize(1024 * 1024 * 100)).toBe("\u24d8");
    });

    it("should return \u24d8 when TB rounds to 0", () => {
      // 100GB doesn't fit in badge format (>= 100GB shows \u24d8), and rounds to 0TB
      expect(formatBadgeFileSize(1024 * 1024 * 1024 * 100)).toBe("\u24d8");
    });
  });
});
