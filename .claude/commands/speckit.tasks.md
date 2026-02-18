---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs: 
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure), spec.md (user stories with priorities)
   - **Optional**: data-model.md (entities), contracts/ (API endpoints), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Execute task generation workflow**:
   - Load plan.md and extract tech stack, libraries, project structure
   - Load spec.md and extract user stories with their priorities (P1, P2, P3, etc.)
   - If data-model.md exists: Extract entities and map to user stories
   - If contracts/ exists: Map endpoints to user stories
   - If research.md exists: Extract decisions for setup tasks
   - Generate tasks organized by user story (see Task Generation Rules below)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `.specify/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - Phase 1: Setup tasks (project initialization)
   - Phase 2: Foundational tasks (blocking prerequisites for all user stories)
   - Phase 3+: One phase per user story (in priority order from spec.md)
   - Each phase includes: story goal, independent test criteria, tests (if requested), implementation tasks
   - Final Phase: Polish & cross-cutting concerns
   - All tasks must follow the strict checklist format (see Task Generation Rules below)
   - Clear file paths for each task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

5. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per user story
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Suggested MVP scope (typically just User Story 1)
   - Format validation: Confirm ALL tasks follow the checklist format (checkbox, ID, labels, file paths)

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.

## ✅ Tests Covered + qTest Integration + Unified Dashboard Task Status

**COMPLETED FEATURES** (February 9, 2026):

### Tests Covered Implementation ✅
- ✅ Backend: 3-layer API infrastructure (ports 3000, 3001, 5173)
  - Main API (port 3000): /api/products, /teams, /sprints, /metrics
  - Tests Covered API (port 3001): /api/metrics/tests-covered, /:sprint, /:sprint/teams
  - Frontend Server (port 5173): Static HTML/CSS/JavaScript service
- ✅ Frontend: React component (TestsCovered.tsx) + CSS + Vanilla HTML dashboard
- ✅ Sample Data: 345 test cases across 5 teams, 3 sprints, 83.2% coverage
- ✅ Navigation: Clickable Tests Covered card → dedicated dashboard
- ✅ Responsive Design: Desktop, tablet, mobile support

### qTest Integration Implementation ✅
- ✅ Backend Service: qtest-integration.js (8KB)
  - API authentication via Bearer token
  - Module hierarchy traversal
  - Test case pagination handling
  - Attachment status detection
  - Data analysis and aggregation
  - 24-hour intelligent caching
- ✅ API Endpoints: Updated server.js
  - GET /api/qtest/sprints - List sprints
  - GET /api/qtest/sprint/:name - Get sprint data
  - Query parameters: refresh, attachments
- ✅ Frontend Component: QTestDashboard.jsx (7KB)
  - Sprint selector (26.1.1, 26.1.2, 26.1.3)
  - Summary metric cards
  - Team breakdown grid
  - Expandable team details
  - Test case table display
  - Real-time fetching with loading states
  - Error handling and messages

### Unified Dashboard Implementation ✅ (NEW)
- ✅ Backend Service: defect-service.js (460 lines)
  - 5 query functions for defect analysis
  - 28 sample defects across 8 modules
  - Team mapping for correlation
  - Severity categorization (SEV-1 to SEV-4)
  - Status tracking (Backlog/In Progress/Complete)
- ✅ API Endpoints: 6 new endpoints in server.js
  - GET /api/defects/by-module - Defects by module
  - GET /api/defects/by-team - Defects by team
  - GET /api/defects/by-severity - Defects by severity
  - GET /api/defects/module/:name - Specific module
  - GET /api/defects/by-status - Defects by status
  - All support sprint parameter for filtering
- ✅ Frontend Component: UnifiedDashboard.jsx (435 lines)
  - 4-tab interface (Overview, Test Metrics, Defects, Correlation)
  - Sprint selector (26.1.1, 26.1.2, 26.1.3)
  - Real-time dual data fetching (qTest + Defects)
  - Risk scoring algorithm (0-100 scale)
  - Risk badges (High/Medium/Low)
  - Team recommendations
  - Error handling and loading states
- ✅ Frontend Styling: UnifiedDashboard.css (666 lines)
  - Gradient design (667eea → 764ba2)
  - Responsive grid layouts
  - Mobile breakpoints at 768px
  - Tab navigation styling
  - Severity/status color indicators
  - Animation keyframes
  - Hover effects
- ✅ App Integration: Updated App.tsx and App.css
  - React navigation with button switching
  - "📊 Unified Metrics" button added
  - "✅ Tests Covered" button added
  - Responsive nav bar

**Risk Scoring Implementation**:
- Formula: (Defects × 15) + ((100 - AutomationRate) × 0.3)
- High Risk (70-100): Red badge - Immediate attention
- Medium Risk (40-69): Yellow badge - Monitor
- Low Risk (0-39): Green badge - On track

**Data Integration**:
- 6 teams with qTest metrics
- 8 modules with defect data
- 28 sample defects included
- Severity levels: 2 Critical, 5 High, 12 Medium, 9 Low
- Status: 8 Backlog, 7 In Progress, 13 Complete

### TAD/TS Compliance Analysis Implementation ✅ (NEW - February 11, 2026)
- ✅ Backend Service: tadTsService.js (470+ lines)
  - `checkDevStatusPRs()` - Query Bitbucket/GitHub/GitLab PR links
  - `checkDescriptionForLinks()` - Parse descriptions for TAD/TS documentation
  - `checkCommentsForNA()` - Detect "Not Applicable" markers in comments
  - `checkBugLinkedToStory()` - Link bug→story analysis in same sprint
  - `analyzeIssue()` - Full per-issue compliance analysis
  - `analyzeSprintCompliance()` - Sprint-wide compliance metrics
  - `calculateComplianceStats()` - Statistical aggregation
- ✅ API Endpoints: 3 new endpoints
  - GET /api/tad-ts/sprints - List available sprints
  - GET /api/tad-ts/sprint/:name - Full sprint compliance (async)
  - GET /api/tad-ts/issue/:key - Individual issue analysis
- ✅ Compliance Logic:
  - **TAD Detection**: PR links + description keywords
  - **TS Detection**: PR links + description keywords
  - **N/A Handling**: Comment analysis, bug→story linking
  - **Metrics**: Compliance %, team matrix, missing vs N/A

**Quick Start Instructions**:
```bash
# Backend
cd backend/api-gateway
npm install && npm start

