# Polaris - ELM Metrics Dashboard

> **Unified Quality Metrics Dashboard for Enterprise Legal Management Products**

**Project Status:** ✅ Phase 1 MVP - Week 1 COMPLETE (Hierarchical Navigation)  
**Methodology:** Specification-Driven Development (GitHub Spec Kit)  
**Created:** January 21, 2026  
**Last Updated:** January 22, 2026

Polaris brings together TAD/TS compliance tracking, test automation metrics, and quality analytics across T360, Passport, DnA, and Collaboration Portal teams in a single, modern dashboard.

---

## 🎯 Project Vision

Three separate quality dashboards existed (T360, Passport, DnA) with complementary features that were planned to merge. **Polaris completes that vision** by unifying:
- **TAD/TS Compliance Tracking** (from T360/Passport teams)
- **QTest Automation Metrics** (from DnA team)
- **Defect Analysis & Quality Scoring**
- **Real-time Updates & Historical Trends**

---

## 🚀 Current Implementation Status

### ✅ What We've Built (January 22, 2026)

**Frontend Dashboard**
- React 19.2.0 + TypeScript + Vite
- Ant Design UI components (enterprise-grade)
- Chart.js visualizations
- **Hierarchical navigation (Product → Team → Sprint)**
- **Three aggregation levels**: Product metrics, Team metrics, Sprint metrics
- Live API integration with loading states and error handling
- Full-screen responsive layout

**Backend API Gateway**
- Express.js REST API
- LowDB (JSON file storage) - pragmatic choice due to corporate proxy constraints
- Complete product/team/sprint data model
- Aggregated metrics endpoints
- CORS enabled for local development

**Data Model**
- **4 Products**: Passport, Tymetrix 360, Data & Analytics, Collaboration Portal
- **11 Teams** correctly mapped:
  - T360: Chubb, Chargers, Matrix, Mavericks, Vanguards, Nexus (6 teams)
  - Passport: Spartacles, Genesis (2 teams)
  - DnA: Guardians, Athena (2 teams)
  - Collaboration Portal: Pioneers (1 team)
- **Sprint tracking** (bi-weekly cadence)
- **TAD/TS compliance metrics**
- **QTest automation metrics**
- **Defect tracking by SDLC phase**

**API Endpoints**
```
GET  /api/health                      → Health check
GET  /api/products                    → All 4 products
GET  /api/teams?productId=<id>        → Filtered teams by product
GET  /api/sprints                     → All sprints
GET  /api/metrics/:teamId/:sprintId   → Sprint-level metrics
GET  /api/metrics/product/:productId  → Aggregated product metrics
GET  /api/metrics/team/:teamId        → Aggregated team metrics
POST /api/metrics                     → Create new metrics
```

**Git Repository**
- Repository: https://bitbucket.wolterskluwer.io/projects/DEP/repos/polaris-elm-dashboard/
- Initial commit pushed successfully
- Reference code excluded from git

---

## 🏃 Quick Start

### Prerequisites
- Node.js (verified working on corporate network)
- npm (npmjs.com whitelisted)

### Development Setup

**1. Start Backend API Server**
```powershell
cd backend/api-gateway
node server.js
```
Server runs on: http://localhost:3000

