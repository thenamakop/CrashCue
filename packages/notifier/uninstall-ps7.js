const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Detect Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

// 2. Detect PowerShell 7 & Profile Path
let profilePath;
try {
  profilePath = execSync('pwsh -NoProfile -Command "$PROFILE"', { 
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
} catch (e) {
  // If no pwsh, nothing to uninstall
  process.exit(0);
}

if (!profilePath || !fs.existsSync(profilePath)) {
  process.exit(0);
}

// 3. Remove Injection Block
const startMarker = '# <crashcue-start>';
const endMarker = '# <crashcue-end>';
const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\r?\\n?`, 'g');

try {
  let content = fs.readFileSync(profilePath, 'utf8');

  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(profilePath, content, 'utf8');
    console.log(`CrashCue: Removed PowerShell 7 integration from: ${profilePath}`);
  }

} catch (err) {
  console.error('CrashCue: Failed to uninstall PowerShell 7 integration:', err.message);
  // Do not fail uninstall
  process.exit(0);
}
