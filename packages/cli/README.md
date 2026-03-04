# CrashCue CLI

CrashCue is a Windows-first CLI that plays an alert sound when commands fail.

## Build

```powershell
cd packages/cli
npm run build
```

## Test packaged tarball

```powershell
cd packages/cli
npm pack
npm install -g .\\crashcue-*.tgz
crashcue --help
crashcue test
```
