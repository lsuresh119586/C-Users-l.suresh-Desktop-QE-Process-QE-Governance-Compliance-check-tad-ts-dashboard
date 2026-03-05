# Rollback Script for Today's Changes (March 4, 2026)
# This script reverts changes from commit 01d64f2 back to commit d95f824
# Run from: c:\git_clone\polarisdashboard

param(
    [switch]$DryRun,        # Show what would be done without executing
    [switch]$Force,         # Skip confirmation prompt
    [switch]$RevertCommit   # Revert the commit (default: just reset files)
)

$RepoPath = "c:\git_clone\polarisdashboard"
$BaseCommit = "d95f824"     # Last committed state before today's changes
$TodayCommit = "01d64f2"    # Today's commit to rollback

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
    if ($RevertCommit) {
        Write-Host "  git revert $TodayCommit --no-edit" -ForegroundColor Gray
        Write-Host "  (Creates new commit that undoes $TodayCommit)" -ForegroundColor Gray
    } else {
        Write-Host "  git reset --hard $BaseCommit" -ForegroundColor Gray
        Write-Host "  git push origin feature/t360latest --force" -ForegroundColor Gray
        Write-Host "  (Force pushes to remove commit from remote)" -ForegroundColor Gray
    }
    exit 0
}

if (-not $Force) {
    Write-Host "WARNING: This will undo today's Passport qTest changes!" -ForegroundColor Red
    if ($RevertCommit) {
        Write-Host "Mode: Revert (creates new commit to undo changes)" -ForegroundColor Yellow
    } else {
        Write-Host "Mode: Reset (removes commit from history - DESTRUCTIVE)" -ForegroundColor Yellow
    }
    $confirm = Read-Host "Type 'YES' to confirm rollback"
    if ($confirm -ne "YES") {
        Write-Host "Rollback cancelled." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Starting rollback..." -ForegroundColor Green

Push-Location $RepoPath

if ($RevertCommit) {
    # Option 1: Safe revert - creates new commit
    Write-Host "`n[1/2] Reverting commit $TodayCommit..." -ForegroundColor Cyan
    git revert $TodayCommit --no-edit
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Revert commit created successfully" -ForegroundColor Green
        Write-Host "`n[2/2] Pushing revert to remote..." -ForegroundColor Cyan
        git push origin feature/t360latest
    } else {
        Write-Host "  ERROR: Revert failed. Resolve conflicts manually." -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    # Option 2: Hard reset - removes commit from history
    Write-Host "`n[1/3] Resetting to $BaseCommit..." -ForegroundColor Cyan
    git reset --hard $BaseCommit
    
    Write-Host "`n[2/3] Force pushing to remote..." -ForegroundColor Cyan
    git push origin feature/t360latest --force
    
    Write-Host "`n[3/3] Verifying state..." -ForegroundColor Cyan
    $currentHead = git rev-parse --short HEAD
    Write-Host "  HEAD is now at: $currentHead" -ForegroundColor Gray
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
