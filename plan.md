# Technical Architecture Plan: Polaris ELM Metrics Dashboard

**Project:** Polaris - Unified Quality Metrics Dashboard for ELM  
**Date:** January 21, 2026  
**Status:** Draft  
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Components](#4-system-components)
5. [Data Model](#5-data-model)
6. [API Design](#6-api-design)
7. [Integration Patterns](#7-integration-patterns)
8. [Security & Authentication](#8-security--authentication)
9. [Performance & Scalability](#9-performance--scalability)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Implementation Phases](#12-implementation-phases)
13. [Code Reuse from Reference Projects](#13-code-reuse-from-reference-projects)
14. [Risk Mitigation](#14-risk-mitigation)
15. [Success Metrics](#15-success-metrics)

---

## 1. Executive Summary

### 1.1 Purpose

Polaris is a **unified quality metrics dashboard** that consolidates Dev and QA metrics across all ELM products (T360, Passport, DnA, Collaboration Portal) into a single, real-time, interactive platform.

**One Dashboard. Complete Visibility. Better Quality.**

### 1.2 Historical Context

The three existing dashboards were **not competing implementations** - they represent different teams working on **complementary features** for their respective areas:

- **T360/Passport Teams**: Focused on **TAD/TS compliance tracking** (document governance)
- **DnA Team**: Focused on **QTest automation metrics** (test coverage and execution)

All teams originally intended to **merge these capabilities** into a unified dashboard, but this consolidation never happened. Each team continued building features they needed most urgently, leading to three separate systems.

**Polaris is the fulfillment of that original vision** - combining TAD/TS compliance (T360/Passport) with automation metrics (DnA) into one comprehensive quality dashboard.

### 1.3 Key Differentiators

| Feature | Current State (3 Separate Dashboards) | Polaris Target State |
|---------|--------------------------------------|----------------------|
| **Coverage** | Partial metrics per product | **100% comprehensive** Dev + QA metrics |
| **Update Frequency** | Manual batch scripts | **Real-time** (5-minute refresh) |
| **Data Storage** | JSON files | **Live Jira API** (dashboard source of truth) + **SQL Server** (persistence for verification/reporting) |
| **Architecture** | Monolithic Python scripts | **Microservices** with strategy pattern |
| **Testing** | No tests | **>80% coverage** with Playwright MCP E2E |
| **Configuration** | Hardcoded constants | **YAML/DB-driven** flexible config |
| **Export** | Basic HTML | **PDF, Excel, PowerPoint** |
| **API** | None | **REST API** for integrations |

### 1.4 What We're Reusing (Merging Their Intent)

**Important:** We're not replacing their work - we're **completing the original merge** they planned!

✅ **From T360/Passport** (TAD/TS Compliance Feature):
- TAD/TS detection algorithm → Core feature for document governance
- Bitbucket PR integration → Essential for TAD/TS verification
- Defect analysis by SDLC/Severity → Quality insights
- **Intent:** Track document compliance across all stories

✅ **From DnA** (Automation Metrics Feature):
- QTest client implementation → Core feature for test coverage
- Sprint-to-test-cycle mapping → Links Jira sprints to QTest data
- Automation percentage calculation → Key quality metric
- Board-based Jira queries → Cleaner sprint data access
- **Intent:** Track test automation coverage and execution

✅ **JiraBugService Implementation** (Production-Ready with Quality Standards):
- **Module**: `backend/api-gateway/jiraBugService.js` (472 lines)
- **Test Suite**: `jiraBugService.test.js` (29 test cases, 72.94% coverage)
- **Error Classes**: `jiraErrors.js` (7 custom error types)
- **Documentation**: Comprehensive JSDoc with examples and type definitions
- **Current Scope**: DnA teams (Minerva, Guardians, Athena) - fully operational
- **Target Scope**: Universal service for ALL products (DnA, T360, Passport, Collaboration Portal)
- **Key Methods**:
  - `getBugsForSprint(teamId, sprintNumber)` - Fetches and filters bugs with caching
  - `detectReopenedBug(issueKey)` - Analyzes changelog for reopen detection
  - `calculateBugMetrics(teamId, sprintNumber)` - Comprehensive metrics with quality indicators
  - `getAllDnATeamMetrics(sprintNumber)` - Parallel fetching for all teams (to be extended to all products)
- **Universal Bug Status Classification** (Applied to ALL products):
  - **Closed**: Only bugs with status `Closed` (exact match)
  - **Open**: All other statuses including `To Verify`, `In Progress`, `To Do`, `Open`, `Reopened`, etc.
  - **Rationale**: Inclusive approach ensures all active bugs are tracked correctly across all products
  - **Implementation**: `isClosed = (status === 'Closed')`, `isOpen = (status !== 'Closed')`
  - **Consistency**: Same logic applied to DnA, T360, Passport, and CP teams
- **Quality Features**:
  - Automatic retry with exponential backoff (prevents transient failures)
  - 10-minute caching (reduces API load by 90%+)
  - Custom error types (enables specific error handling)
  - Safe-Team post-filtering (handles customfield_13392 limitations)
  - Pagination support (handles >50 bug result sets)
- **Multi-Product Configuration Architecture**:
  - Configuration object per team with: `{ jiraProject, boardId, sprintFormat, safeTeamValue }`
  - Flexible Safe-Team matching: supports both simple ("Vanguards") and prefixed ("T360 Vanguards") formats
  - Cross-project support: Primary project + "ELM Tech Ops" where applicable
  - Sprint field verification: Confirms bugs have sprint field populated
- **T360 Teams Configuration** (6 teams - Phase 2 Ready):
  - **Vanguards**: Board 6794, Sprint format "T360 Vanguards-{sprint}", Safe-Team "Vanguards" OR "T360 Vanguards"
  - **Chargers**: Board 6784, Sprint format "T360 Chargers-{sprint}", Safe-Team "Chargers" OR "T360 Chargers"
  - **Chubb**: Board 6793, Sprint format "T360 ICD CHUBB-{sprint}", Safe-Team "CHUBB" OR "T360 CHUBB"
  - **Matrix**: Board 6710, Sprint format "T360 MATRIX-{sprint}", Safe-Team "MATRIX" OR "T360 MATRIX"
  - **Mavericks**: Board 6457, Sprint format "T360 Mavericks-{sprint}", Safe-Team "Maverics" OR "T360 Maverics"
  - **Nexus**: Board 6795, Sprint format "T360 Nexus-{sprint}", Safe-Team "Nexus" OR "T360 Nexus"
  - **Common Settings**: All use GET project, no "ELM Tech Ops" cross-project queries needed
  - **Validation Sprint**: 26.1.1 with known bug counts (14 total: V=5, Ch=2, Cb=2, M=2, Mv=1, N=2)
- **Required Configuration Data for Expansion**:
  - **Passport Teams** (3 teams): Team A, Team B, Team C
    - Project: ELM
    - Board IDs: TBD
    - Sprint Format: TBD
    - Safe-Team Values: TBD
  - **Collaboration Portal**: Configuration TBD
- **Implementation Phases**:
  1. ✅ Phase 1: DnA teams implementation complete (Minerva, Guardians, Athena)
  2. ✅ Phase 2: T360 team configurations discovered and validated (Vanguards, Chargers, Chubb, Matrix, Mavericks, Nexus)
  3. ✅ Phase 3: Implement T360 teams in JiraBugService and test with Sprint 26.1.1
  4. ✅ Phase 4: Re-architect data storage — Dashboard reads live Jira API, persists aggregated metrics to SQL Server (Polarisdashboard)
  5. 🔄 Phase 5: Discover and add Passport teams
  6. 🔄 Phase 6: Add Collaboration Portal teams
- **Data Storage Architecture** (Updated February 17, 2026):
  - **Dashboard Data Source**: Live Jira API only (NOT db.json, NOT SQL Server)
  - **SQL Server Persistence**: Write-behind after live data is fetched and displayed
    - Server: `zusscntssql19\sql2022`, Database: `Polarisdashboard`, User: `sql-cs-user`
    - Table: Metrics with columns: Product, Team, Sprint, OverallBugsCount, TotalOpenBugs, TotalClosedBugs, TotalReopenedBugs, ReopenedBugPercentage
    - Module: `backend/api-gateway/metricsPersistence.js` using `mssql` (Tedious driver)
    - Pattern: MERGE (upsert) for idempotent writes, non-blocking (SQL unavailability doesn't affect dashboard)
    - Audit: All sync operations logged to SyncLog table
  - **Verification Endpoint**: `GET /api/metrics/persisted?product=<product>&sprint=<sprint>`

✅ **From All Three** (Common Infrastructure):
- Cust5 What We're Fixing (Common Issues Across All Three)

All three teams faced the same challenges due to rapid development:

❌ **Technical Debt to Address:**
- Hardcoded team names, project keys, custom field IDs
- 1000+ line monolithic Python files (difficult to maintain)
- No error handling or retry logic (brittle integrations)
- Manual script execution (time-consuming)
- No logging or monitoring (hard to troubleshoot)
- No tests (risky to change)
- Synchronous blocking API calls (slow)
- No caching (hammering Jira/QTest APIs)

✅ **Best Practices to Implement:**
- Configuration-driven architecture (database + YAML)
- Dependency injection (testable, modular)
- Comprehensive error handling (graceful failures)
- Async/await for API calls (performance)
- Redis caching (5-minute TTL, API protection)
- Structured logging (Winston/Pino for debugging)
- >80% test coverage (confidence in changes)
- CI/CD pipeline with automated tests (quality gates)
- API rate limiting and backoff (respect API limits)
- Proper TypeScript types (catch errors at compile time)

**Key Principle:** Preserve their original intent while modernizing the implementation.dling
- Async/await for API calls
- Redis caching (5-minute TTL)
- Structured logging (Winston/Pino)
- >80% test coverage
- CI/CD pipeline with automated tests
- API rate limiting and backoff
- Proper TypeScript types

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│  - Product Switcher  - Team Selector  - Sprint Navigator       │
│  - TAD/TS Dashboard  - QTest Metrics  - Defect Analysis        │
│  - Export (PDF/Excel/PPT)  - Historical Trends                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Node.js/Express)                │
│  - Authentication  - Rate Limiting  - Request Validation        │
│  - CORS  - Compression  - Security Headers                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌─────────────┐ ┌─────────────────┐
│  Metrics Service │ │ Data Service│ │ Integration Svc │
│  (Node.js/TS)    │ │ (Node.js/TS)│ │ (Python)        │
│                  │ │             │ │                 │
│ - TAD/TS Calc    │ │ - CRUD Ops  │ │ - Jira Client   │
│ - QTest Metrics  │ │ - Historical│ │ - QTest Client  │
│ - Release Score  │ │ - Export    │ │ - Bitbucket API │
└──────────────────┘ └─────────────┘ └─────────────────┘
         │                   │                  │
         └───────────────────┼──────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────────┐   ┌─────────────┐
│  PostgreSQL │    │   Redis Cache    │   │   MCP       │
│             │    │                  │   │ - Jira MCP  │
│ - Teams     │    │ - API Responses  │   │ - QTest MCP │
│ - Metrics   │    │ - Computed Mtx   │   │             │
│ - History   │    │ - 5min TTL       │   │             │
└─────────────┘    └──────────────────┘   └─────────────┘
```

### 2.2 Architectural Principles

1. **Separation of Concerns**
   - Frontend: UI/UX only, no business logic
   - API Gateway: Routing, auth, validation
   - Services: Single responsibility (metrics, data, integrations)

2. **Strategy Pattern for Product Differences**
   - Common interface: `ProductIntegrationStrategy`
   - Implementations: `T360Strategy`, `PassportStrategy`, `DnaStrategy`
   - Runtime selection based on product/team configuration

3. **Configuration-Driven**
   - Database tables for teams, products, custom field mappings
   - YAML files for environment-specific settings
   - No hardcoded values in code

4. **Event-Driven Updates**
   - Background jobs trigger metric calculations
   - WebSocket notifications to frontend on completion
   - Batch processing with queue system (BullMQ)

5. **API-First Design**
   - REST API for all operations
   - OpenAPI/Swagger documentation
   - Versioned endpoints (`/api/v1/`)

---

## 3. Technology Stack

### 3.1 Frontend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | **React 18** with TypeScript | Component reusability, strong typing |
| **State Management** | **Zustand** | Lightweight, no boilerplate (better than Redux) |
| **Routing** | **React Router v6** | Standard, well-documented |
| **Charts** | **Chart.js 4** with react-chartjs-2 | Familiar to team (from reference dashboards) |
| **UI Components** | **Ant Design** | Enterprise-grade, comprehensive |
| **HTTP Client** | **Axios** | Interceptors for auth, retry logic |
| **Styling** | **Tailwind CSS** | Utility-first, rapid development |
| **Build Tool** | **Vite** | Fast HMR, optimized builds |
| **Testing** | **Vitest + React Testing Library** | Fast, Jest-compatible |
| **E2E Testing** | **Playwright MCP** | AI-powered test generation |

### 3.2 Backend

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **API Server** | **Node.js 20 + Express** | Fast, async I/O, TypeScript support |
| **Integration Service** | **Python 3.11** (FastAPI) | Reuse existing Jira/QTest code |
| **Language** | **TypeScript** (Node.js services) | Type safety, better IDE support |
| **Database** | **PostgreSQL 16** | JSONB support, reliable, ACID |
| **Cache** | **Redis 7** | Sub-millisecond latency |
| **Queue** | **BullMQ** (Redis-backed) | Reliable job processing |
| **ORM** | **Prisma** | Type-safe, migrations, great DX |
| **API Documentation** | **Swagger/OpenAPI 3.0** | Auto-generated from code |
| **Logging** | **Pino** (Node.js), **structlog** (Python) | Structured JSON logs |
| **Monitoring** | **Prometheus + Grafana** | Metrics, alerting |

### 3.3 Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Containerization** | **Docker** + Docker Compose | Consistent environments |
| **Reverse Proxy** | **Nginx** | SSL termination, load balancing |
| **CI/CD** | **Azure DevOps Pipelines** | Already in use at WK |
| **Secrets Management** | **Azure Key Vault** | Secure credential storage |
| **Deployment Target** | **Internal VM** (per user request) | |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint + Prettier** | Code formatting, linting |
| **Husky** | Git hooks for pre-commit checks |
| **Jest** | Unit testing (Node.js) |
| **Pytest** | Unit testing (Python) |
| **Playwright MCP** | E2E testing with AI |
| **SonarQube** | Code quality, coverage tracking |
| **Postman** | API testing, documentation |

---

## 4. System Components

### 4.1 Frontend Components

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── dashboards/
│   │   ├── ProductSwitcher.tsx
│   │   ├── TeamSelector.tsx
│   │   ├── SprintNavigator.tsx
│   │   ├── TadTsCard.tsx
│   │   ├── QTestMetricsCard.tsx
│   │   ├── DefectAnalysisCard.tsx
│   │   ├── VelocityCard.tsx
│   │   └── ReleaseReadinessCard.tsx
│   ├── charts/
│   │   ├── TrendLineChart.tsx
│   │   ├── ComparisonBarChart.tsx
│   │   ├── DefectPieChart.tsx
│   │   └── SprintBurndown.tsx
│   └── exports/
│       ├── ExportButton.tsx
│       ├── PDFGenerator.tsx
│       └── ExcelExporter.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── TeamView.tsx
│   ├── SprintView.tsx
│   ├── StoryView.tsx
│   └── Admin.tsx
├── services/
│   ├── api.ts             # Axios instance, interceptors
│   ├── metrics.service.ts
│   ├── teams.service.ts
│   └── export.service.ts
├── stores/
│   ├── useMetricsStore.ts
│   ├── useUserStore.ts
│   └── useConfigStore.ts
├── types/
│   ├── metrics.types.ts
│   ├── teams.types.ts
│   └── api.types.ts
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts
```

### 4.2 Backend Services

#### 4.2.1 API Gateway (Node.js/TypeScript)

```
api-gateway/
├── src/
│   ├── index.ts                 # Express app entry
│   ├── routes/
│   │   ├── metrics.routes.ts    # /api/v1/metrics/*
│   │   ├── teams.routes.ts      # /api/v1/teams/*
│   │   ├── products.routes.ts   # /api/v1/products/*
│   │   ├── export.routes.ts     # /api/v1/export/*
│   │   └── admin.routes.ts      # /api/v1/admin/*
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT validation
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   ├── validator.ts         # Request validation
│   │   └── errorHandler.ts      # Global error handler
│   ├── services/
│   │   ├── metrics.proxy.ts     # Forward to metrics service
│   │   ├── data.proxy.ts        # Forward to data service
│   │   └── cache.service.ts     # Redis caching
│   └── config/
│       ├── swagger.config.ts
│       └── cors.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   └── integration/
└── package.json
```

#### 4.2.2 Metrics Service (Node.js/TypeScript)

```
metrics-service/
├── src/
│   ├── index.ts
│   ├── strategies/
│   │   ├── ProductStrategy.interface.ts
│   │   ├── T360Strategy.ts
│   │   ├── PassportStrategy.ts
│   │   ├── DnaStrategy.ts
│   │   └── StrategyFactory.ts
│   ├── calculators/
│   │   ├── TadTsCalculator.ts      # From T360/Passport
│   │   ├── QTestCalculator.ts      # From DnA
│   │   ├── DefectCalculator.ts
│   │   ├── VelocityCalculator.ts
│   │   └── ReleaseReadinessCalculator.ts
│   ├── services/
│   │   ├── metrics.service.ts
│   │   ├── aggregation.service.ts
│   │   └── trending.service.ts
│   └── models/
│       ├── Metrics.model.ts
│       └── Snapshot.model.ts
├── tests/
│   ├── unit/
│   │   ├── TadTsCalculator.test.ts
│   │   └── QTestCalculator.test.ts
│   └── integration/
└── package.json
```

#### 4.2.3 Integration Service (Python/FastAPI)

```
integration-service/
├── app/
│   ├── main.py                  # FastAPI app
│   ├── routers/
│   │   ├── jira.py
│   │   ├── qtest.py
│   │   └── bitbucket.py
│   ├── clients/
│   │   ├── jira_client.py       # From T360/Passport (refactored)
│   │   ├── qtest_client.py      # From DnA (refactored)
│   │   └── bitbucket_client.py  # From T360/Passport
│   ├── models/
│   │   ├── jira_models.py       # Pydantic models
│   │   ├── qtest_models.py
│   │   └── bitbucket_models.py
│   ├── services/
│   │   ├── tad_ts_detector.py   # From T360/Passport (cleaned up)
│   │   ├── sprint_mapper.py     # From DnA (optimized)
│   │   └── custom_field_parser.py
│   └── config/
│       ├── settings.py          # Pydantic settings
│       └── field_mappings.yaml
├── tests/
│   ├── unit/
│   │   ├── test_jira_client.py
│   │   ├── test_qtest_client.py
│   │   └── test_tad_ts_detector.py
│   └── integration/
├── requirements.txt
└── Dockerfile
```

#### 4.2.4 Data Service (Node.js/TypeScript)

```
data-service/
├── src/
│   ├── index.ts
│   ├── repositories/
│   │   ├── metrics.repository.ts
│   │   ├── teams.repository.ts
│   │   └── products.repository.ts
│   ├── services/
│   │   ├── data.service.ts
│   │   ├── export.service.ts
│   │   └── historical.service.ts
│   └── exporters/
│       ├── PDFExporter.ts
│       ├── ExcelExporter.ts
│       └── PowerPointExporter.ts
├── tests/
└── package.json
```

---

## 5. Data Model

### 5.0 Bug Metrics Data Architecture (Updated February 17, 2026)

**Principle**: Dashboard ALWAYS reads from live Jira API. SQL Server is used for persistence/verification only.

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React/Vite)                                      │
│  DnADashboard.tsx → /api/bugs/{product} (LIVE DATA ONLY)   │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP (localhost:3000)
┌──────────────▼──────────────────────────────────────────────┐
│  Backend (Node.js)                                          │
│  server.js                                                  │
│    ├── JiraBugService → Live Jira REST API (source of truth)│
│    └── MetricsPersistence → SQL Server (write-behind, async)│
└──────────┬──────────────┬───────────────────────────────────┘
           │              │ mssql/tedious (non-blocking)
           │  ┌───────────▼───────────────────────────────────┐
           │  │  SQL Server: zusscntssql19\sql2022            │
           │  │  Database: Polarisdashboard                   │
           │  │  User: sql-cs-user                            │
           │  │  Table: Metrics (with Product, Team, Sprint,  │
           │  │    OverallBugsCount, TotalOpenBugs,           │
           │  │    TotalClosedBugs, TotalReopenedBugs,        │
           │  │    ReopenedBugPercentage, SyncSource)          │
           │  │  Table: SyncLog (audit trail)                 │
           │  └───────────────────────────────────────────────┘
           │ HTTPS (jira.wolterskluwer.io)
┌──────────▼──────────────────────────────────────────────────┐
│  Jira REST API (Source of Truth)                            │
│  /rest/api/2/search (bug queries by sprint + Safe-Team)     │
│  /rest/api/2/issue/{key}/changelog (reopened detection)     │
└─────────────────────────────────────────────────────────────┘
```

**SQL Server Metrics Table** (Polarisdashboard):

| Column | SQL Type | Description |
|--------|----------|-------------|
| Id | INT IDENTITY(1,1) PK | Auto-increment primary key |
| Sprint | NVARCHAR(100) UNIQUE | Sprint key (e.g., 'chargers-26.1.1') |
| Team | NVARCHAR(100) | Team identifier (e.g., 'chargers', 'matrix', 'minerva') |
| Product | NVARCHAR(100) | Product: Passport, DnA, T360, Collaboration Portal |
| OverallBugsCount | INT | Total bug count per sprint |
| TotalOpenBugs | INT | Total open bugs per sprint (status ≠ Closed) |
| TotalClosedBugs | INT | Total closed bugs per sprint (status = Closed) |
| TotalReopenedBugs | INT | Reopened bugs (from Jira changelog, even if closed/open now) |
| ReopenedBugPercentage | DECIMAL(5,2) | (Reopened / Overall) × 100 |
| SyncSource | NVARCHAR(50) | Data provenance: 'jira-live-api' |
| LastUpdated | DATETIME | Timestamp of last sync from Jira |

**Key Implementation Files**:
- `backend/api-gateway/metricsPersistence.js` — SQL Server persistence module (mssql/Tedious)
- `database/01-create-schema.sql` — ALTER TABLE migration adding new columns
- `database/03-create-utilities.sql` — Updated views and stored procedures

### 5.0.1 Reopened Defects Metric (NEW - February 17, 2026)

**Purpose**: Display reopened bugs count as a dedicated UI metric in the dashboard, complementing existing Open Defects and Closed Defects metrics.

**Data Flow**:
```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (index.html)                                      │
│  - New scorecard tile: "Reopened Defects"                  │
│  - Display: state.metrics.reopenedBugs                     │
│  - Style: .metric-card (matching Open/Closed Defects)      │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP GET /api/metrics
┌──────────────▼──────────────────────────────────────────────┐
│  Backend (server.js)                                        │
│  - /api/metrics endpoint enrichment (lines 772-810)        │
│  - Calls: JiraBugService.calculateBugMetrics()             │
│  - Maps: reopenedBugs field already in response            │
│  - No code changes needed (already implemented)            │
└──────────────┬──────────────────────────────────────────────┘
               │ Jira API
┌──────────────▼──────────────────────────────────────────────┐
│  JiraBugService (jiraBugService.js)                        │
│  - detectReopenedBug(issueKey) - analyzes changelog       │
│  - calculateBugMetrics() returns:                          │
│    * totalBugs, openBugs, closedBugs                       │
│    * reopenedBugs (already implemented)                    │
│    * reopenedRate, qualityIndicator                        │
│  - Reopened logic: Status transitions from                 │
│    Closed/Done/Resolved → Open/In Progress/etc.            │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Scope**:
- **Backend Changes**: NONE (reopenedBugs already returned in `/api/metrics` response)
- **Frontend Changes**: Add 7th scorecard tile to `frontend/index.html` (lines 568-600)
- **Database Changes**: NONE (TotalReopenedBugs column already exists)
- **API Changes**: NONE (reopenedBugs field already in API response)

**Constraints**:
- Non-breaking change - must not impact existing Open/Closed Defects functionality
- Reuse existing JiraBugService.calculateBugMetrics() - no new API calls
- Display reopenedBugs count regardless of bug's current status (open/closed)
- No new files to be created - modify index.html only

### 5.0.2 CPOD ReOpened Cards Count (SPEC 3.2.14 - Incremental Update)

**Purpose**: Add a CPOD-only `ReOpened Cards Count` metric based on Jira transition events `Closed → New` within selected date range.

**Scope Guardrails**:
- Execute CPOD reopened-card query logic only when selected team is `CPOD`
- For non-CPOD team selections, do not run CPOD-specific reopened query logic and do not render this card

**Query Contract (from spec 3.2.14 FR-3/FR-4)**:
- `project = "ELM Tech Ops"`
- `issuetype = Bug`
- `"Engagement Reason" = Troubleshooting`
- `"Safe-Product" IN (Oasis, Passport)`
- `"Safe-Team" IN ("CPOD 1", "Passport Support", "CPOD 3", "CPOD 2")`
- `status CHANGED FROM Closed TO New DURING ("<fromDate>", "<toDate>")`

**Implementation Scope**:
- **Backend Changes**: Extend CPOD metrics path in `backend/api-gateway/jiraBugService.js` and mapper in `backend/api-gateway/cpodMetricsMapper.js` to return a dedicated reopened-cards count and fallback state
- **Frontend Changes**: Render `ReOpened Cards Count` card only for CPOD in `frontend/index.html`
- **Testing Changes**: Add/extend CPOD-focused tests in `backend/api-gateway/jiraBugService.test.js`, `backend/api-gateway/cpodMetricsMapper.test.js`, and `tests/e2e/cpod.dashboard.spec.ts`

**Acceptance Alignment**:
- Team = CPOD with date range returns count of `Closed → New` transitions in range
- No matching issues returns `0`
- Jira/API/query failures use dashboard-standard fallback (`0` or `Data unavailable`)
- Date range changes trigger recomputation and UI refresh

### 5.1 Core Schema (PostgreSQL)

```sql
-- Products (T360, Passport, DnA, Collaboration Portal)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  jira_project_key VARCHAR(10),           -- 'GET', 'ELM', null
  jira_board_ids INTEGER[],                -- For DnA board-based approach
  qtest_project_id INTEGER,                -- Default QTest project
  safe_product_field_value VARCHAR(50),    -- For ELM filtering
  config JSONB NOT NULL DEFAULT '{}',      -- Product-specific settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Teams (12 teams across 4 products)
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,       -- 'Vanguards', 'Minerva', etc.
  display_name VARCHAR(100) NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id),
  jira_board_id INTEGER,                   -- Specific board (DnA: Minerva=7437, Guardians=6704, Athena=6798)
  qtest_project_id INTEGER,                -- May override product default
  team_members TEXT[],                     -- For person-based filtering
  integration_strategy VARCHAR(50) NOT NULL, -- 't360', 'passport', 'dna'
  safe_team_field_value VARCHAR(100),      -- Value in Safe-Team custom field for bug queries
  config JSONB NOT NULL DEFAULT '{}',      -- Team-specific settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Custom Field Mappings (centralized configuration)
CREATE TABLE custom_field_mappings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  field_purpose VARCHAR(50) NOT NULL,      -- 'team', 'sprint', 'severity', etc.
  field_id VARCHAR(50) NOT NULL,           -- 'customfield_13392'
  field_type VARCHAR(20) NOT NULL,         -- 'string', 'dict', 'array'
  field_path VARCHAR(100),                 -- For nested fields: 'value.name'
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(product_id, field_purpose)
);

-- Sprints (from Jira)
CREATE TABLE sprints (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  state VARCHAR(20) NOT NULL,              -- 'future', 'active', 'closed'
  jira_sprint_id INTEGER,
  pi_version VARCHAR(20),                  -- 'PI 26.1'
  release_version VARCHAR(20),             -- '26.1.1'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, name)
);

-- Stories (from Jira)
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(20) UNIQUE NOT NULL,         -- 'GET-12345'
  summary TEXT NOT NULL,
  story_points INTEGER,
  sprint_id INTEGER REFERENCES sprints(id),
  team_id INTEGER NOT NULL REFERENCES teams(id),
  status VARCHAR(50) NOT NULL,
  assignee VARCHAR(100),
  created_date TIMESTAMP NOT NULL,
  resolved_date TIMESTAMP,
  raw_data JSONB NOT NULL DEFAULT '{}',    -- Full Jira response
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TAD/TS Compliance (calculated from Bitbucket PRs)
CREATE TABLE tad_ts_compliance (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id),
  has_tad BOOLEAN NOT NULL DEFAULT false,
  has_ts BOOLEAN NOT NULL DEFAULT false,
  tad_status VARCHAR(20),                  -- 'complete', 'n/a', 'missing'
  ts_status VARCHAR(20),
  tad_reason TEXT,                         -- Why N/A or missing
  ts_reason TEXT,
  detection_method VARCHAR(50),            -- 'pr_name', 'description', 'comment'
  bitbucket_prs JSONB,                     -- PR details
  last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(story_id)
);

-- Test Cases (from QTest)
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  qtest_id VARCHAR(50) NOT NULL,
  qtest_project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  automation_status VARCHAR(20) NOT NULL,  -- 'automated', 'manual', 'n/a'
  linked_story_key VARCHAR(20),            -- Jira story if linked
  team_id INTEGER REFERENCES teams(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(qtest_project_id, qtest_id)
);

-- Test Executions (from QTest)
CREATE TABLE test_executions (
  id SERIAL PRIMARY KEY,
  qtest_run_id VARCHAR(50) NOT NULL,
  test_case_id INTEGER NOT NULL REFERENCES test_cases(id),
  sprint_id INTEGER REFERENCES sprints(id),
  test_cycle_name VARCHAR(200),
  status VARCHAR(20) NOT NULL,             -- 'Passed', 'Failed', 'Blocked'
  executed_by VARCHAR(100),
  executed_date TIMESTAMP NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(qtest_run_id)
);

-- Defects (from Jira)
CREATE TABLE defects (
  id SERIAL PRIMARY KEY,
  key VARCHAR(20) UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  sprint_id INTEGER REFERENCES sprints(id),
  team_id INTEGER NOT NULL REFERENCES teams(id),
  severity VARCHAR(20),                    -- Passport: 'Sev 1', 'Sev 2', etc.; DnA: Critical/High/Medium/Low
  safe_sdlc_activity VARCHAR(50),          -- T360: 'Requirements', 'Development', etc.
  safe_team VARCHAR(50),                   -- DnA: Team assignment from Safe-Team field
  discovered_by VARCHAR(50),               -- Passport
  status VARCHAR(50) NOT NULL,
  is_reopened BOOLEAN NOT NULL DEFAULT false,
  reopened_count INTEGER NOT NULL DEFAULT 0,  -- Number of times bug was reopened
  reopened_history JSONB,                  -- Array of {date, fromStatus, toStatus} transitions
  linked_story_key VARCHAR(20),
  created_date TIMESTAMP NOT NULL,
  resolved_date TIMESTAMP,
  raw_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Metrics Snapshots (pre-calculated metrics for performance)
CREATE TABLE metrics_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  sprint_id INTEGER REFERENCES sprints(id),
  
  -- TAD/TS Metrics
  total_stories INTEGER NOT NULL DEFAULT 0,
  tad_complete INTEGER NOT NULL DEFAULT 0,
  tad_na INTEGER NOT NULL DEFAULT 0,
  ts_complete INTEGER NOT NULL DEFAULT 0,
  ts_na INTEGER NOT NULL DEFAULT 0,
  tad_pct DECIMAL(5,2),
  ts_pct DECIMAL(5,2),
  
  -- QTest Metrics
  total_test_runs INTEGER NOT NULL DEFAULT 0,
  unique_test_cases INTEGER NOT NULL DEFAULT 0,
  automated_test_cases INTEGER NOT NULL DEFAULT 0,
  manual_test_cases INTEGER NOT NULL DEFAULT 0,
  automation_pct DECIMAL(5,2),
  
  -- Functional Coverage (story → test case mapping)
  stories_with_tests INTEGER NOT NULL DEFAULT 0,
  functional_coverage_pct DECIMAL(5,2),
  
  -- Bug/Defect Metrics
  total_bugs INTEGER NOT NULL DEFAULT 0,           -- Total bugs in sprint
  open_bugs INTEGER NOT NULL DEFAULT 0,            -- Currently open (Open/In Progress/To Do)
  closed_bugs INTEGER NOT NULL DEFAULT 0,          -- Closed bugs (Closed/Done/Resolved)
  reopened_bugs INTEGER NOT NULL DEFAULT 0,        -- Bugs that were reopened
  reopened_rate DECIMAL(5,2),                      -- (reopened_bugs / total_bugs) * 100
  defects_by_severity JSONB,                       -- {"Critical": 2, "High": 5, "Sev 1": 1}
  defects_by_sdlc JSONB,                           -- {"Development": 3, "QE Testing": 4}
  
  -- Velocity Metrics
  story_points_committed INTEGER,
  story_points_completed INTEGER,
  velocity_pct DECIMAL(5,2),
  
  -- Unit Test Coverage (from SonarQube)
  unit_test_coverage_pct DECIMAL(5,2),
  sonarqube_project_key VARCHAR(100),
  
  -- Release Readiness Score (composite)
  release_readiness_score DECIMAL(5,2),
  release_readiness_grade VARCHAR(1),     -- 'A', 'B', 'C', 'D', 'F'
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_date, team_id, sprint_id)
);

-- Historical Trends (for time-series charts)
CREATE TABLE historical_trends (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  metric_name VARCHAR(50) NOT NULL,        -- 'tad_pct', 'automation_pct', etc.
  metric_value DECIMAL(10,2) NOT NULL,
  sprint_name VARCHAR(200),
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_trends_lookup (team_id, metric_name, recorded_date)
);

-- Export History (audit trail)
CREATE TABLE export_history (
  id SERIAL PRIMARY KEY,
  export_type VARCHAR(20) NOT NULL,        -- 'pdf', 'excel', 'ppt'
  export_scope VARCHAR(50) NOT NULL,       -- 'team', 'product', 'org'
  scope_id INTEGER NOT NULL,               -- team_id or product_id
  requested_by VARCHAR(100) NOT NULL,
  file_path VARCHAR(500),
  file_size_bytes INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Background Jobs (for tracking async operations)
CREATE TABLE background_jobs (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL,           -- 'sync_sprint', 'calculate_metrics'
  job_data JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 5.2 Indexes (for query performance)

```sql
-- Frequently queried fields
CREATE INDEX idx_teams_product ON teams(product_id) WHERE is_active = true;
CREATE INDEX idx_sprints_team_dates ON sprints(team_id, start_date, end_date);
CREATE INDEX idx_stories_sprint ON stories(sprint_id);
CREATE INDEX idx_stories_team ON stories(team_id);
CREATE INDEX idx_defects_sprint ON defects(sprint_id);
CREATE INDEX idx_defects_team ON defects(team_id);
CREATE INDEX idx_test_executions_sprint ON test_executions(sprint_id);
CREATE INDEX idx_metrics_snapshots_lookup ON metrics_snapshots(team_id, sprint_id);

-- JSONB GIN indexes for nested queries
CREATE INDEX idx_stories_raw_data ON stories USING GIN (raw_data);
CREATE INDEX idx_defects_raw_data ON defects USING GIN (raw_data);
```

---

## 6. API Design

### 6.1 REST API Endpoints

**Base URL:** `https://polaris.example.com/api/v1`

#### 6.1.1 Products API

```
GET    /products                    # List all products
GET    /products/:id                # Get product details
GET    /products/:id/teams          # List teams for product
GET    /products/:id/metrics        # Aggregate metrics for product
```

#### 6.1.2 Teams API

```
GET    /teams                       # List all teams
GET    /teams/:id                   # Get team details
GET    /teams/:id/sprints           # List sprints for team
GET    /teams/:id/metrics           # Current sprint metrics
GET    /teams/:id/trends            # Historical trends (6 months)
```

#### 6.1.3 Sprints API

```
GET    /sprints/:id                 # Get sprint details
GET    /sprints/:id/stories         # List stories in sprint
GET    /sprints/:id/metrics         # Sprint metrics summary
GET    /sprints/:id/defects         # Defects found in sprint
GET    /sprints/:id/test-executions # Test runs in sprint
```

#### 6.1.4 Stories API

```
GET    /stories/:key                # Get story details
GET    /stories/:key/tad-ts         # TAD/TS compliance status
GET    /stories/:key/test-cases     # Linked test cases
GET    /stories/:key/defects        # Linked defects
```

#### 6.1.5 Metrics API

```
GET    /metrics/tad-ts              # TAD/TS metrics
       ?teamId=1&sprint=26.1.1
       
GET    /metrics/qtest               # QTest metrics
       ?teamId=1&sprint=26.1.1
       
GET    /metrics/defects             # Defect analysis
       ?teamId=1&sprint=26.1.1&groupBy=severity
       
GET    /metrics/velocity            # Sprint velocity
       ?teamId=1&sprintCount=6
       
GET    /metrics/release-readiness   # Release readiness score
       ?productId=1&release=26.1.1
       
GET    /metrics/trends              # Historical trends
       ?teamId=1&metric=tad_pct&period=6months
```

#### 6.1.6 Export API

```
POST   /export/pdf                  # Generate PDF report
       Body: { teamId, sprint, sections: ['tad-ts', 'qtest', 'defects'] }
       
POST   /export/excel                # Generate Excel workbook
       Body: { productId, release }
       
POST   /export/powerpoint           # Generate PowerPoint deck
       Body: { orgLevel: true, release: '26.1.1' }
```

#### 6.1.7 Admin API

```
GET    /admin/sync-status           # Check sync job status
POST   /admin/sync-sprint           # Trigger sprint data sync
       Body: { teamId, sprint }
       
POST   /admin/recalculate-metrics  # Recalculate metrics
       Body: { teamId, sprint }
       
GET    /admin/field-mappings        # Get custom field mappings
PUT    /admin/field-mappings/:id    # Update field mapping
```

### 6.2 API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2026-01-21T10:30:00Z",
    "cached": false,
    "cacheExpires": null
  }
}
```

**Bug Metrics Response (from `/api/metrics` endpoint):**
```json
{
  "success": true,
  "data": {
    "product": "t360",
    "teams": [
      {
        "teamId": "matrix",
        "teamName": "Matrix",
        "sprint": "26.1.1",
        "metrics": {
          "requirementsCovered": 85.5,
          "testsCovered": 92.3,
          "defectsOpen": 0,        // From openBugs (JiraBugService)
          "defectsClosed": 2,      // From closedBugs (JiraBugService)
          "reopenedBugs": 1,       // NEW: From reopenedBugs (JiraBugService)
          "reopenedRate": 50.0,    // NEW: Reopened percentage
          "totalBugs": 2,
          "deploymentReadiness": 95.2,
          "codeQuality": 88.7
        }
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-17T10:30:00Z",
    "cached": false
  }
}
```

**Note**: The `reopenedBugs` and `reopenedRate` fields are already returned by `JiraBugService.calculateBugMetrics()` in the backend. No backend changes needed for the new Reopened Defects UI metric - only frontend display changes required.

**Quality Badge Mapping** (Frontend Implementation):
- `reopenedRate < 10`: Display "Excellent" badge (green)
- `reopenedRate >= 10 && reopenedRate <= 25`: Display "Fair" badge (yellow/orange)
- `reopenedRate > 25`: Display "Action Required" badge (red)

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid team ID",
    "details": {
      "field": "teamId",
      "constraint": "must be a positive integer"
    }
  },
  "meta": {
    "timestamp": "2026-01-21T10:30:00Z"
  }
}
```

### 6.3 WebSocket Events (Real-Time Updates)

**Client → Server:**
```javascript
socket.emit('subscribe:team', { teamId: 1 });
socket.emit('subscribe:sprint', { sprintId: 42 });
```

**Server → Client:**
```javascript
socket.on('metrics:updated', (data) => {
  // { teamId: 1, sprint: '26.1.1', metrics: {...} }
});

socket.on('sync:progress', (data) => {
  // { jobId: 'abc123', progress: 75, status: 'syncing stories' }
});

socket.on('sync:completed', (data) => {
  // { jobId: 'abc123', teamId: 1, sprint: '26.1.1' }
});
```

---

## 7. Integration Patterns

### 7.1 Product Strategy Pattern

**Interface:**
```typescript
interface ProductIntegrationStrategy {
  // Jira Integration
  getSprintIssues(sprint: string): Promise<JiraIssue[]>;
  checkTadTsCompliance(issues: JiraIssue[]): Promise<TadTsMetrics>;
  analyzeDefects(issues: JiraIssue[]): Promise<DefectMetrics>;
  
  // QTest Integration (optional - not all products may use QTest)
  getTestMetrics?(sprint: string): Promise<QTestMetrics>;
  mapSprintToTestCycles?(sprintDates: DateRange): Promise<TestCycle[]>;
  
  // Custom Field Parsing
  parseTeamField(issue: JiraIssue): string | null;
  parseSprintField(issue: JiraIssue): string | null;
  
  // Sprint Name Formatting (for DnA teams)
  formatSprintName?(baseSprint: string): string; // e.g., "26.1.4" -> "Passport D&A Minerva-26.1.4"
  
  // Validation
  shouldIncludeIssue(issue: JiraIssue): boolean;
}
```

**Sprint Naming Conventions:**
- **T360 Teams**: Standard format - `Sprint 26.1.4` (Project: GET)
- **Passport Teams**: Standard format - `Sprint 26.1.4` (Project: ELM)
- **Collaboration Portal Teams**: Standard format - `Sprint 26.1.4` (Project: ELM)
- **DnA Teams**: Product-prefixed format:
  - Minerva: `Passport D&A Minerva-26.1.4` (Project: ELM)
  - Guardians: `Passport D&A Guardians-26.1.4` (Project: ELM)
  - Athena: `T360 D&A Athena-26.1.4` (Project: GET)

**Factory:**
```typescript
class StrategyFactory {
  static create(team: Team): ProductIntegrationStrategy {
    switch (team.integration_strategy) {
      case 't360':
        return new T360Strategy(team.config);
      case 'passport':
        return new PassportStrategy(team.config);
      case 'dna':
        return new DnaStrategy(team.config, team.jira_board_id, team.safe_team_field_value);
      default:
        throw new Error(`Unknown strategy: ${team.integration_strategy}`);
    }
  }
}
```

**DnA Strategy Specifics:**
```typescript
class DnaStrategy implements ProductIntegrationStrategy {
  constructor(
    private config: any,
    private boardId: number,
    private safeTeamValue: string
  ) {}

  async getSprintBugs(sprint: string): Promise<JiraIssue[]> {
    // Use board-based query with Safe-Team filter
    const jql = `
      board = ${this.boardId}
      AND type = Bug
      AND sprint = "${this.formatSprintName(sprint)}"
      AND "Safe-Team" = "${this.safeTeamValue}"
    `;
    return this.jiraClient.searchIssues(jql);
  }

  async detectReopenedBugs(bugs: JiraIssue[]): Promise<ReopenedBugInfo[]> {
    const reopenedBugs = [];
    
    for (const bug of bugs) {
      // Fetch bug changelog/history
      const changelog = await this.jiraClient.getIssueChangelog(bug.key);
      
      // Detect status transitions: Closed/Done/Resolved -> Open/In Progress/To Do
      const closedStatuses = ['Closed', 'Done', 'Resolved'];
      const openStatuses = ['Open', 'In Progress', 'To Do'];
      
      let reopenCount = 0;
      const reopenHistory = [];
      
      for (let i = 0; i < changelog.values.length - 1; i++) {
        const current = changelog.values[i];
        const next = changelog.values[i + 1];
        
        if (current.items) {
          const statusChange = current.items.find(item => item.field === 'status');
          if (statusChange) {
            const fromStatus = statusChange.fromString;
            const toStatus = statusChange.toString;
            
            if (closedStatuses.includes(fromStatus) && openStatuses.includes(toStatus)) {
              reopenCount++;
              reopenHistory.push({
                date: current.created,
                fromStatus,
                toStatus
              });
            }
          }
        }
      }
      
      if (reopenCount > 0) {
        reopenedBugs.push({
          bugKey: bug.key,
          reopenCount,
          reopenHistory,
          currentStatus: bug.fields.status.name,
          severity: bug.fields.severity
        });
      }
    }
    
    return reopenedBugs;
  }

  formatSprintName(baseSprint: string): string {
    // Minerva: "Passport D&A Minerva-26.1.4"
    // Guardians: "Passport D&A Guardians-26.1.4"
    // Athena: "T360 D&A Athena-26.1.4"
    return this.config.sprintFormat.replace('{sprint}', baseSprint);
  }

  buildJqlQuery(sprintName: string): string {
    // Multi-project query to capture bugs from primary project AND "ELM Tech Ops"
    // Example for Athena: (project = GET OR project = "ELM Tech Ops") AND type = Bug AND sprint = "T360 D&A Athena-26.1.2"
    // Note: customfield_13392 (Safe-Team) cannot be used in JQL - filtered post-retrieval
    const primaryProject = this.config.jiraProject;
    const toProject = '"ELM Tech Ops"';  // Full project name in quotes
    
    // All teams search both primary project AND "ELM Tech Ops" for Tech Ops bugs
    const projectClause = primaryProject === 'ELM' 
      ? `(project = ELM OR project = ${toProject})`  // For Minerva/Guardians
      : `(project = ${primaryProject} OR project = ${toProject})`;  // For Athena
    
    return `${projectClause} AND type = Bug AND sprint = "${sprintName}" ORDER BY created DESC`;
  }

  filterBySafeTeam(bugs: JiraIssue[]): JiraIssue[] {
    // Post-retrieval filtering by Safe-Team field
    // Safe-Team field is object with 'value' property: {value: "Athena"}
    return bugs.filter(bug => {
      const safeTeamField = bug.fields.customfield_13392;
      const safeTeamValue = safeTeamField?.value || safeTeamField;
      
      // Include bugs without Safe-Team field (common for Tech Ops bugs)
      if (!safeTeamValue) return true;
      
      return safeTeamValue === this.config.safeTeamValue;
    });
  }
}
```

### 7.2 TAD/TS Detection (from T360/Passport - Refactored)

**Algorithm (2-stage detection):**

```typescript
class TadTsDetector {
  async detectCompliance(story: JiraIssue): Promise<TadTsResult> {
    const result: TadTsResult = {
      hasTad: false,
      hasTs: false,
      tadStatus: 'missing',
      tsStatus: 'missing',
      tadReason: null,
      tsReason: null,
      detectionMethod: null
    };
    
    // Stage 1: Check Bitbucket PR names
    const prs = await this.bitbucketClient.getPullRequests(story.key);
    
    for (const pr of prs) {
      if (this.isPrNameTad(pr.title)) {
        result.hasTad = true;
        result.tadStatus = 'complete';
        result.detectionMethod = 'pr_name';
      }
      if (this.isPrNameTs(pr.title)) {
        result.hasTs = true;
        result.tsStatus = 'complete';
        result.detectionMethod = 'pr_name';
      }
    }
    
    // Stage 2: Check PR descriptions for TAD.md / TS.md links
    if (!result.hasTad || !result.hasTs) {
      for (const pr of prs) {
        const description = pr.description || '';
        
        if (!result.hasTad && this.hasTadMdLink(description)) {
          result.hasTad = true;
          result.tadStatus = 'complete';
          result.detectionMethod = 'description';
        }
        
        if (!result.hasTs && this.hasTsMdLink(description)) {
          result.hasTs = true;
          result.tsStatus = 'complete';
          result.detectionMethod = 'description';
        }
      }
    }
    
    // Stage 3: Check for N/A via comments or bug links
    if (!result.hasTad) {
      const naReason = await this.checkNaStatus(story, 'tad');
      if (naReason) {
        result.tadStatus = 'n/a';
        result.tadReason = naReason;
        result.detectionMethod = 'comment_or_bug';
      }
    }
    
    if (!result.hasTs) {
      const naReason = await this.checkNaStatus(story, 'ts');
      if (naReason) {
        result.tsStatus = 'n/a';
        result.tsReason = naReason;
        result.detectionMethod = 'comment_or_bug';
      }
    }
    
    return result;
  }
  
  private isPrNameTad(title: string): boolean {
    const keywords = [
      'TAD', 'Technical Architecture Document',
      'technical design', 'architecture doc'
    ];
    return keywords.some(kw => 
      title.toLowerCase().includes(kw.toLowerCase())
    );
  }
  
  private hasTadMdLink(description: string): boolean {
    // Look for links to TAD.md files
    const patterns = [
      /TAD\.md/i,
      /Technical.*Architecture.*Document/i,
      /\[TAD\]/i
    ];
    return patterns.some(pattern => pattern.test(description));
  }
  
  private async checkNaStatus(
    story: JiraIssue, 
    docType: 'tad' | 'ts'
  ): Promise<string | null> {
    // Check comments for N/A justification
    const comments = await this.jiraClient.getComments(story.key);
    const naKeyword = docType === 'tad' ? 'TAD N/A' : 'TS N/A';
    
    for (const comment of comments) {
      if (comment.body.includes(naKeyword)) {
        return `N/A: ${comment.body}`;
      }
    }
    
    // Check if linked to bug (bugs don't need TAD/TS)
    const linkedIssues = story.fields.issuelinks || [];
    for (const link of linkedIssues) {
      const linkedIssue = link.inwardIssue || link.outwardIssue;
      if (linkedIssue?.fields?.issuetype?.name === 'Bug') {
        return 'N/A: Linked to bug';
      }
    }
    
    return null;
  }
}
```

### 7.3 QTest Integration (from DnA - Refactored)

**Sprint to Test Cycle Mapping:**

```typescript
class QTestSprintMapper {
  async mapSprintToTestCycles(
    qtestProjectId: number,
    sprintDates: DateRange
  ): Promise<TestCycle[]> {
    // Get all test cycles from QTest
    const allCycles = await this.qtestClient.listTestCycles(qtestProjectId);
    
    // Filter cycles that overlap with sprint dates
    const matchingCycles = allCycles.filter(cycle => {
      const cycleStart = parseDate(cycle.start_date);
      const cycleEnd = parseDate(cycle.end_date);
      
      return this.dateRangesOverlap(
        cycleStart, cycleEnd,
        sprintDates.start, sprintDates.end
      );
    });
    
    return matchingCycles;
  }
  
  private dateRangesOverlap(
    start1: Date, end1: Date,
    start2: Date, end2: Date
  ): boolean {
    return start1 <= end2 && start2 <= end1;
  }
  
  async calculateAutomationMetrics(
    testCycles: TestCycle[]
  ): Promise<QTestMetrics> {
    const allTestRuns: TestRun[] = [];
    
    // Get all test runs from cycles
    for (const cycle of testCycles) {
      const runs = await this.qtestClient.getTestRuns(
        cycle.project_id,
        cycle.id
      );
      allTestRuns.push(...runs);
    }
    
    // Get unique test cases
    const uniqueTestCaseIds = new Set(
      allTestRuns.map(run => run.test_case_id)
    );
    
    // Count automated test cases
    let automatedCount = 0;
    let manualCount = 0;
    
    for (const testCaseId of uniqueTestCaseIds) {
      const testCase = await this.qtestClient.getTestCase(testCaseId);
      
      if (this.isAutomated(testCase)) {
        automatedCount++;
      } else {
        manualCount++;
      }
    }
    
    const totalTestCases = uniqueTestCaseIds.size;
    const automationPct = totalTestCases > 0
      ? (automatedCount / totalTestCases) * 100
      : 0;
    
    return {
      totalRuns: allTestRuns.length,
      uniqueTestCases: totalTestCases,
      automatedTestCases: automatedCount,
      manualTestCases: manualCount,
      automationPct
    };
  }
  
  private isAutomated(testCase: QTestCase): boolean {
    // Check automation field
    const automation = testCase.automation?.toLowerCase() || '';
    if (['automated', 'automation'].includes(automation)) {
      return true;
    }
    
    // Check properties
    for (const prop of testCase.properties || []) {
      const fieldName = prop.field_name?.toLowerCase() || '';
      const fieldValue = prop.field_value?.toLowerCase() || '';
      
      if (fieldName.includes('automation') && fieldValue.includes('auto')) {
        return true;
      }
    }
    
    // Check automation content
    if (testCase.automation_content) {
      return true;
    }
    
    return false;
  }
}
```

### 7.4 Caching Strategy

**Redis Cache Keys:**
```
polaris:metrics:{teamId}:{sprint}        TTL: 5 minutes
polaris:stories:{teamId}:{sprint}        TTL: 10 minutes
polaris:defects:{teamId}:{sprint}        TTL: 10 minutes
polaris:qtest:{teamId}:{sprint}          TTL: 15 minutes
polaris:trends:{teamId}:{metric}         TTL: 30 minutes
```

**Cache Invalidation:**
```typescript
class CacheManager {
  async invalidateTeamCache(teamId: number, sprint: string): Promise<void> {
    const keys = await this.redis.keys(`polaris:*:${teamId}:${sprint}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  async getOrCompute<T>(
    key: string,
    ttl: number,
    computeFn: () => Promise<T>
  ): Promise<T> {
    // Check cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Compute and cache
    const result = await computeFn();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
}
```

### 7.5 Background Jobs (BullMQ)

**Job Types:**

```typescript
enum JobType {
  SYNC_SPRINT = 'sync_sprint',
  CALCULATE_METRICS = 'calculate_metrics',
  GENERATE_EXPORT = 'generate_export',
  REFRESH_HISTORICAL = 'refresh_historical'
}

// Job Definitions
interface SyncSprintJob {
  teamId: number;
  sprint: string;
}

interface CalculateMetricsJob {
  teamId: number;
  sprint: string;
  metricTypes: string[]; // ['tad-ts', 'qtest', 'defects']
}

interface GenerateExportJob {
  exportType: 'pdf' | 'excel' | 'ppt';
  teamId?: number;
  productId?: number;
  sprint?: string;
  requestedBy: string;
}

// Job Processor
class MetricsJobProcessor {
  async processSyncSprint(job: Job<SyncSprintJob>): Promise<void> {
    const { teamId, sprint } = job.data;
    
    await job.updateProgress(10);
    
    // 1. Fetch stories from Jira
    const stories = await this.jiraService.getSprintStories(teamId, sprint);
    await this.storyRepository.upsertMany(stories);
    await job.updateProgress(30);
    
    // 2. Check TAD/TS compliance
    const tadTsResults = await this.tadTsDetector.detectForStories(stories);
    await this.tadTsRepository.upsertMany(tadTsResults);
    await job.updateProgress(50);
    
    // 3. Fetch defects
    const defects = await this.jiraService.getSprintDefects(teamId, sprint);
    await this.defectRepository.upsertMany(defects);
    await job.updateProgress(70);
    
    // 4. Fetch QTest metrics
    const qtestMetrics = await this.qtestService.getSprintMetrics(teamId, sprint);
    await this.testRepository.upsertMetrics(qtestMetrics);
    await job.updateProgress(90);
    
    // 5. Calculate aggregated metrics
    await this.metricsService.calculateSnapshot(teamId, sprint);
    await job.updateProgress(100);
    
    // 6. Invalidate cache
    await this.cacheManager.invalidateTeamCache(teamId, sprint);
  }
}
```

---

## 8. Security & Authentication

### 8.1 Authentication

**Method:** OAuth 2.0 with JWT tokens (integrate with corporate SSO)

```typescript
interface JWTPayload {
  sub: string;          // User ID
  email: string;
  name: string;
  roles: string[];      // ['admin', 'user']
  permissions: string[];
  iat: number;
  exp: number;
}

class AuthMiddleware {
  async validateToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const payload = await this.jwtService.verify(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}
```

### 8.2 Authorization

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| **Admin** | All operations, manage field mappings, trigger syncs |
| **QE Lead** | View all metrics, export reports, view all teams |
| **Dev Lead** | View team metrics, export team reports |
| **IC** | View own team metrics only |
| **Executive** | View org-level metrics, export org reports |

### 8.3 API Security

- **Rate Limiting:** 100 requests/minute per user
- **CORS:** Whitelist internal domains only
- **HTTPS Only:** Enforce TLS 1.3
- **Input Validation:** Joi/Zod schemas for all inputs
- **SQL Injection Prevention:** Parameterized queries (Prisma ORM)
- **XSS Prevention:** Content Security Policy headers
- **CSRF Protection:** SameSite cookies

### 8.4 Secrets Management

**Azure Key Vault Integration:**

```typescript
class SecretsManager {
  async getSecret(key: string): Promise<string> {
    const secretName = `polaris-${key}`;
    const secret = await this.keyVaultClient.getSecret(secretName);
    return secret.value;
  }
}

// Environment variables (non-secret)
const config = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  
  // Secrets (from Key Vault)
  database: {
    host: await secrets.getSecret('db-host'),
    password: await secrets.getSecret('db-password')
  },
  
  jira: {
    baseUrl: await secrets.getSecret('jira-base-url'),
    token: await secrets.getSecret('jira-api-token')
  },
  
  qtest: {
    baseUrl: await secrets.getSecret('qtest-base-url'),
    token: await secrets.getSecret('qtest-api-token')
  }
};
```

---

## 9. Performance & Scalability

### 9.1 Performance Targets

| Metric | Target | Current (Reference Dashboards) |
|--------|--------|-------------------------------|
| **Page Load Time** | <3 seconds | ~8 seconds (manual refresh) |
| **API Response Time** | <500ms (cached), <2s (uncached) | N/A (static files) |
| **Metric Calculation** | <30 seconds | ~5 minutes (batch script) |
| **Export Generation** | <10 seconds | N/A |
| **Database Queries** | <100ms (95th percentile) | N/A |

### 9.2 Optimization Strategies

#### 9.2.1 Database Optimization

```sql
-- Materialized view for frequently accessed metrics
CREATE MATERIALIZED VIEW current_sprint_metrics AS
SELECT 
  t.id AS team_id,
  t.name AS team_name,
  s.name AS sprint_name,
  ms.tad_pct,
  ms.ts_pct,
  ms.automation_pct,
  ms.release_readiness_score
FROM metrics_snapshots ms
JOIN teams t ON ms.team_id = t.id
JOIN sprints s ON ms.sprint_id = s.id
WHERE s.state = 'active';

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY current_sprint_metrics;
```

#### 9.2.2 API Call Optimization

**Batch Jira Requests:**
```typescript
// BAD: N+1 queries
for (const story of stories) {
  const prs = await bitbucketClient.getPullRequests(story.key);
  // Process PRs
}

// GOOD: Single bulk request
const allStoryKeys = stories.map(s => s.key);
const prsByStory = await bitbucketClient.getBulkPullRequests(allStoryKeys);
```

**Parallel API Calls:**
```typescript
// Fetch from multiple sources in parallel
const [jiraStories, qtestMetrics, sonarQubeData] = await Promise.all([
  jiraClient.getSprintStories(teamId, sprint),
  qtestClient.getSprintMetrics(teamId, sprint),
  sonarQubeClient.getCoverage(projectKey)
]);
```

#### 9.2.3 Caching Strategy

**Multi-Layer Cache:**
```
1. Browser Cache (1 minute)
   └→ 2. Redis Cache (5 minutes)
      └→ 3. Database (pre-calculated snapshots)
         └→ 4. External APIs (on-demand)
```

### 9.3 Scalability Plan

**Horizontal Scaling:**
- API Gateway: 3 instances (load balanced by Nginx)
- Metrics Service: 2 instances
- Integration Service: 2 instances
- Data Service: 2 instances

**Database:**
- PostgreSQL Primary (writes)
- PostgreSQL Replica (reads)
- Connection pooling (max 20 connections per service)

**Redis:**
- Clustered mode (3 master + 3 replica)
- Separate instance for BullMQ

---

## 10. Testing Strategy

### 10.1 Test Coverage Targets

| Layer | Target Coverage | Tools |
|-------|-----------------|-------|
| **Unit Tests** | >80% | Jest (Node.js), Pytest (Python) |
| **Integration Tests** | >70% | Supertest, Testcontainers |
| **E2E Tests** | Critical paths | Playwright MCP |
| **API Tests** | 100% endpoints | Postman/Newman |

### 10.2 Unit Testing

**Example (Metrics Service):**
```typescript
// TadTsCalculator.test.ts
describe('TadTsCalculator', () => {
  let calculator: TadTsCalculator;
  let mockJiraClient: jest.Mocked<JiraClient>;
  let mockBitbucketClient: jest.Mocked<BitbucketClient>;
  
  beforeEach(() => {
    mockJiraClient = createMockJiraClient();
    mockBitbucketClient = createMockBitbucketClient();
    calculator = new TadTsCalculator(mockJiraClient, mockBitbucketClient);
  });
  
  describe('detectCompliance', () => {
    it('should detect TAD from PR name', async () => {
      const story = createMockStory('GET-12345');
      const pr = createMockPR('GET-12345: TAD for new feature');
      
      mockBitbucketClient.getPullRequests.mockResolvedValue([pr]);
      
      const result = await calculator.detectCompliance(story);
      
      expect(result.hasTad).toBe(true);
      expect(result.tadStatus).toBe('complete');
      expect(result.detectionMethod).toBe('pr_name');
    });
    
    it('should detect TAD from PR description', async () => {
      const story = createMockStory('GET-12345');
      const pr = createMockPR('GET-12345: Implementation', {
        description: 'See TAD.md for design details'
      });
      
      mockBitbucketClient.getPullRequests.mockResolvedValue([pr]);
      
      const result = await calculator.detectCompliance(story);
      
      expect(result.hasTad).toBe(true);
      expect(result.detectionMethod).toBe('description');
    });
    
    it('should mark as N/A for bug-linked stories', async () => {
      const story = createMockStory('GET-12345', {
        issuelinks: [
          { outwardIssue: { fields: { issuetype: { name: 'Bug' } } } }
        ]
      });
      
      mockBitbucketClient.getPullRequests.mockResolvedValue([]);
      
      const result = await calculator.detectCompliance(story);
      
      expect(result.tadStatus).toBe('n/a');
      expect(result.tadReason).toContain('Linked to bug');
    });
  });
});
```

### 10.3 Integration Testing

**Example (API Integration):**
```typescript
describe('Metrics API Integration', () => {
  let app: Express;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    await prisma.metricsSnapshot.deleteMany();
    await seedTestData(prisma);
  });
  
  describe('GET /api/v1/metrics/tad-ts', () => {
    it('should return TAD/TS metrics for team', async () => {
      const response = await request(app)
        .get('/api/v1/metrics/tad-ts')
        .query({ teamId: 1, sprint: '26.1.1' })
        .set('Authorization', `Bearer ${getTestToken()}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalStories: expect.any(Number),
        tadPct: expect.any(Number),
        tsPct: expect.any(Number)
      });
    });
    
    it('should return cached data on subsequent request', async () => {
      const first = await request(app)
        .get('/api/v1/metrics/tad-ts')
        .query({ teamId: 1, sprint: '26.1.1' })
        .expect(200);
      
      expect(first.body.meta.cached).toBe(false);
      
      const second = await request(app)
        .get('/api/v1/metrics/tad-ts')
        .query({ teamId: 1, sprint: '26.1.1' })
        .expect(200);
      
      expect(second.body.meta.cached).toBe(true);
    });
  });
});
```

### 10.4 E2E Testing with Playwright MCP

**Example Test Cases:**
```typescript
// tests/e2e/dashboard.spec.ts
describe('Polaris Dashboard E2E', () => {
  test('complete user flow: product → team → sprint metrics', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('https://polaris.example.com');
    
    // Login
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Select product
    await page.click('[data-testid="product-switcher"]');
    await page.click('text=T360');
    
    // Select team
    await page.click('[data-testid="team-selector"]');
    await page.click('text=Vanguards');
    
    // Select sprint
    await page.click('[data-testid="sprint-navigator"]');
    await page.click('text=26.1.1');
    
    // Verify metrics loaded
    await expect(page.locator('[data-testid="tad-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="ts-percentage"]')).toBeVisible();
    await expect(page.locator('[data-testid="automation-percentage"]')).toBeVisible();
    
    // Verify values are reasonable (0-100%)
    const tadPct = await page.locator('[data-testid="tad-percentage"]').textContent();
    expect(parseFloat(tadPct!)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(tadPct!)).toBeLessThanOrEqual(100);
  });
  
  test('export PDF report', async ({ page }) => {
    await page.goto('https://polaris.example.com/dashboard?teamId=1&sprint=26.1.1');
    
    // Click export button
    await page.click('[data-testid="export-button"]');
    await page.click('text=Export PDF');
    
    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="confirm-export"]')
    ]);
    
    // Verify file name
    expect(download.suggestedFilename()).toMatch(/polaris-report-.*\.pdf/);
  });
});
```

### 10.5 Performance Testing

**Load Testing with k6:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
  },
};

export default function () {
  const token = 'test-jwt-token';
  
  // Metrics endpoint
  let res = http.get(
    'https://polaris.example.com/api/v1/metrics/tad-ts?teamId=1&sprint=26.1.1',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has data': (r) => JSON.parse(r.body).data !== undefined,
  });
  
  sleep(1);
}
```

---

## 11. Deployment Architecture

### 11.1 Docker Compose Setup

```yaml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway

  # API Gateway
  api-gateway:
    build: ./api-gateway
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
      - metrics-service
      - data-service
      - integration-service

  # Metrics Service
  metrics-service:
    build: ./metrics-service
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  # Data Service
  data-service:
    build: ./data-service
    environment:
      - NODE_ENV=production
      - PORT=3002
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  # Integration Service (Python)
  integration-service:
    build: ./integration-service
    environment:
      - PYTHON_ENV=production
      - PORT=8000
      - DATABASE_URL=${DATABASE_URL}
      - JIRA_BASE_URL=${JIRA_BASE_URL}
      - JIRA_API_TOKEN=${JIRA_API_TOKEN}
      - QTEST_BASE_URL=${QTEST_BASE_URL}
      - QTEST_API_TOKEN=${QTEST_API_TOKEN}
    depends_on:
      - postgres

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=polaris
      - POSTGRES_USER=polaris
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  # Background Job Worker
  job-worker:
    build: ./metrics-service
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  # Frontend (React)
  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=https://polaris.example.com/api/v1
    depends_on:
      - api-gateway

volumes:
  postgres-data:
  redis-data:
```

### 11.2 CI/CD Pipeline (Azure DevOps)

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildFrontend
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              cd frontend
              npm ci
              npm run build
              npm run test
          - task: PublishTestResults@2
            inputs:
              testResultsFiles: 'frontend/coverage/junit.xml'

      - job: BuildBackend
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              cd api-gateway
              npm ci
              npm run build
              npm run test
          - task: PublishTestResults@2
            inputs:
              testResultsFiles: 'api-gateway/coverage/junit.xml'

      - job: BuildIntegrationService
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '3.11'
          - script: |
              cd integration-service
              pip install -r requirements.txt
              pytest --cov=app --cov-report=xml
          - task: PublishTestResults@2
            inputs:
              testResultsFiles: 'integration-service/coverage.xml'

  - stage: Test
    dependsOn: Build
    jobs:
      - job: IntegrationTests
        steps:
          - script: |
              docker-compose -f docker-compose.test.yml up -d
              npm run test:integration
              docker-compose -f docker-compose.test.yml down

      - job: E2ETests
        steps:
          - script: |
              npm run test:e2e

  - stage: SonarQube
    dependsOn: Test
    jobs:
      - job: CodeQuality
        steps:
          - task: SonarQubePrepare@5
            inputs:
              SonarQube: 'SonarQube Connection'
              scannerMode: 'CLI'
              projectKey: 'polaris-elm-metrics'
          - task: SonarQubeAnalyze@5
          - task: SonarQubePublish@5

  - stage: Deploy
    dependsOn: SonarQube
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: |
                    docker-compose -f docker-compose.prod.yml pull
                    docker-compose -f docker-compose.prod.yml up -d
                    docker-compose -f docker-compose.prod.yml run --rm api-gateway npm run migrate
```

---

## 12. Implementation Phases

**Iterative delivery approach** - each phase builds on the previous one and delivers working software.

---

### Phase 1: MVP - T360 Core Metrics (Weeks 1-3) 🚀

**Goal:** Working dashboard for T360 with TAD/TS + QTest metrics

**Deliverables:**
- ✅ PostgreSQL database (core tables only)
- ✅ TAD/TS detection working (port from T360 dashboard)
- ✅ QTest integration working (port from DnA dashboard)
- ✅ Simple REST API (Express)
- ✅ Basic React dashboard (T360 teams only)
- ✅ Manual refresh button
- ✅ PDF export

**What Users See:**
- Dashboard showing TAD %, TS %, Automation % for T360 teams
- Sprint selector
- Team selector (6 T360 teams)
- Current sprint metrics
- Export to PDF button

**Tasks:**

#### Week 1: Backend Foundation
- [ ] **Day 1-2:** Database setup
  - Create PostgreSQL database
  - Create core tables (products, teams, sprints, stories, metrics_snapshots)
  - Seed T360 product and 6 teams
  - Write Prisma schema
  
- [ ] **Day 3-4:** Port TAD/TS detection
  - Extract TAD/TS logic from T360 dashboard (sprint-tad-ts-report.py)
  - Refactor to Python FastAPI service
  - Add error handling
  - Test with real T360 stories
  
- [ ] **Day 5:** Port QTest integration
  - Extract QTest client from DnA dashboard
  - Adapt for T360 (QTest project ID 114345)
  - Test sprint-to-cycle mapping

#### Week 2: API + Metrics Calculation
- [ ] **Day 1-2:** Build Integration Service (Python FastAPI)
  - Jira client (fetch T360 sprint stories)
  - Bitbucket client (fetch PRs for stories)
  - QTest client (fetch test metrics)
  - `/sync/sprint` endpoint
  
- [ ] **Day 3-4:** Build Metrics Calculator
  - Calculate TAD/TS percentages
  - Calculate QTest automation %
  - Calculate defect counts
  - Save to metrics_snapshots table
  
- [ ] **Day 5:** Build REST API (Node.js Express)
  - GET `/api/v1/teams` (list T360 teams)
  - GET `/api/v1/metrics/tad-ts?teamId=X&sprint=Y`
  - GET `/api/v1/metrics/qtest?teamId=X&sprint=Y`
  - POST `/api/v1/sync/sprint` (trigger sync)

#### Week 3: Frontend + Polish
- [ ] **Day 1-2:** Build React Dashboard
  - Team selector dropdown
  - Sprint selector dropdown
  - Metric cards (TAD %, TS %, Automation %)
  - Chart.js bar charts
  - Refresh button
  
- [ ] **Day 3:** PDF Export
  - Puppeteer-based PDF generator
  - Dashboard snapshot with metrics
  - Download button
  
- [ ] **Day 4:** Testing
  - Manual testing all flows
  - Fix critical bugs
  - Basic error handling in UI
  
- [ ] **Day 5:** Deploy
  - Docker Compose setup
  - Deploy to internal VM

---

### Phase 1.5: Reopened Defects UI Metric (NEW - February 17, 2026) 🆕

**Goal:** Add "Reopened Defects" as a 7th scorecard tile in the dashboard UI, complementing existing Open Defects and Closed Defects metrics.

**Deliverables:**
- ✅ Backend already returns `reopenedBugs` in `/api/metrics` response (no changes needed)
- ✅ Frontend displays new scorecard tile for "Reopened Defects"
- ✅ Non-breaking change - existing functionality unaffected
- ✅ Documentation updated (spec.md, plan.md, tasks.md)

**What Users See:**
- New scorecard tile: **"Reopened Defects"** (7th metric)
- Displays count of bugs that were reopened (regardless of current status)
- Matches style of existing Open Defects and Closed Defects tiles
- Positioned alongside existing 6 metrics in the dashboard

**Implementation Approach:**

**Frontend Changes (ONLY):**
1. **Modify `frontend/index.html` (lines 568-600)**:
   - Add 7th `.metric-card` div for "Reopened Defects"
   - Bind to `state.metrics.reopenedBugs` (already in API response)
   - Style: Use existing `.metric-card` CSS class (card-orange or card-yellow)
   - Position: Add after "Closed Defects" or "Deployment Readiness"

**Backend Changes:**
- NONE - `reopenedBugs` already returned by `/api/metrics` endpoint
- `JiraBugService.calculateBugMetrics()` already provides reopenedBugs value
- `server.js` lines 772-810 already map reopenedBugs to API response

**Database Changes:**
- NONE - `TotalReopenedBugs` column already exists in SQL Server

**Data Flow (Already Implemented):**
```
index.html → /api/metrics → JiraBugService.calculateBugMetrics()
                                → returns reopenedBugs (already working)
```

**Constraints:**
- Non-breaking: Must not impact existing Open/Closed Defects functionality
- No new API calls: Reuse existing JiraBugService data
- No new files: Modify index.html only
- Display reopenedBugs regardless of bug's current status

**Effort Estimate:** 2-3 hours (S size)

**Acceptance Criteria:**
1. Dashboard displays 7 scorecard tiles (was 6)
2. New tile shows "Reopened Defects" with:
   - Icon: ↩️ emoji
   - Main value: Percentage as integer (no decimals) - e.g., "15%" not "15.2%"
   - Quality badge: "Excellent" (<10%), "Fair" (10-25%), or "Action Required" (>25%)
   - Color: Wolters Kluwer lime green (`#a4cd58`) — implemented via `.metric-card.card-orange` CSS class
3. Tile positioned immediately after "Closed Defects" (7th position)
4. Tile matches existing scorecard style (.metric-card)
5. Quality badge color-coded:
   - Excellent: Green background or checkmark ✓
   - Fair: Yellow/Orange background or warning ⚠️
   - Action Required: Red background or alert 🚨
6. Existing Open/Closed Defects tiles still work correctly (non-breaking)
7. Matrix team Sprint 26.1.1 shows correct reopenedRate (expected: 0%)
8. Chargers team Sprint 26.1.1 shows correct reopenedRate (expected: 0%)
9. Edge cases handled: null/undefined values display as "0%"
10. No impact on existing dashboard functionality or data accuracy

### Phase 1.6: CPOD ReOpened Cards Count (SPEC 3.2.14) 🆕

**Goal:** Implement CPOD-only `ReOpened Cards Count` driven by Jira transition `Closed → New` and selected date range.

**Deliverables:**
- [ ] Backend returns CPOD reopened-cards metric using transition-time filtering (`Closed → New`)
- [ ] Frontend shows `ReOpened Cards Count` card only for CPOD selection
- [ ] Non-CPOD selections skip CPOD reopened query path and hide card
- [ ] Fallback behavior follows existing dashboard standard (`0` or `Data unavailable`)
- [ ] Unit and E2E tests cover CPOD success, no-match, non-CPOD, and fallback scenarios

**Implementation Tasks:**
1. **Backend query and mapping**
  - Update CPOD metric query logic in `backend/api-gateway/jiraBugService.js` to include `status CHANGED FROM Closed TO New` with CPOD FR-3 filters
  - Map reopened-card value and fallback signal in `backend/api-gateway/cpodMetricsMapper.js`
2. **Frontend conditional rendering**
  - Add CPOD-only metric card in `frontend/index.html` for reopened-cards count
  - Keep card hidden for all non-CPOD teams
3. **Validation and testing**
  - Extend Jest coverage for query composition, activation guard, and fallback behavior
  - Extend CPOD Playwright checks for visibility, recomputation on date changes, and no-match behavior

**Acceptance Criteria:**
1. CPOD + date range displays count of bugs transitioned from `Closed` to `New` within range
2. Count includes only issues satisfying CPOD filter set (project, issue type, engagement reason, safe product, safe team)
3. No matching issues display `0`
4. Non-CPOD team does not render CPOD reopened card or run CPOD reopened query logic
5. Source failure does not break dashboard; fallback state is shown

---

### Phase 2: Multi-Product Support (Weeks 4-6)

**Goal:** Extend dashboard to support Passport, DnA, Collaboration Portal
  
- [ ] **Day 4:** Testing
  - Manual testing all flows
  - Fix critical bugs
  - Basic error handling in UI
  
- [ ] **Day 5:** Deploy
  - Docker Compose setup
  - Deploy to internal VM
  - Smoke test
  - Demo to stakeholders

**Success Criteria:**
- ✅ T360 Vanguards team shows correct TAD/TS % for sprint 26.1.1
- ✅ QTest automation % matches DnA dashboard
- ✅ Page loads in <5 seconds
- ✅ PDF export works
- ✅ No crashes on manual testing

**NOT in Phase 1:**
- ❌ Passport/DnA/CP products (Phase 2)
- ❌ Auto-refresh / background jobs (Phase 2)
- ❌ Historical trends (Phase 3)
- ❌ Excel/PowerPoint export (Phase 3)
- ❌ Unit tests (Phase 4)
- ❌ Velocity metrics (Phase 3)
- ❌ Release readiness score (Phase 4)

---

### Phase 2: Expand Products + Auto-Refresh (Weeks 4-6)

**Goal:** Add Passport + DnA products, background jobs for auto-refresh

**Deliverables:**
- ✅ Passport teams (3 teams) added to database
- ✅ DnA teams (3 teams: Minerva, Guardians, Athena) added to database with sprint format configuration
- ✅ Product switcher UI
- ✅ Strategy pattern for product differences
- ✅ Background jobs (BullMQ)
- ✅ Auto-refresh every 5 minutes
- ✅ Redis caching

**What Users See:**
- Product dropdown (T360, Passport, DnA)
- All 12 teams selectable
- Dashboard auto-updates (no manual refresh needed)
- Faster page loads (caching)

**DnA Team Configuration:**
- Minerva team: Project ELM, Board ID 7437, Sprint format "Passport D&A Minerva-{sprint}", Safe-Team field value "Minerva"
- Guardians team: Project ELM, Board ID 6704, Sprint format "Passport D&A Guardians-{sprint}", Safe-Team field value "Guardians"
- Athena team: Project GET, Board ID 6798, Sprint format "T360 D&A Athena-{sprint}", Safe-Team field value "Athena"

**Bug Metrics Configuration with Jira MCP Integration:**
- **Jira Instance**: https://jira.wolterskluwer.io/jira
- **Authentication**: Jira API Token (stored in environment variable JIRA_API_TOKEN)
- **Issue Type**: `Bug` (not Defect)
- **Team Assignment**: Safe-Team custom field (customfield_13392)
- **Field Availability**: Safe-Team field exists in both ELM and GET projects
- **Testing Sprint**: 26.1.2 (closed sprint)
- **Implementation Order**: Backend first, then frontend (Tasks 2.1 → 2.10 in sequence)
- **No Mock Data**: All metrics from actual Jira API calls
- **Severity Field**: Standard `Severity` field (Critical, High, Medium, Low)
- **Reopened Detection**: 
  - Use GitKraken MCP tool `mcp_gitkraken_issues_get_detail` to fetch bug changelog
  - Parse changelog entries for status field changes
  - Detect pattern: status change from [Closed, Done, Resolved] → [Open, In Progress, To Do]
  - Track reopened count per bug and store history
- **Status Categories**:
  - Open: Open, In Progress, To Do
  - Closed: Closed, Done, Resolved
- **Reopened Quality Thresholds**:
  - Excellent: 0-5% (Green)
  - Good: 6-10% (Yellow) 
  - Needs Improvement: 11-15% (Orange)
  - Poor: >15% (Red)
- **MCP Integration Architecture**:
  ```typescript
  // Use GitKraken MCP for Jira data extraction
  interface JiraMCPClient {
    // Fetch bug details with changelog
    async getBugDetails(issueId: string): Promise<BugDetail>;
    
    // Query bugs by board and sprint
    async getBoardBugs(boardId: number, sprint: string): Promise<Bug[]>;
    
    // Parse changelog for reopen events
    async analyzeReopenHistory(bug: Bug): Promise<ReopenAnalysis>;
  }
  ```
- **Data Storage Extension**:
  ```sql
  -- Add to defects table
  ALTER TABLE defects ADD COLUMN reopened_count INTEGER DEFAULT 0;
  ALTER TABLE defects ADD COLUMN reopened_history JSONB;
  ALTER TABLE defects ADD COLUMN safe_team VARCHAR(50);
  ALTER TABLE defects ADD COLUMN jira_changelog TEXT;
  
  -- Add to metrics_snapshots table
  ALTER TABLE metrics_snapshots ADD COLUMN total_bugs INTEGER DEFAULT 0;
  ALTER TABLE metrics_snapshots ADD COLUMN open_bugs INTEGER DEFAULT 0;
  ALTER TABLE metrics_snapshots ADD COLUMN closed_bugs INTEGER DEFAULT 0;
  ALTER TABLE metrics_snapshots ADD COLUMN reopened_bugs INTEGER DEFAULT 0;
  ALTER TABLE metrics_snapshots ADD COLUMN reopened_rate DECIMAL(5,2);
  ALTER TABLE metrics_snapshots ADD COLUMN reopened_quality_indicator VARCHAR(20);
  ```

**Tasks:**

#### Week 4: Multi-Product Support

**Goals:**
- Port and refactor Jira/QTest/Bitbucket clients
- Implement TAD/TS detection
- [ ] Add Passport product to database (project: ELM, 3 teams)
- [ ] Add DnA product to database (3 teams, board-based)
- [ ] Implement `PassportStrategy` (Safe-Product filtering)
- [ ] Implement `DnaStrategy` (board-based queries)
- [ ] Update Integration Service to use strategies
- [ ] Add product switcher to React UI
- [ ] Test Passport TAD/TS detection
- [ ] Test DnA QTest integration

#### Week 5: Background Jobs + Caching
- [ ] Set up Redis
- [ ] Install BullMQ
- [ ] Create `sync-sprint` job
  - Runs every 5 minutes for active sprints
  - Fetches Jira stories
  - Checks TAD/TS
  - Fetches QTest metrics
  - Updates database
- [ ] Create job monitoring UI (BullMQ Board)
- [ ] Implement Redis caching in API
  - Cache metrics for 5 minutes
  - Cache team/product lists for 1 hour
- [ ] Add cache invalidation on sync

#### Week 6: Polish + Testing
- [ ] Add loading indicators to UI
- [ ] Add real-time sync status (WebSocket)
- [ ] Error handling improvements
- [ ] Manual testing all products
- [ ] Fix bugs
- [ ] Performance tuning
- [ ] Deploy updates

**Success Criteria:**
- ✅ All 12 teams show correct metrics
- ✅ Dashboard auto-refreshes every 5 minutes
- ✅ Page loads in <2 seconds (cached)
- ✅ No manual refresh needed

---

### Ph:** 6-month historical trends + Excel/PowerPoint exports + Velocity metrics

**Deliverables:**
- ✅ Historical trends (6 months of data)
- ✅ Trend line charts in dashboard
- ✅ Excel export
- ✅ PowerPoint export
- ✅ Velocity metrics (story points)
- ✅ Sprint comparison view

**What Users See:**
- Trend charts showing TAD/TS/Automation over time
- Sprint-over-sprint comparison
- Excel workbook with all metrics
- PowerPoint deck for executive reporting
- Velocity chart (committed vs completed points)

**Tasks:**

#### Week 7: Historical Data + Trends
- [ ] Create `historical_trends` table
- [ ] Backfill job (load last 6 months of sprints)
- [ ] Update sync job to save historical snapshots
- [ ] Build `/api/v1/metrics/trends` endpoint
- [ ] Add trend line charts to dashboard
- [ ] Sprint comparison table

#### Week 8: Additional Metrics + Exports
- [ ] Add velocity calculator (story points)
- [ ] Add defect analysis by SDLC/Severity (dual views)
- [ ] Build Excel exporter (ExcelJS)
  - Multiple sheets: TAD/TS, QTest, Defects, Velocity
  - Ch:** >80% test coverage + E2E tests + Bug fixes

**Deliverables:**
- ✅ Unit tests for all services (>80% coverage)
- ✅ Integration tests for APIs
- ✅ E2E tests with Playwright MCP
- ✅ Bug fixes from testing
- ✅ Code quality improvements
- ✅ SonarQube integration

**What Users See:**
- More stable dashboard
- Fewer bugs
- Better error messages

**Tasks:**

#### Week 10: Unit + Integration Tests
- [ ] Write unit tests for TAD/TS detector (Jest/Pytest)
- [ ] Write unit tests for QTest calculator
- [ ] Write unit tests for strategy implementations
- [ ] Write integration tests for REST APIs
- [ ] Set up test database (Testcontainers)
- [ ] Achieve >80% coverage
- [ ] Set up SonarQube
- [ ] Fix code quality issues

#### Week 11: E2E Tests + Bug Fixes
- [ ] Write Playwright MCP E2E tests
  - User flow: select product → team → sprint
  - Verify metrics display
  - Test PDF export
  - Test Excel export
  - Test PowerPoint export
- [ ] Run all E2E tests
- [ ] Fix bugs found during testing
- [ ] Performance testing
- [ ] Security scan
- [ ] Documentation updates

**Success Criteria:**
- ✅ >80% code coverage
- ✅ All E2E tests passing
- ✅ No critical bugs
- ✅ SonarQube Quality Gate passing

---

### Phase 5: Release Readiness + Advanced Featuresry`
   - `DefectsRepository`

2. **Export Service:**
   - PDF exporter (using Puppeteer)
   - Excel exporter (using ExcelJS)
   - PowerPoint exporter (using PptxGenJS)

3. **B:** Release Readiness Score + Collaboration Portal + SonarQube integration

**Deliverables:**
- ✅ Release Readiness Score (composite metric)
- ✅ Collaboration Portal product added
- ✅ Unit test coverage from SonarQube
- ✅ Story detail drill-down view
- ✅ Admin panel for configuration

**What Users See:**
- Release Readiness Score (A/B/C/D/F grade)
- All 4 products supported (including CP)
- Unit test coverage % (from SonarQube)
- Drill-down to story details
- Admin panel to manage teams/config

**Tasks:**

#### Week 12: Release Readiness + CP
- [ ] Build Release Readiness Calculator
  - Weighted formula: TAD/TS (30%), Automation (25%), Velocity (20%), Defects (25%)
  - Grade: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
- [ ] Add Collaboration Portal product
  - Discover teams, boards, QTest project
  - Test integration
- [ ] Add release-level aggregation
  - Aggregate metrics across all teams for a release
- [ ] Build release readiness dashboard card

#### Week 13: SonarQube + Drill-Down
- [ ] Integrate SonarQube API
- [ ] Fetch unit test coverage per product
- [ ] Add unit coverage % to metrics
- [ ] Build story detail page
  - Story info from Jira
  - TAD/TS compliance details
  - Linked PRs
  - Linked test cases
  - Linked defects
- [ ] Add drill-down navigation from dashboard

#### Week 14: Admin Panel + Polish
- [ ] Build admin panel
  - Manage teams
  - Manage custom field mappings
  - Trigger manual syncs
  - View sync job history
- [ ] Add authentication (OAuth 2.0)
- [ ] Add role-based access control
- [ ] Final UI polish
- [ ] Documentation (user guide)

**Success Criteria:**
- ✅ Release Readiness Score accurate
- ✅ All 4 products working
- ✅ SonarQube integration working
- ✅ Admin panel functional

---

### Phase 6: Production Hardening + Monitoring (Weeks 15-17
   - Admin panel

5. **Export UI:**
   - E:** Production-ready with monitoring, alerting, and CI/CD

**Deliverables:**
- ✅ Prometheus + Grafana monitoring
- ✅ Alerting (Slack/Email)
- ✅ CI/CD pipeline (Azure DevOps)
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Production deployment

**What Users See:**
- Rock-solid stability
- Fast performance (<2s loads)
- Minimal downtime

**Tasks:**

#### Week 15: Monitoring + Alerting
- [ ] Set up Prometheus metrics
  - API response times
  - Database query times
  - Job processing times
  - Cache hit rates
- [ ] Set up Grafana dashboards
  - System health
  - Business metrics (sync status, API usage)
- [ ] Configure alerts
  - Job failures → Slack notification
  - API errors > threshold → Email alert
  - Database connection issues → Page on-call
- [ ] Add health check endpoints

#### Week 16: CI/CD + Performance
- [ ] Build Azure DevOps pipeline
  - Build stage (compile, lint)
  - Test stage (unit, integration, E2E)
  - SonarQube stage (code quality)
  - Deploy stage (Docker, deploy to VM)
- [ ] Database query optimization
  - Add missing indexes
g in production
- [ ] User training sessions
- [ ] Handoff documentation

**Success Criteria:**
- ✅ Monitoring dashboards active
- ✅ CI/CD pipeline working
- ✅ Performance targets met (<2s)
- ✅ Security scan passed
- ✅ Production deployment successful

---

### Total Timeline: 17 Weeks

**Phase 1 (3 weeks):** MVP - T360 working dashboard ✅ **DEMO-ABLE**  
**Phase 2 (3 weeks):** All products + auto-refresh ✅ **PRODUCTION-READY for basic use**  
**Phase 3 (3 weeks):** Historical trends + exports ✅ **FEATURE-COMPLETE**  
**Phase 4 (2 weeks):** Testing + quality ✅ **STABLE**  
**Phase 5 (3 weeks):** Advanced features ✅ **COMPREHENSIVE**  
**Phase 6 (3 weeks):** Production hardening ✅ **ENTERPRISE-GRADE**

**You can STOP after any phase** depending on needs:
- Stop after Phase 1 = Working dashboard in 3 weeks
- Stop after Phase 2 = Production-ready in 6 weeks
- Stop after Phase 3 = Feature-complete in 9 weeks
- Continue to Phase 6 = Full enterprise solution in 17 weeks
4. **Documentation:**
   - User guide
   - API documentation
   - Admin guide
   - Developer guide

**Deliverables:**
- >80% test coverage across all services
- All E2E tests passing
- Performance targets met
- Security audit passed
- Complete documentation

### Phase 7: Deployment & Handoff (Week 17)

**Goals:**
- Deploy to production
- Train users
- Monitor and stabilize

**Tasks:**
1. Database migration to production
2. Deploy services to internal VM
3. SSL certificate setup
4. Monitoring and alerting setup
5. User training sessions
6. Handoff documentation
7. Post-deployment monitoring

**Deliverables:**
- Polaris running in production
- Users trained
- Monitoring dashboards active
- Handoff complete

---Reuse Philosophy

**We're merging three complementary feature sets, not replacing them:**

1. **T360/Passport** → TAD/TS compliance feature (their original focus)
2. **DnA** → Automation metrics feature (their original focus)  
3. **Polaris** → Unified dashboard with both features + more

Each team built what they needed most. Now we're completing the merge they originally planned.

### 13.2 What We're Reusing

#### From T360 Dashboard (tad-ts-dashboard/) - TAD/TS Compliance Feature

### 13.1 What We're Reusing

#### From T360 Dashboard (tad-ts-dashboard/)

| Component | File | Lines | Reuse Strategy |
|-----------|------|-------|----------------|
| **TAD/TS Detection** | `sprint-tad-ts-report.py` lines 450-650 | 200 | Port to TypeScript/Python service |
| **Bitbucket PR Parsing** | `sprint-tad-ts-report.py` lines 250-350 | 100 | Refactor into `BitbucketClient` |
| **Jira JQL Queries** | `sprint-tad-ts-report.py` lines 150-200 | 50 | Parameterize and move to config |
| **Custom Field Parsing** | `sprint-tad-ts-report.py` lines 350-400 | 50 | Generalize into `CustomFieldParser` |
| **SDLC Defect Analysis** | `sprint-tad-ts-report.py` lines 700-800 | 100 | Port to `DefectCalculator` |

**Total Lines Reused: ~500 lines** - TAD/TS Compliance Feature (ELM Project)

**Improvements:**
- ❌ Remove hardcoded constants
- ✅ Add TypeScript types
- ✅ Add error handling
- ✅ Add retry logic
- ✅ Add unit tests
- ✅ Use async/await

#### From Passport Dashboard (passport-dashboard/)

| Component | File | Lines | Reuse Strategy |
|-----------|------|-------|----------------|
| **Safe-Product Filtering** | `sprint-tad-ts-report.py` lines 180-200 | 20 | Add to `PassportStrategy` |
| **Severity-Based Defects** | `sprint-tad-ts-report.py` lines 650-750 | 100 | Port to `DefectCalculator` |
| **Discovered By Analysis** | `sprint-tad-ts-report.py` lines 750-800 | 50 | Add to defect metrics |

**Total Lines Reused: ~170 lines**

**Improvements:**
- ❌ Remove ELM project hardcoding
- ✅ Make severity categories configurable
- ✅ Add discovered-by filtering options

#### From DnA Dashboard (dna-dashboard/) - Automation Metrics Feature (Updated Jan 22, 2026)

**Note:** DnA team just pushed major improvements - proper Python package with production-ready components!

| Component | File | Lines | Reuse Strategy |
|-----------|------|-------|----------------|
| **QTest Client (Enhanced)** | `automation_coverage/automation_coverage/qtest_client.py` | 1149 | Port improved API patterns |
| **HTTP Client with Retry** | `automation_coverage/automation_coverage/http.py` | 387 | Reuse retry/rate-limit logic |
| **Jira Client** | `automation_coverage/automation_coverage/jira_client.py` | 340 | Port board-based queries |
| **Analyzer** | `automation_coverage/automation_coverage/analyzer.py` | 493 | Reuse orchestration pattern |
| **Sprint-to-Cycle Mapping** | `team_summary_framework.py` lines 150-250 | 100 | Keep enhanced algorithm |
| **Automation Detection** | `qtest_client.py` lines 800-900 (updated) | 100 | Keep improved logic |
| **Quality Scoring** | `generate_quality_dashboard.py` lines 400-500 | 100 | Make formula configurable |
| **Configuration Models** | `automation_coverage/automation_coverage/config.py` | 188 | Adopt YAML pattern |
| **Domain Models** | `automation_coverage/automation_coverage/domain.py` | 150 | Use Pydantic models |

**Total Lines Reused: ~1100 lines** (increased from ~600 due to improvements)

**Key Improvements in Latest DnA Code:**
- ✅ **Production Package Structure:** Proper Python package with setup.py
- ✅ **HTTPClientWithRetry:** Exponential backoff, rate limiting, comprehensive logging
- ✅ **Enhanced QTest API:** Test Cycles → Test Runs → Execution Logs workflow (better than our original analysis)
- ✅ **Unit Tests:** Complete test suite with fixtures and mocked responses
- ✅ **CLI Interface:** Command-line tool with proper argument parsing
- ✅ **YAML Configuration:** `teams_and_boards.yaml` pattern for all settings
- ✅ **Pydantic Models:** Type-safe data models with validation
- ✅ **Better Documentation:** Complete README with API references

**What We'll Port:**
- ✅ HTTPClientWithRetry pattern → Use in Python FastAPI service
- ✅ Enhanced QTest API workflow → Better than our original Task 1.9 approach
- ✅ YAML configuration pattern → Adopt for Polaris config
- ✅ Pydantic models → Type safety in Python services
- ✅ Test fixtures approach → Use in our test suite

### 13.3 What We're NOT Reusing (Implementation Details, Not Features)

**Important:** We're keeping all their features and logic, just modernizing the implementation:

❌ **Hardcoded team lists** → ✅ Moving to DB (same teams, better config)
❌ **Manual batch scripts** → ✅ Background jobs (same logic, automated)
❌ **JSON file storage** → ✅ PostgreSQL (same data, scalable storage)
❌ **Synchronous API calls** → ✅ Async/await (same APIs, better performance)
❌ **1000+ line monolithic files** → ✅ Modular services (same logic, maintainable)
❌ **No error handling** → ✅ Comprehensive try/catch (same flow, more robust)
❌ **Static HTML generation** → ✅ React SPA (same visualizations, interactive)
❌ **No 4 Refactoring Checklist

**For each component we port (preserving original intent):**ist

For each component we port:

- [ ] **Extract hardcoded values** → Move to config
- [ ] **Add TypeScript/Pydantic types** → Type safety
- [ ] **Add error handling** → Try/catch with logging
- [ ] **Add retry logic** → Exponential backoff
- [ ] **Add rate limiting** → Respect API limits
- [ ] **Add logging** → Structured JSON logs
- [ ] **Add unit tests** → >80% coverage
- [ ] **Add integration tests** → Test with real APIs (mocked)
- [ ] **Add API documentation** → OpenAPI/JSDoc
- [ ] **Optimize performance** → Parallel calls, caching
- [ ] **Follow SOLID principles** → Single responsibility
- [ ] **Use dependency injection** → Testability

---

## 14. Risk Mitigation

### 14.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **API Rate Limits** (Jira/QTest) | High | High | Implement exponential backoff, caching, batch requests |
| **Data Migration Issues** | Medium | High | Extensive testing, rollback plan, staged migration |
| **Performance Degradation** | Medium | Medium | Load testing, caching, database optimization |
| **Bitbucket API Changes** | Low | Medium | Abstract into client, version detection |
| **QTest Sprint Mapping Fails** | Medium | Medium | Fallback to name-based matching, manual override |
| **Custom Field Changes** | Medium | High | Flexible field parser, configuration-driven, alerts |

### 14.2 Implementation Risks

| Risk | Mitigation |
|------|------------|
| **Scope Creep** | Strict adherence to spec, change control process |
| **Incomplete Testing** | Automated test coverage tracking, >80% enforcement |
| **Knowledge Transfer** | Comprehensive documentation, pair programming |
| **Timeline Slippage** | Weekly checkpoints, buffer in schedule, MVP approach |

### 14.3 Operational Risks

| Risk | Mitigation |
|------|------------|
| **Service Outages** | Health checks, auto-restart, monitoring, alerts |
| **Data Loss** | Daily backups, point-in-time recovery, replication |
| **Security Breach** | Penetration testing, regular audits, secret rotation |
| **Performance Issues** | Monitoring, alerting, auto-scaling |

---

## 15. Success Metrics

### 15.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Adoption** | >90% of QE/Dev leads using weekly | Google Analytics |
| **Page Load Time** | <3 seconds (95th percentile) | New Relic / Application Insights |
| **API Response Time** | <500ms (cached), <2s (uncached) | Prometheus metrics |
| **Data Accuracy** | >99% match with Jira/QTest | Automated validation job |
| **Test Coverage** | >80% across all services | SonarQube |
| **Uptime** | >99.5% | Monitoring dashboards |
| **Export Usage** | >50 exports per week | Database logs |

### 15.2 Business Outcomes

**Short-Term (3 months):**
- ✅ Single unified dashboard replacing 3 separate systems
- ✅ Real-time metrics (5-minute refresh vs manual)
- ✅ >80% reduction in manual effort for metrics gathering
- ✅ Comprehensive Dev + QA metrics in one place

**Medium-Term (6 months):**
- ✅ Historical trends enable data-driven decisions
- ✅ Release readiness score predicts release success
- ✅ Early detection of quality issues (TAD/TS gaps, low automation)
- ✅ Executive visibility into org-level quality

**Long-Term (1 year):**
- ✅ Improved release quality (fewer defects, higher automation)
- ✅ Faster releases (better readiness visibility)
- ✅ Data-driven process improvements
- ✅ Integration with CI/CD pipelines

---

## Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **TAD** | Technical Architecture Document - design doc required before implementation |
| **TS** | Test Strategy - test plan required before testing |
| **PI** | Program Increment - 3-month planning cycle in SAFe framework |
| **Sprint** | 2-week iteration |
| **Safe-SDLC Activity** | T360 custom field: Requirements, Design, Development, QE Testing, Production |
| **Severity** | Passport defect classification: Sev 1 (critical) to Sev 4 (minor) |
| **Automation %** | (Automated test cases / Total unique test cases) × 100 |
| **Release Readiness Score** | Composite metric (0-100) indicating release quality |

### B. References

- [GitHub Spec Kit Documentation](https://github.com/)
- [Jira REST API v2](https://developer.atlassian.com/cloud/jira/platform/rest/v2/)
- [Jira Agile API](https://developer.atlassian.com/cloud/jira/software/rest/)
- [QTest API Documentation](https://support.tricentis.com/community/manuals_detail.do?lang=en&url=qtest_apis/current/overview.htm)
- [Bitbucket Server REST API](https://developer.atlassian.com/server/bitbucket/rest/)
- Reference Dashboards:
  - `reference-source/COMPLETE-ANALYSIS.md`
  - `reference-source/INTEGRATION-ANALYSIS.md`
  - `reference-source/PASSPORT-VS-T360-COMPARISON.md`

### C. Open Questions

1. **Team Assignments:**
   - Should Athena (T360 team) move from DnA dashboard to T360 dashboard?
   - Should Guardians (Passport team) move from DnA dashboard to Passport dashboard?
   - **Recommendation:** Support teams in multiple products (flexible mapping)

2. **Custom Fields:**
   - What is the Story Points custom field ID?
   - **Action:** Query Jira to discover field ID

3. **Jira Board IDs:**
   - What are the board IDs for T360 teams (Vanguards, Nexus, etc.)?
   - What are the board IDs for Passport teams (Genesis, Pioneers, Spartacles)?
   - **Action:** Query Jira Agile API to list boards by project

4. **Collaboration Portal:**
   - What is the project key? (Found CPOD analysis in Passport repo)
   - Which teams work on CP?
   - Does CP have a separate dashboard?
   - **Action:** User to provide details

5. **SonarQube Integration:**
   - SonarQube instance URL?
   - Project keys for each product?
   - Authentication method?
   - **Action:** User to provide SonarQube details

---

### Phase 1.6: Dashboard Header Branding (NEW - February 18, 2026) ✅

**Goal:** Replace placeholder nav text with the official Wolters Kluwer logo, sized and positioned to match the dashboard title.

**Deliverables:**
- ✅ Official WK wheel logo (`03-wk-wheel-rev.svg`) copied to `frontend/public/wk-logo.svg`
- ✅ Logo removed from nav bar; repositioned into `dashboard-header` alongside `<h1>` title
- ✅ Logo and title rendered in a flex row (`dashboard-header-inner`), vertically centred
- ✅ Logo height set to `224px` — matches visual weight of `2.5em` bold title
- ✅ Nav bar retains right-aligned navigation links only (Dashboard, Unified Metrics, Tests Covered)
- ✅ `frontend/server.js` updated with `image/svg+xml` MIME type for correct SVG serving
- ✅ "🚀 Speckit Dashboard" placeholder text removed from nav

**Files Modified:**
- `frontend/index.html` — `.dashboard-header-inner` flex container, img tag, nav bar cleanup
- `frontend/server.js` — Added `.svg`, `.png`, `.ico` MIME types to content-type switch
- `frontend/public/wk-logo.svg` — Official WK brand asset (2492 bytes)

**Architecture Note:**
- Logo is a static asset served by `frontend/server.js` at `/public/wk-logo.svg`
- No backend changes required
- No new npm dependencies
- SVG sourced from official WK logo kit (`03-wk-wheel-rev.svg`, reversed/colour variant)

**Constraints Applied:**
- Non-breaking: metrics display, data loading, and navigation links unaffected
- No external URLs: logo served locally to avoid CDN/firewall issues

---

### Phase 1.7: Tests Covered Inline View & Product Filtering (NEW - February 20, 2026) ✅

**Goal:** Embed the Tests Covered view inline within the main dashboard (no page navigation), match the React component's styling, and filter teams by the currently selected product.

**Deliverables:**
- ✅ Tests Covered tile click opens inline view instead of navigating to a separate page
- ✅ Inline view fetches from `/api/metrics/tests-covered` (port 3000)
- ✅ Sprint selector allows switching between available sprints dynamically
- ✅ 5 summary cards: Total Test Cases, Automated, Automation Coverage (highlight + progress bar), With Scripts, Teams
- ✅ Team Breakdown table with Coverage % and mini progress bars
- ✅ CSS styling matches React `TestsCovered.tsx` component exactly (tc- prefixed classes)
- ✅ Product-based filtering: teams filtered by `state.selectedProduct` using `productTeamMap`
- ✅ Summary stats recalculated from filtered teams only
- ✅ Empty state shown for products with no test coverage data
- ✅ Header shows "Tests Covered — [Product Name]"
- ✅ Non-breaking: main dashboard, product selection, and metrics unaffected

**Implementation Approach:**

**Step 1 — Inline View (Frontend Only):**
1. `loadTestsCoveredView()` fetches `/api/metrics/tests-covered` from port 3000
2. Parses `result.data` (sprint-keyed object) and `result.available_sprints`
3. `renderTestsCoveredDashboard()` generates full HTML with summary cards + team table + footer
4. Sprint selector re-renders on change

**Step 2 — CSS Alignment:**
1. Copied all CSS from `TestsCovered.css` into `index.html` `<style>` block
2. Prefixed all class names with `tc-` to avoid conflicts with main dashboard `.metric-card` styles
3. Matched: `.tests-covered-container`, `.tests-covered-header`, `.tests-covered-summary`, `.summary-card`, `.highlight`, `.tc-teams-table`, `.tc-mini-progress`, `.tests-covered-footer`

**Step 3 — Product-Based Filtering:**
1. Added `productTeamMap` constant mapping product IDs to team names
2. `loadTestsCoveredView()` captures `state.selectedProduct` and passes to render
3. `renderTestsCoveredDashboard()` filters teams using case-insensitive match against `productTeamMap`
4. All summary stats (total, automated, coverage, withAttachments, teamsCount) recalculated from filtered teams
5. Empty state message shown when no matching teams found

**Product-Team Mapping:**
| Product | Teams |
|---------|-------|
| T360 | Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards |
| DnA | Minerva, Guardians, Athena |
| Passport | Team A, Team B, Team C |
| Collaboration Portal | (none mapped) |

**Backend Changes:** NONE — existing `/api/metrics/tests-covered` endpoint unchanged

**Files Modified:**
- `frontend/index.html` — CSS (tc- prefixed styles), `loadTestsCoveredView()`, `renderTestsCoveredDashboard()`, `productTeamMap` constant
- `frontend/src/components/TestsCovered.tsx` — Port change (3001 → 3000)

---

## Next Steps

1. **Review & Approve Plan** ✅ (User review)
2. **Create tasks.md** → Break plan into 100-120 detailed tasks
3. **Set up project structure** → Initialize repositories
4. **Begin Phase 1 implementation** → Foundation

---

**Plan Status:** Draft - Awaiting Review  
**Estimated Timeline:** 17 weeks  
**Team Size:** 2-3 developers  
**Risk Level:** Medium (well-defined, proven patterns)

---

**END OF PLAN**
