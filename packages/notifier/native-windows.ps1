param(
  [Parameter(Mandatory=$true)]
  [string]$Path
)

$SoundToPlay = $Path

# Try to resolve user config for custom sound
try {
    $ConfigPath = "$env:APPDATA\crashcue\config.json"
    if (Test-Path $ConfigPath) {
        $Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        if ($Config.sound -and (Test-Path $Config.sound)) {
            if ($Config.sound -match "\.wav$") {
                $SoundToPlay = $Config.sound
            }
        }
    }
} catch {
    # Ignore config errors, fall back to default provided in $Path
}

try {
  if (-not (Test-Path -Path $SoundToPlay)) {
    exit 2
  }

  (New-Object System.Media.SoundPlayer $SoundToPlay).PlaySync()
  exit 0
} catch {
  exit 1
}
