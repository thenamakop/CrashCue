const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Detect Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

// 2. Detect Git Bash environment
const homeDir = os.homedir();
const bashrcPath = path.join(homeDir, '.bashrc');

// 3. Remove Injection Block
const startMarker = '# <crashcue-start>';
const endMarker = '# <crashcue-end>';
const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\r?\\n?`, 'g');

try {
  let content = fs.readFileSync(bashrcPath, 'utf8');

  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(bashrcPath, content, 'utf8');
    console.log(`CrashCue: Removed Git Bash integration from: ${bashrcPath}`);
  }

} catch (err) {
  console.error('CrashCue: Failed to uninstall Git Bash integration:', err.message);
  process.exit(0);
}
