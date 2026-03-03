const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function fail(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function main() {
  const tgzPath = process.argv[2];
  if (!tgzPath)
    fail("Usage: node tools/ci/inspect-cli-tarball.js <path-to-tgz>");

  const abs = path.resolve(tgzPath);
  if (!fs.existsSync(abs)) fail(`Missing tarball: ${abs}`);

  const stat = fs.statSync(abs);
  const maxBytes = 5 * 1024 * 1024;
  if (stat.size > maxBytes) {
    fail(`CLI tarball exceeds 5MB: ${stat.size} bytes`);
  }

  let list;
  try {
    list = execFileSync("tar", ["-tf", abs], { encoding: "utf8" });
  } catch (e) {
    fail("tar -tf failed (tar must be available on the runner)");
  }

  const files = list
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const required = [
    "package/package.json",
    "package/dist/index.js",
    "package/dist/native-windows.ps1",
    "package/dist/assets/faahhhhhh.wav",
  ];
  for (const r of required) {
    if (!files.includes(r)) fail(`Tarball missing required file: ${r}`);
  }

  const disallowed = [
    "package/node_modules/",
    "package/packages/",
    "package/notifier/",
    "package/shared-assets/",
    "package/shared-config/",
  ];
  for (const f of files) {
    if (f.includes("..") || f.includes(":"))
      fail(`Tarball contains invalid path: ${f}`);
    for (const p of disallowed) {
      if (f.startsWith(p)) fail(`Tarball contains disallowed path: ${f}`);
    }
  }
}

main();
