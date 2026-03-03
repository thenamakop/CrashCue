const esbuild = require("esbuild");
const path = require("path");

async function main() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, "src", "extension.ts")],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    outfile: path.join(__dirname, "dist", "extension.js"),
    external: ["vscode"],
    minify: false,
    sourcemap: false,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
