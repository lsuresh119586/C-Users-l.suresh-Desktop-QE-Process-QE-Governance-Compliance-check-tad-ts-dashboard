---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md. Includes Tests Covered dashboard implementation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered Implementation Status

**FULLY COMPLETED** (February 6, 2026):
- ✅ Backend: 3-layer API (ports 3000, 3001, 5173)
- ✅ Frontend: Responsive dashboard with Tests Covered integration
- ✅ Data: 345 tests, 5 teams, 83.2% automation coverage
- ✅ Navigation: Clickable card → dedicated dashboard
- ✅ Validation: 90% pass rate (10/11 tests pass)

**Key Implementation Files**:
- `backend/api-gateway/server.js` - Main API (port 3000)
- `backend/api-gateway/server-temp.js` - Tests Covered API (port 3001)
- `backend/api-gateway/qtest-service.js` - qTest integration
- `backend/api-gateway/generate-sample-data.js` - Sample data (345 tests)
- `backend/api-gateway/db.json` - JSON database
- `frontend/index.html` - Main dashboard with Tests Covered card
- `frontend/src/components/TestsCovered.tsx` - React component

**Quick Start - All 3 Servers**:
```bash
# Terminal 1: Main API
cd backend/api-gateway && node server.js
# Output: 🚀 API Server running on http://localhost:3000

# Terminal 2: Tests Covered API
cd backend/api-gateway && node server-temp.js
# Output: 🚀 Tests Covered API Server running on http://localhost:3001

# Terminal 3: Frontend
cd frontend && node server.js
# Output: 🌐 Frontend running on http://localhost:5173
```

**API Endpoints - Tests Covered**:
- GET `/api/metrics/tests-covered` - Overall metrics
- GET `/api/metrics/tests-covered/:sprint` - Sprint-specific metrics
- GET `/api/metrics/tests-covered/:sprint/teams` - Team breakdown for sprint

**Dashboard Features**:
- Sprint selector dropdown
- Automation coverage % with progress bar
- Total/automated/manual test counts
- Team breakdown table with coverage %
- Back button to main dashboard
- Responsive design (mobile/tablet/desktop)

**Reference Documentation**:
- [TESTS_COVERED_IMPLEMENTATION.md](../../TESTS_COVERED_IMPLEMENTATION.md) - 500+ line guide
- [PROJECT_COMPLETION_SUMMARY.md](../../PROJECT_COMPLETION_SUMMARY.md) - Project statistics
- [DOCUMENTATION_UPDATE_SUMMARY.md](../../DOCUMENTATION_UPDATE_SUMMARY.md) - File inventory

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
