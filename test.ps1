# passwordeeri — local test runner (Windows, no Docker)
#
# Usage:
#   .\test.ps1            # starts mock LDAP + app in two windows
#   .\test.ps1 -MockOnly  # starts just the mock LDAP server
#   .\test.ps1 -AppOnly   # starts just the app (requires mock already running)
#
# After startup: open http://localhost:3000
#   alice / alicepass  → engineering, devops
#   bob   / bobpass    → devops only

param(
  [switch]$MockOnly,
  [switch]$AppOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $AppOnly) {
  Write-Host ""
  Write-Host "Starting mock LDAP server on ldap://localhost:1389 ..." -ForegroundColor Green
  Start-Process -FilePath "bun" -ArgumentList "run", "test/mock-ldap-server.ts" `
    -WorkingDirectory $root -WindowStyle Normal
  Start-Sleep -Seconds 2
}

if (-not $MockOnly) {
  Write-Host ""
  Write-Host "Starting passwordeeri on http://localhost:3000 ..." -ForegroundColor Green
  Write-Host "Loading env from test/config.env" -ForegroundColor Cyan
  # bun --env-file loads the env file into the process
  Start-Process -FilePath "bun" -ArgumentList "--env-file=test/config.env", "run", "src/index.ts" `
    -WorkingDirectory $root -WindowStyle Normal
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Done. Open http://localhost:3000 and log in as alice/alicepass." -ForegroundColor Green
Write-Host "Press Ctrl+C in the server windows to stop." -ForegroundColor DarkGray