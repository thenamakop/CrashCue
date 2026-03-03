const fs = require("fs");
const path = require("path");

function fail(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const tag = process.argv[2] || process.env.GITHUB_REF_NAME;
  if (!tag) fail("Missing tag (pass as arg or set GITHUB_REF_NAME)");
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) fail(`Invalid tag format: ${tag}`);

  const ver = tag.slice(1);
  const repoRoot = path.resolve(__dirname, "..", "..");

  const files = [
    path.join(repoRoot, "package.json"),
    path.join(repoRoot, "packages", "cli", "package.json"),
    path.join(repoRoot, "packages", "vscode-extension", "package.json"),
    path.join(repoRoot, "packages", "notifier", "package.json"),
    path.join(repoRoot, "packages", "shared-assets", "package.json"),
    path.join(repoRoot, "packages", "shared-config", "package.json"),
  ];

  const mismatches = [];
  for (const f of files) {
    const pkg = readJson(f);
    if (pkg.version !== ver)
      mismatches.push(`${path.relative(repoRoot, f)}=${pkg.version}`);
  }

  if (mismatches.length > 0) {
    fail(`Version mismatch for ${tag}:\n${mismatches.join("\n")}`);
  }

  const changelogPath = path.join(repoRoot, "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf8");
  if (!changelog.includes(`## ${tag}`))
    fail(`CHANGELOG.md missing section: ## ${tag}`);
}

main();
