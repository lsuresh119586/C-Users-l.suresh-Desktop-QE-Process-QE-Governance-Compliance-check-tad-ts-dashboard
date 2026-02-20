# TAD/TS Dashboard Integration - Implementation Guide

## Overview

This document describes the integration of TAD/TS (Technical Architecture Document / Test Strategy) compliance checking from the existing tad-ts-dashboard into the new Polaris ELM Dashboard using the Spec Kit template.

## What is TAD/TS Compliance?

### TAD (Technical Architecture Document)
Checks if JIRA issues have associated Technical Architecture/Design documents. Keywords tracked:
- TAD
- TECHNICAL ARCHITECTURE
- TECHNICAL DESIGN
- ADR (Architecture Decision Record)
- ARCHITECTURE DECISION

### TS (Test Strategy)
Checks if JIRA issues have associated Test Strategy documentation. Keywords tracked:
- TS FOR
- TEST STRATEGY
- TEST PLAN
- TESTING STRATEGY
- QA STRATEGY

**Note:** "TS FILE" is explicitly excluded to avoid false positives.

## Architecture

### Data Flow
```
JIRA API 
   ↓
jiraService.js (TAD/TS detection logic)
   ↓
server.js (Node.js API endpoints)
   ↓
SQL Server Database (TADTSCompliance & TADTSIssues tables)
   ↓
Frontend React Components
   ↓
Interactive Dashboard UI
```

## New Database Tables

### TADTSCompliance Table
Stores sprint-level compliance statistics
```sql
CREATE TABLE TADTSCompliance (
  id NVARCHAR(100) PRIMARY KEY,
  sprintName NVARCHAR(100) NOT NULL,
  total INT NOT NULL,
  tadComplete INT NOT NULL,
  tsComplete INT NOT NULL,
  bothComplete INT NOT NULL,
  missingTad INT NOT NULL,
  missingTs INT NOT NULL,
  tadPct FLOAT NOT NULL,
  tsPct FLOAT NOT NULL,
  bothPct FLOAT NOT NULL,
  generatedAt DATETIME DEFAULT GETDATE(),
  createdAt DATETIME DEFAULT GETDATE()
)
```

### TADTSIssues Table
Stores individual issue analysis
```sql
CREATE TABLE TADTSIssues (
  id NVARCHAR(50) PRIMARY KEY,
  sprintName NVARCHAR(100) NOT NULL,
  jiraKey NVARCHAR(20) NOT NULL,
  summary NVARCHAR(MAX) NOT NULL,
  team NVARCHAR(100),
  status NVARCHAR(50),
  tadFound BIT DEFAULT 0,
  tadSource NVARCHAR(50),
  tsFound BIT DEFAULT 0,
  tsSource NVARCHAR(50),
  createdAt DATETIME DEFAULT GETDATE()
)
```

## New API Endpoints

### 1. Get TAD/TS Compliance Analysis
**Endpoint:** `GET /api/tadts/compliance`

**Query Parameters:**
- `sprint` (optional): Sprint name (e.g., "Sprint 26.1.1")

**Response:**
```json
{
  "total": 23,
  "tadComplete": 21,
  "tsComplete": 19,
  "bothComplete": 19,
  "missingTad": 0,
  "missingTs": 0,
  "tadPct": 100.0,
  "tsPct": 100.0,
  "bothPct": 82.61,
  "teamBreakdown": {
    "T360 Vanguards": {
      "total": 5,
      "tadComplete": 5,
      "tsComplete": 4,
      "bothComplete": 4,
      "missingTad": 0,
      "missingTs": 1
    },
    ...
  },
  "issues": [
    {
      "key": "GET-12345",
      "summary": "Issue summary",
      "team": "T360 Vanguards",
      "status": "Closed",
      "tad": { "found": true, "source": "PR", "details": "..." },
      "ts": { "found": true, "source": "Description", "details": "TEST STRATEGY" }
    },
    ...
  ]
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/tadts/compliance?sprint=Sprint%2026.1.1"
```

### 2. Get TAD/TS Issues
**Endpoint:** `GET /api/tadts/issues`

**Query Parameters:**
- `sprint` (optional): Filter by sprint name
- `team` (optional): Filter by team name

**Response:**
```json
[
  {
    "id": "tadts-GET-12345",
    "sprintName": "Sprint 26.1.1",
    "jiraKey": "GET-12345",
    "summary": "Issue summary",
    "team": "T360 Vanguards",
    "status": "Closed",
    "tadFound": 1,
    "tadSource": "PR",
    "tsFound": 1,
    "tsSource": "Description"
  },
  ...
]
```

## Configuration

### Environment Variables (.env file)

