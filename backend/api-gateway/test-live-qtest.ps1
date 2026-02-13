param()

Write-Host "========================================"
Write-Host "QTest Live Integration Test"
Write-Host "========================================"

# Kill any existing node processes
Write-Host "`n[1/5] Killing existing node processes..."
taskkill /IM node.exe /F 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Check if QTEST_API_TOKEN is set
Write-Host "`n[2/5] Checking QTest API Token..."
if ($env:QTEST_API_TOKEN) {
    Write-Host "QTEST_API_TOKEN is set (live mode)"
    $tokenStatus = "ENABLED"
} else {
    Write-Host "QTEST_API_TOKEN not set (using mock data fallback)"
    $tokenStatus = "DISABLED (mock data)"
}

# Start the server
Write-Host "`n[3/5] Starting backend server..."
$backendPath = "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\backend\api-gateway"
Push-Location $backendPath
Start-Process node -ArgumentList "server.js" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Test the endpoint
Write-Host "`n[4/5] Testing /api/qtest/sprint endpoint..."
$testSprints = @('26.1.1', '26.1.2', '26.1.3')

foreach ($sprint in $testSprints) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/qtest/sprint/$sprint" -TimeoutSec 10
        $source = if ($response.source) { $response.source } else { "unknown" }
        Write-Host "  OK $sprint => Total: $($response.totals.total) | Auto: $($response.totals.automated) | Src: $source"
    } catch {
        Write-Host "  FAIL $sprint => Error: $_"
    }
}

# Summary
Write-Host "`n[5/5] Integration Status"
Write-Host "  Live QTest API: $tokenStatus"
Write-Host "  Server: Running on http://localhost:3000"
Write-Host "  Fallback: Mock data from db.json"
Write-Host "`nTo enable live QTest API, set token:"
Write-Host '  $env:QTEST_API_TOKEN = "YOUR_TOKEN"'
Write-Host "`nThen restart server."

Pop-Location
Write-Host "`nDone!"
