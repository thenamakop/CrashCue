[![npm](https://img.shields.io/npm/v/crashcue?style=for-the-badge)](https://www.npmjs.com/package/crashcue)
[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/thenamakop.crashcue-vscode?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=thenamakop.crashcue-vscode)
[![CI](https://img.shields.io/github/actions/workflow/status/thenamakop/CrashCue/ci.yml?branch=master&style=for-the-badge)](https://github.com/thenamakop/CrashCue/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/crashcue?style=for-the-badge)](LICENSE)

![CrashCue – Audible terminal failure notifications](assets/CrashCue_Banner_img.png)

# CrashCue

CrashCue is a lightweight CLI utility that plays an audible notification when your terminal command fails — designed for developer productivity and built with a strong architectural foundation.

CrashCue is Windows-first (PowerShell 7+), with a cross-platform Node-based fallback path where supported. The project aims for stability and predictable behavior over constant feature expansion.

---

## Key Features

- 🎯 Run commands and get notified on failure (`crashcue run ...`)
- 🔊 Customizable sound configuration
- 🖥️ Native PowerShell integration (Windows)
- 🐧 Cross-platform fallback support (best-effort)
- 🩺 Voluntary diagnostic report (`crashcue doctor --report`)
- 🔒 Privacy-first: no telemetry, no network calls

---

## Install

```bash
npm install -g crashcue
```

https://www.npmjs.com/package/crashcue

Note: The CLI is fully self-contained when installed from npm (no external runtime packages required).

Enable shell integration:

```bash
crashcue install
```

### Install from a tarball (manual / deterministic)

This is useful for offline installs or for verifying the packaged artifact:

```bash
npm install -g ./crashcue-*.tgz
```

---

## Usage Examples

```bash
# Run a command and notify if it fails
crashcue run npm test

# Play the configured sound immediately
crashcue test

# Generate a sanitized local diagnostic report for issue reports
crashcue doctor --report

# Temporarily disable notifications
crashcue mute

# Re-enable notifications
crashcue unmute
```

---

## Architecture

CrashCue is structured as a professional multi-package workspace:

- CLI: self-contained npm-distributed tool
- Shared Assets: internal package
- VSCode Extension: bundled and isolated via esbuild
- No runtime workspace coupling
- Extension invokes CLI via system command
- VSCode extension is intentionally not an npm workspace (prevents VSIX parent traversal)

Release artifacts are engineered to be robust outside the repository:

- **Self-contained distributable CLI**: the CLI bundle is packaged so it can run outside the monorepo without requiring workspace resolution.
- **Deterministic asset resolution**: default assets are resolved predictably; packaged installs include required runtime assets.
- **CI tarball smoke testing**: CI packs the CLI, installs the tarball globally, and runs smoke tests (`--help`, `doctor --report`, `test`).
- **No runtime registry dependencies for tarball installs**: installing the packed tarball does not require fetching internal workspace packages at runtime.
- **Coverage enforcement**: tests are run with coverage thresholds to prevent regressions.

---

## Development

Build the CLI (workspace):

```bash
cd packages/cli
npm run build
```

Build the VSCode extension (standalone folder):

```bash
cd packages/vscode-extension
npm install
npm run build
```

Package the VSCode extension (VSIX):

```bash
cd packages/vscode-extension
npx --yes @vscode/vsce package
```

---

## 🎯 Design Principles

- Privacy-first: no telemetry, no tracking, no network calls
- Minimal footprint: small dependency surface and simple runtime model
- Deterministic packaging: reproducible outputs and tarball-based verification
- Predictable behavior: clear failure semantics, explicit configuration, stable defaults

---

## 🚀 Roadmap

### Planned Enhancements

- Per-command notification rules
- Custom sound profiles (workspace and global)
- Native desktop notifications (Windows/macOS/Linux)
- Configurable failure thresholds (exit codes, duration-based triggers)

### Maintenance Scope

CrashCue is maintained on an occasional basis. The goal is stability, not rapid feature expansion. Contributions are welcome, but changes should preserve the project’s privacy-first, lightweight, dependency-safe approach.

---

## Contributing

- PRs and issues are welcome.
- There is no guaranteed SLA for review/response time.
- Changes must preserve the privacy-first and lightweight design principles.

---

## License

MIT
