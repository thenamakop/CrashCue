param(
  [Parameter(Mandatory=$true)]
  [string]$Path
)

$logFile = Join-Path -Path $env:TEMP -ChildPath 'crashcue-notify.log'

try {
  if (-not (Test-Path -Path $Path)) {
    $msg = [PSCustomObject]@{ time = (Get-Date).ToString("o"); path = $Path; status = "missing" } | ConvertTo-Json -Compress
    Add-Content -Path $logFile -Value $msg
    exit 2
  }

  (New-Object System.Media.SoundPlayer $Path).PlaySync()

  $msg = [PSCustomObject]@{ time = (Get-Date).ToString("o"); path = $Path; status = "played" } | ConvertTo-Json -Compress
  Add-Content -Path $logFile -Value $msg
  exit 0
} catch {
  $msg = [PSCustomObject]@{ time = (Get-Date).ToString("o"); path = $Path; status = "error"; error = $_.Exception.Message } | ConvertTo-Json -Compress
  Add-Content -Path $logFile -Value $msg
  exit 1
}
