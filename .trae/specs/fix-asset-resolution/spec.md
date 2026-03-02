# Fix Asset Resolution Spec

## Why

Currently, global installations of the `crashcue` CLI fail to locate shared assets (like the default sound file) because the relative paths used in the monorepo structure (e.g., `file:../shared-assets`) break when packages are packed and installed in isolation. This results in `MODULE_NOT_FOUND` errors at runtime. We need a robust resolution strategy that handles monorepo dev, sibling package installs, and bundled scenarios.

## What Changes

- **New Utility**: Create `packages/cli/src/utils/resolve-shared-assets.ts` to handle asset path resolution with multiple fallbacks.
- **CLI Update**: Refactor `packages/cli` code to use this new utility instead of hardcoded paths or direct imports.
- **Notifier Packaging**: Ensure `packages/notifier` copies assets into its own directory during `prepack` so they are included in the published tarball.
- **Tests**: Add unit tests for the resolution logic covering all fallback scenarios.
- **Scripts**: Update/ensure existence of `scripts/copy-shared-assets-into-notifier.js` and `scripts/pack-notifier.js`.

## Impact

- **Affected specs**: Packaging and Installation.
- **Affected code**: `packages/cli`, `packages/notifier`, `scripts/`.

## ADDED Requirements

### Requirement: Robust Asset Resolution

The system SHALL resolve the path to shared assets by trying the following in order:

1.  `require.resolve("@crashcue/shared-assets")` (Standard node resolution).
2.  Module-relative path `../../notifier/assets` (Bundled global install).
3.  `process.cwd()/packages/notifier/assets` (Local monorepo dev).

### Requirement: Self-Contained Notifier Package

The `packages/notifier` package SHALL include the `assets` directory in its distribution tarball.

- **WHEN** `npm pack` is run in `packages/notifier`.
- **THEN** The resulting `.tgz` MUST contain `package/assets/faahhhhhh.wav`.

## MODIFIED Requirements

### Requirement: CLI Asset Usage

The CLI SHALL use the `resolveSharedAssets` utility to determine the `DEFAULT_SOUND_PATH`.
