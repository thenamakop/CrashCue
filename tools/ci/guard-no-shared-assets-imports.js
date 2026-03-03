const fs = require("fs");
const path = require("path");

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
}

function isTextFile(p) {
  return /\.(ts|js|cjs|mjs|json)$/i.test(p);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const targets = [
    path.join(repoRoot, "packages", "cli", "src"),
    path.join(repoRoot, "packages", "cli", "dist"),
    path.join(repoRoot, "packages", "notifier", "src"),
    path.join(repoRoot, "packages", "notifier", "dist"),
    path.join(repoRoot, "packages", "vscode-extension", "src"),
    path.join(repoRoot, "packages", "vscode-extension", "dist"),
  ];

  const files = [];
  for (const t of targets) walk(t, files);

  const hits = [];
  for (const f of files) {
    if (!isTextFile(f)) continue;
    const rel = path.relative(repoRoot, f);
    const content = fs.readFileSync(f, "utf8");
    if (content.includes("@crashcue/shared-assets")) hits.push(rel);
  }

  const cliPkg = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "packages", "cli", "package.json"),
      "utf8",
    ),
  );
  const deps = {
    ...(cliPkg.dependencies || {}),
    ...(cliPkg.optionalDependencies || {}),
  };
  if (deps["@crashcue/shared-assets"]) {
    hits.push(
      "packages/cli/package.json (dependency on @crashcue/shared-assets)",
    );
  }

  if (hits.length > 0) {
    process.stderr.write(
      "Runtime references to @crashcue/shared-assets are not allowed:\n",
    );
    for (const h of hits) process.stderr.write(`${h}\n`);
    process.exit(1);
  }
}

main();
