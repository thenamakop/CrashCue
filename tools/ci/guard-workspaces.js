const fs = require("fs");
const path = require("path");

function fail(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const rootPkgPath = path.join(repoRoot, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));

  const workspaces = rootPkg.workspaces;
  if (!Array.isArray(workspaces))
    fail("package.json: workspaces must be an array");

  const invalid = workspaces.filter(
    (w) => typeof w !== "string" || /[*?[\]]/.test(w) || w.includes(".."),
  );
  if (invalid.length > 0) {
    fail(`package.json: invalid workspaces entries: ${invalid.join(", ")}`);
  }

  if (workspaces.includes("packages/vscode-extension")) {
    fail("package.json: packages/vscode-extension must not be in workspaces");
  }

  const required = [
    "packages/cli",
    "packages/notifier",
    "packages/shared-assets",
    "packages/shared-config",
  ];
  const missing = required.filter((r) => !workspaces.includes(r));
  if (missing.length > 0) {
    fail(`package.json: missing required workspace(s): ${missing.join(", ")}`);
  }
}

main();
