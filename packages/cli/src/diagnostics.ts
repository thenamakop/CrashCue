import * as fs from "fs";
import * as path from "path";
import { execSync, spawnSync } from "child_process";
import Conf from "conf";

interface CliConfig {
  muted: boolean;
  soundPath: string;
  ignoreCommands: string[];
}

function readCliVersion(): string {
  const pkgJsonPath = path.resolve(__dirname, "..", "package.json");
  try {
    const raw = fs.readFileSync(pkgJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || "unknown";
  } catch {
    try {
      const parsed = require(pkgJsonPath) as { version?: string };
      return parsed.version || "unknown";
    } catch {
      return "unknown";
    }
  }
}

function getConfigSummary(): {
  muted: boolean;
  customSoundConfigured: boolean;
  usingDefaultSound: boolean;
} {
  try {
    const conf = new Conf<CliConfig>({
      projectName: "crashcue",
      defaults: {
        muted: false,
        soundPath: "",
        ignoreCommands: [],
      },
    });

    const muted = Boolean(conf.get("muted"));
    const soundPath = (conf.get("soundPath") || "") as string;
    const customSoundConfigured = Boolean(soundPath);
    const usingDefaultSound = !customSoundConfigured;

    return { muted, customSoundConfigured, usingDefaultSound };
  } catch {
    return {
      muted: false,
      customSoundConfigured: false,
      usingDefaultSound: true,
    };
  }
}

function detectPowerShellIntegration(): boolean {
  const shells = ["powershell", "pwsh"];
  for (const shell of shells) {
    try {
      const profilePath = execSync(`${shell} -NoProfile -Command "$PROFILE"`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();

      if (!profilePath) continue;
      if (!fs.existsSync(profilePath)) continue;

      const content = fs.readFileSync(profilePath, "utf8");
      if (content.includes("<crashcue-start>")) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function detectGitBashIntegration(): boolean {
  const home = process.env.HOME;
  if (!home) return false;

  try {
    const bashrc = path.join(home, ".bashrc");
    if (!fs.existsSync(bashrc)) return false;
    const content = fs.readFileSync(bashrc, "utf8");
    return content.includes("<crashcue-start>");
  } catch {
    return false;
  }
}

function checkNativeScriptPresent(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const scriptPath = path.resolve(__dirname, "native-windows.ps1");
    return fs.existsSync(scriptPath);
  } catch {
    return false;
  }
}

function checkPowerShellAvailable(): boolean {
  if (process.platform !== "win32") return false;
  try {
    const res = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "exit 0"],
      { windowsHide: true, stdio: "ignore" },
    );
    return res.status === 0;
  } catch {
    return false;
  }
}

function checkNodeFallbackAvailable(): boolean {
  try {
    const playSound = require("play-sound") as unknown;
    return typeof playSound === "function";
  } catch {
    return false;
  }
}

export function generateDiagnosticReport(): string {
  const version = readCliVersion();
  const platform = process.platform;
  const nodeVersion = process.version;
  const arch = process.arch;

  const configSummary = getConfigSummary();
  const psInstalled = detectPowerShellIntegration();
  const gitBashInstalled = detectGitBashIntegration();

  const nativeScriptPresent = checkNativeScriptPresent();
  const powerShellAvailable = checkPowerShellAvailable();
  const nodeFallbackAvailable = checkNodeFallbackAvailable();

  const issuesDetected =
    (platform === "win32" && (!nativeScriptPresent || !powerShellAvailable)) ||
    !nodeFallbackAvailable;

  const lines: string[] = [];

  lines.push("==============================");
  lines.push("CrashCue Diagnostic Report");
  lines.push("==============================");
  lines.push("");
  lines.push(`Version: ${version}`);
  lines.push(`Platform: ${platform}`);
  lines.push(`Node: ${nodeVersion}`);
  lines.push(`Arch: ${arch}`);
  lines.push("");
  lines.push("--- Configuration ---");
  lines.push(`Muted: ${configSummary.muted ? "true" : "false"}`);
  lines.push(
    `Custom Sound Configured: ${configSummary.customSoundConfigured ? "Yes" : "No"}`,
  );
  lines.push(
    `Using Default Sound: ${configSummary.usingDefaultSound ? "Yes" : "No"}`,
  );
  lines.push("");
  lines.push("--- Integrations ---");
  lines.push(
    `PowerShell Integration: ${psInstalled ? "Installed" : "Not Detected"}`,
  );
  lines.push(
    `Git Bash Integration: ${gitBashInstalled ? "Installed" : "Not Detected"}`,
  );
  lines.push("");
  lines.push("--- Native Capabilities ---");
  lines.push(`Native Script Present: ${nativeScriptPresent ? "Yes" : "No"}`);
  lines.push(`PowerShell Available: ${powerShellAvailable ? "Yes" : "No"}`);
  lines.push(
    `Node Fallback Available: ${nodeFallbackAvailable ? "Yes" : "No"}`,
  );
  lines.push("");
  lines.push(
    `Overall Status: ${issuesDetected ? "Issues Detected" : "Healthy"}`,
  );
  lines.push("==============================");

  return lines.join("\n");
}
