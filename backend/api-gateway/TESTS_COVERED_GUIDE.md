# Tests Covered Integration Guide

This guide explains how to pull test case data from qTest and populate the "Tests Covered" metric in your dashboard.

## Overview

The Tests Covered feature provides comprehensive test metrics by:
1. Fetching test cases from qTest using the API
2. Analyzing automation coverage and test statistics
3. Organizing data by team and sprint
4. Exposing metrics via REST API endpoints

## Files Created

### 1. **qtest-service.js** - Core qTest Integration Module
Handles all interactions with qTest API.

**Key Functions:**
- `getSprintTestCases(moduleId, sprintName)` - Fetches all test cases for a sprint
- `getModuleStructure(moduleId)` - Retrieves module hierarchy and teams
- `analyzeTestCases(testCases)` - Generates statistics
- `printReport(data)` - Formats output for display

**Configuration:**
```javascript
const QTEST_URL = "https://wk.qtestnet.com/api/v3";
const PROJECT_ID = 114345;
const QTEST_API_TOKEN = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d";
```

### 2. **fetch-testcases.js** - CLI Tool for Data Fetching
Command-line script to fetch and manage test data.

**Usage:**
```bash
# Fetch test cases for a sprint and display report
node fetch-testcases.js 26.1.2

# Fetch and save to separate JSON file
node fetch-testcases.js 26.1.2 --save

# Fetch and update db.json with metrics
node fetch-testcases.js 26.1.2 --update-db

# Fetch with both save and db update
node fetch-testcases.js 26.1.2 --save --update-db
```

**Available Sprints:**
- 26.1.1 (Module ID: 68209713)
- 26.1.2 (Module ID: 68209714)
- 26.1.3 (Module ID: 68209719)

**Output:**
- Console report with team breakdown and statistics
- Optional: `tests-covered-{sprint}.json` file
- Optional: Updated `db.json` with metrics

### 3. **server-temp.js** - Updated API Server
Enhanced API server with new test metrics endpoints.

## API Endpoints

### Get All Tests Covered Data
```
GET /api/metrics/tests-covered
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "26.1.1": { ... },
    "26.1.2": { ... },
    "26.1.3": { ... }
  },
  "available_sprints": ["26.1.1", "26.1.2", "26.1.3"],
  "total_sprints": 3
}
```

### Get Tests Covered for Specific Sprint
```
GET /api/metrics/tests-covered/:sprint
```

**Example:**
```
GET /api/metrics/tests-covered/26.1.2
```

**Response:**
```json
{
  "status": "success",
  "sprint": "26.1.2",
  "data": {
    "sprint": "26.1.2",
    "module_id": 68209714,
    "generated": "2026-02-06",
    "summary": {
      "total_test_cases": 345,
      "total_automated": 287,
      "total_with_attachments": 287,
      "automation_coverage_percent": 83.2,
      "teams_count": 5
    },
    "teams": {
      "Team A": {
        "total_test_cases": 67,
        "automated_test_cases": 58,
        "automation_coverage_percent": 86.6,
        "with_attachments": 58,
        "without_attachments": 9,
        "test_cases": [ ... ]
      },
      ...
    }
  }
}
```

### Get Tests Covered Summary (All Sprints Aggregated)
```
GET /api/metrics/tests-covered-summary
```

**Response:**
```json
{
  "status": "success",
  "aggregate": {
    "total_test_cases": 1050,
    "total_automated": 892,
    "automation_coverage_percent": 85.0,
    "total_with_attachments": 892,
    "sprints_tracked": 3
  },
  "sprints": [
    {
      "sprint": "26.1.1",
      "total_test_cases": 312,
      "total_automated": 267,
      "automation_coverage_percent": 85.6,
      "teams_count": 5
    },
    ...
  ]
}
```

### Get Team Breakdown for a Sprint
```
GET /api/metrics/tests-covered/:sprint/teams
```

**Example:**
```
GET /api/metrics/tests-covered/26.1.2/teams
```

**Response:**
```json
{
  "status": "success",
  "sprint": "26.1.2",
  "teams": {
    "Team A": {
      "total_test_cases": 67,
      "automated_test_cases": 58,
      "automation_coverage_percent": 86.6,
      "with_attachments": 58,
      "without_attachments": 9,
      "test_cases": [ ... ]
    },
    ...
  },
  "summary": {
    "total_teams": 5,
    "total_test_cases": 345
  }
}
```

### Update Tests Covered Data
```
POST /api/metrics/tests-covered
```

**Request Body:**
```json
{
  "sprint": "26.1.2",
  "data": {
    "sprint": "26.1.2",
    "module_id": 68209714,
    "generated": "2026-02-06",
    "summary": {
      "total_test_cases": 345,
      "total_automated": 287,
      ...
    },
    "teams": { ... }
  }
}
```

## Quick Start

### Step 1: Set qTest API Token (if needed)
The token is already configured in qtest-service.js. If you need to update it:

```bash
# Set environment variable
$env:QTEST_API_TOKEN = "your-token-here"

# Or edit qtest-service.js
const QTEST_API_TOKEN = "your-token-here";
```

