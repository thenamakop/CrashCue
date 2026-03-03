const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyBuildAssets(repoRoot) {
  const cliDist = path.join(repoRoot, "packages", "cli", "dist");

  const nativePs1Src = path.join(
    repoRoot,
    "packages",
    "notifier",
    "native-windows.ps1",
  );
  const nativePs1Dest = path.join(cliDist, "native-windows.ps1");

  const wavSrc = path.join(
    repoRoot,
    "packages",
    "shared-assets",
    "assets",
    "faahhhhhh.wav",
  );
  const wavDest = path.join(cliDist, "assets", "faahhhhhh.wav");

  copyFile(nativePs1Src, nativePs1Dest);
  copyFile(wavSrc, wavDest);
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");

  await esbuild.build({
    entryPoints: [path.join(repoRoot, "packages", "cli", "src", "index.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(repoRoot, "packages", "cli", "dist", "index.js"),
    format: "cjs",
    sourcemap: false,
    external: [],
  });

  copyBuildAssets(repoRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
