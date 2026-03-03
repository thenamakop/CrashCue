# Changelog

## v0.2.3

- Harden CI/CD with split CLI + VSCode workflows, deterministic smoke tests, and regression guards.
- Add tag-driven release workflow with version synchronization checks for npm + VSCE publishing.

## v0.2.2

- Split CI into CLI and VSCode Extension workflows with hardened smoke tests and regression guards.
- Add tag-driven release workflow with version synchronization checks for npm + VSCE publishing.
- Ensure packaging remains self-contained (no workspace assumptions, no runtime shared-assets imports).

## 0.2.0 — Self-Contained Distribution Refactor

### Added

- Fully bundled CLI distribution
- Zero runtime dependency on internal packages
- Deterministic asset resolution
- Stable global install behavior
- Voluntary sanitized diagnostic report via `crashcue doctor --report`
- No telemetry, no data collection
- Fully isolated VSCode extension VSIX packaging (no workspace traversal)

### Changed

- Removed registry dependency on @crashcue/\*
- Simplified asset resolver logic
- Improved packaging reliability
- CI builds the VSCode extension outside npm workspaces

### Fixed

- Global install failing due to registry resolution
- Inconsistent shared-assets resolution
- Workspace-only dependency leakage
- VSCode extension packaging including parent directories and sibling packages

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
