# Dashboard Quick Start Guide

## Status ✅

**✅ Backend API**: Running on http://localhost:3000
**✅ Frontend Server**: Running on http://localhost:5173
**✅ API Endpoints**: All working and returning data

## Data Endpoints

### QTest Metrics
```
GET http://localhost:3000/api/qtest/sprint/26.1.2
```
Returns:
- Total test cases: 345
- Automated: 287
- With attachments: 287
- Per-team breakdown

###Defects Data
```
GET http://localhost:3000/api/defects/by-module?sprint=26.1.2
```
Returns:
- Open defects: 1
- Closed defects: 2
- Defects by module breakdown

## How to View the Dashboard

### Option 1: Open in Browser
1. Open http://localhost:5173/unified-dashboard.html in a web browser (Chrome, Firefox, Edge, etc.)
2. The page will automatically load data for Sprint 26.1.2
3. You should see:
   - **Total Tests**: 345
   - **Automated**: 287  
   - **With Attachments**: 287
   - **Open Defects**: 1

### Option 2: Change Sprint
1. Use the "Sprint" dropdown to select:
   - Sprint 26.1.1
   - Sprint 26.1.2
   - Sprint 26.1.3
2. Click "Refresh" or select a different sprint to load new data

### Option 3: View Tabs
- **📈 Overview**: Summary cards with key metrics
- **✅ Test Metrics**: Per-team test case breakdown
- **🐛 Defects**: Defect distribution by module and severity
- **🔗 Correlation**: Risk analysis and team recommendations

## Troubleshooting

### If data isn't showing:
1. Check that both servers are running:
   ```powershell
   Get-Process node
   ```
   Should show 2 processes

2. Test the APIs directly:
   ```powershell
   Invoke-RestMethod "http://localhost:3000/api/qtest/sprint/26.1.2"
   ```

3. Open browser developer console (F12) to see any JavaScript errors
   - Look for console.log messages starting with "[Dashboard]"
   - This will show the exact step where loading is happening

### If servers are not running:
```powershell
cd "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\backend\api-gateway"
node server.js

# In another terminal:
cd "c:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\frontend"
node server.js
```

## Key Files

- **Backend Server**: backend/api-gateway/server.js (port 3000)
- **Frontend Server**: frontend/server.js (port 5173)
- **Dashboard HTML**: frontend/unified-dashboard.html
- **Database**: backend/api-gateway/db.json (contains test metrics and defect data)

## Recent Changes

- ✅ Added `/api/qtest/sprint/<sprint>` endpoint
- ✅ Added auto-loading of data on page load
- ✅ Added enhanced logging for debugging
- ✅ Added sprint dropdown change handler
- ✅ Fixed server binding to 127.0.0.1

## Test Data

All test data is stored in `db.json`:
- Sprint 26.1.1: 320 tests (280 automated, 280 with attachments)
- Sprint 26.1.2: 345 tests (287 automated, 287 with attachments)
- Sprint 26.1.3: 330 tests (285 automated, 285 with attachments)

Each sprint has data for 5 teams:
- Chubb (67 tests)
- Matrix (72 tests)
- Mavericks (68 tests)
- Nexus (70 tests)
- Vanguards (68 tests)
