#!/usr/bin/env node
// scripts/pack-notifier.js
// Build repo, copy shared assets into notifier, pack notifier, and move artifact to ./dist-packages
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  if (res.error) throw res.error;
  if (res.status !== 0)
    throw new Error(`${cmd} ${args.join(" ")} failed with exit ${res.status}`);
  return res;
}

(async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const notifierDir = path.join(repoRoot, "packages", "notifier");
  const distPackages = path.join(repoRoot, "dist-packages");

  try {
    // Build at repo root (if your project has a build step)
    console.log("Running root build...");
    run("npm", ["run", "build"], { cwd: repoRoot });

    // Copy shared assets safely (this script throws on failure)
    console.log("Copying shared assets into notifier...");
    run(
      "node",
      [path.join(repoRoot, "scripts", "copy-shared-assets-into-notifier.js")],
      { cwd: repoRoot },
    );

    // Ensure dist-packages directory exists
    if (!fs.existsSync(distPackages))
      fs.mkdirSync(distPackages, { recursive: true });

    // Run npm pack in notifier package (prints filename)
    console.log("Running npm pack in notifier...");
    run("npm", ["pack"], { cwd: notifierDir });

    // Find the produced tarball
    const files = fs.readdirSync(notifierDir);
    const tgz = files.find((f) => f.endsWith(".tgz"));
    if (!tgz)
      throw new Error(
        "npm pack did not produce a .tgz file in packages/notifier",
      );

    const srcTgz = path.join(notifierDir, tgz);
    const destTgz = path.join(distPackages, tgz);

    // Move the tarball to repo root dist-packages
    fs.copyFileSync(srcTgz, destTgz);
    console.log(`Tarball copied to ${destTgz}`);

    // Verify tarball contains mandatory asset using tar -tf
    console.log("Verifying tarball contents...");
    const tarArgs = ["-tf", destTgz];
    const spawn = spawnSync("tar", tarArgs, { encoding: "utf8" });
    if (spawn.error) {
      console.error("tar error:", spawn.error);
      throw spawn.error;
    }
    if (spawn.status !== 0) {
      console.error(
        "tar failed with status",
        spawn.status,
        "stdout:",
        spawn.stdout,
        "stderr:",
        spawn.stderr,
      );
      throw new Error("tar failed to list the archive");
    }
    const out = spawn.stdout || "";
    if (!out.includes("package/assets/faahhhhhh.wav")) {
      console.error("Tarball contents:\n", out);
      throw new Error(
        "Mandatory asset package/assets/faahhhhhh.wav not found inside the tarball",
      );
    }
    console.log("Verification OK: mandatory asset exists in tarball");

    console.log("Packaging complete. Artifact:", destTgz);
    process.exit(0);
  } catch (err) {
    console.error(
      "pack-notifier.js ERROR:",
      err && (err.stack || err.message || err),
    );
    process.exit(3);
  }
})();
