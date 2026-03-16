# Live QTest Integration Implementation Guide

## Overview

The dashboard has been updated with **live QTest API integration** with automatic fallback to mock data. The system intelligently attempts to fetch real test case data from QTest and gracefully falls back to mock data if the API is unavailable or credentials are not configured.

## Architecture

### Data Flow

```
Frontend Request → Backend /api/qtest/sprint/[sprint-name]
                        ↓
                   Is API Token Set?
                   /      \
                Yes        No
                /            \
        Try QTest API     Use Mock Data
           /      \              |
        Success  Fail         Return
          |        |         Mock Data
       Return   Fallback
       Live     to Mock
       Data     Data
```

### Key Features

✅ **Live QTest API Integration** - Fetches real test case data when credentials available  
✅ **Intelligent Fallback** - Automatically uses mock data if API unavailable  
✅ **Error Handling** - Gracefully handles network timeouts and auth failures  
✅ **Data Aggregation** - Automatically groups test cases by team and status  
✅ **Backward Compatible** - Works with existing mock data structure  

## Configuration

### Setting Up Live QTest API

#### Option 1: PowerShell (Temporary)

```powershell
$env:QTEST_API_TOKEN = "YOUR_BEARER_TOKEN"
cd backend/api-gateway
node server.js
```

#### Option 2: Environment Variable (Persistent)

**Windows Command Prompt:**
```cmd
setx QTEST_API_TOKEN "YOUR_BEARER_TOKEN"
```

**Windows PowerShell:**
```powershell
[Environment]::SetEnvironmentVariable("QTEST_API_TOKEN", "YOUR_BEARER_TOKEN", "User")
```

**Linux/Mac:**
```bash
export QTEST_API_TOKEN="YOUR_BEARER_TOKEN"
```

#### Option 3: .env File (Development)

Create `.env` file in `backend/api-gateway/`:
```
QTEST_API_TOKEN=YOUR_BEARER_TOKEN
QTEST_PROJECT_ID=114345
```

Then load before starting server:
```bash
source .env  # Linux/Mac
set-content -Path .env -Value ... # PowerShell
node server.js
```

## API Token

### Getting Your QTest API Token

