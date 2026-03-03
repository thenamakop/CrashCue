const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function runNpm(args, opts = {}) {
  const npmExecPath = process.env.npm_execpath;
  const res = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, ...args], {
        stdio: "inherit",
        ...opts,
      })
    : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
        stdio: "inherit",
        ...opts,
      });

  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }

  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

const target = process.argv[2];
const repoRoot = path.resolve(__dirname, "..");
const cliDir = path.join(repoRoot, "packages", "cli");
const extDir = path.join(repoRoot, "packages", "vscode-extension");

function ensureExtensionDeps() {
  const nodeModulesDir = path.join(extDir, "node_modules");
  if (fs.existsSync(nodeModulesDir)) return;

  const lockPath = path.join(extDir, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    runNpm(["ci", "--no-audit", "--no-fund"], { cwd: extDir });
  } else {
    runNpm(["install", "--no-audit", "--no-fund"], { cwd: extDir });
  }
}

if (!target) {
  runNpm(["run", "build"], { cwd: cliDir });
  ensureExtensionDeps();
  runNpm(["run", "build"], { cwd: extDir });
} else if (target === "cli") {
  runNpm(["run", "build"], { cwd: cliDir });
} else if (target === "ext") {
  ensureExtensionDeps();
  runNpm(["run", "build"], { cwd: extDir });
} else {
  process.exit(1);
}
