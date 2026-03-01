const { execSync } = require('child_process');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

console.log('CrashCue: Detecting CMD environment...');

const nativeScriptPath = path.resolve(__dirname, 'native-windows.ps1');
const soundPath = path.resolve(__dirname, '../../assets/faahhhhhh.wav');

// The CMD payload
// We use a marker in a comment or rely on the pattern matching to ensure idempotency.
// Since we are appending to a registry string, we can't easily add comments.
// We will search for "CrashCueNotifierPS" in the existing value to detect presence.

const cmdPayload = `@FOR /F "tokens=*" %%i IN ('echo %ERRORLEVEL%') DO ( IF NOT "%%i"=="0" ( powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${nativeScriptPath}" -Path "${soundPath}" >nul 2>&1 ) )`;

try {
  // 1. Read current AutoRun
  let currentAutoRun = '';
  try {
    // reg query HKCU\Software\Microsoft\Command Processor /v AutoRun
    const output = execSync('reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    // Parse output: HKEY... \n    AutoRun    REG_SZ    <value>
    const match = output.match(/AutoRun\s+REG_\w+\s+(.*)/);
    if (match && match[1]) {
      currentAutoRun = match[1].trim();
    }
  } catch (e) {
    // Key might not exist, which is fine
  }

  // 2. Check for existing integration
  if (currentAutoRun.includes('native-windows.ps1') && currentAutoRun.includes('CrashCue')) {
    console.log('CrashCue: CMD integration already present.');
    // We might want to update paths if they changed, but regex replace on registry string is risky without markers.
    // For now, if present, we skip to avoid duplication.
    // To support updates, we'd need to parse and replace the specific block.
    // Let's assume simplistic "if present, skip" for safety unless we want to be smarter.
    // Given "Avoid duplicate insertion", skipping is safe.
    process.exit(0);
  }

  // 3. Append payload
  let newAutoRun = currentAutoRun;
  if (newAutoRun && !newAutoRun.endsWith('&')) {
      newAutoRun += ' & '; // Append with operator
  }
  newAutoRun += cmdPayload;

  // 4. Write back
  // Use REG_EXPAND_SZ just in case, though REG_SZ is standard for simple commands.
  // We need to be careful with quotes. execSync handles argument quoting if passed as array? No, windows shell quoting is tricky.
  // We'll use a direct command string carefully constructed.
  
  // Escape double quotes for the command line
  const escapedAutoRun = newAutoRun.replace(/"/g, '\\"');
  
  execSync(`reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "${escapedAutoRun}" /f`, {
    stdio: 'ignore'
  });

  console.log('CrashCue: CMD integration configured.');

} catch (err) {
  console.error('CrashCue: Failed to configure CMD integration:', err.message);
  // Don't fail install
  process.exit(0);
}
