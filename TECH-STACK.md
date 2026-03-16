# Polaris ELM Metrics Dashboard - Technology Stack

## Frontend

### Core Framework
- **React 19.2.0** - UI library for building component-based interfaces
- **TypeScript** - Static typing for JavaScript
- **Vite 7.2.5** - Fast build tool and dev server with hot module replacement (HMR)

### UI Components & Styling
- **Ant Design (antd)** - Enterprise-grade React component library
  - Layout, Cards, Buttons, Select, Progress, Statistic components
  - Professional design system (90k+ GitHub stars)
  - Used by Alibaba, Tencent, Baidu
- **CSS** - Custom styling for layout adjustments

### Data Visualization
- **Chart.js** - Flexible charting library
- **react-chartjs-2** - React wrapper for Chart.js
  - Bar charts (stacked, horizontal)
  - Pie charts
  - Responsive and interactive

### State Management & Data Fetching
- **Zustand** - Lightweight state management (for future API integration)
- **Axios** - HTTP client for API requests (for future backend integration)

### Current Data Source
- **Mock Data** (mockData.ts) - Realistic sprint metrics for Phase 1 MVP demo
  - T360 Vanguards team data
  - Sprint 26.1.1 metrics (TAD/TS, QTest, Defects)

---

## Backend (Planned - Phase 1 Implementation)

### Integration Service (Python)
- **Python 3.11+** - Primary language for data integration
- **FastAPI** - Modern Python web framework for building APIs
- **Pydantic** - Data validation using Python type annotations
- **Prisma Client (Python)** - Type-safe database ORM

### Reusable Components from DnA Dashboard
- **automation_coverage** package (~1,100 lines reusable)
  - `qtest_client.py` (1,149 lines) - Enhanced QTest API client
  - `jira_client.py` (340 lines) - Jira API client
  - `http.py` (387 lines) - HTTPClientWithRetry with exponential backoff
  - Production-ready error handling, retry logic, rate limiting

### API Gateway (Node.js)
- **Node.js** - JavaScript runtime
- **Express.js** (planned) - Web framework for routing and middleware
- **Prisma Client (Node.js)** - Database ORM for API queries

---

## Database

### Database System
- **SQLite** (Development) - Lightweight file-based database for rapid development
- **PostgreSQL** (Production) - Robust relational database for production deployment

### ORM & Migrations
- **Prisma** - Next-generation ORM with:
  - Type-safe database client
  - Declarative schema modeling
  - Auto-generated migrations
  - Visual database browser (Prisma Studio)

### Schema Models
11 core models covering:
- Products, Teams, Custom Field Mappings
- Sprints, Stories
- TAD/TS Compliance metrics
- Test Cases, Test Executions (QTest)
- Defects
- Metrics Snapshots (historical tracking)

---

## External Integrations

### Data Sources
- **Jira Cloud API** - Sprint planning, story tracking, custom fields
- **QTest API** - Test case management, automation metrics, test execution data
- **Bitbucket API** (Future) - Pull request analysis for TAD/TS verification

### Authentication
- **API Tokens** - Secure authentication for external services
- **Environment Variables** (.env) - Secure credential management

---

## Development Tools

### Package Managers
- **npm** - Node.js package manager for frontend and API Gateway
- **pip** - Python package manager for integration service

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting (planned)

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** (planned) - Code formatting
- **Black** (planned) - Python code formatting

---

## Testing (Planned - Phase 1 Week 3)

### Frontend Testing
- **Vitest** - Fast unit testing framework (Vite-native)
- **React Testing Library** - Component testing utilities

### Backend Testing
- **pytest** (Python) - Testing framework for integration service
- **Jest** (Node.js) - Testing framework for API Gateway

### E2E Testing
- **Playwright** (planned) - End-to-end browser testing

---

## Infrastructure & Deployment (Planned)

### Containerization
- **Docker** - Container platform
- **Docker Compose** - Multi-container orchestration
  - Frontend container
  - API Gateway container
  - Integration Service container
  - PostgreSQL container

### CI/CD (Future)
- **GitHub Actions** (planned) - Automated testing and deployment
- **Azure DevOps** (alternative) - Enterprise CI/CD pipeline

### Hosting (Future Options)
- **Azure App Service** - Managed application hosting
- **Vercel** - Frontend deployment (alternative)
- **Railway/Render** - Full-stack deployment options

---

## Configuration Management

### Environment Configuration
- **.env files** - Environment-specific variables
- **YAML configuration** - Reusing DnA dashboard's config approach

### Build Tools
- **Vite** - Frontend bundling and optimization
- **Rolldown** - Vite's bundler (Rust-based, fast)

---

## Key Architecture Decisions

### Monorepo Structure
```
polaris-elm-metrics-dashboard/
├── frontend/          # React + Vite
├── backend/
│   ├── integration-service/  # Python + FastAPI
│   ├── api-gateway/          # Node.js + Express
│   └── shared/               # Shared types/utilities
├── database/          # Prisma schema + migrations
└── docker/           # Docker configuration
```

### Why These Technologies?

**React + Vite:** Fast development, hot reload, modern tooling
**Ant Design:** Enterprise-proven, comprehensive components, professional design
**Chart.js:** Flexible, widely-used, extensive chart types
**FastAPI (Python):** High performance, async support, auto-generated docs
**Prisma:** Type safety, excellent DX, migration management
**Reuse DnA Code:** Proven QTest client, HTTPClientWithRetry pattern (~1,100 lines)

---

## Current Status (Phase 1 - Day 1)

### ✅ Implemented
- Frontend structure with React + Vite
- Ant Design UI components
- Chart.js visualizations
- Mock data for demo
- Full-screen responsive layout

### 🚧 In Progress
- Backend API development (blocked by Prisma certificate issues)
- Database setup (deferred to after UI demo)

### ⏳ Planned
- API integration
- Real-time data from Jira/QTest
- PDF export functionality
- Historical metrics tracking
- Multi-team comparison views

---

**Last Updated:** January 22, 2026  
**Project Phase:** Phase 1 - Week 1 - MVP Development
