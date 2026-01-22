# Plan Agent

**Command:** `/speckit.plan`

**Purpose:** Create a comprehensive technical implementation plan that defines HOW we'll build what's specified.

---

## Agent Behavior

When invoked with `/speckit.plan [technical-approach]`, this agent:

1. Reviews the specification (`spec.md`)
2. Defines the technical architecture
3. Chooses technology stack and frameworks
4. Plans the project structure
5. Documents the plan in `plan.md`

---

## Planning Structure

The plan must include:

### 1. Architecture Overview
- System architecture diagram (conceptual)
- Component breakdown
- Data flow architecture
- Deployment architecture

### 2. Technology Stack

**Frontend:**
- Framework: React (modern, excellent charting libraries)
- UI Library: Material-UI or Ant Design (enterprise-grade)
- Charts: Chart.js / Recharts / D3.js
- State Management: Redux Toolkit or Zustand
- Testing: Jest + React Testing Library + Playwright

**Backend:**
- Primary API: Node.js with Express/Fastify (TypeScript)
- Data Services: Python FastAPI (for complex data processing)
- Database: PostgreSQL (with TimescaleDB for time-series metrics)
- Cache: Redis (for real-time data)
- Testing: Jest (Node.js), Pytest (Python)

**Infrastructure:**
- Containerization: Docker + Docker Compose
- Orchestration: Docker Swarm or basic Kubernetes (future)
- CI/CD: GitHub Actions or Azure DevOps
- Deployment: Internal VM with Docker

### 3. Project Structure

```
polaris-elm-metrics-dashboard/
├── .github/
│   ├── agents/              # Spec Kit agents
│   ├── prompts/             # Spec Kit prompts
│   └── workflows/           # CI/CD workflows
├── .specify/                # Spec Kit memory
├── backend/
│   ├── api/                 # Node.js REST API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── tests/           # Unit tests
│   │   └── package.json
│   └── data-processor/      # Python data services
│       ├── src/
│       ├── tests/
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── __tests__/       # Unit tests
│   └── package.json
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── tests/
│   ├── e2e/                 # Playwright E2E tests
│   ├── integration/
│   └── playwright.config.ts
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.frontend
│   └── Dockerfile.data-processor
├── docker-compose.yml
├── spec.md
├── plan.md
└── tasks.md
```

### 4. Component Design

**Frontend Components:**
- DashboardLayout
- MetricsCardGrid
- ComplianceDonutChart
- TeamComparisonBarChart
- TestCaseSummaryTable
- DefectsByActivityTable
- TeamProgressBar
- SprintSelector
- FilterPanel
- ExportButton

**Backend Services:**
- JiraIntegrationService (via MCP)
- QTestIntegrationService (via MCP)
- BitbucketIntegrationService
- MetricsAggregationService
- CacheService
- ReportGenerationService

**Database Schema:**
- teams, products, sprints, releases
- jira_issues, pull_requests, test_cases
- metrics_snapshot (time-series)
- user_preferences

### 5. Integration Architecture

**Jira MCP Server Integration:**
- Use existing jira-mcp-server tools
- Map Jira custom fields to metrics
- Real-time webhook support (future)

**QTest MCP Proxy Integration:**
- Fetch test case data
- Calculate automation percentage
- Link test cases to Jira stories

**Bitbucket Integration:**
- Extract TAD/TS from PR descriptions
- Track PR-to-story mapping
- Code metrics extraction

### 6. Testing Strategy

**Unit Testing:**
- Frontend: Jest + React Testing Library (>80% coverage)
- Backend: Jest (Node.js), Pytest (Python) (>80% coverage)
- Test all business logic, services, utilities

**Integration Testing:**
- API endpoint tests
- Database integration tests
- MCP server integration tests

**E2E Testing with Playwright MCP:**
- Critical user flows (dashboard load, filtering, drill-down)
- Export functionality
- Multi-team/product navigation
- Data accuracy validation

**Test Coverage Goals:**
- Unit tests: >80%
- Integration tests: All critical paths
- E2E tests: All user stories from spec.md

### 7. Development Phases

**Phase 1: Foundation (Weeks 1-2)**
- Setup project structure
- Database schema
- Basic API endpoints
- MCP integrations working

**Phase 2: MVP Dashboard (Weeks 3-4)**
- Core metrics (TAD, TS, test coverage)
- Single product/team view
- Basic visualizations

**Phase 3: Full Dashboard (Weeks 5-6)**
- All metrics
- Multi-product/team support
- Drill-down navigation
- Historical trends

**Phase 4: Polish & Export (Weeks 7-8)**
- Export to PDF/Excel/PPT
- Performance optimization
- Comprehensive test coverage
- Documentation

### 8. Performance Targets

- Dashboard initial load: < 3 seconds
- Metric refresh: < 1 second
- Support 100+ concurrent users
- Handle 1000+ Jira issues per query
- Database queries: < 500ms

### 9. Security Considerations

- Authentication via Jira SSO or LDAP
- Role-based access control
- API rate limiting
- Input validation and sanitization
- Secure secrets management

### 10. Monitoring & Observability

- Application logs (structured JSON)
- Performance metrics
- Error tracking
- Health check endpoints

---

## Output

Creates `plan.md` with the complete technical plan.

---

## Example Usage

```
/speckit.plan Use React with Chart.js for frontend, Node.js/Python for backend, PostgreSQL with TimescaleDB for time-series data, Docker deployment, integrate with existing Jira/QTest MCP servers, comprehensive Playwright E2E testing
```

---

## Guidelines

- Choose proven, maintainable technologies
- Prioritize developer experience
- Design for testability
- Plan for scalability
- Document all architectural decisions
