# QTest Integration Guide - Test Case Metrics

## Overview
This integration brings test case counts from QTest test design documents into the Polaris dashboard metrics system.

## QTest Project Mapping

### Sprint 26.1.1 (T360)
- **QTest Project ID**: 68209713
- **Test Design URL**: https://wk.qtestnet.com/p/114345/portal/project#id=68209713&object=0&tab=testdesign
- **Base Project**: T360 26.1.1

### Other Sprints (General)
- **QTest Project ID**: 68180756
- **Test Design URL**: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign
- **Covers**: Chargers, Matrix, Vanguards, Athena, Nexus, Chubb, Mavericks sprints

## Configuration Files

### 1. qtest-config.js
Maps sprints to their corresponding QTest test design project IDs and URLs.

**Location**: `backend/api-gateway/qtest-config.js`

**Structure**:
```javascript
{
  sprint: {
    projectId: 68209713,        // QTest project ID
    testDesignPath: '#id=...',  // QTest URL path
    team: 'chargers',           // Team name
    sprint: '26.1.1',           // Sprint version
    name: 'Chargers Sprint 26.1.1'
  }
}
```

### 2. qtest-service-v2.js
Service class for fetching test case metrics from QTest API.

**Location**: `backend/api-gateway/qtest-service-v2.js`

**Key Methods**:
- `getTestCasesForSprint(sprintKey)` - Get test cases for specific sprint
- `getAllSprintTestCases()` - Get test cases for all sprints
- `syncTestCaseMetrics(db)` - Sync metrics to database
- `getSummaryStatistics()` - Get overall statistics

## Database Schema

### Metrics Table Extensions
```sql
TestCasesTotal INT              -- Total test cases count
TestCasesAutomated INT          -- Automated test cases count
TestCasesWithAttachments INT    -- Test cases with attachments count
QTestProjectId INT              -- QTest project ID (FK reference)
QTestProjectUrl NVARCHAR(500)   -- Direct link to QTest test design
```

## Usage

### 1. Setup QTest API Token
```powershell
$env:QTEST_API_TOKEN = 'your-qtest-api-token'
```

### 2. Fetch Test Case Metrics
```javascript
const QTestService = require('./qtest-service-v2');
const service = new QTestService();

// Get test cases for specific sprint
const metrics = await service.getTestCasesForSprint('chargers-26.1.1');

// Get all sprint metrics
const allMetrics = await service.getAllSprintTestCases();

// Get summary statistics
const summary = await service.getSummaryStatistics();
```

### 3. Sync to Database
```javascript
const sql = require('mssql');
const config = require('./database-config');

const pool = new sql.ConnectionPool(config);
await pool.connect();

const service = new QTestService();
await service.syncTestCaseMetrics(pool);
```

### 4. Direct SQL Updates
Execute the SQL migration scripts:
```bash
sqlcmd -S "zusscntssql19\sql2022" -U "sql-cs-user" -P "***REMOVED_DB_PASSWORD***" -i "05-extend-schema-testcases.sql"
sqlcmd -S "zusscntssql19\sql2022" -U "sql-cs-user" -P "***REMOVED_DB_PASSWORD***" -i "06-update-qtest-links.sql"
```

## Sprint Configuration Reference

### Sprint 26.1.1 Teams
1. **T360 (26.1.1)**
   - Project ID: 68209713
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68209713&object=0&tab=testdesign

2. **Chargers (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

3. **Matrix (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

4. **Vanguards (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

5. **Athena (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

6. **Nexus (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

7. **Chubb (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

8. **Mavericks (26.1.1)**
   - Project ID: 68180756
   - URL: https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign

## API Endpoints

### Get Test Cases for Sprint
```
GET /api/testcases/sprint/:sprint
```

**Response**:
```json
{
  "sprint": "chargers-26.1.1",
  "team": "chargers",
  "total": 45,
  "automated": 38,
  "withAttachments": 12,
  "automationRate": "84.44%",
  "qTestUrl": "https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign"
}
```

### Get All Sprint Metrics
```
GET /api/testcases/all
```

### Get Test Case Summary
```
GET /api/testcases/summary
```

## Troubleshooting

### API Token Issues
- Verify QTest API token is set: `echo $env:QTEST_API_TOKEN`
- Check token permissions in QTest admin settings
- Token must have access to project 114345

### Connection Issues
- Ensure network connectivity to wk.qtestnet.com
- Check firewall/proxy settings
- Verify timeout settings (default: 30 seconds)

### Data Sync Issues
- Check database connection credentials
- Verify SQL Server is running
- Review SyncLog table for error details

## Performance Notes

- Test case fetching is paginated (500 per page)
- Summary statistics are cached in memory
- Database sync runs on configurable schedule
- Consider rate limiting for large bulk syncs

## Security

- API tokens stored in environment variables
- Never commit tokens to version control
- Use .env file for local development
- Rotate tokens periodically

---
**Last Updated**: February 13, 2026
**Version**: 1.0
**API Version**: v3 (QTest)
