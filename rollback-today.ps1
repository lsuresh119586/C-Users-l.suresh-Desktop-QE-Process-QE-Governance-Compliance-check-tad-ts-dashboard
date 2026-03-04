# Rollback Script for Today's Changes (March 4, 2026)
# This script reverts all local changes made today back to commit d95f824
# Run from: c:\git_clone\polarisdashboard

param(
    [switch]$DryRun,        # Show what would be done without executing
    [switch]$Force          # Skip confirmation prompt
)

$RepoPath = "c:\git_clone\polarisdashboard"
$BaseCommit = "d95f824"     # Last committed state before today's changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ROLLBACK SCRIPT - March 4, 2026 Changes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Files modified today
$ModifiedFiles = @(
    "backend/api-gateway/.env",
    "backend/api-gateway/.env.example", 
    "backend/api-gateway/db.json",
    "backend/api-gateway/jiraBugService.js",
    "backend/api-gateway/passportTadTsComplianceService.js",
    "backend/api-gateway/server.js",
    "frontend/index.html",
    "frontend/src/components/DnADashboard.tsx",
    "frontend/unified-dashboard.html"
)

# New files/directories created today
$NewItems = @(
    "PASSPORT_QTEST_INTEGRATION.md",
    "backend/api-gateway/.passport-qtest-cache",
    "backend/api-gateway/passport-qtest-integration.js",
    "specs/002-passport-cpod-fix",
    "specs/003-passport-qtest",
    "rollback-today.ps1"
)

Write-Host "MODIFIED FILES (will be restored to $BaseCommit):" -ForegroundColor Yellow
$ModifiedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""
Write-Host "NEW FILES/FOLDERS (will be deleted):" -ForegroundColor Yellow
$NewItems | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No changes will be made." -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Commands that would run:" -ForegroundColor Magenta
    Write-Host "  git checkout $BaseCommit -- <modified files>" -ForegroundColor Gray
    Write-Host "  Remove-Item -Recurse -Force <new items>" -ForegroundColor Gray
    exit 0
}

if (-not $Force) {
    Write-Host "WARNING: This will discard ALL local changes made today!" -ForegroundColor Red
    $confirm = Read-Host "Type 'YES' to confirm rollback"
    if ($confirm -ne "YES") {
        Write-Host "Rollback cancelled." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Starting rollback..." -ForegroundColor Green

Push-Location $RepoPath

# Step 1: Restore modified files to base commit
Write-Host "`n[1/3] Restoring modified files..." -ForegroundColor Cyan
foreach ($file in $ModifiedFiles) {
    $fullPath = Join-Path $RepoPath $file
    if (Test-Path $fullPath) {
        Write-Host "  Restoring: $file" -ForegroundColor Gray
        git checkout $BaseCommit -- $file 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "    WARNING: Could not restore $file" -ForegroundColor Yellow
        }
    }
}

# Step 2: Delete new files/directories
Write-Host "`n[2/3] Removing new files/directories..." -ForegroundColor Cyan
foreach ($item in $NewItems) {
    $fullPath = Join-Path $RepoPath $item
    if (Test-Path $fullPath) {
        Write-Host "  Deleting: $item" -ForegroundColor Gray
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Step 3: Verify clean state
Write-Host "`n[3/3] Verifying rollback..." -ForegroundColor Cyan
$remaining = git status -s
if ($remaining) {
    Write-Host "  Some changes remain:" -ForegroundColor Yellow
    Write-Host $remaining -ForegroundColor Gray
} else {
    Write-Host "  Working directory is clean!" -ForegroundColor Green
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " ROLLBACK COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart backend: cd backend/api-gateway; node server.js" -ForegroundColor Gray
Write-Host "  2. Restart frontend: cd frontend; npm run dev" -ForegroundColor Gray
Write-Host "  3. Verify at: http://localhost:5174" -ForegroundColor Gray
