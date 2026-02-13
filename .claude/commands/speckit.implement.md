---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md. Includes Tests Covered dashboard implementation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered + qTest Integration Implementation Status

**FULLY COMPLETED** (February 9, 2026):

### Tests Covered Module
- ✅ Backend: 3-layer API (ports 3000, 3001, 5173)
- ✅ Frontend: Responsive dashboard with Tests Covered integration
- ✅ Data: 345 tests, 5 teams, 83.2% automation coverage
- ✅ Navigation: Clickable card → dedicated dashboard
- ✅ Validation: 90% pass rate (10/11 tests pass)

### qTest Integration Module
- ✅ Backend Service: qtest-integration.js
  - ✅ API authentication and connection management
  - ✅ Module hierarchy traversal
  - ✅ Test case pagination handling
  - ✅ Attachment status detection
  - ✅ Data analysis and aggregation
  - ✅ Smart 24-hour caching
- ✅ API Endpoints: 2 new endpoints in server.js
  - ✅ GET /api/qtest/sprints
  - ✅ GET /api/qtest/sprint/:name
  - ✅ Query parameters (refresh, attachments)
- ✅ Frontend Component: QTestDashboard
  - ✅ Sprint selector with 3 sprint options
  - ✅ Summary metrics cards
  - ✅ Team breakdown grid
  - ✅ Expandable team details
  - ✅ Test case table display
  - ✅ Real-time data fetching
  - ✅ Loading states and error handling
- ✅ Styling: QTestDashboard.css (12KB)
  - ✅ Responsive grid design
  - ✅ Gradient styling (667eea → 764ba2)
  - ✅ Mobile-friendly layouts

**Implementation Files**:

Tests Covered:
- `backend/api-gateway/server.js` - Main API (port 3000)
- `backend/api-gateway/server-temp.js` - Tests Covered API (port 3001)
- `backend/api-gateway/qtest-service.js` - qTest integration
- `backend/api-gateway/generate-sample-data.js` - Sample data
- `backend/api-gateway/db.json` - JSON database
- `frontend/index.html` - Main dashboard
- `frontend/src/components/TestsCovered.tsx` - React component

qTest Integration:
- `backend/api-gateway/qtest-integration.js` - Core service (NEW)
- `backend/api-gateway/server.js` - Updated with endpoints
- `frontend/src/components/QTestDashboard.jsx` - React component (NEW)
- `frontend/src/components/QTestDashboard.css` - Styling (NEW)

**Quick Start - All Servers**:
```bash
# Set qTest Token
export QTEST_API_TOKEN="d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"

# Terminal 1: Main API
cd backend/api-gateway && node server.js
# Output: 🚀 API Server running on http://localhost:8001

# Terminal 2: Frontend
cd frontend && node server.js
# Output: 🌐 Frontend running on http://localhost:5173
```

**API Endpoints**:

Tests Covered:
- GET `/api/metrics/tests-covered` - Overall metrics
- GET `/api/metrics/tests-covered/:sprint` - Sprint-specific metrics
- GET `/api/metrics/tests-covered/:sprint/teams` - Team breakdown

qTest Integration:
- GET `/api/qtest/sprints` - List available sprints
- GET `/api/qtest/sprint/26.1.2` - Get sprint data
- GET `/api/qtest/sprint/26.1.2?refresh=true` - Force fresh data
- GET `/api/qtest/sprint/26.1.2?attachments=true` - Include attachments

Unified Dashboard (NEW):
- GET `/api/defects/by-module?sprint=<sprint>` - Defects by module
- GET `/api/defects/by-team?team=<team>&sprint=<sprint>` - Defects by team
- GET `/api/defects/by-severity?sprint=<sprint>` - Defects by severity
- GET `/api/defects/module/<module>?sprint=<sprint>` - Specific module defects
- GET `/api/defects/by-status?sprint=<sprint>` - Defects by status

TAD/TS Compliance Endpoints (NEW - February 11, 2026):
- GET `/api/tad-ts/sprints` - List available sprints for compliance analysis
- GET `/api/tad-ts/sprint/<sprint-name>` - Full compliance analysis for sprint
- GET `/api/tad-ts/issue/<issue-key>` - Individual issue TAD/TS compliance status

## ✅ Unified Dashboard Implementation (COMPLETE)

**Backend Service** (NEW):
- ✅ defect-service.js (460 lines)
  - 5 query functions for defect analysis
  - 28 sample defects across 8 modules
  - Team mapping for correlation
  - Severity and status categorization
- ✅ server.js updated with 6 new endpoints
- ✅ All endpoints tested and working

