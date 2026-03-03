# Changelog

## v0.2.2

- Split CI into CLI and VSCode Extension workflows with hardened smoke tests and regression guards.
- Add tag-driven release workflow with version synchronization checks for npm + VSCE publishing.
- Ensure packaging remains self-contained (no workspace assumptions, no runtime shared-assets imports).
