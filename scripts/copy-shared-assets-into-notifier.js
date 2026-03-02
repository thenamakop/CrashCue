// scripts/copy-shared-assets-into-notifier.js
// Copies packages/shared-assets/assets/* into packages/notifier/assets/
// Exit with non-zero code if source doesn't exist or copy fails.

const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    // ensure dest dir exists
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  try {
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

    if (!fs.existsSync(sharedAssetsDir)) {
      console.error(`Shared assets dir not found: ${sharedAssetsDir}`);
      process.exit(1);
    }

    // Clean destination first (idempotent)
    if (fs.existsSync(notifierAssetsDir)) {
      // remove files recursively
      const rimraf = (p) => {
        if (!fs.existsSync(p)) return;
        for (const name of fs.readdirSync(p)) {
          const cur = path.join(p, name);
          if (fs.statSync(cur).isDirectory()) rimraf(cur);
          else fs.unlinkSync(cur);
        }
        // do not remove assets dir itself; keep it
      };
      rimraf(notifierAssetsDir);
    }

    copyRecursive(sharedAssetsDir, notifierAssetsDir);
    console.log("Copied shared-assets -> packages/notifier/assets");
    process.exit(0);
  } catch (err) {
    console.error(
      "Error copying shared assets:",
      err && err.stack ? err.stack : err,
    );
    process.exit(1);
  }
}

main();
