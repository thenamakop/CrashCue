#!/usr/bin/env node
// scripts/copy-shared-assets-into-notifier.js
// Safely copy shared-assets into packages/notifier/assets
const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

function fail(msg) {
  console.error("copy-shared-assets-into-notifier ERROR:", msg);
  process.exit(2);
}

(function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const sharedAssetsDir = path.join(
    repoRoot,
    "packages",
    "shared-assets",
    "assets",
  );
  const notifierAssetsDir = path.join(
    repoRoot,
    "packages",
    "notifier",
    "assets",
  );

  console.log("copy-shared-assets-into-notifier: repoRoot=", repoRoot);
  console.log(
    "copy-shared-assets-into-notifier: sharedAssetsDir=",
    sharedAssetsDir,
  );
  console.log(
    "copy-shared-assets-into-notifier: notifierAssetsDir=",
    notifierAssetsDir,
  );

  if (!fs.existsSync(sharedAssetsDir)) {
    fail(
      `Shared assets dir not found: ${sharedAssetsDir}. Ensure shared-assets package has an 'assets' folder with the required files.`,
    );
  }

  // Copy recursively
  const ok = copyRecursive(sharedAssetsDir, notifierAssetsDir);
  if (!ok) {
    fail(
      `Failed to copy assets from ${sharedAssetsDir} to ${notifierAssetsDir}`,
    );
  }

  // Verify mandatory file exists after copy
  const mandatory = path.join(notifierAssetsDir, "faahhhhhh.wav");
  if (!fs.existsSync(mandatory)) {
    fail(`Mandatory asset not found after copy: ${mandatory}`);
  }

  console.log(
    "copy-shared-assets-into-notifier: Done. Mandatory asset present:",
    mandatory,
  );
})();
