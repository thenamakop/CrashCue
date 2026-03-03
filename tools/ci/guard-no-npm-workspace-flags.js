const fs = require("fs");
const path = require("path");

const ALLOWLIST_DIRS = [".github", "packages", "scripts"];
const IGNORE_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".pack-verify",
]);

function isTextFile(p) {
  return /\.(yml|yaml|json|js|ts|md|ps1|sh)$/i.test(p);
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIR_NAMES.has(e.name)) continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
}

function looksLikeCommentLine(line, ext) {
  const t = line.trim();
  if (!t) return true;
  if (ext === ".ps1" || ext === ".sh" || ext === ".yaml" || ext === ".yml") {
    return t.startsWith("#");
  }
  if (ext === ".md") {
    return t.startsWith("<!--") || t.startsWith("[//]:") || t.startsWith("#");
  }
  return false;
}

function containsWorkspaceFlagInNpmCommand(text) {
  if (!/\bnpm(\.cmd)?\b/i.test(text)) return false;
  if (/(?:^|[\s"'`])--workspace(?:\s+|=)/i.test(text)) return true;
  if (/(?:^|[\s"'`])-w(?:\s+|=)/.test(text)) return true;
  return false;
}

function extractInlineStringLiterals(line) {
  const out = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push(m[2]);
  }
  return out;
}

function scanJsonFileForHits(jsonText, rel) {
  let obj;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    return [];
  }

  const hits = [];
  const stack = [{ value: obj, path: "$" }];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;

    const v = cur.value;
    if (typeof v === "string") {
      if (containsWorkspaceFlagInNpmCommand(v)) {
        hits.push(`${rel}:${cur.path}:${v}`);
      }
      continue;
    }

    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        stack.push({ value: v[i], path: `${cur.path}[${i}]` });
      }
      continue;
    }

    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) {
        stack.push({ value: v[k], path: `${cur.path}.${k}` });
      }
    }
  }

  return hits;
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const files = [];
  for (const dir of ALLOWLIST_DIRS) {
    const abs = path.join(repoRoot, dir);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      walk(abs, files);
    }
  }

  const hits = [];
  for (const f of files) {
    if (!isTextFile(f)) continue;
    if (path.resolve(f) === path.resolve(__filename)) continue;
    const rel = path.relative(repoRoot, f);
    const content = fs.readFileSync(f, "utf8");
    const ext = path.extname(f).toLowerCase();

    if (ext === ".json") {
      hits.push(...scanJsonFileForHits(content, rel));
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (looksLikeCommentLine(line, ext)) continue;

      if (ext === ".js" || ext === ".ts") {
        const literals = extractInlineStringLiterals(line);
        for (const s of literals) {
          if (containsWorkspaceFlagInNpmCommand(s)) {
            hits.push(`${rel}:${i + 1}:${s}`);
            break;
          }
        }
        continue;
      }

      if (containsWorkspaceFlagInNpmCommand(line)) {
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
