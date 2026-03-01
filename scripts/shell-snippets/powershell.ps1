
# CrashCue native PowerShell integration (EngineEvent)
$CrashCueNotifierPS = "{{NATIVE_SCRIPT_PATH}}"
if (Test-Path $CrashCueNotifierPS) {
  $global:CrashCueLastExit = $null
  Register-EngineEvent PowerShell.OnIdle -Action {
    try {
      if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $global:CrashCueLastExit) {
        # Call native script silently once (bypass only for this invocation)
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CrashCueNotifierPS -Path "{{SOUND_PATH}}" > $null 2>&1
      }
    } catch {}
    $global:CrashCueLastExit = $LASTEXITCODE
  } | Out-Null
}
