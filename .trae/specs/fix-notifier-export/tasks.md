# Tasks

- [ ] Task 1: Restore Notifier Class and Implement Lazy Resolver
  - [ ] Rewrite `packages/notifier/src/index.ts` to include the `Notifier` class.
  - [ ] Implement `resolveSharedAssets` as a private helper function within the file (or module-scope but not exported if not needed, or exported if tests need it - spec says "private helper inside the file", but CLI tests might rely on `resolveSharedAssets` export? The user prompt says "The file MUST export: export class Notifier", and "Implement a private helper... function resolveSharedAssets(): string". It doesn't explicitly forbid exporting the helper, but the goal is to restore the Notifier. The CLI uses `Notifier`. Let's stick to the prompt: `Implement a private helper`. NOTE: If CLI uses `resolveSharedAssets` from notifier, we might need to check. The prompt says "CLI imports it: import { Notifier } from ...". It doesn't mention CLI importing resolveSharedAssets from notifier index. CLI has its own resolver now. So private is fine. Wait, the previous `index.ts` exported `resolveSharedAssets`. Let's check if anything else uses it. The prompt says "Restore the full Notifier implementation". )
  - [ ] Ensure `notify` method calls the resolver lazily.

- [ ] Task 2: Verification
  - [ ] Run `npm ci`.
  - [ ] Run `npm run build`.
  - [ ] Run `npm test`.
