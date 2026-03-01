# Changelog

## v0.1.0 — 2026-03-01

### Added

- Windows-aware audio playback (.wav native, .mp3 fallback)
- `crashcue` CLI: `run`, `test`, `install-shell`, `uninstall-shell`, `set-sound`, `config`, `mute`, `unmute`
- `crashcue-notify` notifier CLI
- PowerShell integration installer and safe snippets
- VSCode extension (workspace-level settings + play/mute/test commands)
- Shared config system with precedence (workspace > global > defaults)
- Default asset: `assets/faahhhhhh.mp3` (fallback for missing/invalid sound)
- Strict Jest coverage enforcement and cross-platform CI
