---
description: Execute the implementation planning workflow using the plan template to generate design artifacts. Includes Tests Covered architecture.
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered + qTest Integration + Unified Dashboard Architecture (COMPLETED)

**System Design**: Multi-layer Node.js API + React Frontend with qTest + Defect Integration

### Tests Covered Architecture

**Layer 1: Main API (Port 3000)**
- Server: `backend/api-gateway/server.js`
- Endpoints: `/api/products`, `/api/teams`, `/api/sprints`, `/api/metrics`
- Database: JSON file (`db.json`)
- Response: Products, teams, sprints, baseline metrics

**Layer 2: Tests Covered API (Port 3001)**
- Server: `backend/api-gateway/server-temp.js`
- Endpoints: 
  - GET `/api/metrics/tests-covered` - Overall metrics
  - GET `/api/metrics/tests-covered/:sprint` - Sprint metrics
  - GET `/api/metrics/tests-covered/:sprint/teams` - Team breakdown
- Data Source: Sample generator or qTest API
- Response: Test counts, automation %, team breakdown

### qTest Integration Architecture

**Backend Service Layer**:
- Service: `backend/api-gateway/qtest-integration.js`
- Functions:
  - `fetchSprintTestCases()` - Get sprint data from qTest
  - `getCachedSprintData()` - Retrieve from cache
  - `clearCache()` - Manage cache lifecycle
- Features:
  - Bearer token authentication
  - Module hierarchy traversal
  - Pagination handling (100 items/page)
  - Attachment detection
  - Data aggregation and analysis
  - 24-hour intelligent caching

**API Endpoints**:
- `GET /api/qtest/sprints` - List available sprints
- `GET /api/qtest/sprint/:name` - Get sprint test case data
- Query parameters: `?refresh=true`, `?attachments=true`

### Unified Dashboard Architecture (NEW)

**Backend Service Layer** (NEW):
- Service: `backend/api-gateway/defect-service.js` (460 lines)
- Functions:
  - `getDefectsByModule()` - Aggregate defects by module
  - `getDefectsByTeam()` - Filter by team
  - `getDefectsBySeverity()` - Categorize by severity
  - `getDefectsByModuleName()` - Query specific modules
  - `getDefectsByStatus()` - Group by status
- Data: 28 sample defects, 8 modules, 6 teams mapped

**API Endpoints** (NEW - 6 endpoints):
- `GET /api/defects/by-module?sprint=<sprint>`
- `GET /api/defects/by-team?team=<team>&sprint=<sprint>`
- `GET /api/defects/by-severity?sprint=<sprint>`
- `GET /api/defects/module/:name?sprint=<sprint>`
- `GET /api/defects/by-status?sprint=<sprint>`

### TAD/TS Compliance Analysis Architecture (NEW - February 11, 2026)

**Backend Service Layer** (NEW):
- Service: `backend/api-gateway/tadTsService.js` (NEW - 470+ lines)
- Core Functions:
  - `checkDevStatusPRs()` - Query Bitbucket/GitHub/GitLab PR links
  - `checkDescriptionForLinks()` - Parse issue descriptions for TAD/TS docs
  - `checkCommentsForNA()` - Detect "Not Applicable" in comments
  - `checkBugLinkedToStory()` - Link bug→story analysis
  - `analyzeIssue()` - Full compliance analysis per issue
  - `analyzeSprintCompliance()` - Sprint-wide compliance metrics
  - `calculateComplianceStats()` - Statistical aggregation
- Dependencies:
  - Extends `jiraService.js` for Jira API calls
  - Uses `/rest/dev-status/1.0/` for PR detection
  - Handles 3 repo types: Bitbucket, GitHub, GitLab
  - Async/await based HTTP request handling

**Compliance Detection Logic**:
1. **TAD Detection** (Technical Architecture Document):
   - PR names: "TAD", "TECHNICAL ARCHITECTURE"
   - Description links: Keywords like "TECHNICAL DESIGN", "ADR"
   - Source tracking: PR vs Description

2. **TS Detection** (Test Strategy):
   - PR names: "[TS]", "TS FOR", "TEST STRATEGY"
   - Description links: Keywords like "TEST PLAN", "TESTING STRATEGY"
   - Filters: Excludes "TS FILE"

3. **Not Applicable Detection**:
   - Stories: Checks comments for N/A keywords + deliverable type
   - Bugs: Checks if linked to Story in same sprint
   - Comments: Searches "NOT APPLICABLE", "N/A", "NOT REQUIRED"
   - Cascading: TAD N/A → TS automatically N/A

4. **Statistics Calculation**:
   - Total issues analyzed
   - Compliance percentages (excluding N/A items)
   - Team-based compliance matrix
   - Truly missing vs N/A categorization

**API Endpoints** (NEW - 3 endpoints):
- `GET /api/tad-ts/sprints` - List available sprints
- `GET /api/tad-ts/sprint/<sprint-name>` - Full compliance analysis (async)
- `GET /api/tad-ts/issue/<issue-key>` - Individual issue analysis

