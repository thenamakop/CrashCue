import fs from "fs";
import path from "path";
import os from "os";
import { installGitBash, uninstallGitBash } from "../../src/install/gitbash";

jest.mock("fs");
jest.mock("os");

describe("Git Bash Integration", () => {
  const mockBashrcPath = path.join("/users/home", ".bashrc");

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, "platform", { value: "win32" });
    (os.homedir as jest.Mock).mockReturnValue("/users/home");
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("");
  });

  test("installGitBash should append PROMPT_COMMAND hook", async () => {
    await installGitBash();

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockBashrcPath,
      expect.stringContaining("PROMPT_COMMAND"),
      "utf8",
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockBashrcPath,
      expect.stringContaining("powershell.exe"),
      "utf8",
    );
  });

  test("uninstallGitBash should remove PROMPT_COMMAND hook", async () => {
    const existingContent = `
# <crashcue-start>
crashcue_prompt() {
    local EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File "path/to/script.ps1" -Path "path/to/sound.wav" >/dev/null 2>&1 &
    fi
}
if [[ ! "$PROMPT_COMMAND" =~ "crashcue_prompt" ]]; then
    PROMPT_COMMAND="crashcue_prompt;$PROMPT_COMMAND"
fi
# <crashcue-end>
`;
    (fs.readFileSync as jest.Mock).mockReturnValue(existingContent);

    await uninstallGitBash();

    // Should remove the block
    const callArgs = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const writtenContent = callArgs[1];
    expect(writtenContent).not.toContain("# <crashcue-start>");
    expect(writtenContent).not.toContain("PROMPT_COMMAND");
  });

  test("installGitBash should handle existing hook", async () => {
    const existingContent = `
# <crashcue-start>
old_hook
# <crashcue-end>
`;
    (fs.readFileSync as jest.Mock).mockReturnValue(existingContent);

    await installGitBash();

    const callArgs = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const writtenContent = callArgs[1];
    expect(writtenContent).toContain("PROMPT_COMMAND");
    expect(writtenContent).not.toContain("old_hook");
  });
});
