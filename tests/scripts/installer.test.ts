import fs from "fs";
import path from "path";
import os from "os";
import { ShellInstaller } from "../../scripts/install-shell";

const MOCK_HOME = path.join(__dirname, "mock-home");
const MOCK_DOCUMENTS = path.join(MOCK_HOME, "Documents");
const MOCK_PS_PROFILE = path.join(
  MOCK_DOCUMENTS,
  "PowerShell",
  "Microsoft.PowerShell_profile.ps1",
);

jest.mock("os", () => ({
  homedir: jest.fn(),
}));

describe("Shell Installer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (os.homedir as jest.Mock).mockReturnValue(MOCK_HOME);

    // Clean up mock environment
    if (fs.existsSync(MOCK_HOME)) {
      fs.rmSync(MOCK_HOME, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(MOCK_PS_PROFILE), { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(MOCK_HOME)) {
      fs.rmSync(MOCK_HOME, { recursive: true, force: true });
    }
  });

  test("should detect PowerShell profile path", () => {
    const profilePath = ShellInstaller.getPowerShellProfilePath();
    // Since we are mocking homedir, it should construct the path relative to mock home
    // But getPowerShellProfilePath checks for existence of directories.
    // In our setup, we created the dir.
    expect(profilePath).toBe(MOCK_PS_PROFILE);
  });

  test("should create backup before install", async () => {
    // Create initial profile
    fs.writeFileSync(MOCK_PS_PROFILE, "# Existing content");

    await ShellInstaller.installPowerShell();

    const files = fs.readdirSync(path.dirname(MOCK_PS_PROFILE));
    const backups = files.filter((f) => f.endsWith(".bak"));
    expect(backups.length).toBeGreaterThan(0);
  });

  test("should install snippet idempotently", async () => {
    await ShellInstaller.installPowerShell();
    let content = fs.readFileSync(MOCK_PS_PROFILE, "utf8");
    expect(content).toContain("# <crashcue-start>");
    expect(content).toContain("Register-EngineEvent");

    // Install again
    await ShellInstaller.installPowerShell();
    content = fs.readFileSync(MOCK_PS_PROFILE, "utf8");

    // Should only appear once (matched by regex logic in installer)
    const matches = content.match(/# <crashcue-start>/g);
    expect(matches?.length).toBe(1);
  });

  test("should uninstall snippet and restore clean state", async () => {
    await ShellInstaller.installPowerShell();
    await ShellInstaller.uninstallPowerShell();

    const content = fs.readFileSync(MOCK_PS_PROFILE, "utf8");
    expect(content).not.toContain("# <crashcue-start>");
    expect(content).not.toContain("Register-EngineEvent");
  });
});
