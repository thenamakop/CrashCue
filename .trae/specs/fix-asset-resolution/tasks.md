# Tasks

- [x] Task 1: Implement Asset Resolution Utility
  - [x] Create `packages/cli/src/utils/resolve-shared-assets.ts` with robust fallback logic.
  - [x] Create `packages/cli/src/__tests__/resolve-shared-assets.test.ts` with unit tests mocking `fs` and `require`.

- [ ] Task 2: Integrate Resolution Utility into CLI
  - [ ] Search for existing asset resolution code in `packages/cli`.
  - [ ] Replace old logic with `resolveSharedAssets`.

- [ ] Task 3: Ensure Notifier Bundles Assets
  - [ ] Verify/Create `scripts/copy-shared-assets-into-notifier.js` (idempotent, cross-platform).
  - [ ] Update `packages/notifier/package.json` to include `prepack` script and `files` entry.

- [ ] Task 4: Packaging and Verification Scripts
  - [ ] Ensure `scripts/pack-notifier.js` exists and works.
  - [ ] Ensure `scripts/check-tgz.js` exists.
  - [ ] Update root `package.json` with `pack:notifier` script if missing.

- [ ] Task 5: Verification and Cleanup
  - [ ] Run `npm run build` and `npm test`.
  - [ ] Perform smoke test: Pack notifier, install globally, run `crashcue --help`.
