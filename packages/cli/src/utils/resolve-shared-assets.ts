import fs from "fs";
import path from "path";

/**
 * Resolve shared assets directory in three ways (in order):
 * 1) If @crashcue/shared-assets is installed, resolve it via require.resolve
 * 2) If notifier is installed as a sibling package (global install bundling),
 *    resolve module-relative path ../../notifier/assets (safe for global installs)
 * 3) If executing inside monorepo dev, resolve process.cwd()/packages/notifier/assets
 *
 * This function never assumes a monorepo root and only uses __dirname for module
 * relative lookups which is safe in production builds.
 */
export function resolveSharedAssets(): string {
  // Debug logging
  console.log("Resolving shared assets from:", __dirname);

  // 1) installed package
  try {
    // require.resolve may return a file path inside the package; return its dir
    const resolved = require.resolve("@crashcue/shared-assets");
    // If resolved points to index.js in dist or src, we need to find the root of the package or assets dir
    // Assuming package structure: pkg/dist/index.js -> pkg/
    // We want pkg/assets if it exists, or just pkg if it contains assets
    // But @crashcue/shared-assets usually exports from src/index.ts or dist/index.js

    // Let's try to find the directory containing 'assets'
    let dir = path.dirname(resolved);
    // Walk up until we find assets or package.json
    for (let i = 0; i < 3; i++) {
      if (fs.existsSync(path.join(dir, "assets"))) {
        return path.join(dir, "assets");
      }
      dir = path.dirname(dir);
    }
  } catch (err) {
    // ignore
  }

  // 2) bundled notifier (module relative) - safe for global install where
  // node_modules/crashcue/packages/cli/... -> ../../notifier/assets
  // In our case, cli/src/utils -> ../../../notifier/assets (3 levels up)
  // If compiled to dist/utils -> ../../../notifier/assets
  const bundledCandidate = path.resolve(__dirname, "../../notifier/assets");
  console.log("Checking bundled candidate:", bundledCandidate);
  if (fs.existsSync(bundledCandidate)) return bundledCandidate;

  // 3) local monorepo workspace dev fallback (process.cwd())
  const monorepoCandidate = path.resolve(
    process.cwd(),
    "packages/notifier/assets",
  );
  console.log("Checking monorepo candidate:", monorepoCandidate);
  if (fs.existsSync(monorepoCandidate)) return monorepoCandidate;

  // 4) Root assets fallback (for repo root execution or root bundle)
  // dist/index.js -> ../../../assets
  const rootAssetsCandidate = path.resolve(__dirname, "../../..", "assets");
  console.log("Checking root assets candidate:", rootAssetsCandidate);
  if (fs.existsSync(path.join(rootAssetsCandidate, "faahhhhhh.wav")))
    return rootAssetsCandidate;

  // Debug output if failed
  console.error("Failed to resolve shared assets. Checked locations:");
  console.error("1. @crashcue/shared-assets (require)");
  console.error("2. " + bundledCandidate);
  console.error("3. " + monorepoCandidate);
  console.error("4. " + rootAssetsCandidate);

  throw new Error(
    "Cannot resolve shared assets. Ensure @crashcue/shared-assets is installed or assets are bundled.",
  );
}
