const fs = require("fs");
const path = require("path");
const { mkdirSync, copyFileSync, existsSync, readdirSync } = fs;

const repoRoot = path.resolve(__dirname, "..");
const from = path.join(repoRoot, "packages", "shared-assets");
const to = path.join(repoRoot, "packages", "notifier", "assets");

function copyDir(src, dest) {
  if (!existsSync(src)) throw new Error(`Source assets missing: ${src}`);
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

try {
  copyDir(from, to);
  console.log("Copied shared-assets -> packages/notifier/assets");
} catch (err) {
  console.error("Error copying shared assets:", err.message);
  process.exit(1);
}