**2. Start Frontend Dev Server** (in new terminal)
```powershell
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

**3. Open Dashboard**
Navigate to http://localhost:5173 in your browser.

---

## 📊 Using the Dashboard

### Hierarchical Navigation

**View Product-Level Metrics:**
1. Select a product from the dropdown (Passport, T360, DnA, or Collaboration Portal)
2. Leave Team and Sprint empty
3. Dashboard shows aggregated metrics across all teams in that product

**View Team-Level Metrics:**
1. Select a product
2. Select a team from the filtered list
3. Leave Sprint empty
4. Dashboard shows aggregated metrics across all sprints for that team

**View Sprint-Level Metrics:**
1. Select a product
2. Select a team
3. Select a sprint
4. Dashboard shows detailed metrics for that specific team+sprint combination

**Current Test Data:**
- T360 Vanguards + Sprint 26.1.1 (full dataset)
- Other teams/sprints: Add via POST /api/metrics

---

## 🛠️ Project Structure

```
polaris-elm-metrics-dashboard/
├── .specify/
│   └── memory/
│       └── constitution.md          # 📜 Foundational principles
├── requirements-questionnaire.md    # ✅ Team/product mapping source
├── spec.md                          # ✅ Complete specification with data model
├── plan.md                          # Implementation plan
├── tasks.md                         # Task tracking
├── backend/
│   └── api-gateway/
│       ├── server.js                # ✅ Express API with aggregation
│       ├── db.json                  # ✅ Auto-generated data (11 teams)
│       └── package.json             # ES modules configured
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # ✅ Hierarchical navigation
│   │   ├── services/api.ts          # ✅ Product/team/sprint methods
│   │   ├── App.css                  # Full-screen layout
│   │   └── index.css                # Clean styles
│   └── package.json                 # React 19.2.0 + dependencies
└── reference-source/                # (gitignored)
```

---

## 🔧 Technical Decisions & Trade-offs

### Decision 1: LowDB over PostgreSQL/Prisma
**Reason:** Corporate infrastructure blocked all external database downloads (Docker Hub 403, Prisma binaries blocked, PostgreSQL installer 403)  
**Trade-off:** Simple JSON storage vs. relational integrity and performance  
**Benefit:** Development unblocked, working prototype in 1 day  
**Future:** Can migrate to real database once infrastructure allows  

### Decision 2: Frontend-First Development
**Reason:** Built UI with mock data while resolving backend issues  
**Benefit:** Validated UX concepts early, smooth transition to live API  
**Result:** User feedback loop established before backend complexity  

### Decision 3: Hierarchical Navigation Implementation
**Reason:** User requirement for multi-level metrics visibility  
**Approach:** Cascading selectors with aggregated metrics at each level  
**Alignment:** Matches SAFE organization structure (Product → Team → Sprint)  
**Spec-Driven:** Data model added to spec.md BEFORE code implementation  

---

## 📚 Lessons Learned

### Specification-Driven Development
- ✅ **Always update spec.md before code changes**
- ✅ **Team/product mapping must be in spec (Appendix C) before implementation**
- ✅ **Data models belong in spec, not just code comments**
- ⚠️  Initially implemented hierarchical navigation without spec update - corrected immediately

### Infrastructure Challenges
- Corporate proxy blocks Docker Hub, Prisma, external DB installers
- npm packages work reliably (npmjs.com whitelisted)
- File-based storage (LowDB) was pragmatic choice for resilience
- Two-server development workflow (frontend:5173, API:3000) established

### Development Workflow
- Mock data validates UX before backend complexity
- Frequent server restarts needed when changing data models (delete db.json to regenerate)
- Terminal IDs must be tracked for background processes
- Port conflicts resolved by killing all node processes cleanly

### File Corruption Risks
- Multiple sequential `replace_string_in_file` operations can break files
- Use `create_file` for major rewrites instead
- Always validate JSON after programmatic edits

---

## 🔗 Integration Points

- **Jira MCP Server**: Quality metrics, TAD/TS validation (Phase 1 Week 2)
- **QTest MCP Proxy**: Test coverage data (Phase 1 Week 2)
- **SAFE Framework**: PI/Sprint/Release tracking
- **Bitbucket**: Code repository and PR metrics (future)

---

## ⏳ Known Limitations

**Data:**
- Only 1 test dataset (T360 Vanguards Sprint 26.1.1)
- Need more teams/sprints for comprehensive demo
- Manually add via POST /api/metrics or edit db.json directly

**Features:**
- No real Jira/QTest integration yet (Phase 1 Week 2: Python service)
- No authentication/authorization
- No production deployment plan
- No automated testing (coming in Phase 1 Week 2)

**Infrastructure:**
- Local development only
- Docker deployment blocked by corporate proxy
- Database migration pending infrastructure resolution

---

## 📈 Next Steps

**Phase 1 - Week 2:**
1. Python integration service for live Jira/QTest data
2. Add more test data for all 11 teams
3. Implement automated testing
4. Historical trend charts

**Phase 1 - Week 3:**
5. PDF/Excel export functionality
6. Role-based access control
7. Production deployment planning

**Phase 2:**
8. Real-time updates via WebSockets
9. Custom dashboard configurations
10. Predictive analytics

---

## 📚 Methodology: GitHub Spec Kit

This project follows the **4-phase Specification-Driven Development** process:

1. **Specify**: Define what we're building (intent, not implementation)
2. **Plan**: Technical architecture and implementation strategy
3. **Tasks**: Break down into actionable development tasks
4. **Implement**: Execute with full traceability

---

## 👥 Team

- **Product Owner**: Sandeep Meesarapu (QE Leadership)
- **Organization**: ELM
- **Framework**: SAFE (Scaled Agile Framework)
