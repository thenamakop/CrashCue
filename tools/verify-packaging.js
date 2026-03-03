const path = require("path");
const fs = require("fs");
const os = require("os");
const { execSync, spawnSync } = require("child_process");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function run(cmd, opts) {
  const out = execSync(cmd, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    ...opts,
  });
  return out;
}

function runNode(entry, args, opts) {
  const res = spawnSync(process.execPath, [entry, ...args], {
    stdio: "inherit",
    ...opts,
  });
  if (res.status !== 0) {
    throw new Error(`Command failed: node ${entry} ${args.join(" ")}`);
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const cliDir = path.join(repoRoot, "packages", "cli");
  const verifyRoot = path.join(repoRoot, ".pack-verify");
  const prefixDir = path.join(verifyRoot, "prefix");
  const outsideDir = path.join(verifyRoot, "outside");

  resetDir(verifyRoot);
  resetDir(prefixDir);
  resetDir(outsideDir);

  const tgzName = run("npm pack", { cwd: cliDir }).trim().split(/\s+/).pop();
  if (!tgzName) throw new Error("npm pack did not produce a tarball name");

  const tgzPath = path.join(cliDir, tgzName);
  if (!fs.existsSync(tgzPath)) throw new Error(`Tarball missing: ${tgzPath}`);

  const tarList = run(`tar -tf "${tgzPath}"`, { cwd: repoRoot });
  fs.writeFileSync(path.join(verifyRoot, "tarball-files.txt"), tarList, "utf8");

  run(
    `npm install -g "${tgzPath}" --prefix "${prefixDir}" --no-audit --no-fund --registry http://127.0.0.1:9`,
    { cwd: repoRoot },
  );

  const installedPkgDir = path.join(prefixDir, "node_modules", "crashcue");
  const installedEntry = path.join(installedPkgDir, "dist", "index.js");
  const installedAssetsDir = path.join(installedPkgDir, "dist", "assets");
  const installedWav = path.join(installedAssetsDir, "faahhhhhh.wav");
  const installedPs1 = path.join(installedPkgDir, "dist", "native-windows.ps1");

  if (!fs.existsSync(installedEntry))
    throw new Error(`Missing dist/index.js: ${installedEntry}`);
  if (!fs.existsSync(installedPs1))
    throw new Error(`Missing dist/native-windows.ps1: ${installedPs1}`);
  if (!fs.existsSync(installedWav))
    throw new Error(`Missing dist/assets/faahhhhhh.wav: ${installedWav}`);

  const env = {
    ...process.env,
    CRASHCUE_TEST_ASSETS_PATH: installedAssetsDir,
    HOME: outsideDir,
    USERPROFILE: outsideDir,
    APPDATA: outsideDir,
    LOCALAPPDATA: outsideDir,
    TMPDIR: outsideDir,
    TEMP: outsideDir,
    TMP: outsideDir,
  };

  runNode(installedEntry, ["--help"], { cwd: outsideDir, env });
  runNode(installedEntry, ["test"], { cwd: outsideDir, env });

  const secondOutside = path.join(os.tmpdir(), "crashcue-pack-verify");
  resetDir(secondOutside);
  runNode(installedEntry, ["test"], { cwd: secondOutside, env });
}

main();
