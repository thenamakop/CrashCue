# CrashCue (VSCode Extension)

[![npm](https://img.shields.io/npm/v/crashcue)](https://www.npmjs.com/package/crashcue)
[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/thenamakop.crashcue-vscode)](https://marketplace.visualstudio.com/items?itemName=thenamakop.crashcue-vscode)

CrashCue is a lightweight CLI that plays an audible notification when terminal commands fail.

This VSCode extension triggers the globally installed `crashcue` CLI when a task fails.

VSCode extension requires globally installed CrashCue CLI.

## Install (CLI)

```bash
npm install -g crashcue
```

## Install (VSCode Marketplace)

- Search for "CrashCue" in the Extensions view
- Or run:

```bash
code --install-extension thenamakop.crashcue-vscode
```

## Development

This package is intentionally not part of the npm workspaces in this repository.

```bash
cd packages/vscode-extension
npm install
npm run build
```

Package the VSIX:

```bash
cd packages/vscode-extension
npx --yes @vscode/vsce package
```
