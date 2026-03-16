#!/usr/bin/env powershell
# Kill any existing node processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start backend API server
Write-Host "Starting Backend API Server on port 3000..." -ForegroundColor Cyan
cd "C:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\backend\api-gateway"
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd 'C:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\backend\api-gateway'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend static server
Write-Host "Starting Frontend Server on port 5173..." -ForegroundColor Cyan
cd "C:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\frontend"
Start-Process powershell -ArgumentList "-NoProfile", "-Command", "cd 'C:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\frontend'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# Verify servers are running
Write-Host "`nVerifying servers..." -ForegroundColor Cyan
$backend = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "api-gateway" }
$frontend = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "frontend" }

if ($backend) { Write-Host "✅ Backend API: http://localhost:3000" -ForegroundColor Green }
if ($frontend) { Write-Host "✅ Frontend Server: http://localhost:5173" -ForegroundColor Green }

Write-Host "`n🎯 Open dashboard at: http://localhost:5173/unified-dashboard.html" -ForegroundColor Yellow