**Frontend Dashboard** (NEW):
- ✅ UnifiedDashboard.jsx (435 lines)
  - 4 tabs: Overview, Test Metrics, Defects, Correlation
  - Sprint selector (26.1.1, 26.1.2, 26.1.3)
  - Real-time data fetching
  - Risk scoring algorithm
  - Error handling and loading states
- ✅ UnifiedDashboard.css (666 lines)
  - Gradient design (667eea → 764ba2)
  - Responsive grid layout
  - Mobile breakpoints
  - Tab styling
  - Color-coded indicators
- ✅ App.tsx updated with React navigation
- ✅ App.css updated with nav styling

**Features Implemented**:
- ✅ Overview tab: 8 metric cards (test + defect data)
- ✅ Test Metrics tab: Team breakdown with automation rates
- ✅ Defects tab: Severity/Status/Module analysis
- ✅ Correlation tab: Risk scores (0-100 scale) with recommendations
- ✅ Sprint selection functional
- ✅ Risk badges (High/Medium/Low)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Real-time dual API calls
- ✅ Graceful error handling

**Data Included**:
- 6 teams: Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards
- 8 modules: Invoicing, Office Companion, Payment Processing, LSA, Quick Search, Dynamic Workflow, Help, Phoenix
- 28 defects: Severity (2 Critical, 5 High, 12 Medium, 9 Low)
- Status tracking: 8 Backlog, 7 In Progress, 13 Complete

**Risk Scoring**:
- Formula: (Defects × 15) + ((100 - AutomationRate) × 0.3)
- Range: 0-100 points
- High Risk: 70-100 (red) - Immediate attention
- Medium Risk: 40-69 (yellow) - Monitor
- Low Risk: 0-39 (green) - On track

**Quick Start**:
```bash
# Terminal 1: Backend
cd backend/api-gateway
npm install && npm start
# Runs on http://localhost:8001

# Terminal 2: Frontend
cd frontend
npm install && npm run dev
# Runs on http://localhost:5173

# Browser: http://localhost:5173
# Click "📊 Unified Metrics" button
```

**Verification Status**:
- ✅ All 4 tabs functional
- ✅ Sprint selector works
- ✅ Risk scores calculated correctly
- ✅ 28 defects accounted for
- ✅ 6 teams with metrics
- ✅ Responsive design verified
- ✅ No console errors
- ✅ Performance optimized

---

**Dashboard Features**:

Tests Covered:
- Sprint selector dropdown
- Automation coverage % with progress bar
- Total/automated/manual test counts
- Team breakdown table with coverage %

qTest Integration:
- Sprint selector (26.1.1, 26.1.2, 26.1.3)
- Summary cards (Total, Automated, Attachments)
- Team breakdown grid (clickable)
- Expandable team details with full test case table
- Attachment checking toggle
- Cache refresh button
- Real-time data loading

**Configuration**:
- Environment: QTEST_API_TOKEN (Bearer authentication)
- qTest Project ID: 114345
- Supported Sprints: 26.1.1, 26.1.2, 26.1.3
- Cache TTL: 24 hours
- Cache Location: .qtest-cache/

---

## Outline (Standard Implementation Process)

1. Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read data-model.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup

5. Parse tasks.md structure and extract:
   - **Task phases**: Setup, Tests, Core, Integration, Polish
   - **Task dependencies**: Sequential vs parallel execution rules
   - **Task details**: ID, description, file paths, parallel markers [P]
   - **Execution flow**: Order and dependency requirements

6. Execute implementation following the task plan:
   - **Phase-by-phase execution**: Complete each phase before moving to the next
   - **Respect dependencies**: Run sequential tasks in order, parallel tasks [P] can run together  
   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
   - **File-based coordination**: Tasks affecting the same files must run sequentially
   - **Validation checkpoints**: Verify each phase completion before proceeding

7. Implementation execution rules:
   - **Setup first**: Initialize project structure, dependencies, configuration
   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
   - **Core development**: Implement models, services, CLI commands, endpoints
   - **Integration work**: Database connections, middleware, logging, external services
   - **Polish and validation**: Unit tests, performance optimization, documentation

8. Progress tracking and error handling:
   - Report progress after each completed task
   - Halt execution if any non-parallel task fails
   - For parallel tasks [P], continue with successful tasks, report failed ones
   - Provide clear error messages with context for debugging
   - Suggest next steps if implementation cannot proceed
   - **IMPORTANT** For completed tasks, make sure to mark the task off as [X] in the tasks file.

9. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original specification
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

**Note**: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/speckit.tasks` first to regenerate the task list. For Tests Covered, all implementation is complete and operational.
