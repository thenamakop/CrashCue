![CrashCue – Make your terminal scream](assets/CrashCue_Banner_img.png)

# 🚨 CrashCue

### _When your code crashes, you hear it._

> Silent failures are productivity killers. CrashCue makes sure you
> never miss one.

---

## ⚡ What is CrashCue?

**CrashCue** is a lightweight, cross-platform developer tool that plays
a sound whenever a terminal command fails.

Whether you're working in:

- 🖥 macOS Terminal\
- 🐧 Linux Shell\
- 🪟 Windows PowerShell\
- 🧠 VSCode integrated terminal\
- 💻 Any modern IDE terminal

CrashCue instantly alerts you when a command exits with an error.

No more silent build failures.\
No more unnoticed crashes.

---

## 🚀 Features

- 🔊 Plays sound on non-zero exit codes
- 🎛 Fully customizable audio (WAV supported on Windows, MP3/WAV on macOS/Linux)
- 🌍 Works on macOS, Linux, Windows
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

To enable silent, native playback directly from your PowerShell profile without spawning Node processes for every command, add this snippet to your `$PROFILE`:

```powershell
# CrashCue native PowerShell integration (safe)
$CrashCueNotifierPS = "C:\Users\mauli\Documents\Projects\CrashCue\packages\notifier\native-windows.ps1"
if (Test-Path $CrashCueNotifierPS) {
  $global:CrashCueLastExit = $null
  Register-EngineEvent PowerShell.OnIdle -Action {
    try {
      if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $global:CrashCueLastExit) {
        # call the native script silently using execution bypass
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CrashCueNotifierPS -Path "C:\Users\mauli\Documents\Projects\CrashCue\assets\faahhhhhh.wav" > $null 2>&1
      }
    } catch {}
    $global:CrashCueLastExit = $LASTEXITCODE
  } | Out-Null
}
```

### Why WAV-only?

- Windows native SoundPlayer supports PCM WAV reliably.
- MP3 introduces windowed players and inconsistent behavior.
- To ensure silent native playback, CrashCue enforces WAV format on Windows.

> **Note:** Update the paths to match your actual installation location if different.

---

## � Installation

### Install globally

```bash
npm install -g crashcue
```

### Enable in your shell

```bash
crashcue install-shell
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

## ⚙️ Configuration

Global config location:

    %APPDATA%\CrashCue\config.json (Windows)
    ~/.config/crashcue/config.json (macOS/Linux)

### Sound Customization

You can change the crash sound easily:

```bash
# Set a custom sound (WAV only on Windows)
crashcue config set-sound "C:\Sounds\error.wav"

# Check current sound
crashcue config get-sound

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
- **CMD**: Uses `AutoRun` registry hook.
- **Git Bash**: Uses `PROMPT_COMMAND` hook.

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

## 🛣 Roadmap

- Desktop notification support
- Custom sound packs
- Per-project config detection
- TTS mode ("Your build failed.")
- GUI configuration app
- Community sound themes

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
