import { execSync } from "child_process";
import { installCMD, uninstallCMD } from "../../src/install/cmd";

jest.mock("child_process");

describe("CMD Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, "platform", { value: "win32" });
  });

  test("installCMD should add AutoRun registry key", async () => {
    (execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes("reg query")) {
        // Return empty or existing
        return "";
      }
      return "";
    });

    await installCMD();

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun',
      ),
      expect.anything(),
    );
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining("cmd_macros.doskey"),
      expect.anything(),
    );
  });

  test("uninstallCMD should remove AutoRun registry key", async () => {
    (execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes("reg query")) {
        return "    AutoRun    REG_SZ    doskey /macrofile=...cmd_macros.doskey";
      }
      return "";
    });

    await uninstallCMD();

    // Should set it to empty since it was only our payload
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun',
      ),
      expect.anything(),
    );
    // Verify it sets empty value
    const callArgs = (execSync as jest.Mock).mock.calls.find((call) =>
      call[0].includes("reg add"),
    );
    expect(callArgs[0]).toContain('/d ""');
  });

  test("installCMD should be idempotent", async () => {
    (execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes("reg query")) {
        return "    AutoRun    REG_SZ    doskey /macrofile=...cmd_macros.doskey";
      }
      return "";
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    await installCMD();

    // Should NOT call reg add
    expect(execSync).not.toHaveBeenCalledWith(
      expect.stringContaining("reg add"),
      expect.anything(),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("already present"),
    );
    consoleSpy.mockRestore();
  });
});