**Existing SQL Server config:**
```
DB_SERVER=localhost
DB_NAME=ELMDashboard
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

**New JIRA config:**
```
JIRA_URL=https://jira.wolterskluwer.io/jira
JIRA_API_TOKEN=your_bearer_token_here
JIRA_PROJECT_KEY=GET
```

### Getting JIRA API Token

1. Go to https://jira.wolterskluwer.io/secure/ViewProfile.jspa
2. Click "API tokens" section
3. Click "Create API token"
4. Copy the token and save it in `.env`

**Format:** `JIRA_API_TOKEN=eyJhbGc...` (long string)

## Implementation Files

### Backend
- **server.js** - Main API server with new `/api/tadts/*` endpoints
- **jiraService.js** - JIRA API client and TAD/TS analysis logic
- **.env** - Configuration file with JIRA credentials
- **package.json** - Dependencies (mssql, dotenv)

### Key Functions in jiraService.js

```javascript
// Get all issues from a sprint
jiraService.getSprintIssues(sprintName)

// Check if issue has TAD
jiraService.checkTAD(issue)
// Returns: { found: true/false, source: 'PR'/'Description', details: '...' }

// Check if issue has TS
jiraService.checkTS(issue)
// Returns: { found: true/false, source: 'PR'/'Description', details: '...' }

// Analyze entire sprint
jiraService.analyzeSprintCompliance(sprintName)
// Returns: { total, tadComplete, tsComplete, ..., teamBreakdown, issues }
```

## Issue Analysis Logic

### Two-Stage Detection

**Stage 1: PR Names (Primary)**
- Checks JIRA issue links (Pull Requests in Development tab)
- Looks for TAD/TS keywords in PR names
- Higher confidence than description

**Stage 2: Description Field (Fallback)**
- Checks issue description field
- Looks for TAD/TS keywords anywhere in text
- Extracts keyword that matched

### Filtering
- **Issue Types:** Only Bug and Story (excludes Sub-task, Epic, Feature, Task)
- **Project:** GET (customizable via JIRA_PROJECT_KEY)
- **Teams:** Retrieved from customfield_13392 in JIRA

## Frontend Components (To Be Built)

The following React components should be created in `frontend/src/`:

### 1. TADTSCompliance.tsx
Main dashboard component showing sprint compliance

### 2. ComplianceChart.tsx
Bar chart showing TAD/TS percentages

### 3. TeamBreakdown.tsx
Table showing team-wise breakdown

### 4. IssueDetails.tsx
Detailed view of individual issues

### 5. SprintSelector.tsx
Dropdown to select sprint

## Usage Examples

### Fetch Compliance for Current Sprint
```javascript
fetch('http://localhost:3000/api/tadts/compliance')
  .then(res => res.json())
  .then(data => console.log(data))
```

### Fetch for Specific Sprint
```javascript
fetch('http://localhost:3000/api/tadts/compliance?sprint=Sprint%2026.1.1')
  .then(res => res.json())
  .then(data => console.log(data))
```

### Fetch Issues for Team
```javascript
fetch('http://localhost:3000/api/tadts/issues?sprint=Sprint%2026.1.1&team=T360%20Vanguards')
  .then(res => res.json())
  .then(data => console.log(data))
```

## Migration from Original Dashboard

### Data Consistency
- **Original dashboard** uses pure Python + HTML/JavaScript
- **New dashboard** uses Node.js API + React frontend
- Both can operate independently
- Data is synchronized via JIRA API

### Keys Preserved
- Same JIRA keywords detection logic
- Same team mapping
- Same filtering rules (Bug & Story types only)

## Troubleshooting

### JIRA Connection Issues
**Error:** `JIRA API Error: 401`
- **Cause:** Invalid or expired JIRA_API_TOKEN
- **Solution:** Regenerate token and update .env

**Error:** `JIRA API Error: 403`
- **Cause:** Token user doesn't have permission for GET project
- **Solution:** Check JIRA user permissions

**Error:** `JIRA API request timeout`
- **Cause:** Network issue or JIRA server slow
- **Solution:** Check internet connection, retry

### Database Issues
**Error:** `Connection failed`
- **Cause:** SQL Server not running
- **Solution:** Start SQL Server service or Docker container

**Error:** `Table already exists`
- **Cause:** Tables already created
- **Solution:** This is normal, ignore the warning

## Next Steps

1. **Install dependencies:** `npm install` in backend/api-gateway
2. **Configure environment:** Set JIRA_API_TOKEN in .env
3. **Test API:** Run server and test endpoints
4. **Build Frontend:** Create React components
5. **Integrate UI:** Connect frontend to new API endpoints
6. **Deploy:** Follow deployment guide

## Support & Maintenance

### Regular Tasks
- Monitor JIRA API rate limits
- Archive old compliance data periodically
- Update team mappings as needed
- Verify TAD/TS keyword relevance quarterly

### Performance Considerations
- JIRA API requests cached in memory (optional: add Redis)
- SQL queries indexed on sprintName and team
- Consider pagination for large datasets

## References

- **Original TAD/TS Dashboard:** `/Compliance check/tad-ts-dashboard/`
- **Python Implementation:** `sprint-tad-ts-report.py`
- **HTML Dashboard:** `tad-ts-dashboard.html`
- **Sample Data:** `tad-ts-report-sprint-26.1.1.json`