1. Go to [QTest](https://wk.qtestnet.com)
2. Click your profile icon (top right)
3. Select **Settings** → **API Tokens**
4. Generate new token or copy existing one
5. Use Bearer format: `your-token-here`

### Token Format

```
QTEST_API_TOKEN = Bearer [your-actual-token]
```

**DO NOT commit tokens to git!** Add to `.gitignore`:
```
.env
*.local
```

## Sprint Mapping

The system maps sprint names to QTest project IDs:

| Sprint | QTest ID | URL |
|--------|----------|-----|
| 26.1.1 | 68209713 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68209713) |
| 26.1.2 | 68209714 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68209714) |
| 26.1.3 | 68209719 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68209719) |
| 26.1.4 | 68289134 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68289134) |
| 26.1.5 | 68341069 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68341069) |
| 26.1.6 | 68341070 | [View](https://wk.qtestnet.com/p/114345/portal/project#id=68341070) |

### Add More Sprints

Edit `server.js` in the `QTEST_CONFIG.sprintMapping` object:

```javascript
const QTEST_CONFIG = {
  sprintMapping: {
    '26.1.1': 68209713,
    '26.1.2': 68209714,
    // Add new sprints here
    '26.2.1': 12345678  // Example
  }
};
```

## Testing

### Run Integration Test

```powershell
cd backend/api-gateway
powershell -ExecutionPolicy Bypass -File test-live-qtest.ps1
```

**Expected Output (No Token):**
```
✓ 26.1.1 => Total: 0 | Auto: 0 | Src: mock-data
✓ 26.1.2 => Total: 345 | Auto: 287 | Src: mock-data
✓ 26.1.3 => Total: 0 | Auto: 0 | Src: mock-data
Live QTest API: DISABLED (mock data)
```

**Expected Output (With Token):**
```
✓ 26.1.1 => Total: 245 | Auto: 198 | Src: qtest-live
✓ 26.1.2 => Total: 432 | Auto: 398 | Src: qtest-live
✓ 26.1.3 => Total: 187 | Auto: 156 | Src: qtest-live
Live QTest API: ENABLED
```

### Manual API Test

```powershell
# Without API token (uses mock data)
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/qtest/sprint/26.1.2"
$r | ConvertTo-Json -Depth 10

# Response will show: "source": "mock-data"
```

### Force Mock Data (for testing)

```powershell
# Add ?backup=true to force mock data even if token is set
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/qtest/sprint/26.1.2?backup=true"
```

## Response Format

### Live QTest Data Response

```json
{
  "sprint": "26.1.2",
  "totals": {
    "total": 345,
    "automated": 287,
    "with_attachments": 287,
    "without_attachments": 0
  },
  "teams": {
    "Chubb": {
      "total_test_cases": 67,
      "automated_test_cases": 58,
      "with_attachments": 58
    },
    "Matrix": {
      "total_test_cases": 92,
      "automated_test_cases": 87,
      "with_attachments": 87
    }
  },
  "source": "qtest-live"
}
```

### Mock Data Response (Fallback)

```json
{
  "sprint": "26.1.2",
  "totals": {
    "total": 345,
    "automated": 287,
    "with_attachments": 287,
    "without_attachments": 0
  },
  "teams": {
    "Chubb": { ... },
    "Matrix": { ... }
  },
  "source": "mock-data"
}
```

## Troubleshooting

### Issue: "QTEST_API_TOKEN environment variable not set"

**Solution:** Set the environment variable before running server:
```powershell
$env:QTEST_API_TOKEN = "your-token"
node server.js
```

### Issue: "QTest API returned unexpected format"

**Possible Causes:**
- Invalid QTest project ID
- API endpoint changed
- Malformed test case data

**Solution:**
- Verify sprint ID in QTEST_CONFIG.sprintMapping
- Check QTest API documentation
- Fall back to mock data (automatic)

### Issue: "QTest API request timeout"

**Possible Causes:**
- Network connectivity issue
- QTest server is slow
- Firewall blocking HTTPS requests

**Solution:**
- Check network connectivity: `ping wk.qtestnet.com`
- Increase timeout in server.js (default: 15 seconds)
- Use mock data fallback (automatic)

### Issue: "Failed to parse QTest response"

**Possible Causes:**
- QTest API returned non-JSON response
- Invalid authentication token
- API authentication required

**Solution:**
- Verify token is valid
- Test token manually with curl/Postman
- Check QTest API response format

## Performance Considerations

### API Rate Limiting

QTest API typically has rate limits:
- **Throttling:** 100 requests per 1 minute
- **Max Page Size:** 500 test cases

The dashboard requests data once when loaded and caches it in browser. To refresh:
- Change sprint selection
- Reload page
- Manually refresh (F5)

### Optimization Strategies

1. **Server-Side Caching** (Recommended)
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   if (cache.has(sprint) && Date.now() - cache.get(sprint).time < CACHE_TTL) {
     return cache.get(sprint).data;
   }
   ```

2. **Pagination** for large sprints
   ```javascript
   const url = `${QTEST_CONFIG.baseUrl}/.../test-cases?pageSize=500&pageIndex=0`;
   ```

3. **Selective Fetching** - Only fetch data when needed

## Frontend Integration

The frontend automatically uses the enhanced endpoint. No changes needed to HTML/JS.

### How Frontend Uses It

[unified-dashboard.html](frontend/unified-dashboard.html#L464)

```javascript
const qTestUrl = `${API_BASE}/api/qtest/sprint/${sprint}`;
const qTestResponse = await fetch(qTestUrl);
const qtest = await qTestResponse.json();

// Displays totals: qtest.totals.total, qtest.totals.automated, etc.
```

### Detecting Live vs Mock Data

Check response source:
```javascript
if (response.source === 'qtest-live') {
  console.log('Using live QTest data');
} else if (response.source === 'mock-data') {
  console.log('Using mock data (fallback)');
}
```

## Future Enhancements

1. **Real-Time Updates** - Poll QTest API every 5 minutes
2. **Historical Trends** - Track metrics over time
3. **Team-Specific Views** - Filter by team
4. **Defect Correlation** - Link test metrics to defects
5. **Performance Analytics** - Track automation ratio trends
6. **Custom Dashboards** - Allow users to configure views

## Code References

- **Live Integration:** [server.js#L732-L795](backend/api-gateway/server.js#L732-L795)
- **API Configuration:** [server.js#L13-L28](backend/api-gateway/server.js#L13-L28)
- **Data Aggregation:** [server.js#L53-L103](backend/api-gateway/server.js#L53-L103)
- **Test Script:** [test-live-qtest.ps1](backend/api-gateway/test-live-qtest.ps1)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Run the integration test: `test-live-qtest.ps1`
3. Review server logs for detailed error messages
4. Contact QTest admin for API token issues
