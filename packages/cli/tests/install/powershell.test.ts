import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  installPowerShell,
  uninstallPowerShell,
} from "../../src/install/powershell";

jest.mock("fs");
jest.mock("child_process");

describe("PowerShell Integration Installer", () => {
  const mockProfilePath =
    "C:\\Users\\User\\Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1";

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, "platform", { value: "win32" });

    (execSync as jest.Mock).mockReturnValue(mockProfilePath);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      "# Existing profile content",
    );
    // fs.dirname doesn't exist, it's path.dirname. The code uses path.dirname for profileDir.
    // fs.mkdirSync is used.
  });

  test("installPowerShell should detect Windows platform", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await installPowerShell();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("only supported on Windows"),
    );
    consoleSpy.mockRestore();
  });

  test("installPowerShell should create profile if missing", async () => {
    // Mock profile doesn't exist, but directory check will be called
    (fs.existsSync as jest.Mock).mockImplementation((p) => {
      if (p === mockProfilePath) return false;
      // Mock directory doesn't exist either to trigger mkdirSync
      if (p === path.dirname(mockProfilePath)) return false;
      return true;
    });

    await installPowerShell();

    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockProfilePath,
      expect.stringContaining("# <crashcue-start>"),
      "utf8",
    );
  });

  test("installPowerShell should inject block idempotently", async () => {
    // First run
    await installPowerShell();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockProfilePath,
      expect.stringContaining("Template Version: 2"),
      "utf8",
    );

    // Second run with existing block
    (fs.readFileSync as jest.Mock).mockReturnValue(
      "# Existing\n# <crashcue-start>\nold block\n# <crashcue-end>",
    );

    await installPowerShell();

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockProfilePath,
      expect.stringContaining("Template Version: 2"), // Should contain new template
      "utf8",
    );
    // Verify it replaced, not appended
    const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[1];
    const content = writeCall[1];
    expect((content.match(/# <crashcue-start>/g) || []).length).toBe(1);
  });

  test("uninstallPowerShell should remove block", async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(
      "# Existing\n# <crashcue-start>\nblock\n# <crashcue-end>\n# More",
    );
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await uninstallPowerShell();

    // The logic in powershell.ts handles newlines slightly differently when replacing.
    // It might be leaving an extra newline or consuming one differently.
    // Let's verify what it's calling with more flexibility or fix the expectation.
    // Based on the code: content.replace(regex, "")
    // And the regex includes \\r?\\n? at the end.
    // So it should remove the block + one newline.
    // "# Existing\n[BLOCK]\n# More" -> "# Existing\n# More"

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockProfilePath,
      "# Existing\n# More",
      "utf8",
    );
  });

  test("uninstallPowerShell should handle missing profile gracefully", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await uninstallPowerShell();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Profile not found"),
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
