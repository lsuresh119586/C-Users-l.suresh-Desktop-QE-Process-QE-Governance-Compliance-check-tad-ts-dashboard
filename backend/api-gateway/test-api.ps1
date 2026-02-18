$sprints = @('chargers-26.1.1', 'chargers-26.1.3', 'chargers-26.1.6')
$sprints | ForEach-Object {
  try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/qtest/sprint/$_" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "$_ - Total: $($response.totals.total) Automated: $($response.totals.automated)" -ForegroundColor Green
  } catch {
    Write-Host "$_ - ERROR: $_" -ForegroundColor Red
  }
}
