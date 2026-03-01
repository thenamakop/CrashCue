const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Detect Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

// 2. Detect Git Bash environment
// Typically ~/.bashrc
const homeDir = os.homedir();
const bashrcPath = path.join(homeDir, '.bashrc');

console.log('CrashCue: Detecting Git Bash environment...');

// 3. Prepare Paths
const nativeScriptPath = path.resolve(__dirname, 'native-windows.ps1');
const soundPath = path.resolve(__dirname, '../../assets/faahhhhhh.wav');

// Escape spaces in paths for bash
const escapedScriptPath = nativeScriptPath.replace(/ /g, '\\ ');
const escapedSoundPath = soundPath.replace(/ /g, '\\ ');

// 4. Construct Injection Block
const startMarker = '# <crashcue-start>';
const endMarker = '# <crashcue-end>';

const block = `${startMarker}
crashcue_prompt() {
  if [ $? -ne 0 ]; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${escapedScriptPath}" -Path "${escapedSoundPath}" >/dev/null 2>&1
  fi
}
PROMPT_COMMAND="crashcue_prompt;$PROMPT_COMMAND"
${endMarker}`;

// 5. Read & Modify .bashrc
try {
  let content = '';
  if (fs.existsSync(bashrcPath)) {
    content = fs.readFileSync(bashrcPath, 'utf8');
  } else {
    // Create new
    fs.writeFileSync(bashrcPath, '', 'utf8');
  }

  // Idempotency: Replace or Append
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
  
  if (regex.test(content)) {
    content = content.replace(regex, block);
    console.log('CrashCue: Updated existing Git Bash integration.');
  } else {
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    content += block + '\n';
    console.log('CrashCue: Injected Git Bash integration.');
  }

  fs.writeFileSync(bashrcPath, content, 'utf8');
  console.log(`CrashCue: Successfully configured Git Bash profile at: ${bashrcPath}`);

} catch (err) {
  console.error('CrashCue: Failed to update Git Bash profile:', err.message);
  // Do not fail installation
  process.exit(0);
}
