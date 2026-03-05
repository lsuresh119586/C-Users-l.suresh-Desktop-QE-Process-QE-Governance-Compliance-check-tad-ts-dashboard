param(
  [switch]$ForceRestart
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$requiredVars = @('JIRA_API_TOKEN','QTEST_API_TOKEN','DB_SERVER','DB_NAME','DB_USER','DB_PASSWORD')

if (Test-Path '.env') {
  Get-Content '.env' | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $parts = $line -split '=', 2
    if ($parts.Length -ne 2) { return }
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (-not (Test-Path "Env:$key") -and $value) {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

foreach ($key in $requiredVars) {
  if (-not (Test-Path "Env:$key")) {
    Set-Item -Path "Env:$key" -Value 'placeholder'
  }
}

$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn -and -not $ForceRestart) {
  Write-Host "Backend already running on port 3000 (PID $($conn.OwningProcess))." -ForegroundColor Yellow
  Write-Host 'Use -ForceRestart to restart it.' -ForegroundColor DarkYellow
  exit 0
}

if ($conn -and $ForceRestart) {
  Stop-Process -Id $conn.OwningProcess -Force
  Start-Sleep -Milliseconds 500
}

Write-Host 'Starting backend API on http://localhost:3000 ...' -ForegroundColor Cyan
node server.js
