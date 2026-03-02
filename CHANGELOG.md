# Changelog

## v0.2.0 — 2026-03-02

### Breaking Changes

- **Removed CMD support**: Windows Command Prompt (cmd.exe) integration has been removed. The previous implementation using `AutoRun` macros was insufficient for reliable interactive error detection, and robust support would require invasive DLL injection. Windows users are encouraged to use PowerShell 7 or Git Bash.

## v0.1.1 — 2026-03-02

### Changed

- Removed debug logging from native Windows notifier
- Removed crashcue-notify.log in production
- Documented PowerShell 7 integration

## v0.1.0 — 2026-03-01

### Changed

- Windows audio playback now exclusively supports `.wav` files
- Removed Windows MP3 playback logic
- Replaced Windows Media Player invocation with native SoundPlayer
- Playback now silent and windowless on Windows
- Default asset changed to `.wav` for cross-platform consistency
- Added native PowerShell playback script `native-windows.ps1`
- Updated CLI to prefer native PowerShell execution for `.wav` files on Windows
- Added manual profile integration guidance for zero-overhead monitoring

### Added

- Windows-aware audio playback (.wav native, .mp3 fallback)
- `crashcue` CLI: `run`, `test`, `install-shell`, `uninstall-shell`, `set-sound`, `config`, `mute`, `unmute`
- `crashcue-notify` notifier CLI
- PowerShell integration installer and safe snippets
- VSCode extension (workspace-level settings + play/mute/test commands)
- Shared config system with precedence (workspace > global > defaults)
- Default asset: `assets/faahhhhhh.mp3` (fallback for missing/invalid sound)
- Strict Jest coverage enforcement and cross-platform CI
