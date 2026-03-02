#!/usr/bin/env node
// scripts/check-tgz.js <path-to-tgz>
// Exit 0 if contains package/assets/faahhhhhh.wav, else exit 2
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

if (process.argv.length < 3) {
  console.error("Usage: node scripts/check-tgz.js <path-to-tgz>");
  process.exit(2);
}
const tgz = path.resolve(process.argv[2]);
if (!fs.existsSync(tgz)) {
  console.error("File not found:", tgz);
  process.exit(2);
}
const res = spawnSync("tar", ["-tf", tgz], { encoding: "utf8" });
if (res.error) {
  console.error("tar error:", res.error);
  process.exit(2);
}
const out = res.stdout || "";
if (!out.includes("package/assets/faahhhhhh.wav")) {
  console.error("Mandatory asset not found in tarball. tar -tf output:\n", out);
  process.exit(2);
}
console.log("check-tgz: OK - mandatory asset found in", tgz);
process.exit(0);
