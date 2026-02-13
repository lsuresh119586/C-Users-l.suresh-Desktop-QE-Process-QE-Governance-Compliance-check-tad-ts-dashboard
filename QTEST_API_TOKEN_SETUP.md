# QTest API Token Setup Guide

## Quick Start

To enable live QTest data in your dashboard, you need to set up an API token. Follow these steps:

### Step 1: Get Your QTest API Token

1. **Go to QTest:** https://wk.qtestnet.com
2. **Login** with your credentials
3. **Click your profile** (top-right corner) → **Settings**
4. **Navigate to:** API Tokens → Personal Access Tokens
5. **Generate a new token** or copy existing one
6. **Copy the full token value**

### Step 2: Set Environment Variable

Choose one of the methods below:

#### PowerShell (Temporary - This Session Only)

```powershell
$env:QTEST_API_TOKEN = "paste-your-token-here"
```

To verify it's set:
```powershell
$env:QTEST_API_TOKEN
```

#### PowerShell (Permanent - All Future Sessions)

```powershell
[Environment]::SetEnvironmentVariable("QTEST_API_TOKEN", "paste-your-token-here", "User")
```

Then restart PowerShell for changes to take effect.

#### Windows Command Prompt (Permanent)

```cmd
setx QTEST_API_TOKEN "paste-your-token-here"
```

Then restart Command Prompt.

### Step 3: Start the Server

```powershell
cd backend/api-gateway
node server.js
```

### Step 4: Verify It's Working

Run the test script:

```powershell
cd backend/api-gateway
powershell -ExecutionPolicy Bypass -File test-live-qtest.ps1
```

You should see output showing "Live QTest API: ENABLED" and "Src: qtest-live".

## Token Format

Your token should look like:
```
***REMOVED_JIRA_TOKEN***
```

**DO NOT include "Bearer" prefix** - the code adds it automatically.

## Verifying Your Token

### Test Token with curl

```powershell
$token = $env:QTEST_API_TOKEN
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
    -Uri "https://wk.qtestnet.com/api/v3/projects/114345/sprints/68209714/test-cases?pageSize=1" `
    -Headers $headers `
    -Method GET

if ($response.items) {
    Write-Host "✓ Token is valid! Got $(($response.items).Count) test cases"
} else {
    Write-Host "✗ Token is invalid or no test cases found"
}
```

### Check Dashboard

1. Open dashboard: http://localhost:5173/unified-dashboard.html
2. Open browser Developer Tools (F12)
3. Go to **Console** tab
4. Select a sprint from dropdown
5. Look for logs:
   - `[QTest] Fetching live data...` = trying QTest API
   - `[Dashboard]...` = frontend fetching data
6. Check if data displays correctly

## Security

### Protecting Your Token

**✓ DO:**
- Store in environment variables
- Use .env files (add to .gitignore)
- Rotate tokens periodically
- Use separate tokens for dev/prod

**✗ DON'T:**
- Commit tokens to git
- Share tokens via email/chat
- Put tokens in config files that are checked in
- Use tokens in client-side code

### .gitignore Setup

```bash
# Add to .gitignore
.env
.env.local
*.token
```

## Troubleshooting

### "Token is invalid"

**Check:**
1. Token is copied completely without extra spaces
2. Token hasn't expired (regenerate if needed)
3. You're using the correct QTest URL

**Solution:**
```powershell
# Get new token from QTest
# https://wk.qtestnet.com → Settings → API Tokens
$env:QTEST_API_TOKEN = "new-token-here"
```

### "Connection refused"

**Check:**
1. QTest server is accessible: `Test-NetConnection wk.qtestnet.com -Port 443`
2. Firewall allows HTTPS (port 443)
3. Your network connection is working

### "Still using mock data"

**Reasons:**
1. QTEST_API_TOKEN environment variable not set
2. Token is invalid
3. QTest API endpoint is down (fallback to mock data is working correctly)

**Solution:**
```powershell
# Verify token is set
if ($env:QTEST_API_TOKEN) {
    Write-Host "Token is set: $($env:QTEST_API_TOKEN.Substring(0,10))..."
} else {
    Write-Host "Token is NOT set"
}

# Kill and restart server
taskkill /IM node.exe /F
Start-Sleep -Seconds 2
cd backend/api-gateway
node server.js
```

## Response Indicators

When dashboard loads, check response source:

### Live QTest Data (✓ Ideal)
```
Sprint: 26.1.2
Total: 432
Automated: 398
Source: qtest-live
```

### Mock Data (✓ Fallback Working)
```
Sprint: 26.1.2
Total: 345
Automated: 287
Source: mock-data
```

### Error (✗ Issue)
```
Error: QTEST_API_TOKEN environment variable not set
Source: error
```

## Support

### Additional Resources

- [QTest API Documentation](https://qtestnet.guidepoint.com/display/public/DOC/QTest+API)
- [Live Integration Guide](QTEST_LIVE_INTEGRATION.md)
- [QTest Sprint References](QTEST_SPRINT_REFERENCES.md)

### Getting Help

If live QTest integration isn't working:

1. **Check token:** `$env:QTEST_API_TOKEN`
2. **Run test:** `test-live-qtest.ps1`
3. **Check console:** F12 → Console tab
4. **Review logs:** Look for [QTest] messages
5. **Fall back to mock:** System works with or without token

## Next Steps

Once live API is working:

1. ✓ All sprints display real test case counts
2. ✓ Team breakdown shows actual assignments
3. ✓ Automated test counts are accurate
4. ✓ Attachment tracking works correctly

The dashboard automatically uses live data whenever available and falls back to mock data if needed.
