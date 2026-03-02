param(
  [Parameter(Mandatory=$true)]
  [string]$Path
)

try {
  if (-not (Test-Path -Path $Path)) {
    exit 2
  }

  (New-Object System.Media.SoundPlayer $Path).PlaySync()
  exit 0
} catch {
  exit 1
}
