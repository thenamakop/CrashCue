![CrashCue – Make your terminal scream](assets/CrashCue_Banner_img.png)

# 🚨 CrashCue

### _When your code crashes, you hear it._

> Silent failures are productivity killers. CrashCue makes sure you
> never miss one.

---

## ⚠ Platform Support

CrashCue currently supports:

- ✅ Windows (PowerShell 7+)
- 🚧 macOS (Planned)
- 🚧 Linux (Planned)

macOS and Linux support will be introduced in a future release.

## ⚡ What is CrashCue?

**CrashCue** is a lightweight developer tool that plays
a sound whenever a terminal command fails.

Whether you're working in:

- 🪟 Windows PowerShell
- 🧠 VSCode integrated terminal
- 💻 Any modern IDE terminal

CrashCue instantly alerts you when a command exits with an error.

No more silent build failures.\
No more unnoticed crashes.

---

## 🚀 Features

- 🔊 Plays sound on non-zero exit codes
- 🎛 Fully customizable audio (WAV supported)
- 🪟 Optimized for Windows
- 🧠 VSCode extension support
- ⚡ Ultra-lightweight CLI
- 🛠 Regex-based error detection mode
- 🚫 Ignore specific commands
- 🔕 Temporary mute support
- 🧪 Built-in test sound command
- 🔒 100% local --- no telemetry, no tracking

---

## PowerShell 7 Integration (Recommended)

CrashCue integrates directly with PowerShell 7 using a safe prompt hook.

### Automatic PowerShell Integration

On Windows, CrashCue automatically integrates into PowerShell 7 during installation.

To remove integration:

    npm uninstall -g crashcue

Or manually delete content between:

    # <crashcue-start>
    # <crashcue-end>

### Manual Setup (Optional)

Use the built-in installer instead:

```powershell
crashcue install powershell
```

### Why WAV-only?

- Windows native SoundPlayer supports PCM WAV reliably.
- MP3 introduces windowed players and inconsistent behavior.
- To ensure silent native playback, CrashCue enforces WAV format on Windows.

> **Note:** Update the paths to match your actual installation location if different.

---

## 📦 Installation

### Install globally

```bash
npm install -g crashcue
```

### Enable in your shell

```bash
crashcue install
```

Test it:

```bash
false
```

You should hear the default crash sound 🔊

---

## 🧪 Quick Commands

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `crashcue test`          | Play test sound                   |
| `crashcue run <command>` | Run command and notify on failure |
| `crashcue mute`          | Temporarily disable sounds        |
| `crashcue unmute`        | Re-enable sounds                  |
| `crashcue doctor`        | Check installation status         |
| `crashcue status`        | Show current configuration        |
| `crashcue config`        | Manage configuration              |

---

## 🛠 Local Verification (Windows)

To verify the packaging locally on Windows:

```powershell
npm ci
npm test
npm run build
```

The `crashcue test` command should play the sound silently without opening a media player.

---

## 🩺 Diagnostic Report

If you're reporting an issue, run:

```bash
crashcue doctor --report
```

Copy and paste the output into your GitHub issue. This report is fully local and does NOT send data anywhere.

## 🔒 Self-Contained CLI Architecture

CrashCue publishes a single distributable CLI package that is fully self-contained at runtime.

It includes:

- `dist/index.js` (bundled CLI, including internal packages)
- `dist/native-windows.ps1` (native Windows playback script)
- `dist/assets/faahhhhhh.wav` (default crash sound)

This means:

- No runtime dependency on `@crashcue/notifier`, `@crashcue/shared-assets`, or `@crashcue/shared-config`
- Global installs from the packed tarball do not require workspace resolution and do not fetch `@crashcue/*` from the registry
- `crashcue` runs outside the monorepo (any folder)

### Architecture diagram

CLI (bundled)
├── Notifier (inlined)
├── Shared Assets (inlined)
└── Native Windows Script (copied into dist)

