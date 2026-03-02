const esbuild = require("esbuild");
const path = require("path");

esbuild
  .build({
    entryPoints: [path.resolve(__dirname, "../packages/cli/src/index.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.resolve(__dirname, "../packages/cli/dist/index.js"),
    format: "cjs",
    sourcemap: false,
    // banner: { js: "#!/usr/bin/env node" }, // Removed to avoid double shebang
    external: [], // bundle EVERYTHING
  })
  .then(() => {
    console.log("✅ CrashCue bundled successfully");
  })
  .catch((err) => {
    console.error("❌ Bundle failed:", err);
    process.exit(1);
  });
