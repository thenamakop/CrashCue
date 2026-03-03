const fs = require("fs");
const path = require("path");

function isTextFile(p) {
  return /\.(yml|yaml|json|js|ts|md|ps1|sh)$/i.test(p);
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules") continue;
    if (e.name === ".git") continue;
    if (e.name === "dist") continue;
    if (e.name === "coverage") continue;
    if (e.name === ".pack-verify") continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const files = [];
  walk(repoRoot, files);

  const hits = [];
  for (const f of files) {
    if (!isTextFile(f)) continue;
    const rel = path.relative(repoRoot, f);
    const content = fs.readFileSync(f, "utf8");
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const hasWorkspaceFlag =
        line.includes("--workspace") ||
        /(^|\s)-w(\s|$)/.test(line) ||
        /npm(\.cmd)?\s+run\b.*\s-w\s+/i.test(line) ||
        /npm(\.cmd)?\s+\S+\s+--workspace\b/i.test(line);

      if (hasWorkspaceFlag) {
        hits.push(`${rel}:${i + 1}:${line}`);
      }
    }
  }

  if (hits.length > 0) {
    process.stderr.write("Workspace flag usage is not allowed:\n");
    for (const h of hits) process.stderr.write(`${h}\n`);
    process.exit(1);
  }
}

main();