**Response Format** (sprint endpoint):
```json
{
  "sprint": "26.1.1",
  "timestamp": "2026-02-11T10:30:00Z",
  "totalIssues": 45,
  "stats": {
    "total": 45,
    "tadComplete": 38,
    "tsComplete": 40,
    "bothComplete": 37,
    "tadNA": 3,
    "tsNA": 2,
    "tadTrulyMissing": 4,
    "tsTrulyMissing": 3,
    "tadCompliancePct": 92.7,
    "tsCompliancePct": 95.3
  },
  "issues": [
    {
      "key": "GET-12345",
      "type": "Story",
      "tad_found": true,
      "ts_found": true,
      "tad_source": "PR",
      "ts_source": "Description",
      "tad_pr": { "name": "TAD-UPDATE", "status": "MERGED", "url": "..." },
      "tad_desc_links": ["https://..."],
      "tad_na": false,
      "ts_na": false
    }
  ]
}
```

**Integration with Dashboard**:
- Consumed by frontend TAD/TS compliance dashboard (future)
- Feeds into risk scoring algorithm
- Team-level compliance metrics
- Trending analysis across sprints
````

**Frontend Dashboard** (NEW):
- Component: `frontend/src/components/UnifiedDashboard.jsx` (435 lines)
- 4-Tab Interface:
  1. **Overview** - Dual metrics (test + defect)
  2. **Test Metrics** - Team breakdown with automation rates
  3. **Defects** - Severity, status, module analysis
  4. **Correlation** - Risk scores with recommendations
- Styling: `frontend/src/components/UnifiedDashboard.css` (666 lines)
  - Gradient design (667eea → 764ba2)
  - Responsive grid layouts
  - Mobile breakpoints (768px)
  - Color-coded indicators
- Features:
  - Sprint selector (3 options)
  - Real-time dual data fetching
  - Risk scoring algorithm
  - Error handling
  - Responsive design

**Risk Scoring Algorithm**:
```
Risk Score = (Defects × 15) + ((100 - AutomationRate) × 0.3)
Range: 0-100 points

High Risk (70-100): Red badge - Needs immediate attention
Medium Risk (40-69): Yellow badge - Monitor and improve
Low Risk (0-39): Green badge - On track
```

**Integration Architecture**:
  "total_tests": 345,
  "automated_tests": 287,
  "manual_tests": 58,
  "coverage_percentage": 83.2,
  "teams": [
    {
      "name": "Chubb",
      "total": 69,
      "automated": 58,
      "manual": 11,
      "coverage": 84.1
    }
  ]
}
```

**Data Model - qTest Integration**:
```json
{
  "sprint_name": "26.1.2",
  "module_id": 68209714,
  "totals": {
    "total": 150,
    "automated": 120,
    "with_attachments": 95,
    "without_attachments": 25
  },
  "teams": {
    "Team A": {
      "total": 50,
      "automated": 42,
      "with_attachments": 38,
      "test_cases": []
    }
  }
}
```

**Integration Points**:
1. Main dashboard displays Tests Covered metrics
2. QTest Dashboard accessible via new component
3. Sprint selector filters data dynamically
4. Team breakdown table shows statistics
5. Attachment toggle tracks compliance
6. Cache refresh for latest data
7. Error handling with user feedback

**qTest Configuration**:
- API URL: https://wk.qtestnet.com/api/v3
- Project ID: 114345
- Authentication: Bearer token (environment variable)
- Supported Sprints: 26.1.1, 26.1.2, 26.1.3
- Cache Duration: 24 hours
- Cache Location: `.qtest-cache/`

**Sample Data Generator**:
- Creates 345 test cases across 5 teams
- 3 sprints (26.1.1, 26.1.2, 26.1.3)
- Average automation coverage: 83.2%
- Location: `backend/api-gateway/generate-sample-data.js`
  "total_tests": 345,
  "automated_tests": 287,
  "manual_tests": 58,
  "coverage_percentage": 83.2,
  "teams": [
    {
      "name": "Chubb",
      "total": 69,
      "automated": 58,
      "manual": 11,
      "coverage": 84.1
    }
  ]
}
```

**Integration Points**:
1. Main dashboard loads Tests Covered metrics
2. Click "Tests Covered" card → opens dedicated dashboard
3. Sprint selector filters data
4. Team table shows breakdown
5. Back button returns to main dashboard

**qTest Integration** (`backend/api-gateway/qtest-service.js`):
- Requires valid qTest API token
- Methods: fetch test cases, calculate coverage, format response
- Fallback: Sample data generator when token unavailable

**Sample Data Generator**:
- Creates 345 test cases across 5 teams (Chubb, Matrix, Mavericks, Nexus, Vanguards)
- 3 sprints (26.1.1, 26.1.2, 26.1.3)
- Average automation coverage: 83.2%
- Location: `backend/api-gateway/generate-sample-data.js`

---

## Outline (Standard Planning Process)

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file

### Phase 2: Validation & Gate

1. **Validate Phase 1 outputs**: Ensure all artifacts exist and match template format
2. **Re-check constitution**: No violations introduced by design
3. **Report status**: PASS (proceed to tasks phase) or FAIL (list violations)

**OUTPUT**: All design artifacts ready for task generation
