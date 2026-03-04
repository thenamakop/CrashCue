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
  const notifierDir = path.join(repoRoot, "packages", "notifier");
  const notifierDist = path.join(notifierDir, "dist");

  const sharedAssetsSrcDir = path.join(
    repoRoot,
    "packages",
    "shared-assets",
    "assets",
  );
  const notifierAssetsDestDir = path.join(notifierDist, "assets");

  const nativePs1Src = path.join(notifierDir, "native-windows.ps1");
  const nativePs1Dest = path.join(notifierDist, "native-windows.ps1");

  copyDir(sharedAssetsSrcDir, notifierAssetsDestDir);
  copyFile(nativePs1Src, nativePs1Dest);
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const notifierDir = path.join(repoRoot, "packages", "notifier");
  const outDir = path.join(notifierDir, "dist");

  await esbuild.build({
    entryPoints: [path.join(notifierDir, "src", "index.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(outDir, "index.js"),
    format: "cjs",
    sourcemap: false,
    external: [],
  });

  await esbuild.build({
    entryPoints: [path.join(notifierDir, "src", "cli.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(outDir, "cli.js"),
    format: "cjs",
    sourcemap: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
    external: [],
  });

  copyBuildAssets(repoRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
