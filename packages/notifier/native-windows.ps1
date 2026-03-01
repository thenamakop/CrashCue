param(
  [Parameter(Mandatory=$true)]
  [string]$Path
)

# Write attempt log to TEMP for debugging
$logFile = Join-Path -Path $env:TEMP -ChildPath 'crashcue-notify.log'

try {
  if (-not (Test-Path -Path $Path)) {
    $msg = [PSCustomObject]@{
      time = (Get-Date).ToString("o")
      path = $Path
      status = "missing"
    } | ConvertTo-Json -Compress
    Add-Content -Path $logFile -Value $msg
    exit 2
  }

  # Play sync via System.Media.SoundPlayer (WAV required)
  (New-Object System.Media.SoundPlayer $Path).PlaySync()

  $msg = [PSCustomObject]@{
    time = (Get-Date).ToString("o")
    path = $Path
    status = "played"
  } | ConvertTo-Json -Compress
  Add-Content -Path $logFile -Value $msg
  exit 0
}
catch {
  $msg = [PSCustomObject]@{
    time = (Get-Date).ToString("o")
    path = $Path
    status = "error"
    error = $_.Exception.Message
  } | ConvertTo-Json -Compress
  Add-Content -Path $logFile -Value $msg
  exit 1
}
