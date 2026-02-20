# Polaris — ELM Metrics Dashboard

> **Unified Quality Metrics Dashboard for Enterprise Legal Management Products**

Polaris is a centralized, real-time quality metrics dashboard that consolidates Dev and QA metrics across all ELM product areas — **T360**, **DnA**, **Passport**, and **Collaboration Portal** — into a single interactive platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Frontend](#frontend)
- [Backend API](#backend-api)
- [Data Sources](#data-sources)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Speckit Documentation](#speckit-documentation)
- [Sprint Coverage](#sprint-coverage)
- [Product & Team Mapping](#product--team-mapping)

---

## Overview

### What It Does

| Capability | Description |
|------------|-------------|
| **Hierarchical Navigation** | Product → Team → Sprint drill-down |
| **TAD/TS Compliance** | Track Technical Architecture Document & Test Strategy completion |
| **Tests Covered** | qTest-synced automation coverage with team breakdown |
| **Bug Metrics** | Live Jira integration for open/closed/reopened defect tracking |
| **Dual Product Support** | DnA + T360 Jira tokens for cross-product bug analysis |
| **Product Filtering** | Tests Covered view filters teams by selected product |

### Key Metrics Tracked

- TAD Document Completion Rate
- Test Strategy Completion Rate
- Unit & Functional Test Coverage
- Test Case Automation Rate (from qTest)
- Bug Metrics: Open, Closed, Reopened (from Jira)
- Sprint Velocity / Completion Rate
- Deployment Readiness Score

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Port 5173)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  index.html   │  │  App.tsx     │  │  Components  │  │
│  │  (Legacy JS)  │  │  (React SPA) │  │  (TSX/JSX)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                  │                             │
│         └────────┬─────────┘                             │
│                  ▼                                       │
│         Vite Dev Server / Static Server                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (fetch)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API Gateway (Port 3000)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  server.js    │  │ jiraBugSvc   │  │ qtest-integ  │  │
│  │  (REST API)   │  │ (Jira Live)  │  │ (qTest API)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  db.json      │  │ .env tokens  │  │ SQL Server   │  │
│  │  (Local Data) │  │ (DnA + T360) │  │ (Persistence)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │                    │
                      ▼                    ▼
              ┌──────────────┐    ┌──────────────┐
              │  Jira REST   │    │  qTest API   │
              │  (Live Bugs) │    │  (Test Cases) │
              └──────────────┘    └──────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** (npmjs.com whitelisted on corporate network)

### 1. Install Dependencies

```bash
# Backend
cd backend/api-gateway
npm install

# Frontend
cd ../../frontend
npm install
```

### 2. Configure Environment

Create `backend/api-gateway/.env`:

```env
# Jira API Tokens (dual-product support)
JIRA_API_TOKEN_DNA=<your-dna-jira-token>
JIRA_API_TOKEN_T360=<your-t360-jira-token>

# SQL Server (optional - for metric persistence)
DB_SERVER=localhost
DB_NAME=ELMDashboard
DB_USER=sa
DB_PASSWORD=<your-password>
DB_AUTH_TYPE=default
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### 3. Start the Application

```bash
# Terminal 1 — Backend API
cd backend/api-gateway
node server.js
# → API running on http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → Dashboard running on http://localhost:5173
```

### 4. Open Dashboard

| View | URL |
|------|-----|
| **Main Dashboard** (Legacy) | http://localhost:5173/index.html |
| **React SPA** | http://localhost:5173/index-react.html |
| **API Health** | http://localhost:3000/api/health |

---

## Frontend

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | — | Type safety |
| Vite | 5.0.8 | Dev server & bundler |

### Views & Components

| Component | File | Description |
|-----------|------|-------------|
| **Main Dashboard** | `index.html` | Vanilla JS dashboard with hierarchical navigation, metric tiles, inline Tests Covered view |
| **Unified Dashboard** | `UnifiedDashboard.jsx` | Consolidated metrics view |
| **DnA Bug Metrics** | `DnADashboard.tsx` | DnA + T360 live bug metrics from Jira |
| **TAD/TS Compliance** | `TADTSComplianceDashboard.tsx` | Document compliance tracking |
| **Tests Covered** | `TestsCovered.tsx` | qTest automation coverage by sprint/team |
| **Bug Metrics** | `BugMetrics.tsx` | Bug analysis component |
| **qTest Dashboard** | `QTestDashboard.jsx` | qTest integration dashboard |

### Dashboard Features

- **Product Selector** — Switch between T360, DnA, Passport, Collaboration Portal
- **Team Selector** — Filtered by selected product
- **Sprint Selector** — Dynamic sprint list per team
- **Metric Tiles** — TAD %, TS %, Open/Closed/Reopened Bugs, Deployment Readiness
- **Tests Covered Inline View** — Opens within dashboard, filtered by product, sprint selector
- **Wolters Kluwer Branding** — Official WK wheel logo in header

---

## Backend API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/products` | List all 4 products |
| `GET` | `/api/teams?product=<id>` | Teams filtered by product |
| `GET` | `/api/sprints?team=<id>` | Sprints for a team |
| `GET` | `/api/metrics?product=&team=&sprint=` | Sprint-level metrics |
| `POST` | `/api/metrics` | Save new metrics |
| `GET` | `/api/metrics/tests-covered` | All test coverage data (all sprints) |
| `GET` | `/api/metrics/tests-covered/:sprint` | Test coverage for specific sprint |
| `GET` | `/api/bugs/dna?team=&sprint=` | DnA team bug metrics (live Jira) |
| `GET` | `/api/bugs/dna/all?sprint=` | All DnA teams (parallel fetch) |
| `GET` | `/api/bugs/t360?team=&sprint=` | T360 team bug metrics (live Jira) |
| `GET` | `/api/bugs/t360/all?sprint=` | All T360 teams (parallel fetch) |
| `GET` | `/api/defects/by-module?sprint=` | Defects grouped by module |
| `GET` | `/api/metrics/persisted?product=&sprint=` | SQL Server persisted metrics |

### Key Backend Services

| Service | File | Description |
|---------|------|-------------|
| `JiraBugService` | `jiraBugService.js` | Live Jira bug fetching with dual tokens, reopened detection via changelog, caching, retries |
| `MetricsPersistence` | `metricsPersistence.js` | SQL Server persistence for historical metrics |
| `qTest Integration` | `qtest-integration.js` | qTest API client for test case sync |
| `TAD/TS Service` | `tadTsService.js` | TAD/TS compliance data service |

---

## Data Sources

| Source | Integration | Data |
|--------|-------------|------|
| **Jira** | REST API (`jira.wolterskluwer.io`) | Bug tickets, changelog, status transitions |
| **qTest** | REST API (`wk.qtestnet.com`, Project 114345) | Test cases, automation status, attachments |
| **db.json** | Local JSON file | Products, teams, sprints, tests_covered, baseline metrics |
| **SQL Server** | `mssql` driver | Persisted/aggregated metrics for historical analysis |

### Bug Status Classification (Universal)

- **Closed**: Only bugs with status exactly `Closed`
- **Open**: All other statuses (`To Verify`, `In Progress`, `To Do`, `Open`, `Reopened`, etc.)
- **Reopened**: Detected via Jira changelog — status transitions from closed states (`Closed`/`Done`/`Resolved`/`Fixed`) to open states

---

## Testing

### Unit Tests (Jest)

```bash
cd backend/api-gateway
npm test
```

- Framework: Jest 29.7 (ESM mode)
- Coverage: `jiraBugService.test.js` — 29 test cases, 72.94% coverage
- Custom error classes: `jiraErrors.js` (7 error types)

### E2E Tests (Playwright)

```bash
npx playwright test
```

- Browsers: Chromium, Firefox, WebKit
- Test directory: `tests/e2e/`
- Base URL: `http://localhost:5173`
- Auto-starts backend + frontend servers
- CI: 2 retries, 4 workers

---

## Project Structure

```
polaris-elm-dashboard-feature-t360/
├── spec.md                          # Feature specification (speckit output)
├── plan.md                          # Technical architecture plan (speckit output)
├── tasks.md                         # Implementation tasks log (speckit output)
├── playwright.config.ts             # E2E test configuration
├── package.json                     # Root package.json
│
├── backend/
│   └── api-gateway/
│       ├── server.js                # Main API server (port 3000)
│       ├── server-temp.js           # Secondary server (port 3001)
│       ├── jiraBugService.js        # Jira bug service (dual tokens)
│       ├── jiraBugService.test.js   # Jest unit tests
│       ├── jiraErrors.js            # Custom error classes
│       ├── jiraService.js           # Base Jira service
│       ├── qtest-integration.js     # qTest API integration
│       ├── qtest-service.js         # qTest service layer
│       ├── tadTsService.js          # TAD/TS compliance service
│       ├── metricsPersistence.js    # SQL Server persistence
│       ├── db.json                  # Local data store
│       ├── .env                     # Environment config (tokens)
│       └── package.json
│
├── frontend/
│   ├── index.html                   # Main dashboard (vanilla JS)
│   ├── index-react.html             # React SPA entry
│   ├── server.js                    # Static file server
│   ├── vite.config.ts               # Vite configuration
│   ├── package.json
│   ├── public/
│   │   └── wk-logo.svg             # Wolters Kluwer logo
│   └── src/
│       ├── App.tsx                  # React app with navigation
│       ├── main.tsx                 # React entry point
│       └── components/
│           ├── UnifiedDashboard.jsx + .css
│           ├── DnADashboard.tsx + .css
│           ├── TADTSComplianceDashboard.tsx + .css
│           ├── TestsCovered.tsx + .css
│           ├── BugMetrics.tsx + .css
│           └── QTestDashboard.jsx + .css
│
├── database/
│   ├── 01-create-schema.sql         # DB schema
│   ├── 02-insert-sprint-26-1-1-data.sql
│   ├── 03-create-utilities.sql
│   └── 04-backup-restore.sql
│
├── tests/
│   └── e2e/                         # Playwright E2E tests
│
├── .specify/                        # Speckit templates & memory
│   ├── templates/                   # Document templates
│   └── memory/                      # Constitution & context
│
├── .claude/commands/                # Speckit CLI commands
│   └── speckit.*.md                 # Workflow definitions
│
└── .github/
    ├── agents/                      # Speckit agent definitions
    │   └── speckit.*.agent.md
    └── prompts/                     # Speckit prompt definitions
        └── speckit.*.prompt.md
```

---

## Speckit Documentation

This project uses **GitHub Spec Kit** (Specification-Driven Development). The documentation framework has three layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Commands** | `.claude/commands/speckit.*.md` | Workflow definitions — tell the AI agent *how* to generate docs |
| **Templates** | `.specify/templates/*.md` | Blank formats/structures for each document type |
| **Output** | `spec.md`, `plan.md`, `tasks.md` | Living project documentation (generated & maintained) |

### Documents

| File | Content |
|------|---------|
| `spec.md` | Feature specification — business context, user stories, metric definitions, acceptance criteria |
| `plan.md` | Technical architecture plan — tech stack, system components, API design, implementation phases |
| `tasks.md` | Implementation task log — completed tasks with traceability back to spec/plan sections |

---

## Sprint Coverage

| Sprint | qTest Module ID | Tests Covered | Bug Metrics |
|--------|----------------|---------------|-------------|
| 26.1.1 | 68209713 | ✅ T360 teams | ✅ DnA + T360 |
| 26.1.2 | 68209714 | ✅ T360 teams | ✅ DnA + T360 |
| 26.1.3 | 68209719 | ✅ T360 teams | ✅ DnA + T360 |
| 26.1.4 | 68289134 | ✅ T360 teams | ✅ DnA + T360 |
| 26.1.5 | 68341069 | — (empty) | ✅ DnA + T360 |
| 26.1.6 | 68341070 | ✅ T360 teams | ✅ DnA + T360 |

---

## Product & Team Mapping

| Product | Teams | Bug Source | Tests Covered |
|---------|-------|-----------|---------------|
| **T360** | Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards | Jira (T360 token) | ✅ qTest data synced |
| **DnA** | Minerva, Guardians, Athena | Jira (DnA token) | — (pending sync) |
| **Passport** | Team A, Team B, Team C | — (pending) | — (pending sync) |
| **Collaboration Portal** | — | — (pending) | — (pending sync) |

---

## License

Internal — Wolters Kluwer ELM Organization

---

*Last Updated: February 20, 2026*
