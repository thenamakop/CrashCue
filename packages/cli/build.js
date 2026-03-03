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

function copyDir(srcDir, destDir) {
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
    }
  }
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

  const sharedAssetsSrcDir = path.join(
    repoRoot,
    "packages",
    "shared-assets",
    "assets",
  );
  const cliAssetsDestDir = path.join(cliDist, "assets");

  copyFile(nativePs1Src, nativePs1Dest);
  copyDir(sharedAssetsSrcDir, cliAssetsDestDir);
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
