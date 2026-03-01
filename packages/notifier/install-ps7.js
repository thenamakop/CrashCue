const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Detect Windows
if (process.platform !== 'win32') {
  process.exit(0);
}

console.log('CrashCue: Detecting PowerShell 7...');

// 2. Detect PowerShell 7 & Profile Path
let profilePath;
try {
  // Check if pwsh is available and get profile path
  profilePath = execSync('pwsh -NoProfile -Command "$PROFILE"', { 
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'] // Suppress stderr
  }).trim();
} catch (e) {
  console.log('CrashCue: PowerShell 7 (pwsh) not found. Skipping automatic integration.');
  process.exit(0);
}

if (!profilePath) {
  console.log('CrashCue: Could not determine PowerShell 7 profile path. Skipping.');
  process.exit(0);
}

// 3. Prepare Paths
const nativeScriptPath = path.resolve(__dirname, 'native-windows.ps1');
const soundPath = path.resolve(__dirname, '../../assets/faahhhhhh.wav');

// 4. Construct Injection Block
const startMarker = '# <crashcue-start>';
const endMarker = '# <crashcue-end>';

const block = `${startMarker}
$CrashCueNotifierPS = "${nativeScriptPath}"
$CrashCueSoundPath  = "${soundPath}"

function global:prompt {

    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        try {
            if (Test-Path $CrashCueNotifierPS) {
                powershell.exe -NoProfile -ExecutionPolicy Bypass \`
                    -File $CrashCueNotifierPS \`
                    -Path $CrashCueSoundPath \`
                    > $null 2>&1
            }
        } catch {}
    }

    $global:LASTEXITCODE = 0
    "PS $($executionContext.SessionState.Path.CurrentLocation)> "
}
${endMarker}`;

// 5. Read & Modify Profile
try {
  const profileDir = path.dirname(profilePath);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  let content = '';
  if (fs.existsSync(profilePath)) {
    content = fs.readFileSync(profilePath, 'utf8');
  }

  // Idempotency: Replace or Append
  const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
  
  if (regex.test(content)) {
    content = content.replace(regex, block);
    console.log('CrashCue: Updated existing PowerShell 7 integration.');
  } else {
    // Ensure newline before append if file not empty
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    content += block + '\n';
    console.log('CrashCue: Injected PowerShell 7 integration.');
  }

  fs.writeFileSync(profilePath, content, 'utf8');
  console.log(`CrashCue: Successfully configured PowerShell 7 profile at: ${profilePath}`);

} catch (err) {
  console.error('CrashCue: Failed to update PowerShell 7 profile:', err.message);
  // Do not fail installation
  process.exit(0);
}
