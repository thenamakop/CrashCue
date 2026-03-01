const { execSync } = require('child_process');
const path = require('path');

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  // 1. Read current AutoRun
  let currentAutoRun = '';
  try {
    const output = execSync('reg query "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const match = output.match(/AutoRun\s+REG_\w+\s+(.*)/);
    if (match && match[1]) {
      currentAutoRun = match[1].trim();
    }
  } catch (e) {
    process.exit(0);
  }

  // 2. Detect CrashCue marker
  // Since we appended, we need to carefully remove the specific command string.
  // The command string is: @FOR /F "tokens=*" %%i IN ('echo %ERRORLEVEL%') DO ( IF NOT "%%i"=="0" ( powershell.exe ... ) )
  // We can regex replace the whole thing if it matches our pattern.

  const pattern = /@FOR \/F "tokens=\*" %%i IN \('echo %ERRORLEVEL%'\) DO \( IF NOT "%%i"=="0" \( powershell\.exe .*native-windows\.ps1.* \) \)/;
  
  if (pattern.test(currentAutoRun)) {
    let newAutoRun = currentAutoRun.replace(pattern, '').trim();
    
    // Clean up trailing/leading '&'
    if (newAutoRun.endsWith('&')) {
      newAutoRun = newAutoRun.slice(0, -1).trim();
    }
    if (newAutoRun.startsWith('&')) {
      newAutoRun = newAutoRun.slice(1).trim();
    }

    // Write back
    // If empty, delete the value entirely? Or keep empty string. Deleting is cleaner if empty.
    if (newAutoRun.length === 0) {
      execSync('reg delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f', { stdio: 'ignore' });
    } else {
      const escapedAutoRun = newAutoRun.replace(/"/g, '\\"');
      execSync(`reg add "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /t REG_EXPAND_SZ /d "${escapedAutoRun}" /f`, { stdio: 'ignore' });
    }
    
    console.log('CrashCue: Removed CMD integration.');
  }

} catch (err) {
  console.error('CrashCue: Failed to uninstall CMD integration:', err.message);
  process.exit(0);
}