# Frontend (new terminal)
cd frontend
npm install && npm run dev

# Browser: http://localhost:5173
# Click "📊 Unified Metrics" button
```
- ✅ Styling: QTestDashboard.css (12KB)
  - Responsive grid design
  - Gradient styling (667eea → 764ba2)
  - Mobile-responsive layouts

### Configuration ✅
- ✅ Environment: QTEST_API_TOKEN (Bearer authentication)
- ✅ qTest Project: 114345
- ✅ Sprints: 26.1.1, 26.1.2, 26.1.3 mapped to module IDs
- ✅ Cache: 24-hour TTL in .qtest-cache/

### Setup Instructions

**1. Set qTest Token**:
```bash
# Windows PowerShell
$env:QTEST_API_TOKEN = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"

# Mac/Linux
export QTEST_API_TOKEN="d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"
```

**2. Start Backend**:
```bash
cd backend/api-gateway
npm install
node server.js
# Output: 🚀 API Server running on http://localhost:8001
```

**3. Start Frontend**:
```bash
cd frontend
npm install
npm run dev
# Output: 🌐 Frontend running on http://localhost:5173
```

**4. Access Dashboard**:
- Main: http://localhost:5173
- API: http://localhost:8001/api/qtest/sprints

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature specification or if user requests TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if task is parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED for user story phase tasks only
   - Format: [US1], [US2], [US3], etc. (maps to user stories from spec.md)
   - Setup phase: NO story label
   - Foundational phase: NO story label  
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action with exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Endpoints/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)

2. **From Contracts**:
   - Map each contract/endpoint → to the user story it serves
   - If tests requested: Each contract → contract test task [P] before implementation in that story's phase

3. **From Data Model**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Setup phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete before user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns
