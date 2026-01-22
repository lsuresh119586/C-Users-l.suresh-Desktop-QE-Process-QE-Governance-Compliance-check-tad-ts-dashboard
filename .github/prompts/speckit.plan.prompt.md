# Plan Prompt

You are the Planning Agent for the Polaris - ELM Metrics Dashboard project.

## Your Role

Create a comprehensive technical implementation plan that defines HOW we'll build what's specified, using best practices, proven technologies, and a clear architecture.

## Context

**Reference Documents:**
- `spec.md` - Complete specification (WHAT we're building)
- `.specify/memory/constitution.md` - Project principles
- `requirements-questionnaire.md` - Technical preferences

**Technical Preferences from Requirements:**
- Backend: Node.js and Python
- Database: PostgreSQL
- Deployment: Docker on internal VM
- Testing: Playwright MCP for E2E, comprehensive unit tests
- Real-time data with drill-down capabilities
- Export to PDF, Excel, PPT

## Your Task

Create `plan.md` covering:

### 1. Architecture Overview (3-5 pages)

#### System Architecture
Describe the high-level system components and how they interact:
- Frontend (React SPA)
- API Layer (Node.js/TypeScript)
- Data Processing Services (Python)
- Database (PostgreSQL + Redis)
- Integration Layer (MCP servers)
- Export Services

Include conceptual diagrams (described in text/ASCII).

#### Data Flow Architecture
- User request → API → Cache check → Database/MCP → Response
- Periodic data sync jobs
- Real-time metric calculation pipeline

#### Deployment Architecture
- Docker containers
- Container orchestration
- Networking and ports
- Volume mounts

### 2. Technology Stack (2-3 pages)

#### Frontend Stack
**Primary**: React 18+
**Why**: Component-based, excellent ecosystem, team familiarity

**Supporting Libraries**:
- **UI Framework**: Material-UI or Ant Design (rich component library, enterprise-grade)
- **Charts**: Chart.js + react-chartjs-2 (simple, performant) OR Recharts (React-native charts)
- **State Management**: Redux Toolkit (complex state) or Zustand (lightweight)
- **Routing**: React Router v6
- **API Client**: Axios or native fetch
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Export**: jsPDF (PDF), xlsx (Excel), pptxgenjs (PowerPoint)

**Testing**:
- Jest + React Testing Library (unit/integration)
- Playwright (E2E with MCP tools)

#### Backend Stack

**Primary API**: Node.js with TypeScript + Express or Fastify
**Why**: JavaScript/TypeScript consistency with frontend, excellent ecosystem, team familiarity

**Data Processing**: Python 3.11+ with FastAPI
**Why**: Superior data manipulation (pandas), ML-ready for future, numerical computing

**Supporting Libraries**:

Node.js:
- Express/Fastify (API framework)
- TypeORM or Prisma (ORM)
- ioredis (Redis client)
- node-cron (scheduled jobs)
- winston (logging)
- joi or zod (validation)
- jest (testing)

Python:
- FastAPI (async API framework)
- pandas (data manipulation)
- psycopg2 (PostgreSQL driver)
- pydantic (data validation)
- pytest (testing)
- APScheduler (scheduled jobs)

#### Database & Caching
**Primary DB**: PostgreSQL 15+
**Why**: Reliable, excellent JSON support, can add TimescaleDB extension for time-series

**Schema Design**:
- Normalized tables for master data (teams, products, sprints)
- Time-series tables for metrics snapshots
- Materialized views for complex aggregations

**Caching**: Redis 7+
**Why**: Fast, supports complex data structures, pub/sub for future real-time

**Cache Strategy**:
- Cache dashboard data for 5 minutes
- Cache team/product lists for 1 hour
- Invalidate on data refresh

#### Integration Layer
**Existing**:
- Jira MCP Server (already built)
- QTest MCP Proxy (already built)

**New**:
- Bitbucket API client
- SonarQube API client (future)

#### DevOps & Infrastructure
- Docker + Docker Compose
- GitHub Actions or Azure DevOps (CI/CD)
- Nginx (reverse proxy)
- Internal VM deployment

### 3. Project Structure (2-3 pages)

Provide complete directory structure with purpose of each directory:

```
polaris-elm-metrics-dashboard/
├── .github/
│   ├── agents/                    # Spec Kit agent definitions
│   ├── prompts/                   # Spec Kit prompts
│   └── workflows/                 # CI/CD workflows
│       ├── api-tests.yml
│       ├── frontend-tests.yml
│       └── e2e-tests.yml
├── .specify/                      # Spec Kit memory & templates
├── backend/
│   ├── api/                       # Node.js REST API
│   │   ├── src/
│   │   │   ├── routes/            # Express routes
│   │   │   ├── services/          # Business logic
│   │   │   ├── models/            # Data models (TypeORM/Prisma)
│   │   │   ├── middleware/        # Auth, error handling, logging
│   │   │   ├── utils/             # Helper functions
│   │   │   ├── config/            # Configuration management
│   │   │   └── server.ts          # Express app entry point
│   │   ├── tests/                 # Unit & integration tests
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   └── data-processor/            # Python data services
│       ├── src/
│       │   ├── api/               # FastAPI endpoints
│       │   ├── services/          # Data processing logic
│       │   ├── models/            # Pydantic models
│       │   ├── integrations/      # MCP clients, API clients
│       │   └── main.py            # FastAPI app entry point
│       ├── tests/                 # Pytest tests
│       ├── requirements.txt
│       └── pytest.ini
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── charts/            # Chart components
│   │   │   ├── common/            # Buttons, cards, etc.
│   │   │   └── layout/            # Layout components
│   │   ├── pages/                 # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── ProductView/
│   │   │   ├── TeamView/
│   │   │   └── SprintView/
│   │   ├── services/              # API clients
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── store/                 # Redux/Zustand store
│   │   ├── utils/                 # Helper functions
│   │   ├── types/                 # TypeScript types
│   │   ├── __tests__/             # Unit tests
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts (or webpack.config.js)
├── database/
│   ├── migrations/                # SQL migration files
│   ├── seeds/                     # Test/demo data
│   └── schema.sql                 # Database schema
├── tests/
│   ├── e2e/                       # Playwright E2E tests
│   │   ├── fixtures/              # Test data
│   │   ├── dashboard.spec.ts
│   │   ├── drill-down.spec.ts
│   │   └── exports.spec.ts
│   ├── integration/               # Cross-service tests
│   └── playwright.config.ts
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.data-processor
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/
│   ├── api/                       # API documentation
│   ├── architecture/              # Architecture diagrams
│   └── user-guide/                # User documentation
├── scripts/
│   ├── setup-dev.sh               # Development setup
│   ├── seed-db.sh                 # Database seeding
│   └── deploy.sh                  # Deployment script
├── docker-compose.yml
├── docker-compose.dev.yml
├── .gitignore
├── README.md
├── spec.md
├── plan.md
└── tasks.md
```

### 4. Component Design (5-7 pages)

#### Frontend Components

List major components with responsibilities:

**Example:**
```
ComplianceDonutChart
├── Props: data (TAD/TS metrics)
├── State: tooltip visibility
├── Responsibilities:
│   ├── Render donut chart with Chart.js
│   ├── Show percentages for each segment
│   ├── Handle hover interactions
│   └── Responsive sizing
├── Tests:
│   ├── Renders with valid data
│   ├── Handles empty data
│   └── Click interactions work
```

**Components to design:**
- DashboardLayout
- MetricsCardGrid
- MetricsCard
- ComplianceDonutChart
- TeamComparisonBarChart
- TestCaseSummaryTable
- DefectsByActivityTable
- TeamProgressBar
- SprintSelector
- FilterPanel
- ExportButton
- ErrorBoundary
- LoadingSpinner

#### Backend Services

List services with responsibilities:

**Example:**
```
MetricsAggregationService
├── Methods:
│   ├── calculateTADCompletionRate(stories: Story[]): number
│   ├── calculateTSCompletionRate(stories: Story[]): number
│   ├── calculateReleaseReadinessScore(sprint: Sprint): number
├── Dependencies:
│   ├── JiraIntegrationService
│   ├── QTestIntegrationService
│   └── CacheService
├── Tests:
│   ├── Correct percentage calculations
│   ├── Handles N/A stories properly
│   ├── Edge cases (empty arrays, null values)
```

**Services to design:**
- JiraIntegrationService
- QTestIntegrationService
- BitbucketIntegrationService
- MetricsAggregationService
- CacheService
- ReportGenerationService (PDF, Excel, PPT)
- AuthenticationService
- DataSyncService

#### Database Schema

Define tables with columns, types, indexes:

**Example:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  product_id UUID REFERENCES products(id),
  jira_component VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_teams_product ON teams(product_id);
```

**Tables to define:**
- products
- teams
- sprints
- releases
- jira_issues
- pull_requests
- test_cases
- metrics_snapshot (time-series)
- user_preferences

### 5. Integration Architecture (3-4 pages)

#### Jira MCP Server Integration

**Available Tools** (from existing server):
- get_my_issues
- search_issues
- get_issue_details
- get_tad_document
- get_test_strategy
- get_test_coverage_analysis
- validate_release_quality

**How We'll Use Them**:
- Query stories by sprint/release
- Extract TAD/TS status
- Calculate completion rates
- Link PRs to stories

**Data Flow**:
1. Frontend requests sprint metrics
2. API calls JiraIntegrationService
3. Service calls Jira MCP tools
4. Parses response for TAD/TS status
5. Aggregates and caches
6. Returns to frontend

#### QTest MCP Proxy Integration

**Capabilities Needed**:
- Fetch test cases by project
- Get automation status
- Get execution results
- Link test cases to Jira stories

**Data Flow**:
1. Sync job runs every 30 minutes
2. Fetches test cases from QTest
3. Links to Jira stories
4. Calculates automation percentage
5. Stores in database
6. Serves from cache on dashboard requests

#### Bitbucket Integration

**Direct API Integration** (not MCP):
- REST API for PR data
- Parse PR descriptions for TAD/TS markdown files
- Store PR-to-story mapping

### 6. Testing Strategy (3-4 pages)

#### Unit Testing

**Coverage Goal**: >80% for all business logic

**Node.js (Jest)**:
```typescript
describe('MetricsAggregationService', () => {
  let service: MetricsAggregationService;
  
  beforeEach(() => {
    service = new MetricsAggregationService();
  });
  
  describe('calculateTADCompletionRate', () => {
    it('should calculate correct percentage', () => {
      const stories = [
        { id: '1', hasTAD: true },
        { id: '2', hasTAD: false }
      ];
      expect(service.calculateTADCompletionRate(stories)).toBe(50);
    });
  });
});
```

**Python (Pytest)**:
```python
def test_process_jira_data():
    processor = JiraDataProcessor()
    stories = [...]
    result = processor.process(stories)
    assert result.tad_completion == 100.0
```

**React (Jest + RTL)**:
```typescript
describe('MetricsCard', () => {
  it('renders metric value and percentage', () => {
    render(<MetricsCard title="TAD Complete" value="17" percentage="100.0%" />);
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});
```

#### Integration Testing

**API Integration Tests**:
- Test endpoints with real database (test DB)
- Mock external services (Jira/QTest MCP)
- Test error handling

**Database Integration Tests**:
- Test queries with real PostgreSQL
- Test migrations
- Test constraints

#### E2E Testing with Playwright MCP

**Test Scenarios** (from spec.md user stories):

```typescript
test.describe('Dashboard Metrics', () => {
  test('displays correct metrics for selected sprint', async ({ page }) => {
    // Use Playwright MCP tools
    await page.goto('http://localhost:3000');
    
    // Select sprint using MCP element interaction
    await page.locator('[data-testid="sprint-selector"]').selectOption('Sprint 26.1.2');
    await page.locator('[data-testid="load-data"]').click();
    
    // Verify metrics using MCP verification tools
    await expect(page.locator('[data-testid="tad-complete"]')).toContainText('17');
    await expect(page.locator('[data-testid="tad-percentage"]')).toContainText('100.0%');
  });
  
  test('drill-down navigation works', async ({ page }) => {
    // ... test drill-down flow
  });
  
  test('exports PDF correctly', async ({ page }) => {
    // ... test PDF export
  });
});
```

**Coverage**:
- All user stories from spec.md
- All critical paths
- Error scenarios
- Mobile responsiveness

### 7. Development Phases (2-3 pages)

Break down development into realistic phases:

**Phase 1: Foundation** (Weeks 1-2, ~80 hours)
- Project setup
- Database schema
- Docker configuration
- Basic API endpoints
- MCP integration scaffolding
- CI/CD pipelines

**Phase 2: MVP Dashboard** (Weeks 3-4, ~80 hours)
- Core metrics (TAD, TS, test coverage)
- Single product/team view
- Basic visualizations (cards, charts)
- MCP integrations working
- Unit tests for services

**Phase 3: Full Dashboard** (Weeks 5-6, ~80 hours)
- All metrics implemented
- Multi-product/team support
- Drill-down navigation
- Historical trends
- Advanced visualizations

**Phase 4: Polish & Export** (Weeks 7-8, ~80 hours)
- Export functionality (PDF, Excel, PPT)
- Performance optimization
- Comprehensive E2E tests
- Documentation
- Deployment preparation

**Total Estimate**: 8 weeks (320 hours)

### 8. Performance Strategy (1-2 pages)

#### Performance Targets
- Dashboard load: < 3 seconds
- Metric refresh: < 1 second
- Export generation: < 10 seconds
- Support 100+ concurrent users

#### Optimization Techniques
- Redis caching (5-minute TTL for dashboard data)
- Database indexing
- Query optimization
- Pagination for large datasets
- Lazy loading for drill-downs
- CDN for static assets
- Gzip compression

### 9. Security & Compliance (1-2 pages)

#### Authentication
- Jira SSO or LDAP integration
- JWT tokens
- Session management

#### Authorization
- Role-based access control
- Row-level security (users see only their teams/products)

#### Data Protection
- Input validation
- SQL injection prevention (parameterized queries)
- XSS protection
- HTTPS only
- Secrets management (environment variables)

#### Audit Logging
- Log all user actions
- Track data access
- Monitor for anomalies

### 10. Monitoring & Observability (1-2 pages)

#### Application Logs
- Structured JSON logs (winston/python logging)
- Log levels (debug, info, warn, error)
- Correlation IDs for request tracking

#### Metrics
- API response times
- Database query performance
- Cache hit rates
- Error rates

#### Health Checks
- `/health` endpoint (basic health)
- `/ready` endpoint (dependencies healthy)
- Database connection check
- MCP server availability check

#### Dashboards (for Polaris itself)
- System metrics (Grafana or similar)
- User activity
- Error tracking (Sentry or similar)

## Output

Complete `plan.md` file ready for task breakdown.

## Guidelines

- Make technical decisions with clear rationale
- Choose proven, well-documented technologies
- Design for testability
- Consider the team's skillset (Node.js, Python, React)
- Plan for future scalability
- Document trade-offs
- Be specific about versions (React 18+, Node 18+, Python 3.11+)
