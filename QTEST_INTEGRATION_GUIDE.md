# QTest Live Data Integration Guide

## Overview

This guide explains how to integrate the dashboard with live QTest data using the API token provided.

## QTest API Endpoints

### Get Test Cases for a Sprint (WORKING FORMAT)

```
GET https://wk.qtestnet.com/api/v3/projects/114345/test-cases?pageSize=500&sprintId={sprint-id}
```

**Headers Required:**
```
Authorization: Bearer {API_TOKEN}
Content-Type: application/json
```

**Response Format:**
Returns an array of test case objects directly:
```json
[
  { id: 1, name: "Test Case 1", automation_status: "AUTOMATED", ... },
  { id: 2, name: "Test Case 2", automation_status: "MANUAL", ... }
]
```

### Example: Fetch Sprint 26.1.2 Test Cases

```powershell
$token = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"
$sprintId = "68209714"
$response = Invoke-RestMethod `
    -Uri "https://wk.qtestnet.com/api/v3/projects/114345/test-cases?pageSize=500&sprintId=$sprintId" `
    -Headers @{ "Authorization" = "Bearer $token" }

Write-Host "Got $($response.Count) test cases"
```

## Sprint ID Mapping

Map sprint names to QTest sprint IDs:

| Sprint | QTest ID |
|--------|----------|
| 26.1.1 | 68209713 |
| 26.1.2 | 68209714 |
| 26.1.3 | 68209719 |
| 26.1.4 | 68289134 |
| 26.1.5 | 68341069 |
| 26.1.6 | 68341070 |

## Backend Implementation

The dashboard backend automatically fetches live data:

```javascript
// In server.js - /api/qtest/sprint endpoint
const qTestUrl = `${QTEST_CONFIG.baseUrl}/projects/114345/test-cases?pageSize=500&sprintId=${qTestSprintId}`;
const qTestData = await fetchQTestData(qTestUrl);

// Response is an array of test cases
if (Array.isArray(qTestData) && qTestData.length > 0) {
  const aggregated = aggregateTestMetrics(qTestData, sprintName);
  aggregated.source = 'qtest-live';
  // Return aggregated metrics to frontend
}
```

## Environment Setup

Set your QTest API token:

```powershell
$env:QTEST_API_TOKEN = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"
```

Then restart the backend server:

```powershell
cd backend/api-gateway
node server.js
```

## Data Aggregation

The QTest response array is aggregated into dashboard format:

```javascript
// Input: Array of test cases from QTest
// Output:
{
  sprint: "26.1.2",
  totals: {
    total: 20,
    automated: 15,
    with_attachments: 12,
    without_attachments: 3
  },
  teams: {
    "Team A": { total: 8, automated: 6, with_attachments: 5 },
    "Team B": { total: 12, automated: 9, with_attachments: 7 }
  },
  source: "qtest-live"
}
```

## Testing Live Integration

Verify the endpoint works:

```powershell
# Test from dashboard
cd backend/api-gateway
powershell -ExecutionPolicy Bypass -File test-live-qtest.ps1

# Test specific sprint
Invoke-RestMethod "http://localhost:3000/api/qtest/sprint/26.1.2" | ConvertTo-Json
```

Expected response shows `"source": "qtest-live"`.

## Endpoint Details

### QTest API v3 (Working)

Endpoint: `/api/v3/projects/{projectId}/test-cases`

**Parameters:**
- `pageSize` - Number of results (default: 10, max: 500)
- `sprintId` - Sprint ID to filter by (required for sprint data)

**Query Format:**
```
GET /api/v3/projects/114345/test-cases?pageSize=500&sprintId=68209714
```

**Response:** Direct array of test case objects

### Test Case Object Format

```json
{
  "id": 12345,
  "name": "Test Case Name",
  "automation_status": "AUTOMATED" | "MANUAL",
  "assigned_team": "Team Name",
  "attachments": [ ... ],
  "priority": "High" | "Medium" | "Low",
  "status": "Active" | "Inactive"
}
```

## Troubleshooting

### "405 Method Not Allowed"
- **Cause:** Using wrong endpoint format (e.g., `/sprints/{id}/test-cases`)
- **Fix:** Use `/test-cases?sprintId={id}` format

### "No test cases returned"
- **Cause:** Invalid sprint ID
- **Check:** Verify sprint ID in QTEST_SPRINT_REFERENCES.md

### "Authentication failed"
- **Cause:** Invalid or expired token
- **Fix:** Set `$env:QTEST_API_TOKEN` with correct Bearer token

## Resources

- QTest Project: https://wk.qtestnet.com/p/114345/portal/project
- [QTest API Documentation](https://qtestnet.guidepoint.com/display/public/DOC/QTest+API)
- [Sprint References](QTEST_SPRINT_REFERENCES.md)

