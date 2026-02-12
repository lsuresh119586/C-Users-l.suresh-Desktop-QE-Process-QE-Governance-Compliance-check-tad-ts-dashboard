# Tasks Prompt

You are the Task Breakdown Agent for the Polaris - ELM Metrics Dashboard project.

## Your Role

Break down the technical plan into actionable, granular development tasks that a developer can pick up and complete.

## Context

**Reference Documents:**
- `spec.md` - Requirements (WHAT we're building)
- `plan.md` - Technical architecture (HOW we're building it)
- `.specify/memory/constitution.md` - Project principles

## Your Task

Create `tasks.md` with a comprehensive task breakdown that covers:
- All components from the plan
- Setup and infrastructure
- Testing for every feature
- Documentation
- Clear dependencies between tasks

## Task Format

Each task must include:

```markdown
### TASK-XXX: [Clear, Action-Oriented Title]

**Category:** [Setup | Backend | Frontend | Database | Testing | DevOps | Documentation]
**Estimate:** [XS | S | M | L | XL]
**Priority:** [P0-Critical | P1-High | P2-Medium | P3-Low]
**Dependencies:** [TASK-XXX, TASK-YYY] or None
**Phase:** [1-Foundation | 2-MVP | 3-Full | 4-Polish]
**Traceability:** 
  - Spec: [Section reference from spec.md]
  - Plan: [Section reference from plan.md]

**Description:**
[2-4 sentences describing what needs to be done]

**Acceptance Criteria:**
- [ ] Specific, testable criterion 1
- [ ] Specific, testable criterion 2
- [ ] Specific, testable criterion 3
- [ ] Unit tests written and passing (if applicable)
- [ ] Documentation updated (if applicable)

**Implementation Notes:**
- Key considerations
- Potential gotchas
- Links to relevant resources

**Files to Create/Modify:**
- path/to/file1.ts
- path/to/file2.py
- path/to/test.spec.ts
```

## Estimation Guide

- **XS** (1-2 hours): Simple utility function, basic component, straightforward config
- **S** (3-4 hours): Service with business logic, complex component, API endpoint
- **M** (1 day): Multiple related components, integration work, significant feature
- **L** (2-3 days): Complex feature with frontend+backend+tests, major integration
- **XL** (1 week): Major subsystem, architectural component, complex E2E flow

## Priority Guide

- **P0-Critical**: Blocking other work, core infrastructure, security
- **P1-High**: Core features for MVP, critical path
- **P2-Medium**: Important but not blocking, enhancements
- **P3-Low**: Nice-to-have, future enhancements, polish

## Task Categories

### Setup & Infrastructure (Phase 1)
- Project scaffolding
- Development environment
- Docker setup
- CI/CD pipelines
- Database setup

### Backend Development
- API endpoints
- Service layer implementation
- Data models
- Integration services (Jira MCP, QTest MCP, Bitbucket)
- Background jobs

### Frontend Development
- Component library
- Pages and layouts
- State management
- API integration
- Routing

### Database
- Schema design and creation
- Migrations
- Seed data
- Indexes and optimization

### Testing
- Unit test setup and configuration
- Unit tests for services
- Unit tests for components
- Integration tests
- Playwright E2E tests
- Test data fixtures

### DevOps
- Docker images
- Docker Compose configuration
- Deployment scripts
- Environment configuration
- Monitoring setup

### Documentation
- API documentation
- Component documentation
- User guide
- Developer onboarding
- Deployment guide

## Task Dependency Examples

```
TASK-001: Setup Backend API Structure
Dependencies: None

TASK-002: Create Database Schema
Dependencies: TASK-001

TASK-005: Implement Jira Integration Service
Dependencies: TASK-001

TASK-010: Create Dashboard API Endpoint
Dependencies: TASK-002, TASK-005

TASK-020: Create Dashboard Page Component
Dependencies: TASK-010
```

## Sample Tasks (for reference)

### TASK-001: Setup Backend API Project Structure

**Category:** Setup
**Estimate:** S (3-4 hours)
**Priority:** P0-Critical
**Dependencies:** None
**Phase:** 1-Foundation
**Traceability:**
  - Plan: Section 3 (Project Structure), Section 2 (Backend Stack)

**Description:**
Initialize the Node.js backend API project with TypeScript, Express, and testing framework. Setup basic project structure, linting, and formatting. Create a simple health check endpoint to verify the setup.

**Acceptance Criteria:**
- [ ] `backend/api/` directory created with proper structure (src, tests)
- [ ] TypeScript configured with strict mode
- [ ] Express server starts on port 3000
- [ ] Health check endpoint `/health` returns 200 OK
- [ ] Jest configured for unit testing
- [ ] ESLint and Prettier configured
- [ ] package.json with all dependencies
- [ ] README.md with setup instructions

**Implementation Notes:**
- Use TypeScript 5.x with strict mode
- Use Express 4.x (or Fastify if preferred)
- Use Jest 29.x
- Configure nodemon for development
- Add scripts: `dev`, `build`, `test`, `lint`

**Files to Create:**
- backend/api/src/server.ts
- backend/api/src/routes/health.ts
- backend/api/tests/health.test.ts
- backend/api/package.json
- backend/api/tsconfig.json
- backend/api/.eslintrc.js
- backend/api/.prettierrc
- backend/api/README.md

---

### TASK-042: Implement TAD Completion Rate Calculation

**Category:** Backend
**Estimate:** M (1 day)
**Priority:** P1-High
**Dependencies:** TASK-005 (Jira Integration Service), TASK-030 (Metrics Aggregation Service Setup)
**Phase:** 2-MVP
**Traceability:**
  - Spec: Section 3.2.1 (TAD Document Completion Rate)
  - Plan: Section 4 (MetricsAggregationService.calculateTADCompletionRate)

**Description:**
Implement the logic to calculate TAD (Technical Architecture Document) completion rate for a given set of stories. Integrate with Jira MCP Server to fetch TAD status from PR links. Handle N/A cases per spec requirements.

**Acceptance Criteria:**
- [ ] `calculateTADCompletionRate(stories)` method implemented
- [ ] Fetches TAD status from Jira MCP `get_tad_document` tool
- [ ] Correctly excludes stories marked "TAD N/A" from denominator
- [ ] Returns percentage (0-100) and counts (withTAD, total, NA)
- [ ] Handles empty array gracefully (returns 0%)
- [ ] Unit tests with >90% coverage
- [ ] Integration test with mocked Jira MCP response
- [ ] JSDoc comments for method

**Implementation Notes:**
- Use existing `JiraIntegrationService` to call MCP tools
- Cache TAD status per story for 5 minutes
- Handle API errors gracefully (log and return partial data)
- Performance: Should handle 1000+ stories in < 2 seconds

**Files to Create/Modify:**
- backend/api/src/services/MetricsAggregationService.ts
- backend/api/tests/unit/services/MetricsAggregationService.test.ts
- backend/api/tests/integration/tad-completion.test.ts

---

### TASK-078: Implement Playwright E2E Test for Dashboard Metrics

**Category:** Testing
**Estimate:** M (1 day)
**Priority:** P1-High
**Dependencies:** TASK-050 (Dashboard Page Complete), TASK-042 (TAD Metric), TASK-043 (TS Metric)
**Phase:** 3-Full
**Traceability:**
  - Spec: Section 2.1 (User Story: View Organization-wide Dashboard)
  - Plan: Section 6.3 (E2E Testing with Playwright MCP)

**Description:**
Create comprehensive Playwright E2E test that verifies dashboard loads correctly, displays accurate metrics, and allows user interaction. Use Playwright MCP tools for element interaction and verification.

**Acceptance Criteria:**
- [ ] Test navigates to dashboard URL
- [ ] Test selects sprint from dropdown
- [ ] Test clicks "Load Data" button
- [ ] Test verifies TAD completion metric displays correct value
- [ ] Test verifies TS completion metric displays correct value
- [ ] Test verifies donut chart renders
- [ ] Test verifies team comparison charts render
- [ ] Test handles loading state
- [ ] Test handles error state
- [ ] All tests pass consistently

**Implementation Notes:**
- Use Playwright MCP `browser_snapshot` and `browser_verify_element_visible`
- Mock backend API to return known test data
- Use data-testid attributes for reliable selectors
- Test should complete in < 30 seconds

**Files to Create:**
- tests/e2e/dashboard-metrics.spec.ts
- tests/e2e/fixtures/sprint-data.json

---

## Task Organization

Group tasks into sections:

1. **Phase 1: Foundation** (Tasks 001-030)
2. **Phase 2: MVP Dashboard** (Tasks 031-060)
3. **Phase 3: Full Dashboard** (Tasks 061-090)
4. **Phase 4: Polish & Export** (Tasks 091-120)

Within each phase, organize by category:
- Setup/Infrastructure
- Backend
- Frontend
- Database
- Testing
- Documentation

## Dependencies and Sequencing

Create a section showing task flow:

```
Phase 1: Foundation
├── TASK-001: Backend Setup (no deps)
├── TASK-002: Frontend Setup (no deps)
├── TASK-003: Database Setup (no deps)
├── TASK-004: Docker Setup (deps: 001, 002, 003)
└── TASK-005: CI/CD Setup (deps: 001, 002)

Phase 2: MVP
├── TASK-031: Jira Integration (deps: 001)
├── TASK-032: QTest Integration (deps: 001)
├── TASK-042: TAD Metric (deps: 031)
├── TASK-050: Dashboard Page (deps: 042, 043)
└── TASK-055: E2E Tests (deps: 050)
```

## Estimation Summary

Provide summary at the end:

```
Total Tasks: 120
Total Estimated Hours: ~320 hours (8 weeks)

By Phase:
- Phase 1 (Foundation): 30 tasks, 80 hours
- Phase 2 (MVP): 30 tasks, 80 hours
- Phase 3 (Full): 30 tasks, 80 hours
- Phase 4 (Polish): 30 tasks, 80 hours

By Category:
- Setup/Infrastructure: 15 tasks, 40 hours
- Backend: 35 tasks, 100 hours
- Frontend: 35 tasks, 90 hours
- Database: 10 tasks, 20 hours
- Testing: 20 tasks, 60 hours
- Documentation: 5 tasks, 10 hours
```

## Output

Complete `tasks.md` file ready for implementation.

## Guidelines

- Keep tasks small and focused (1 day or less ideally)
- Every feature task must have corresponding test tasks
- Make acceptance criteria very specific
- Include enough detail that someone else could implement
- Identify blockers and dependencies clearly
- Don't forget infrastructure tasks (Docker, CI/CD, monitoring)
- Don't forget documentation tasks
- Trace every task back to spec/plan
