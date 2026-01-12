
import { describe, it, expect, spyOn, afterEach } from "bun:test";
import { ralphCommand } from "./src/cli/commands/ralph";

// Mock process.exit and console.error
const mockExit = spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process.exit called with code ${code}`);
});
const mockConsoleError = spyOn(console, "error").mockImplementation(() => {});

describe("ralphCommand validation", () => {
  afterEach(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  it("should fail when iterations is NaN", async () => {
    try {
      await ralphCommand("test task", { iterations: "not-a-number" });
    } catch (e: any) {
      expect(e.message).toBe("Process.exit called with code 1");
    }
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it("should fail when iterations is a non-numeric string (e.g. '5abc')", async () => {
    try {
      // If the bug is that parseInt is too lenient, this might NOT fail currently
      await ralphCommand("test task", { iterations: "5abc" });
    } catch (e: any) {
      expect(e.message).toBe("Process.exit called with code 1");
    }
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error: --iters must be a positive number'));
  });

  it("should fail when iterations is less than 1", async () => {
    try {
      await ralphCommand("test task", { iterations: "0" });
    } catch (e: any) {
      expect(e.message).toBe("Process.exit called with code 1");
    }
    expect(mockConsoleError).toHaveBeenCalled();
  });
});
