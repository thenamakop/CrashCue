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

## � Windows Audio Format

On Windows, CrashCue uses native `.wav` playback via `System.Media.SoundPlayer`.

**Why WAV only?**

- Silent playback
- No media player windows
- No background processes
- Native .NET API
- Reliable system-level execution

⚠️ **MP3 files are NOT supported on Windows** to ensure consistent, windowless behavior.

---

## �📦 Installation

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
