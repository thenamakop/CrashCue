const { spawnSync } = require("child_process");

function runNpm(args) {
  const npmExecPath = process.env.npm_execpath;
  const res = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, ...args], { stdio: "inherit" })
    : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
        stdio: "inherit",
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

if (!target) {
  runNpm(["-w", "packages/cli", "run", "build"]);
  runNpm(["-w", "packages/vscode-extension", "run", "build"]);
} else if (target === "cli") {
  runNpm(["-w", "packages/cli", "run", "build"]);
} else if (target === "ext") {
  runNpm(["-w", "packages/vscode-extension", "run", "build"]);
} else {
  process.exit(1);
}
