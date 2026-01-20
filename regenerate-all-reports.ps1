# Regenerate all 2025 monthly reports with description checking
# This will take approximately 1 hour to complete

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Regenerating All 2025 Monthly TAD/TS Reports" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$months = @(
    @{Month="January"; Start="2025-01-01"; End="2025-01-31"},
    @{Month="February"; Start="2025-02-01"; End="2025-02-28"},
    @{Month="March"; Start="2025-03-01"; End="2025-03-31"},
    @{Month="April"; Start="2025-04-01"; End="2025-04-30"},
    @{Month="May"; Start="2025-05-01"; End="2025-05-31"},
    @{Month="June"; Start="2025-06-01"; End="2025-06-30"},
    @{Month="July"; Start="2025-07-01"; End="2025-07-31"},
    @{Month="August"; Start="2025-08-01"; End="2025-08-31"},
    @{Month="September"; Start="2025-09-01"; End="2025-09-30"},
    @{Month="October"; Start="2025-10-01"; End="2025-10-31"},
    @{Month="November"; Start="2025-11-01"; End="2025-11-30"}
)

$totalMonths = $months.Count
$currentMonth = 0
$startTime = Get-Date

foreach ($month in $months) {
    $currentMonth++
    Write-Host ""
    Write-Host "[$currentMonth/$totalMonths] Processing $($month.Month) 2025..." -ForegroundColor Yellow
    Write-Host "  Date Range: $($month.Start) to $($month.End)" -ForegroundColor Gray
    
    # Run the report generation
    py sprint-tad-ts-report.py $month.Start $month.End
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $($month.Month) completed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($month.Month) failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Generating Standalone Dashboard..." -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

py generate-standalone-html.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Standalone dashboard generated successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Dashboard generation failed with exit code $LASTEXITCODE" -ForegroundColor Red
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "All Reports Regenerated!" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Total Time: $($duration.Hours)h $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Yellow
Write-Host ""
Write-Host "Updated Files:" -ForegroundColor Green
Write-Host "  - tad-ts-report-2025-01.json/js through 2025-11.json/js"
Write-Host "  - tad-ts-report-2025-12.json/js (already completed)"
Write-Host "  - standalone-dashboard/tad-ts-dashboard-standalone.html"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open tad-ts-dashboard.html to view updated reports"
Write-Host "  2. Share standalone-dashboard/tad-ts-dashboard-standalone.html with team"
Write-Host "  3. Compare before/after TAD/TS percentages"
Write-Host ""