### Step 2: Fetch Test Data
```bash
cd backend/api-gateway
node fetch-testcases.js 26.1.2 --save --update-db
```

This will:
1. Fetch test cases from qTest for sprint 26.1.2
2. Display a formatted report in the console
3. Save data to `tests-covered-26.1.2.json`
4. Update `db.json` with the metrics

### Step 3: Access via API
Start the server:
```bash
node server-temp.js
```

Then query the endpoints:
```bash
# Get summary for all sprints
curl http://localhost:3001/api/metrics/tests-covered-summary

# Get data for specific sprint
curl http://localhost:3001/api/metrics/tests-covered/26.1.2

# Get team breakdown
curl http://localhost:3001/api/metrics/tests-covered/26.1.2/teams
```

## Data Structure

### Tests Covered Object
```javascript
{
  "sprint": "26.1.2",
  "module_id": 68209714,
  "generated": "2026-02-06",
  
  "summary": {
    "total_test_cases": 345,           // Total test cases found
    "total_automated": 287,            // Test cases marked as automated
    "total_with_attachments": 287,     // Test cases with scripts/attachments
    "automation_coverage_percent": 83.2, // Percentage automated
    "teams_count": 5                   // Number of teams
  },
  
  "teams": {
    "Team A": {
      "total_test_cases": 67,
      "automated_test_cases": 58,
      "automation_coverage_percent": 86.6,
      "with_attachments": 58,
      "without_attachments": 9,
      "test_cases": [
        {
          "id": "TC-001",
          "qtest_id": 12345,
          "name": "Login with valid credentials",
          "automated": true,
          "status": "Active"
        },
        ...
      ]
    }
  }
}
```

## Statistics Explained

- **Total Test Cases**: All test cases found in the module
- **Total Automated**: Test cases marked with "Automation = Yes" in qTest
- **Automation Coverage**: Percentage of test cases that are automated
- **With Attachments**: Test cases that have attached test scripts
- **Teams**: Number of teams/sub-modules within the sprint

## Troubleshooting

### Connection Error: ECONNREFUSED
```
Error: connect ECONNREFUSED 127.0.0.1:443
```
**Solution**: Check your network connection to qTest. The API URL must be accessible from your network.

### 401 Unauthorized
```
Error: HTTP 401: {"errorCode":"OAUTH_TOKEN_INVALID"}
```
**Solution**: Update the QTEST_API_TOKEN in qtest-service.js with a valid token from https://wk.qtestnet.com/user/api-token

### 404 Module Not Found
```
Error: HTTP 404: {"errorCode":"MODULE_NOT_FOUND"}
```
**Solution**: Verify the module ID is correct. Check SPRINT_CONFIGS in fetch-testcases.js.

### No Test Cases Found
**Solution**: 
1. Verify the sprint module has test cases in qTest
2. Check if your qTest user has permission to view the module
3. Try fetching a different sprint first to test connectivity

## Integration with Dashboard

### Display on Dashboard
The test data can be displayed on your dashboard by:

1. Fetching from `/api/metrics/tests-covered` endpoint
2. Creating a component to visualize:
   - Total test cases per team
   - Automation coverage percentage
   - Test case status distribution

### Example React Component
```jsx
function TestsCovered({ sprint }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/metrics/tests-covered/${sprint}`)
      .then(res => res.json())
      .then(result => setData(result.data));
  }, [sprint]);
  
  if (!data) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Tests Covered - {sprint}</h2>
      <p>Total: {data.summary.total_test_cases}</p>
      <p>Automated: {data.summary.total_automated}</p>
      <p>Coverage: {data.summary.automation_coverage_percent}%</p>
      
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Total</th>
            <th>Automated</th>
            <th>Coverage %</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.teams).map(([team, stats]) => (
            <tr key={team}>
              <td>{team}</td>
              <td>{stats.total_test_cases}</td>
              <td>{stats.automated_test_cases}</td>
              <td>{stats.automation_coverage_percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Scheduling Regular Updates

To refresh test data on a schedule, create a cron job or scheduled task:

### Windows Task Scheduler
```batch
cd C:\Users\l.suresh\Desktop\QE Process\QE Governance\Spec Kit Templates\spec-kit-template-claude-ps-v0.0.90\backend\api-gateway
node fetch-testcases.js 26.1.2 --update-db
```

### Linux/Mac Cron
```bash
0 9 * * 1 cd /path/to/backend/api-gateway && node fetch-testcases.js 26.1.2 --update-db
```

This would run every Monday at 9 AM.

## API Token Management

To get your qTest API token:
1. Go to https://wk.qtestnet.com/user/api-token
2. Generate or view your token
3. Update QTEST_API_TOKEN in qtest-service.js or use environment variable

## Next Steps

1. ✅ Run `node fetch-testcases.js 26.1.2 --update-db` to populate initial data
2. ✅ Start server with `node server-temp.js`
3. ✅ Test API endpoints
4. Create dashboard visualization components
5. Set up scheduled updates via cron/task scheduler
6. Integrate with JIRA TAD/TS compliance tracking

## Support

For issues or questions:
- Check qTest API documentation: https://docs.qtestnet.com/
- Verify network connectivity to qTest
- Ensure valid API token is set
- Review console output for error messages
