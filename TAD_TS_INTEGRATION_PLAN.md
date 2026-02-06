# TAD/TS Dashboard Integration Plan

## Current Analysis of tad-ts-dashboard

### Key Features to Integrate:

#### 1. **TAD/TS Compliance Checking**
- **TAD Keywords**: "TAD", "TECHNICAL ARCHITECTURE", "TECHNICAL DESIGN", "ADR", "ARCHITECTURE DECISION"
- **TS Keywords**: "TS FOR", "TEST STRATEGY", "TEST PLAN", "TESTING STRATEGY", "QA STRATEGY"
- Two-stage detection:
  - Stage 1: Check PR names in JIRA Development tab
  - Stage 2: If not found, check issue description field
- Tracks source (PR vs Description)

#### 2. **Data Structure**
```json
{
  "dateRange": "Sprint 26.1.1",
  "generated": "2026-02-02 20:20:24",
  "summary": {
    "total": 23,
    "tadComplete": 21,
    "tsComplete": 19,
    "bothComplete": 19,
    "tadPct": 100.0,
    "tsPct": 100.0,
    "bothPct": 82.61,
    "missingTad": 0,
    "missingTs": 0
  },
  "defects": {
    "totalDefects": 17,
    "activities": { "QE Feature Testing": 13, ... },
    "teamMatrix": { "T360 Vanguards": { ... } },
    "teamDefectDetails": { ... }
  },
  "teamBreakdown": { ... },
  "issues": [ ... ]
}
```

#### 3. **Teams Tracked**
- T360 Vanguards
- Nexus
- T360 Mavericks
- Matrix
- T360 ICD Chubb
- T360 Chargers
- Athena
- (13 total teams via customfield_13392)

#### 4. **Filters & Analysis**
- Issue Types: Bug and Story (excludes Sub-task, Epic, Feature, Task)
- Project: GET (JIRA project key)
- Safe-SDLC Activity tracking (customfield_14391)
- Sprint-based filtering
- Status filters: All/Closed/New/Closed & New

#### 5. **Defect Analysis**
- Activities: QE Feature Testing, Vulnerability Testing, QE Regression Testing, UAT, Production
- Team × Activity matrix
- Detailed issue lists per team/activity

#### 6. **Data Generation**
- Source: JIRA API using Bearer token authentication
- Retry logic with exponential backoff
- Pagination support (100 issues per request)
- Handles large datasets efficiently

---

## Integration Steps for Spec Kit Dashboard

### Phase 1: Backend API Gateway Enhancement
1. Add TAD/TS compliance endpoints to server.js
2. Create new database tables:
   - TADTSCompliance
   - DefectAnalysis
   - TeamActivityMatrix
3. Add JIRA API integration module

### Phase 2: Frontend Components
1. Add TAD/TS dashboard view
2. Create compliance chart components
3. Add defect analysis visualizations
4. Implement sprint/team filtering

### Phase 3: Data Pipeline
1. Create Python script to fetch JIRA data
2. Transform and store in SQL Server
3. Expose via REST API endpoints

### Phase 4: UI/UX
1. Dashboard with sprint selector
2. Status filter controls
3. Team breakdown views
4. Defect detail panels

---

## JIRA Integration Requirements

**Environment Variables Needed:**
- JIRA_URL: https://jira.wolterskluwer.io/jira
- JIRA_API_TOKEN: Bearer token for authentication
- JIRA_PROJECT_KEY: GET

**JIRA API Fields Used:**
- key, summary, description
- issuetype, status, assignee
- customfield_13392 (Team)
- customfield_14391 (Safe-SDLC Activity)
- customfield_10004, sprint
- issuelinks

**Filtering:**
- Project: GET
- Issue Types: Bug, Story
- Sprint: By name or current/open sprints

---

## Data Flow
```
JIRA API 
   ↓
Python Script (sprint-tad-ts-report.py)
   ↓
JSON Data Files
   ↓
Node.js API Gateway (new endpoints)
   ↓
SQL Server Database
   ↓
Frontend React Components
   ↓
Interactive Dashboard
```

---

## Next Steps
1. Copy relevant Python logic to Node.js/JavaScript
2. Create JIRA API client module
3. Add new tables to SQL Server schema
4. Build React components for visualization
5. Integrate with existing metrics dashboard