### Development workflow

```powershell
npm ci
npm test
npm run build
cd packages/cli
npm pack
```

## ⚙️ Configuration

Global config location:

    %APPDATA%\CrashCue\config.json (Windows)

### Sound Customization

You can change the crash sound easily:

```bash
# Set a custom sound (WAV only on Windows)
crashcue config sound "C:\Sounds\error.wav"

# Check current sound
crashcue config show

# Reset to default
crashcue config reset
```

### Example configuration

```json
{
  "enabled": true,
  "sound": "C:\\Sounds\\error.wav",
  "ignoreCommands": ["git status", "ls"]
}
```

---

## 🖥 Automatic Shell Integration

CrashCue automatically integrates with your shell during installation.

### Supported Shells

- **PowerShell 7+**: Uses a safe `prompt` hook.
- **Git Bash**: Uses `PROMPT_COMMAND` hook.

### Unsupported Features

**CMD (Windows Command Prompt)**
Support for CMD has been discontinued. The legacy `AutoRun` registry hook method proved unreliable for interactive sessions, and alternative solutions require custom DLL injection which introduces security and complexity risks that align poorly with CrashCue's "lightweight" philosophy. We recommend using PowerShell 7 or Git Bash on Windows for the best experience.

### Managing Integrations

If you need to re-install or remove integrations:

```bash
# Force re-install shell hooks
crashcue install

# Remove all shell hooks
crashcue uninstall
```

> **Note:** Uninstalling via `npm uninstall -g crashcue` will also automatically remove these integrations.

---

## ❓ Troubleshooting

If you suspect CrashCue isn't working:

1. **Run Doctor**

   ```bash
   crashcue doctor
   ```

   This checks for:
   - Native script existence
   - Sound file validity
   - Shell profile integration status

2. **Check Status**

   ```bash
   crashcue status
   ```

   Shows if you are muted or if the sound path is incorrect.

3. **Manual Test**
   ```bash
   crashcue test
   ```
   Should play the configured sound immediately.

---

## 🧠 VSCode Extension

Search for:

**CrashCue --- Terminal Error Sound**

Extension features:

- Detects failed tasks
- Regex-based detection
- Workspace-level configuration
- One-click test sound
- Quick mute toggle

---

## 🔐 Privacy First

CrashCue is fully local.

- No analytics\
- No external API calls\
- No telemetry\
- No background tracking

Your errors stay on your machine.

---

## 🏗 Project Structure

    crashcue/
    ├── packages/
    │   ├── notifier/
    │   ├── cli/
    │   └── vscode-extension/
    ├── config/
    ├── scripts/
    ├── tests/
    └── README.md

---

## � Roadmap

CrashCue is actively evolving. Planned improvements include:

### v0.3 — Extensibility & Customization

- 🔔 Per-command notification rules
- 🎵 Custom sound profiles (per workspace / global)
- 🧩 Plugin architecture for custom failure handlers
- 🖥️ Native desktop notifications (Windows/macOS/Linux)
- ⚙️ Configurable failure thresholds (exit codes, duration-based triggers)

### Future Exploration

- IDE integrations beyond VSCode
- Optional performance metrics reporting (fully opt-in)
- Cross-shell enhancements
- Team-wide shared configuration

CrashCue is designed to remain lightweight, privacy-first, and dependency-safe.

---

## 🤝 Contributing

Contributions are welcome.

If you've ever lost time because your terminal failed silently --- this
project is for you.

1.  Fork it\
2.  Create a branch\
3.  Submit a PR

---

## 📄 License

MIT License

---

## ⭐ Support

If CrashCue saves you from even one unnoticed failure:

- ⭐ Star the repository\
- 🔁 Share it\
- 🧩 Add it to your dotfiles

---

## 💬 Philosophy

Your terminal shouldn't fail quietly.

Make it heard.\
Make it instant.\
Make it CrashCue.
