# Tasks

- [x] Task 1: Implement Asset Resolution Utility
  - [x] Create `packages/cli/src/utils/resolve-shared-assets.ts` with robust fallback logic.
  - [x] Create `packages/cli/src/__tests__/resolve-shared-assets.test.ts` with unit tests mocking `fs` and `require`.

- [x] Task 2: Integrate Resolution Utility into CLI
  - [x] Search for existing asset resolution code in `packages/cli`.
  - [x] Replace old logic with `resolveSharedAssets`.

- [x] Task 3: Ensure Notifier Bundles Assets
  - [x] Verify/Create `scripts/copy-shared-assets-into-notifier.js` (idempotent, cross-platform).
  - [x] Update `packages/notifier/package.json` to include `prepack` script and `files` entry.

- [x] Task 4: Packaging and Verification Scripts
  - [x] Ensure `scripts/pack-notifier.js` exists and works.
  - [x] Ensure `scripts/check-tgz.js` exists.
  - [x] Update root `package.json` with `pack:notifier` script if missing.

- [x] Task 5: Verification and Cleanup
  - [x] Run `npm run build` and `npm test`.
  - [x] Perform smoke test: Pack notifier, install globally, run `crashcue --help`.

- [ ] Task 6: Fix Asset Resolver Monorepo Fallback
  - [ ] Update `packages/cli/src/utils/resolve-shared-assets.ts` with production-grade fallback logic.
  - [ ] Update unit tests in `packages/cli/src/__tests__/resolve-shared-assets.test.ts` to match robust resolution paths.
  - [ ] Verify fix by running `npm test`.
