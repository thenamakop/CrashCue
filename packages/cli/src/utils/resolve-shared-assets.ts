// packages/cli/src/utils/resolve-shared-assets.ts
import fs from "fs";
import path from "path";

/**
 * Production-safe resolver for shared assets.
 * Tries several candidates in order and returns the first existing directory path.
 *
 * Candidate order:
 * 1) Installed package: require.resolve('@crashcue/shared-assets')
 * 2) Module-relative monorepo/bundled candidate: ../../../notifier/assets
 *    (this resolves to packages/notifier/assets when __dirname is packages/cli/src/utils)
 * 3) Module-relative alternate candidate: ../../notifier/assets
 *    (keeps compatibility with some build layouts)
 * 4) process.cwd() monorepo candidate: <cwd>/packages/notifier/assets
 * 5) root assets candidate: <cwd>/assets
 *
 * Throws a clear error if none found.
 */
export function resolveSharedAssets(): string {
  const tried: string[] = [];
  const debugPrefix = "Resolving shared assets from:";

  // 0) debug context
  // eslint-disable-next-line no-console
  console.log(`${debugPrefix} ${__dirname}`);

  // 1) Try installed package
  try {
    // require.resolve returns a file path inside the package; directory is package root
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call
    const resolved = require.resolve("@crashcue/shared-assets");
    const pkgDir = path.dirname(resolved);
    tried.push(`@crashcue/shared-assets -> ${pkgDir}`);
    if (fs.existsSync(pkgDir)) {
      // eslint-disable-next-line no-console
      console.log("Resolved shared-assets via require.resolve:", pkgDir);
      return pkgDir;
    }
  } catch (err) {
    // ignore - try next candidate
  }

  // 2) Module-relative monorepo/bundled candidate (three levels up)
  const bundledCandidate = path.resolve(__dirname, "../../../notifier/assets");
  tried.push(bundledCandidate);
  // eslint-disable-next-line no-console
  console.log("Checking bundled candidate (3up):", bundledCandidate);
  if (fs.existsSync(bundledCandidate)) return bundledCandidate;

  // 3) Module-relative alternate candidate (two levels up)
  const altBundledCandidate = path.resolve(__dirname, "../../notifier/assets");
  tried.push(altBundledCandidate);
  // eslint-disable-next-line no-console
  console.log(
    "Checking bundled alternate candidate (2up):",
    altBundledCandidate,
  );
  if (fs.existsSync(altBundledCandidate)) return altBundledCandidate;

  // 4) process.cwd() monorepo candidate
  const monorepoCandidate = path.resolve(
    process.cwd(),
    "packages",
    "notifier",
    "assets",
  );
  tried.push(monorepoCandidate);
  // eslint-disable-next-line no-console
  console.log("Checking monorepo candidate:", monorepoCandidate);
  if (fs.existsSync(monorepoCandidate)) return monorepoCandidate;

  // 5) root assets candidate (repo root assets/)
  const rootAssetsCandidate = path.resolve(process.cwd(), "assets");
  tried.push(rootAssetsCandidate);
  // eslint-disable-next-line no-console
  console.log("Checking root assets candidate:", rootAssetsCandidate);
  if (fs.existsSync(rootAssetsCandidate)) return rootAssetsCandidate;

  // Nothing found — print debug summary and throw
  // eslint-disable-next-line no-console
  console.error("Failed to resolve shared assets. Checked locations:");
  // eslint-disable-next-line no-console
  console.error("1. @crashcue/shared-assets (require)");
  // eslint-disable-next-line no-console
  console.error("2. " + bundledCandidate);
  // eslint-disable-next-line no-console
  console.error("3. " + altBundledCandidate);
  // eslint-disable-next-line no-console
  console.error("4. " + monorepoCandidate);
  // eslint-disable-next-line no-console
  console.error("5. " + rootAssetsCandidate);

  throw new Error(
    "Cannot resolve shared assets. Ensure @crashcue/shared-assets is installed or that notifier assets are bundled into packages/notifier/assets or root assets/.",
  );
}
