# Tests Covered - Quick Reference

## One-Liner Commands

### Fetch and display test data
```bash
node fetch-testcases.js 26.1.2
```

### Fetch and save to file
```bash
node fetch-testcases.js 26.1.2 --save
```

### Fetch and update database
```bash
node fetch-testcases.js 26.1.2 --update-db
```

### Do everything at once
```bash
node fetch-testcases.js 26.1.2 --save --update-db
```

## API Quick Reference

### All sprints summary
```bash
curl http://localhost:3001/api/metrics/tests-covered-summary
```

### Specific sprint data
```bash
curl http://localhost:3001/api/metrics/tests-covered/26.1.2
```

### Team breakdown
```bash
curl http://localhost:3001/api/metrics/tests-covered/26.1.2/teams
```

### All tests covered data
```bash
curl http://localhost:3001/api/metrics/tests-covered
```

## File Locations

| File | Purpose |
|------|---------|
| `qtest-service.js` | Core qTest API integration |
| `fetch-testcases.js` | CLI tool to fetch data |
| `server-temp.js` | API server with test endpoints |
| `db.json` | Local database with test metrics |
| `tests-covered-{sprint}.json` | Generated sprint data files |

## Key Metrics Explained

| Metric | Definition |
|--------|-----------|
| Total Test Cases | All test cases in the sprint module |
| Automated | Test cases marked as automated in qTest |
| Automation Coverage % | (Automated / Total) × 100 |
| With Attachments | Test cases with attached scripts/documents |
| Teams Count | Number of team sub-modules in sprint |

## Available Sprints

| Sprint | Module ID |
|--------|-----------|
| 26.1.1 | 68209713 |
| 26.1.2 | 68209714 |
| 26.1.3 | 68209719 |

## Workflow

```
1. Fetch Test Data from qTest
   ↓
   node fetch-testcases.js 26.1.2 --update-db
   ↓
2. Start API Server
   ↓
   node server-temp.js
   ↓
3. Query API Endpoints
   ↓
   curl http://localhost:3001/api/metrics/tests-covered/26.1.2
   ↓
4. Display on Dashboard
   ↓
   Use React component or UI framework
```

## Data Flow

```
qTest API
    ↓
qtest-service.js (fetch & analyze)
    ↓
fetch-testcases.js (process & format)
    ↓
db.json + tests-covered-{sprint}.json
    ↓
server-temp.js (API endpoints)
    ↓
Dashboard UI Components
```

## Environment Setup

```bash
# Navigate to backend
cd backend/api-gateway

# Optional: Set qTest token
$env:QTEST_API_TOKEN = "your-token-here"

# Fetch test data
node fetch-testcases.js 26.1.2 --update-db

# Start server
node server-temp.js

# In another terminal, test endpoints
curl http://localhost:3001/api/metrics/tests-covered/26.1.2
```

## Response Structure

All endpoints return JSON with this structure:

```json
{
  "status": "success",
  "data": { /* specific data */ },
  "sprint": "26.1.2",
  "timestamp": "2026-02-06T10:30:00Z"
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check network/qTest URL |
| 401 Unauthorized | Update QTEST_API_TOKEN |
| 404 Not found | Verify sprint/module ID |
| No data returned | Check qTest permissions |
| Port already in use | Kill process or change PORT |

## Performance Notes

- First fetch: 30-60 seconds (depends on test case count)
- Subsequent fetches: Cached in db.json
- API responses: <100ms (cached data)
- Attachment checks: Can add 2-5 seconds per 100 test cases

## Next Integration Steps

- [ ] Fetch test data: `node fetch-testcases.js 26.1.2 --update-db`
- [ ] Start server: `node server-temp.js`
- [ ] Create React components for visualization
- [ ] Add dashboard charts/widgets
- [ ] Set up cron for regular updates
- [ ] Integrate with TAD/TS compliance data
