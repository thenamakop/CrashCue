# Changelog

## v0.1.1 — 2026-03-02

### Changed

- Switched to bundled CLI for stable npm distribution
- Windows-only support (macOS/Linux planned)
- WAV-only audio playback for native reliability

### Fixed

- Resolved workspace module resolution issues
- Fixed global install failures
- Fixed CI asset verification

### Added

- **Sound Customization**: New `crashcue config` command to manage settings.
  - `crashcue config sound <path>`: Set a custom WAV file.
  - `crashcue config show`: Display current configuration.
  - `crashcue config reset`: Reset to defaults.

### Changed

- **Build System**: Switched from `tsc` project references to `esbuild` for the CLI artifact.
- **Logging**: Removed debug logging and log files from production builds.
- **Documentation**: Updated README with correct configuration commands.

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
- `crashcue` CLI: `run`, `test`, `install`, `uninstall`, `doctor`, `status`, `config`
- `crashcue-notify` notifier CLI
- PowerShell integration installer and safe snippets
- VSCode extension (workspace-level settings + play/mute/test commands)
- Shared config system with precedence (workspace > global > defaults)
- Default asset: `assets/faahhhhhh.wav`
- Strict Jest coverage enforcement and cross-platform CI
