# Fix Notifier Export and Resolver Spec

## Why

The previous update to `packages/notifier/src/index.ts` inadvertently removed the `Notifier` class export, causing the build to fail because the CLI package depends on it. Additionally, the asset resolution logic needs to be lazy to avoid side effects at module load time and ensure robustness.

## What Changes

- **Restore Notifier Class**: Re-implement the `Notifier` class with its full public API (constructor, `notify`, `playWavWindows`, `playNodeFallback`, `startIpcServer`).
- **Lazy Asset Resolution**: Move asset resolution logic into a private helper function that is called only when needed (lazily), rather than at the top level.
- **Robust Resolution**: Implement the specified fallback strategy for finding shared assets.

## Impact

- **Affected specs**: None directly, but fixes the build and runtime errors.
- **Affected code**: `packages/notifier/src/index.ts`.

## ADDED Requirements

### Requirement: Lazy Asset Resolution

The system SHALL resolve the path to shared assets only when `notify()` is called or when specifically requested, not at module load time.

### Requirement: Restored API

The `packages/notifier` package SHALL export a `Notifier` class that is compatible with the existing CLI usage.

## MODIFIED Requirements

### Requirement: Asset Resolution Order

The resolver SHALL check candidates in the following order:

1. `require.resolve('@crashcue/shared-assets')`
2. `path.resolve(__dirname, '../assets')`
3. `path.resolve(__dirname, '../../notifier/assets')`
4. `path.resolve(process.cwd(), 'packages', 'notifier', 'assets')`
5. `path.resolve(process.cwd(), 'assets')`

## REMOVED Requirements

- **Top-level execution**: Removed any top-level calls to resolution logic.
