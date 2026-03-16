# Live QTest Integration - Quick Reference

## One-Minute Setup

```powershell
# 1. Get token from https://wk.qtestnet.com → Settings → API Tokens

# 2. Set environment variable
$env:QTEST_API_TOKEN = "YOUR_TOKEN_HERE"

# 3. Start backend
cd backend/api-gateway
node server.js

# 4. Test it
Invoke-RestMethod "http://localhost:3000/api/qtest/sprint/26.1.2" | ConvertTo-Json
```

## Verification

### Check Token is Set
```powershell
$env:QTEST_API_TOKEN
```

### Test Single Sprint
```powershell
Invoke-RestMethod "http://localhost:3000/api/qtest/sprint/26.1.2"
```

### Run Full Test
```powershell
cd backend/api-gateway
powershell -ExecutionPolicy Bypass -File test-live-qtest.ps1
```

## Key Endpoints

### Get Test Metrics
```
GET /api/qtest/sprint/{sprint-name}
```

**Parameters:**
- `sprint-name` - Sprint identifier (e.g., "26.1.2", "chargers-26.1.1")
- `?backup=true` - Force mock data (optional)

**Response:**
```json
{
  "sprint": "26.1.2",
  "totals": {
    "total": 345,
    "automated": 287,
    "with_attachments": 287,
    "without_attachments": 0
  },
  "teams": { ... },
  "source": "qtest-live" | "mock-data"
}
```

## Sprint IDs

| Sprint | ID | URL |
|--------|----|----|
| 26.1.1 | 68209713 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68209713) |
| 26.1.2 | 68209714 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68209714) |
| 26.1.3 | 68209719 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68209719) |
| 26.1.4 | 68289134 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68289134) |
| 26.1.5 | 68341069 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68341069) |
| 26.1.6 | 68341070 | [Link](https://wk.qtestnet.com/p/114345/portal/project#id=68341070) |

## Troubleshooting

### Data Shows "mock-data" Source
**Causes:**
- Token not set → `$env:QTEST_API_TOKEN` empty
- Token invalid → Check in QTest settings
- QTest API down → Check status.qtest.com

**Fix:**
```powershell
$env:QTEST_API_TOKEN = "new-token"
taskkill /IM node.exe /F
node server.js
```

### Connection Refused
**Cause:** Backend not running

**Fix:**
```powershell
cd backend/api-gateway
node server.js
```

### API Timeout
**Cause:** Slow network or QTest API overloaded

**Solution:** System automatically falls back to mock data (no action needed)

### Token Invalid
**Cause:** Wrong token format or expired

**Fix:**
1. Go to https://wk.qtestnet.com → Settings → API Tokens
2. Generate new token
3. Update: `$env:QTEST_API_TOKEN = "new-token"`
4. Restart server

## Files Reference

| File | Purpose |
|------|---------|
| [server.js](backend/api-gateway/server.js#L13-L28) | QTest API config & implementation |
| [test-live-qtest.ps1](backend/api-gateway/test-live-qtest.ps1) | Integration test script |
| [QTEST_LIVE_INTEGRATION.md](QTEST_LIVE_INTEGRATION.md) | Complete guide |
| [QTEST_API_TOKEN_SETUP.md](QTEST_API_TOKEN_SETUP.md) | Token setup guide |
| [QTEST_SPRINT_REFERENCES.md](QTEST_SPRINT_REFERENCES.md) | Sprint mapping |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Implementation summary |

## Key Functions

### fetchQTestData(url)
Fetches data from QTest API with bearer token authentication.

### aggregateTestMetrics(testCases, sprintName)
Groups test cases by team, counts automated tests, tracks attachments.

### /api/qtest/sprint/:sprint
Main endpoint - returns live or mock data based on token availability.

## Environment Variables

```powershell
# Required
$env:QTEST_API_TOKEN = "your-bearer-token"

# Optional
$env:QTEST_PROJECT_ID = "114345"
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (live or mock data) |
| 400 | Missing sprint name |
| 500 | Server error (returns mock data as fallback) |

## Common Commands

```powershell
# Start backend
cd backend/api-gateway && node server.js

# Test endpoint
Invoke-RestMethod "http://localhost:3000/api/qtest/sprint/26.1.2"

# Check token
Write-Host $env:QTEST_API_TOKEN

# Set token
$env:QTEST_API_TOKEN = "token-here"

# Kill all node processes
taskkill /IM node.exe /F

# Run test script
powershell -ExecutionPolicy Bypass -File test-live-qtest.ps1
```

## Response Indicators

✅ **Everything Works**
- `"source": "qtest-live"`
- Total matches QTest data
- Teams properly grouped

✅ **Fallback Working**
- `"source": "mock-data"`
- Mock data displayed
- No errors

❌ **Error**
- `"error": "..."`
- `"source": "error"`
- Check logs

## Automation

### Add to Startup Script

```powershell
# Set token once
[Environment]::SetEnvironmentVariable("QTEST_API_TOKEN", "your-token", "User")

# Server will use it on every restart
```

### Integrate with CI/CD

```yaml
# Add to environment before deployment
env:
  QTEST_API_TOKEN: ${{ secrets.QTEST_API_TOKEN }}
```

## Performance Notes

- **Live API Response:** 2-5 seconds
- **Mock Fallback:** <100ms
- **Timeout:** 15 seconds
- **Rate Limit:** 100 req/min

## Support

| Issue | Solution |
|-------|----------|
| Still showing mock data | Set token & restart |
| Connection refused | Start backend server |
| Timeout | Check network, will fallback |
| Invalid token | Regenerate in QTest |
| No data | Check sprint ID mapping |

---

**Quick Links:**
- [Full Documentation](QTEST_LIVE_INTEGRATION.md)
- [Token Setup](QTEST_API_TOKEN_SETUP.md)
- [Sprint References](QTEST_SPRINT_REFERENCES.md)
- [Backend Code](backend/api-gateway/server.js#L732-L795)
