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

On Windows:

- WAV-only playback is enforced.
- Uses native .NET SoundPlayer.
- No visible media player window.
- Fully silent background execution.
- Triggers on non-zero $LASTEXITCODE.

### Why WAV-only?

- Windows native SoundPlayer supports PCM WAV reliably.
- MP3 introduces windowed players and inconsistent behavior.
- To ensure silent native playback, CrashCue enforces WAV format on Windows.

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

Command Description

---

`crashcue test` Play test sound
`crashcue run <command>` Run command and notify on failure
`crashcue mute` Temporarily disable sounds
`crashcue unmute` Re-enable sounds
`crashcue config` Open config file

---

## ⚙️ Configuration

Global config location:

    ~/.config/crashcue/config.json

### Example configuration

```json
{
  "enabled": true,
  "sound": "default",
  "volume": 0.8,
  "mode": "exit-code",
  "regexes": ["error", "exception", "fatal"],
  "ignoreCommands": ["git status", "ls"],
  "debounceMs": 2000
}
```

---

## 🖥 Shell Support

CrashCue integrates with:

- Bash
- Zsh
- Fish
- PowerShell

Install safely with:

```bash
crashcue install-shell
```

Uninstall:

```bash
crashcue uninstall-shell
```

CrashCue automatically backs up your shell profile before making
changes.

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
