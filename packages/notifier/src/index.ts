import fs from "fs";
import path from "path";

/**
 * Resolve shared assets for the notifier package.
 * Robust across:
 * - Installed npm package
 * - Monorepo development
 * - Global install
 */
export function resolveSharedAssets(): string {
  const candidates: string[] = [];

  // 1) Installed package (@crashcue/shared-assets)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve("@crashcue/shared-assets");
    const pkgDir = path.dirname(resolved);
    if (fs.existsSync(pkgDir)) {
      return pkgDir;
    }
  } catch {
    // ignore
  }

  // 2) Module-relative (when notifier installed)
  const moduleRelative = path.resolve(__dirname, "../assets");
  candidates.push(moduleRelative);
  if (fs.existsSync(moduleRelative)) return moduleRelative;

  // 3) Alternate layout
  const altModuleRelative = path.resolve(__dirname, "../../notifier/assets");
  candidates.push(altModuleRelative);
  if (fs.existsSync(altModuleRelative)) return altModuleRelative;

  // 4) Monorepo layout
  const monorepoCandidate = path.resolve(
    process.cwd(),
    "packages",
    "notifier",
    "assets",
  );
  candidates.push(monorepoCandidate);
  if (fs.existsSync(monorepoCandidate)) return monorepoCandidate;

  // 5) Root-level assets
  const rootAssetsCandidate = path.resolve(process.cwd(), "assets");
  candidates.push(rootAssetsCandidate);
  if (fs.existsSync(rootAssetsCandidate)) return rootAssetsCandidate;

  console.error(
    "Notifier failed to resolve shared assets. Checked:",
    candidates,
  );

  throw new Error(
    "Cannot resolve shared assets. Expected installed @crashcue/shared-assets or bundled packages/notifier/assets/",
  );
}
