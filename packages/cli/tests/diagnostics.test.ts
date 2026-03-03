import fs from "fs";
import os from "os";
import path from "path";

jest.mock("conf", () => jest.fn());
jest.mock("child_process", () => ({
  execSync: jest.fn(),
  spawnSync: jest.fn(),
}));

describe("generateDiagnosticReport (sanitized)", () => {
  const originalPlatform = process.platform;
  let tempDirs: string[] = [];

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    tempDirs = [];
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    delete process.env.HOME;
    delete process.env.USERPROFILE;

    for (const d of tempDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
  });

  test("includes version and platform/node/arch", () => {
    Object.defineProperty(process, "platform", { value: "win32" });

    const Conf = require("conf") as jest.Mock;
    Conf.mockImplementation(() => ({
      get: (k: string) => {
        if (k === "muted") return false;
        if (k === "soundPath") return "";
        return undefined;
      },
    }));

    const { generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics");

    const report = generateDiagnosticReport();
    expect(report).toContain("CrashCue Diagnostic Report");
    expect(report).toContain("Version: 0.2.0");
    expect(report).toContain("Platform: win32");
    expect(report).toContain(`Node: ${process.version}`);
    expect(report).toContain(`Arch: ${process.arch}`);
  });

  test("does not include usernames, env values, or absolute paths", () => {
    Object.defineProperty(process, "platform", { value: "win32" });

    process.env.USERPROFILE = "C:\\Users\\SecretUser";
    process.env.HOME = "C:\\Users\\SecretUser";

    const Conf = require("conf") as jest.Mock;
    Conf.mockImplementation(() => ({
      get: () => "",
    }));

    const { generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics");

    const report = generateDiagnosticReport();

    expect(report).not.toContain("SecretUser");
    expect(report).not.toContain("C:\\Users\\");
    expect(report).not.toMatch(/^[A-Z]:\\/m);
    expect(report).not.toMatch(/\/Users\//);
  });

  test("reflects mute and custom sound state without printing sound path", () => {
    Object.defineProperty(process, "platform", { value: "win32" });

    const Conf = require("conf") as jest.Mock;
    Conf.mockImplementation(() => ({
      get: (k: string) => {
        if (k === "muted") return true;
        if (k === "soundPath") return "C:\\Users\\SecretUser\\sound.wav";
        return undefined;
      },
    }));

    const { generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics");

    const report = generateDiagnosticReport();
    expect(report).toContain("Muted: true");
    expect(report).toContain("Custom Sound Configured: Yes");
    expect(report).toContain("Using Default Sound: No");
    expect(report).not.toContain("sound.wav");
    expect(report).not.toContain("SecretUser");
  });

  test("reflects integration detection (boolean only)", () => {
    Object.defineProperty(process, "platform", { value: "win32" });

    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "crashcue-home-"));
    tempDirs.push(homeDir);
    process.env.HOME = homeDir;
    process.env.USERPROFILE = homeDir;

    fs.writeFileSync(path.join(homeDir, ".bashrc"), "<crashcue-start>", "utf8");
    const profilePath = path.join(homeDir, "profile.ps1");
    fs.writeFileSync(profilePath, "<crashcue-start>", "utf8");

    const Conf = require("conf") as jest.Mock;
    Conf.mockImplementation(() => ({
      get: () => "",
    }));

    const { execSync } = require("child_process") as { execSync: jest.Mock };
    execSync.mockReturnValue(profilePath);

    const { generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics");

    const report = generateDiagnosticReport();
    expect(report).toContain("PowerShell Integration: Installed");
    expect(report).toContain("Git Bash Integration: Installed");
    expect(report).not.toContain("profile.ps1");
    expect(report).not.toContain(".bashrc");
  });

  test("reflects Windows vs non-Windows behavior", () => {
    const Conf = require("conf") as jest.Mock;
    Conf.mockImplementation(() => ({
      get: () => "",
    }));

    const { spawnSync } = require("child_process") as { spawnSync: jest.Mock };
    spawnSync.mockReturnValue({ status: 0 });

    Object.defineProperty(process, "platform", { value: "win32" });
    let { generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics");
    let report = generateDiagnosticReport();
    expect(report).toMatch(/Native Script Present: (Yes|No)/);
    expect(report).toContain("PowerShell Available: Yes");

    jest.resetModules();
    Object.defineProperty(process, "platform", { value: "linux" });
    ({ generateDiagnosticReport } =
      require("../src/diagnostics") as typeof import("../src/diagnostics"));
    report = generateDiagnosticReport();
    expect(report).toContain("Native Script Present: No");
    expect(report).toContain("PowerShell Available: No");
  });
});
