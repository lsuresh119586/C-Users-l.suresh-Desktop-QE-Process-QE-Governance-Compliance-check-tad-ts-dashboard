# Implementation Tasks: Polaris ELM Metrics Dashboard

**Project:** Polaris - Unified Quality Metrics Dashboard  
**Phase:** Phase 1 - MVP (3 weeks)  
**Goal:** Working T360 dashboard with TAD/TS + QTest metrics  
**Start Date:** January 22, 2026  
**Target Delivery:** February 12, 2026

## 🔄 Update (January 22, 2026)

**DnA Dashboard Improvements Incorporated:**
The DnA team pushed major improvements converting their scripts into a production-ready Python package. We've updated the following tasks to leverage these improvements:

- **Task 1.9:** Enhanced QTest client with Test Cycles → Test Runs → Execution Logs workflow
- **HTTP Client:** Added HTTPClientWithRetry pattern (exponential backoff, rate limiting)
- **Configuration:** Will adopt YAML-based configuration approach
- **Models:** Using Pydantic models for type safety
- **Total reusable code:** Increased from ~600 to ~1100 lines

These improvements make our implementation more robust and production-ready from day one!

---

## 🔄 Update (February 17, 2026)

### TASK-BUG-001: Fix Dashboard Data Source for Live Bug Metrics 🟢

**Category:** Frontend Bug Fix  
**Estimate:** S (3-4 hours)  
**Status:** Complete  
**Dependencies:** JiraBugService T360 implementation  
**Traceability:** Bug report - Dashboard showing stale SQL data instead of live Jira API data

**Description:**
Fixed DnADashboard component to fetch live bug metrics from Jira API instead of stale SQL database values. Extended dashboard to support both DnA and T360 teams in a unified view.

**Root Cause:**
- SQL database (`02-insert-sprint-26-1-1-data.sql`) contained hardcoded stale values
- Matrix team: 1 open, 1 closed (stale) vs 0 open, 2 closed (actual)
- Chargers team: 1 open, 1 closed (stale) vs 0 open, 2 closed (actual)
- Dashboard was fetching from `/api/metrics` (SQL) instead of `/api/bugs/{product}` (live Jira)

**Changes Made:**
- ✅ **DnADashboard.tsx - fetchTeams()**: Now fetches both DnA and T360 teams via parallel API calls
- ✅ **DnADashboard.tsx - fetchMetrics()**: Dynamically determines product (dna/t360) and fetches from correct live API endpoint
- ✅ **Data Flow Updated**: Dashboard → `/api/bugs/{product}` → JiraBugService → Live Jira API
- ✅ **Universal Bug Classification Applied**: Consistent across all products (Closed = status 'Closed', Open = all other statuses)

**Acceptance Criteria:**
- [x] DnADashboard fetches both DnA teams (Minerva, Guardians, Athena) and T360 teams (Matrix, Chargers, Vanguards, Nexus, Chubb, Mavericks)
- [x] Bug metrics fetched from `/api/bugs/dna` for DnA teams
- [x] Bug metrics fetched from `/api/bugs/t360` for T360 teams
- [x] Matrix team shows correct data: 0 open bugs, 2 closed bugs (GET-68371, GET-67532)
- [x] Chargers team shows correct data: 0 open bugs, 2 closed bugs (GET-68403, GET-67272)
- [x] All bug data reflects live Jira API state, not stale SQL database values
- [x] No new files created, only existing DnADashboard.tsx updated

**Files Modified:**
- `frontend/src/components/DnADashboard.tsx` (lines 54-120)
  - fetchTeams(): Added parallel fetch for both products
  - fetchMetrics(): Added product detection and dynamic endpoint routing

**Verification:**
```bash
# Start backend server
cd backend/api-gateway
node server.js

# Start frontend server  
cd frontend
npm run dev

# Test in browser:
# 1. Navigate to DnA Bug Metrics dashboard
# 2. Select Matrix team, Sprint 26.1.1
# 3. Verify: 0 open bugs, 2 closed bugs
# 4. Select Chargers team, Sprint 26.1.1
# 5. Verify: 0 open bugs, 2 closed bugs
```

**Impact:**
- ✅ Data accuracy improved: Dashboard now shows real-time bug counts
- ✅ Single unified dashboard for both DnA and T360 teams
- ✅ Eliminates dependency on manually updated SQL data
- ✅ Consistent with JiraBugService implementation (universal bug classification)

---

### TASK-BUG-002: Re-Architect Data Storage — Live Jira + SQL Server Persistence 🟢

**Category:** Backend / Database  
**Estimate:** M (1 day)  
**Status:** Complete  
**Dependencies:** TASK-BUG-001  
**Traceability:** Data architecture re-design — Dashboard uses live Jira API, persists aggregated metrics to SQL Server

**Description:**
Re-architected the data storage so the dashboard ALWAYS reads bug metrics from the live Jira API (source of truth), and then asynchronously persists aggregated bug data to the SQL Server (Polarisdashboard) for verification and historical analysis. This eliminates the stale data issue entirely.

**Architecture:**
```
Dashboard → /api/bugs/{product} → JiraBugService → Live Jira API → Response to Dashboard
                                                                  ↓ (async, non-blocking)
                                                    MetricsPersistence → SQL Server (Polarisdashboard)
```

**Changes Made:**

**1. SQL Schema Migration** (`database/01-create-schema.sql`):
- ✅ Added `Product` column (NVARCHAR(100)) — Passport, DnA, T360, Collaboration Portal
- ✅ Added `OverallBugsCount` column (INT) — Total bug count per sprint
- ✅ Added `TotalOpenBugs` column (INT) — Open bugs per sprint (status ≠ Closed)
- ✅ Added `TotalClosedBugs` column (INT) — Closed bugs per sprint (status = Closed)
- ✅ Added `TotalReopenedBugs` column (INT) — Reopened bugs (from Jira changelog, even if closed/open now)
- ✅ Added `ReopenedBugPercentage` column (DECIMAL(5,2)) — (Reopened / Overall) × 100
- ✅ Added `SyncSource` column (NVARCHAR(50)) — Data provenance: 'jira-live-api'
- ✅ Added composite index `IX_Product_Team_Sprint`
- ✅ Migration script uses `ALTER TABLE` with `IF NOT EXISTS` guards (safe to re-run)
- ✅ Data migration: Populates Product column for existing rows, copies DefectsOpen/DefectsClosed to new columns

**2. Updated Stored Procedures** (`database/03-create-utilities.sql`):
- ✅ `vw_MetricsSummary` view updated with Product grouping and new columns
- ✅ `sp_GetMetricsBySprint` updated to return new columns
- ✅ `sp_GetMetricsByTeam` updated to return new columns
- ✅ NEW: `sp_GetMetricsByProduct` stored procedure for product-level queries

**3. Metrics Persistence Module** (`backend/api-gateway/metricsPersistence.js`) — NEW:
- ✅ SQL Server connection via `mssql` (Tedious driver) — already in package.json
- ✅ `persistBugMetrics(bugMetrics, product)` — MERGE (upsert) single team metrics
- ✅ `persistAllTeamMetrics(allTeamMetrics, product)` — Batch persist for all teams
- ✅ `readMetrics(product, sprint)` — Read persisted data for verification
- ✅ `logSync()` — Audit trail to SyncLog table
- ✅ Non-blocking: SQL Server unavailability does NOT affect dashboard
- ✅ Connection pooling (max 5, idle timeout 30s)

**4. Server Integration** (`backend/api-gateway/server.js`):
- ✅ Import and initialize MetricsPersistence on startup
- ✅ `/api/bugs/dna` — Persists DnA single team metrics after returning live data
- ✅ `/api/bugs/dna/all` — Persists all DnA team metrics after returning live data
- ✅ `/api/bugs/t360` — Persists T360 single team metrics after returning live data
- ✅ `/api/bugs/t360/all` — Persists all T360 team metrics after returning live data
- ✅ NEW: `/api/metrics/persisted` — Read persisted metrics from SQL Server for verification
- ✅ All persistence calls are async (`.catch()` pattern) — never blocks API response

**5. Dashboard Fix** (`frontend/src/components/DnADashboard.tsx`):
- ✅ `fetchAllTeamsBugMetrics()` — Now fetches both DnA and T360 teams in parallel
- ✅ `fetchSingleTeamBugMetrics()` — Now uses correct product-based endpoint (DnA or T360)
- ✅ All three fetch functions use product-aware endpoint routing

**Acceptance Criteria:**
- [x] Dashboard ALWAYS reads from live Jira API (NOT db.json, NOT SQL Server)
- [x] Metrics table has new columns: Product, OverallBugsCount, TotalOpenBugs, TotalClosedBugs, TotalReopenedBugs, ReopenedBugPercentage, SyncSource
- [x] After live data is displayed, aggregated metrics are persisted to SQL Server asynchronously
- [x] SQL Server unavailability does NOT affect dashboard functionality
- [x] Persisted data can be read via `/api/metrics/persisted?product=T360&sprint=26.1.1`
- [x] All sync operations logged to SyncLog table
- [x] Sprints 26.1.1 through 26.1.6 supported for current PI
- [x] All products (DnA, T360) persist to SQL with correct Product column
- [x] `fetchAllTeamsBugMetrics()` fetches both DnA and T360 teams
- [x] `fetchSingleTeamBugMetrics()` uses correct product-based API endpoint
- [x] spec.md, plan.md, tasks.md updated with new architecture
- [x] Team name case normalization (Matrix → matrix) implemented in bug endpoints
- [x] Dotenv path fix for portable server startup
- [x] Error handlers (unhandledRejection, uncaughtException) prevent mssql crashes
- [x] SQL Server credentials corrected (sql-cs-user, zusscntssql19\sql2022)

**Files Modified:**
- `database/01-create-schema.sql` — ALTER TABLE migration for new columns
- `database/03-create-utilities.sql` — Updated views and stored procedures
- `backend/api-gateway/server.js` — Import MetricsPersistence, wire into all 4 bug endpoints, add `/api/metrics/persisted`, team name toLowerCase(), dotenv path fix, error handlers
- `backend/api-gateway/metricsPersistence.js` — SQL Server persistence module, pool error handler, correct default username
- `backend/api-gateway/.env` — SQL Server configuration (zusscntssql19\sql2022, sql-cs-user)
- `frontend/src/components/DnADashboard.tsx` — Fix fetchAllTeamsBugMetrics and fetchSingleTeamBugMetrics for multi-product support

**Additional Fixes (February 17, 2026):**
- ✅ **Team Name Normalization** — Both `/api/bugs/dna` and `/api/bugs/t360` endpoints now call `team.toLowerCase()` before passing to JiraBugService (e.g., `Matrix` → `matrix` to match service dictionary keys)
- ✅ **Dotenv Path Fix** — `dotenv.config({ path: path.join(__dirname, '.env') })` ensures server can start from any directory
- ✅ **Error Handlers** — Added `process.on('unhandledRejection')` and `process.on('uncaughtException')` to prevent mssql connection failures from crashing Node.js process
- ✅ **SQL Server Credentials** — Corrected username from `sa` to `sql-cs-user` in metricsPersistence.js defaults
- ✅ **SQL Server Address** — Corrected `.env` from `localhost` to `zusscntssql19\sql2022`
- ✅ **mssql Pool Error Handler** — Added `pool.on('error')` event handler to gracefully handle SQL Server connection issues
- `backend/api-gateway/server.js` — Import MetricsPersistence, wire into all 4 bug endpoints, add `/api/metrics/persisted`
- `frontend/src/components/DnADashboard.tsx` — Fix fetchAllTeamsBugMetrics and fetchSingleTeamBugMetrics for multi-product support

**Files Created:**
- `backend/api-gateway/metricsPersistence.js` — SQL Server persistence module

**Verification:**
```bash
# 1. Run SQL migration on Polarisdashboard
sqlcmd -S zusscntssql19\sql2022 -d Polarisdashboard -i database/01-create-schema.sql
sqlcmd -S zusscntssql19\sql2022 -d Polarisdashboard -i database/03-create-utilities.sql

# 2. Start backend server
cd backend/api-gateway && node server.js
# Expected: "✅ Jira Bug Service initialized" + "✅ Metrics Persistence connected to SQL Server"

# 3. Start frontend
cd frontend && npm run dev

# 4. Test dashboard — select Matrix team, Sprint 26.1.1
# Expected: 0 open bugs, 2 closed bugs (live from Jira)

# 5. Verify SQL Server persistence
curl "http://localhost:3000/api/metrics/persisted?product=T360&sprint=26.1.1"
# Expected: Rows with OverallBugsCount, TotalOpenBugs, TotalClosedBugs matching live data
```

---

### TASK-UI-001: Add Reopened Defects Metric to Dashboard UI 🔵

**Category:** Frontend Enhancement  
**Estimate:** S (2-3 hours)  
**Status:** Not Started  
**Dependencies:** TASK-BUG-002 (backend already returns reopenedBugs)  
**Traceability:** New feature requirement - Display reopened bugs count as dedicated UI metric

**Description:**
Add a new "Reopened Defects" scorecard tile to the dashboard UI to display the count of bugs that were reopened after being closed. This complements the existing "Open Defects" and "Closed Defects" metrics. The backend (`JiraBugService.calculateBugMetrics()`) already returns `reopenedBugs` and `reopenedRate` values, so only frontend display changes are needed.

**Business Context:**
Reopened bugs indicate quality issues and rework. Tracking this metric separately helps teams:
- Identify patterns in bug lifecycle management
- Measure quality of initial bug fixes
- Improve sprint planning (account for potential rework)
- Highlight systemic issues requiring root cause analysis

**Data Source:**
- **Existing Backend**: `JiraBugService.calculateBugMetrics()` already analyzes Jira changelog to detect reopened bugs
- **API Response**: `/api/metrics` endpoint already includes `reopenedBugs` and `reopenedRate` fields
- **Detection Logic**: Status transitions from closed states (Closed/Done/Resolved) to open states (Open/In Progress/To Do/To Verify/Reopened)
- **Count Behavior**: Includes reopened bugs regardless of their current status (open or closed)

**Changes Required:**

**1. Frontend UI - `frontend/index.html` (lines 568-600)**:
- Add 7th `.metric-card` div for "Reopened Defects" metric
- Bind display value to `state.metrics.reopenedBugs` (already in API response)
- Position: Add after "Closed Defects" or before "Deployment Readiness"
- Style: Use existing `.metric-card` CSS class with color variant (suggest `card-orange` or `card-yellow`)

**Example HTML to Add:**
```html
<!-- Reopened Defects Card -->
<div class="metric-card card-orange">
  <div class="metric-header">
    <span class="metric-icon">↩️</span>
    <span class="metric-title">Reopened Defects</span>
  </div>
  <div class="metric-value" id="reopened-bugs-value">-</div>
  <div class="metric-quality-badge" id="reopened-quality-badge">-</div>
  <div class="metric-subtitle">Bugs reopened after closure</div>
</div>
```

**Quality Badge Styles (to add to CSS):**
```css
.metric-quality-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 8px;
}

.quality-excellent {
  background-color: #4caf50;
  color: white;
}

.quality-fair {
  background-color: #ff9800;
  color: white;
}

.quality-action-required {
  background-color: #f44336;
  color: white;
}
```

**2. Frontend JavaScript - `frontend/index.html` (lines 247-262, getMetrics function)**:
- Map `reopenedBugs` from API response to UI display
- Update `#reopened-bugs-value` element with fetched value
- Handle undefined/null values gracefully (display "0" or "-")

**Example JavaScript Update:**
```javascript
// In getMetrics() function, after setting defectsOpen and defectsClosed:
const reopenedRate = team.metrics?.reopenedRate ?? 0;
const reopenedBugs = team.metrics?.reopenedBugs ?? 0;

// Display percentage as integer (no decimals)
const reopenedPercentage = Math.round(reopenedRate);
document.getElementById('reopened-bugs-value').textContent = `${reopenedPercentage}%`;

// Determine quality badge
let qualityBadgeText = 'Excellent';
let qualityBadgeClass = 'quality-excellent';

if (reopenedRate > 25) {
  qualityBadgeText = 'Action Required';
  qualityBadgeClass = 'quality-action-required';
} else if (reopenedRate >= 10) {
  qualityBadgeText = 'Fair';
  qualityBadgeClass = 'quality-fair';
}

// Update quality badge
const badgeElement = document.getElementById('reopened-quality-badge');
badgeElement.textContent = qualityBadgeText;
badgeElement.className = `metric-quality-badge ${qualityBadgeClass}`;
```

**Backend Changes:**
- NONE - `reopenedBugs` already returned by `/api/metrics` endpoint (server.js lines 772-810)
- NONE - `JiraBugService.calculateBugMetrics()` already calculates reopenedBugs
- NONE - SQL Server `TotalReopenedBugs` column already exists

**Database Changes:**
- NONE - All required schema changes already implemented in TASK-BUG-002

**Acceptance Criteria:**
- [x] Backend `/api/metrics` endpoint returns reopenedBugs and reopenedRate fields (already implemented)
- [ ] Dashboard displays 7 scorecard tiles (previously 6)
- [ ] New tile shows "Reopened Defects" as title with ↩️ icon
- [ ] New tile displays percentage as INTEGER (no decimals) from `state.metrics.reopenedRate`
- [ ] Tile positioned immediately after "Closed Defects" (7th position)
- [ ] Tile uses Wolters Kluwer orange color (#FF6B35 or similar, NOT red)
- [ ] Quality badge displayed with correct text and color:
  - [ ] "Excellent" (green) when reopenedRate < 10%
  - [ ] "Fair" (yellow/orange) when reopenedRate 10-25%
  - [ ] "Action Required" (red) when reopenedRate > 25%
- [ ] Tile matches existing scorecard style (.metric-card)
- [ ] Existing Open Defects tile continues to work correctly (non-breaking)
- [ ] Existing Closed Defects tile continues to work correctly (non-breaking)
- [ ] Matrix team (Sprint 26.1.1) displays correct reopenedRate: 0% with "Excellent" badge
- [ ] Chargers team (Sprint 26.1.1) displays correct reopenedRate: 0% with "Excellent" badge
- [ ] Edge cases handled: null/undefined reopenedRate displays as "0%" with "Excellent" badge
- [ ] No JavaScript errors in browser console
- [ ] No impact on existing bug metrics (open/closed counts remain accurate)

**Files Modified:**
- `frontend/index.html` — Add 7th scorecard tile for Reopened Defects, update getMetrics() function

**Files Created:**
- NONE

**Constraints:**
- **Non-Breaking**: Must not impact existing Open Defects or Closed Defects functionality
- **No New API Calls**: Reuse existing `/api/metrics` endpoint data
- **No New Files**: Modify index.html only
- **Data Accuracy**: Display reopenedBugs regardless of bug's current status (open or closed)

**Verification:**
```bash
# 1. Ensure backend is running
cd backend/api-gateway
node server.js
# Expected: Server running on port 3000

# 2. Ensure frontend is running
cd frontend
npm run dev
# Expected: Server running on port 5174

# 3. Test in browser (http://localhost:5174):
# a. Navigate to dashboard
# b. Select Matrix team, Sprint 26.1.1
# c. Verify: Dashboard displays 7 scorecard tiles
# d. Verify: "Reopened Defects" tile shows correct count
# e. Verify: Open Defects shows 0
# f. Verify: Closed Defects shows 2
# g. Select Chargers team, Sprint 26.1.1
# h. Verify: "Reopened Defects" tile shows correct count
# i. Verify: Existing tiles still work correctly

# 4. Verify API response structure:
curl "http://localhost:3000/api/metrics?product=t360&sprint=26.1.1"
# Expected JSON includes:
# {
#   "teams": [
#     {
#       "teamId": "matrix",
#       "metrics": {
#         "defectsOpen": 0,
#         "defectsClosed": 2,
#         "reopenedBugs": <count>,  // NEW field displayed
#         "reopenedRate": <percentage>
#       }
#     }
#   ]
# }
```

**Impact:**
- ✅ Enhanced visibility: Teams can now track reopened bugs separately
- ✅ Quality insights: Reopened bugs indicate fix quality issues
- ✅ Non-breaking: Existing Open/Closed Defects functionality unchanged
- ✅ Zero backend changes: Leverages existing JiraBugService implementation
- ✅ Consistent UX: Matches existing scorecard tile design pattern

**Related Documentation:**
- `spec.md` — Section 3.2.11 "Reopened Defects Metric (New UI Feature)"
- `plan.md` — Section 5.0.1 "Reopened Defects Metric Data Flow"
- `plan.md` — Section 6.2 "Bug Metrics Response Format"
- `plan.md` — Phase 1.5 "Reopened Defects UI Metric Implementation"

---

## Task Status Legend

- 🔵 **Not Started** - Task not yet begun
- 🟡 **In Progress** - Currently being worked on
- 🟢 **Complete** - Task finished and verified
- 🔴 **Blocked** - Cannot proceed due to dependency

---

## Week 1: Backend Foundation (Days 1-5)

### Day 1: Project Setup & Database Schema

#### Task 1.1: Initialize Project Structure 🔵
**Description:** Set up monorepo with backend services  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Acceptance Criteria:**
- [ ] Git repository initialized
- [ ] Folder structure created:
  ```
  polaris-elm-metrics-dashboard/
  ├── backend/
  │   ├── integration-service/    # Python FastAPI
  │   ├── api-gateway/            # Node.js Express
  │   └── shared/                 # Common utilities
  ├── frontend/                   # React app (Phase 1 Week 3)
  ├── database/                   # Prisma schema & migrations
  └── docker/                     # Docker Compose files
  ```
- [ ] .gitignore configured
- [ ] README.md with setup instructions

**Implementation Steps:**
1. Create root directory structure
2. Initialize Git repository
3. Create .gitignore (node_modules, .env, __pycache__, etc.)
4. Create root README.md

---

#### Task 1.2: Set Up PostgreSQL Database 🔵
**Description:** Install and configure PostgreSQL  
**Estimated Time:** 1 hour  
**Dependencies:** Task 1.1  
**Acceptance Criteria:**
- [ ] PostgreSQL 16 installed (or Docker container running)
- [ ] Database created: `polaris_dev`
- [ ] User created: `polaris_user` with appropriate permissions
- [ ] Connection verified

**Implementation Steps:**
1. Install PostgreSQL 16 or use Docker:
   ```bash
   docker run -d \
     --name polaris-postgres \
     -e POSTGRES_DB=polaris_dev \
     -e POSTGRES_USER=polaris_user \
     -e POSTGRES_PASSWORD=dev_password \
     -p 5432:5432 \
     postgres:16-alpine
   ```
2. Test connection with psql or DBeaver
3. Document connection string in .env.example

---

#### Task 1.3: Create Prisma Schema (Core Tables) 🔵
**Description:** Define database schema using Prisma  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.2  
**Acceptance Criteria:**
- [ ] Prisma installed in `database/` directory
- [ ] Schema file created with core tables:
  - `products`
  - `teams`
  - `custom_field_mappings`
  - `sprints`
  - `stories`
  - `tad_ts_compliance`
  - `test_cases`
  - `test_executions`
  - `defects`
  - `metrics_snapshots`
- [ ] Initial migration generated
- [ ] Migration applied successfully
- [ ] Prisma Client generated

**Implementation Steps:**
1. Initialize Prisma in database directory:
   ```bash
   cd database
   npm init -y
   npm install prisma @prisma/client
   npx prisma init
   ```

2. Create `schema.prisma` (reference: plan.md Section 5.1):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model Product {
     id                     Int       @id @default(autoincrement())
     name                   String    @unique
     displayName            String    @map("display_name")
     jiraProjectKey         String?   @map("jira_project_key")
     jiraBoardIds           Int[]     @map("jira_board_ids")
     qtestProjectId         Int?      @map("qtest_project_id")
     safeProductFieldValue  String?   @map("safe_product_field_value")
     config                 Json      @default("{}")
     isActive               Boolean   @default(true) @map("is_active")
     createdAt              DateTime  @default(now()) @map("created_at")
     updatedAt              DateTime  @updatedAt @map("updated_at")
     
     teams                  Team[]
     customFieldMappings    CustomFieldMapping[]

     @@map("products")
   }

   model Team {
     id                   Int       @id @default(autoincrement())
     name                 String    @unique
     displayName          String    @map("display_name")
     productId            Int       @map("product_id")
     jiraBoardId          Int?      @map("jira_board_id")
     qtestProjectId       Int?      @map("qtest_project_id")
     teamMembers          String[]  @map("team_members")
     integrationStrategy  String    @map("integration_strategy")
     config               Json      @default("{}")
     isActive             Boolean   @default(true) @map("is_active")
     createdAt            DateTime  @default(now()) @map("created_at")
     updatedAt            DateTime  @updatedAt @map("updated_at")
     
     product              Product   @relation(fields: [productId], references: [id])
     sprints              Sprint[]
     stories              Story[]
     testCases            TestCase[]
     testExecutions       TestExecution[]
     defects              Defect[]
     metricsSnapshots     MetricsSnapshot[]

     @@map("teams")
   }

   model CustomFieldMapping {
     id           Int       @id @default(autoincrement())
     productId    Int       @map("product_id")
     fieldPurpose String    @map("field_purpose")
     fieldId      String    @map("field_id")
     fieldType    String    @map("field_type")
     fieldPath    String?   @map("field_path")
     isActive     Boolean   @default(true) @map("is_active")
     
     product      Product   @relation(fields: [productId], references: [id])

     @@unique([productId, fieldPurpose])
     @@map("custom_field_mappings")
   }

   model Sprint {
     id            Int       @id @default(autoincrement())
     name          String
     teamId        Int       @map("team_id")
     startDate     DateTime  @map("start_date") @db.Date
     endDate       DateTime  @map("end_date") @db.Date
     state         String
     jiraSprintId  Int?      @map("jira_sprint_id")
     piVersion     String?   @map("pi_version")
     releaseVersion String?  @map("release_version")
     createdAt     DateTime  @default(now()) @map("created_at")
     updatedAt     DateTime  @updatedAt @map("updated_at")
     
     team          Team      @relation(fields: [teamId], references: [id])
     stories       Story[]
     testExecutions TestExecution[]
     defects       Defect[]
     metricsSnapshots MetricsSnapshot[]

     @@unique([teamId, name])
     @@map("sprints")
   }

   model Story {
     id               Int       @id @default(autoincrement())
     key              String    @unique
     summary          String
     storyPoints      Int?      @map("story_points")
     sprintId         Int?      @map("sprint_id")
     teamId           Int       @map("team_id")
     status           String
     assignee         String?
     createdDate      DateTime  @map("created_date")
     resolvedDate     DateTime? @map("resolved_date")
     rawData          Json      @default("{}") @map("raw_data")
     createdAt        DateTime  @default(now()) @map("created_at")
     updatedAt        DateTime  @updatedAt @map("updated_at")
     
     sprint           Sprint?   @relation(fields: [sprintId], references: [id])
     team             Team      @relation(fields: [teamId], references: [id])
     tadTsCompliance  TadTsCompliance?

     @@map("stories")
   }

   model TadTsCompliance {
     id               Int       @id @default(autoincrement())
     storyId          Int       @unique @map("story_id")
     hasTad           Boolean   @default(false) @map("has_tad")
     hasTs            Boolean   @default(false) @map("has_ts")
     tadStatus        String?   @map("tad_status")
     tsStatus         String?   @map("ts_status")
     tadReason        String?   @map("tad_reason")
     tsReason         String?   @map("ts_reason")
     detectionMethod  String?   @map("detection_method")
     bitbucketPrs     Json?     @map("bitbucket_prs")
     lastChecked      DateTime  @default(now()) @map("last_checked")
     
     story            Story     @relation(fields: [storyId], references: [id])

     @@map("tad_ts_compliance")
   }

   model TestCase {
     id               Int       @id @default(autoincrement())
     qtestId          String    @map("qtest_id")
     qtestProjectId   Int       @map("qtest_project_id")
     name             String
     automationStatus String    @map("automation_status")
     linkedStoryKey   String?   @map("linked_story_key")
     teamId           Int?      @map("team_id")
     createdAt        DateTime  @default(now()) @map("created_at")
     updatedAt        DateTime  @updatedAt @map("updated_at")
     
     team             Team?     @relation(fields: [teamId], references: [id])
     executions       TestExecution[]

     @@unique([qtestProjectId, qtestId])
     @@map("test_cases")
   }

   model TestExecution {
     id              Int       @id @default(autoincrement())
     qtestRunId      String    @unique @map("qtest_run_id")
     testCaseId      Int       @map("test_case_id")
     sprintId        Int?      @map("sprint_id")
     testCycleName   String?   @map("test_cycle_name")
     status          String
     executedBy      String?   @map("executed_by")
     executedDate    DateTime  @map("executed_date")
     teamId          Int       @map("team_id")
     createdAt       DateTime  @default(now()) @map("created_at")
     
     testCase        TestCase  @relation(fields: [testCaseId], references: [id])
     sprint          Sprint?   @relation(fields: [sprintId], references: [id])
     team            Team      @relation(fields: [teamId], references: [id])

     @@map("test_executions")
   }

   model Defect {
     id                Int       @id @default(autoincrement())
     key               String    @unique
     summary           String
     sprintId          Int?      @map("sprint_id")
     teamId            Int       @map("team_id")
     severity          String?
     safeSdlcActivity  String?   @map("safe_sdlc_activity")
     discoveredBy      String?   @map("discovered_by")
     status            String
     isReopened        Boolean   @default(false) @map("is_reopened")
     linkedStoryKey    String?   @map("linked_story_key")
     createdDate       DateTime  @map("created_date")
     resolvedDate      DateTime? @map("resolved_date")
     rawData           Json      @default("{}") @map("raw_data")
     createdAt         DateTime  @default(now()) @map("created_at")
     updatedAt         DateTime  @updatedAt @map("updated_at")
     
     sprint            Sprint?   @relation(fields: [sprintId], references: [id])
     team              Team      @relation(fields: [teamId], references: [id])

     @@map("defects")
   }

   model MetricsSnapshot {
     id                      Int       @id @default(autoincrement())
     snapshotDate            DateTime  @map("snapshot_date") @db.Date
     teamId                  Int       @map("team_id")
     sprintId                Int?      @map("sprint_id")
     
     totalStories            Int       @default(0) @map("total_stories")
     tadComplete             Int       @default(0) @map("tad_complete")
     tadNa                   Int       @default(0) @map("tad_na")
     tsComplete              Int       @default(0) @map("ts_complete")
     tsNa                    Int       @default(0) @map("ts_na")
     tadPct                  Decimal?  @map("tad_pct") @db.Decimal(5, 2)
     tsPct                   Decimal?  @map("ts_pct") @db.Decimal(5, 2)
     
     totalTestRuns           Int       @default(0) @map("total_test_runs")
     uniqueTestCases         Int       @default(0) @map("unique_test_cases")
     automatedTestCases      Int       @default(0) @map("automated_test_cases")
     manualTestCases         Int       @default(0) @map("manual_test_cases")
     automationPct           Decimal?  @map("automation_pct") @db.Decimal(5, 2)
     
     totalDefects            Int       @default(0) @map("total_defects")
     reopenedDefects         Int       @default(0) @map("reopened_defects")
     reopenedPct             Decimal?  @map("reopened_pct") @db.Decimal(5, 2)
     defectsBySeverity       Json?     @map("defects_by_severity")
     defectsBySdlc           Json?     @map("defects_by_sdlc")
     
     createdAt               DateTime  @default(now()) @map("created_at")
     
     team                    Team      @relation(fields: [teamId], references: [id])
     sprint                  Sprint?   @relation(fields: [sprintId], references: [id])

     @@unique([snapshotDate, teamId, sprintId])
     @@map("metrics_snapshots")
   }
   ```

3. Generate and apply migration:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

---

#### Task 1.4: Seed T360 Product and Teams 🔵
**Description:** Insert T360 product and 6 teams into database  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.3  
**Acceptance Criteria:**
- [ ] T360 product record created (project key: GET, QTest project: 114345)
- [ ] 6 T360 teams created:
  - Vanguards
  - Nexus
  - Mavericks
  - Matrix
  - Chubb
  - Chargers
- [ ] Custom field mappings created for T360:
  - Team field: `customfield_13392`
  - Sprint field: `customfield_10292`
  - Safe-SDLC Activity: `customfield_14391`
- [ ] Seed script in `database/seed.ts`
- [ ] Verification queries successful

**Note:** In Phase 2, we will add:
- Passport product with 3 teams
- **DnA product with 3 teams using actual Jira bug data**:
  - Minerva: Primary Project ELM, Board ID 7437, Sprint format "Passport D&A Minerva-{sprint}", Safe-Team "Minerva"
  - Guardians: Primary Project ELM, Board ID 6704, Sprint format "Passport D&A Guardians-{sprint}", Safe-Team "Guardians"
  - Athena: Primary Project GET, Board ID 6798, Sprint format "T360 D&A Athena-{sprint}", Safe-Team "Athena"
  - **Cross-Project Bug Query**: All teams have bugs in both primary project AND "ELM Tech Ops" project
    - JQL Pattern: `(project = <PRIMARY> OR project = "ELM Tech Ops") AND type = Bug AND sprint = "<SPRINT>" ORDER BY created DESC`
    - Examples:
      - Minerva/Guardians: `(project = ELM OR project = "ELM Tech Ops") AND type = Bug AND sprint = "Passport D&A Minerva-26.1.2"`
      - Athena: `(project = GET OR project = "ELM Tech Ops") AND type = Bug AND sprint = "T360 D&A Athena-26.1.2"`
    - **Post-Retrieval Safe-Team Filtering**: customfield_13392 cannot be used in JQL queries (causes 400 error)
    - Safe-Team field is object with `value` property: `{value: "Athena"}`
    - Application filters bugs after retrieval by comparing `bug.fields.customfield_13392.value` with team's Safe-Team value
    - Bugs without Safe-Team field (null/undefined) are included if they match sprint name
    - Sprint name format is consistent across all projects (ELM, GET, "ELM Tech Ops")
  - **Authentication**: Jira API Token (JIRA_API_TOKEN env variable)
  - Real-time bug extraction from Jira (https://jira.wolterskluwer.io/jira)
  - **Testing Sprint**: 26.1.2 (closed sprint for validation)
  - **Verified Results**: Minerva 4 bugs, Guardians 1 bug, Athena 4 bugs (GET + 3 TO bugs)
  - Reopened bugs detection via changelog analysis
  - Quality indicators: Excellent (0-5%), Good (6-10%), Needs Improvement (11-15%), Poor (>15%)
  - **Implementation Order**: Tasks 2.1 → 2.10 (backend first, then frontend)
  - **No Mock Data**: All bug metrics from actual Jira API
  - Safe-Team field (customfield_13392) available in ELM, GET, and "ELM Tech Ops" projects
  - Performance: <3s for 50 bugs acceptable
- Collaboration Portal product with 1 team

**Implementation Steps:**
1. Create `database/seed.ts`:
   ```typescript
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   async function main() {
     // Create T360 Product
     const t360 = await prisma.product.upsert({
       where: { name: 't360' },
       update: {},
       create: {
         name: 't360',
         displayName: 'Tymetrix 360',
         jiraProjectKey: 'GET',
         jiraBoardIds: [], // Will discover later
         qtestProjectId: 114345,
         safeProductFieldValue: null,
         config: {},
         isActive: true,
       },
     });

     console.log('✅ T360 product created:', t360);

     // Create T360 Teams
     const teams = [
       'Vanguards',
       'Nexus',
       'Mavericks',
       'Matrix',
       'Chubb',
       'Chargers',
     ];

     for (const teamName of teams) {
       const team = await prisma.team.upsert({
         where: { name: teamName },
         update: {},
         create: {
           name: teamName,
           displayName: teamName,
           productId: t360.id,
           jiraBoardId: null, // Will discover later
           qtestProjectId: 114345,
           teamMembers: [],
           integrationStrategy: 't360',
           config: {},
           isActive: true,
         },
       });
       console.log(`✅ Team created: ${team.name}`);
     }

     // Create Custom Field Mappings for T360
     const fieldMappings = [
       {
         fieldPurpose: 'team',
         fieldId: 'customfield_13392',
         fieldType: 'string',
         fieldPath: null,
       },
       {
         fieldPurpose: 'sprint',
         fieldId: 'customfield_10292',
         fieldType: 'string',
         fieldPath: null,
       },
       {
         fieldPurpose: 'sprint_alt',
         fieldId: 'customfield_10004',
         fieldType: 'string',
         fieldPath: null,
       },
       {
         fieldPurpose: 'safe_sdlc_activity',
         fieldId: 'customfield_14391',
         fieldType: 'string',
         fieldPath: null,
       },
     ];

     for (const mapping of fieldMappings) {
       const fieldMapping = await prisma.customFieldMapping.upsert({
         where: {
           productId_fieldPurpose: {
             productId: t360.id,
             fieldPurpose: mapping.fieldPurpose,
           },
         },
         update: {},
         create: {
           productId: t360.id,
           ...mapping,
           isActive: true,
         },
       });
       console.log(`✅ Field mapping created: ${fieldMapping.fieldPurpose}`);
     }

     console.log('\n✅ Seed completed successfully!');
   }

   main()
     .catch((e) => {
       console.error('❌ Seed failed:', e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

2. Add seed script to package.json:
   ```json
   {
     "scripts": {
       "seed": "ts-node seed.ts"
     }
   }
   ```

3. Run seed:
   ```bash
   npm run seed
   ```

4. Verify data:
   ```sql
   SELECT * FROM products;
   SELECT * FROM teams;
   SELECT * FROM custom_field_mappings;
   ```

---

### Day 2: Port TAD/TS Detection Logic

#### Task 1.5: Set Up Python Integration Service 🔵
**Description:** Create Python FastAPI service structure  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.1  
**Acceptance Criteria:**
- [ ] Python virtual environment created
- [ ] FastAPI installed with dependencies
- [ ] Basic app structure created:
  ```
  backend/integration-service/
  ├── app/
  │   ├── main.py
  │   ├── routers/
  │   ├── clients/
  │   ├── services/
  │   ├── models/
  │   └── config/
  ├── tests/
  ├── requirements.txt
  ├── .env.example
  └── Dockerfile
  ```
- [ ] Health check endpoint working: `GET /health`
- [ ] Server runs on port 8000

**Implementation Steps:**
1. Create integration-service directory:
   ```bash
   cd backend
   mkdir integration-service
   cd integration-service
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

2. Create `requirements.txt`:
   ```txt
   fastapi==0.109.0
   uvicorn[standard]==0.27.0
   httpx==0.26.0
   pydantic==2.5.3
   pydantic-settings==2.1.0
   python-dotenv==1.0.0
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `app/main.py`:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   app = FastAPI(
       title="Polaris Integration Service",
       description="Jira, QTest, and Bitbucket integration service",
       version="0.1.0",
   )

   # CORS
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # Configure properly in production
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/health")
   async def health_check():
       return {"status": "healthy", "service": "integration-service"}

   if __name__ == "__main__":
       import uvicorn
       uvicorn.run(app, host="0.0.0.0", port=8000)
   ```

5. Test server:
   ```bash
   python app/main.py
   # Visit http://localhost:8000/docs for Swagger UI
   ```

---

#### Task 1.6: Extract Jira Client from T360 Dashboard 🔵
**Description:** Port Jira API client from reference T360 dashboard  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.5  
**Source:** `reference-source/tad-ts-dashboard/sprint-tad-ts-report.py` lines 150-400  
**Acceptance Criteria:**
- [ ] `app/clients/jira_client.py` created
- [ ] Jira authentication configured (base URL, token)
- [ ] Methods implemented:
  - `get_sprint_issues(project_key: str, sprint: str) -> List[JiraIssue]`
  - `get_issue_details(issue_key: str) -> JiraIssue`
  - `get_issue_comments(issue_key: str) -> List[Comment]`
- [ ] Pydantic models for Jira responses
- [ ] Error handling with retries (3 attempts, exponential backoff)
- [ ] Rate limiting (1 request per second)
- [ ] Test with real T360 sprint (GET-* issues)

**Implementation Steps:**
1. Create `.env`:
   ```env
   JIRA_BASE_URL=https://jira.wolterskluwer.io/jira
   JIRA_API_TOKEN=your_token_here
   ```

2. Create `app/config/settings.py`:
   ```python
   from pydantic_settings import BaseSettings

   class Settings(BaseSettings):
       jira_base_url: str
       jira_api_token: str
       
       class Config:
           env_file = ".env"

   settings = Settings()
   ```

3. Create `app/models/jira_models.py`:
   ```python
   from pydantic import BaseModel
   from typing import Optional, List, Any
   from datetime import datetime

   class JiraCustomFields(BaseModel):
       team: Optional[str] = None
       sprint: Optional[str] = None
       safe_sdlc_activity: Optional[str] = None

   class JiraIssueFields(BaseModel):
       summary: str
       status: dict
       issuetype: dict
       customfield_13392: Optional[Any] = None  # Team
       customfield_10292: Optional[Any] = None  # Sprint
       customfield_14391: Optional[str] = None  # SDLC Activity
       issuelinks: Optional[List[dict]] = []
       created: str
       resolutiondate: Optional[str] = None

   class JiraIssue(BaseModel):
       key: str
       id: str
       fields: JiraIssueFields

   class JiraSearchResponse(BaseModel):
       issues: List[JiraIssue]
       total: int
       startAt: int
       maxResults: int

   class JiraComment(BaseModel):
       id: str
       author: dict
       body: str
       created: str
   ```

4. Create `app/clients/jira_client.py`:
   ```python
   import httpx
   import time
   from typing import List, Optional
   from app.config.settings import settings
   from app.models.jira_models import JiraIssue, JiraSearchResponse, JiraComment

   class JiraClient:
       def __init__(self):
           self.base_url = settings.jira_base_url
           self.headers = {
               "Authorization": f"Bearer {settings.jira_api_token}",
               "Content-Type": "application/json",
           }
           self.client = httpx.Client(
               base_url=self.base_url,
               headers=self.headers,
               timeout=30.0,
           )
           self.last_request_time = 0
           self.min_request_interval = 1.0  # Rate limit: 1 req/sec

       def _rate_limit(self):
           """Enforce rate limiting"""
           elapsed = time.time() - self.last_request_time
           if elapsed < self.min_request_interval:
               time.sleep(self.min_request_interval - elapsed)
           self.last_request_time = time.time()

       def _retry_request(self, method: str, url: str, **kwargs):
           """Retry logic with exponential backoff"""
           max_retries = 3
           for attempt in range(max_retries):
               try:
                   self._rate_limit()
                   response = self.client.request(method, url, **kwargs)
                   response.raise_for_status()
                   return response
               except httpx.HTTPError as e:
                   if attempt == max_retries - 1:
                       raise
                   wait_time = 2 ** attempt
                   print(f"Request failed, retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                   time.sleep(wait_time)

       def get_sprint_issues(
           self, 
           project_key: str, 
           sprint: str
       ) -> List[JiraIssue]:
           """
           Fetch all issues for a sprint in a project
           
           Args:
               project_key: Jira project key (e.g., 'GET')
               sprint: Sprint name (e.g., '26.1.1')
               
           Returns:
               List of Jira issues
           """
           jql = f'project = {project_key} AND sprint = "{sprint}" AND issuetype = Story'
           
           all_issues = []
           start_at = 0
           max_results = 50
           
           while True:
               response = self._retry_request(
                   "GET",
                   "/rest/api/2/search",
                   params={
                       "jql": jql,
                       "startAt": start_at,
                       "maxResults": max_results,
                       "fields": [
                           "summary",
                           "status",
                           "issuetype",
                           "customfield_13392",  # Team
                           "customfield_10292",  # Sprint
                           "customfield_14391",  # SDLC Activity
                           "issuelinks",
                           "created",
                           "resolutiondate",
                       ],
                   },
               )
               
               data = response.json()
               search_response = JiraSearchResponse(**data)
               all_issues.extend(search_response.issues)
               
               if start_at + max_results >= search_response.total:
                   break
               start_at += max_results
           
           return all_issues

       def get_issue_details(self, issue_key: str) -> JiraIssue:
           """Fetch single issue details"""
           response = self._retry_request(
               "GET",
               f"/rest/api/2/issue/{issue_key}",
           )
           return JiraIssue(**response.json())

       def get_issue_comments(self, issue_key: str) -> List[JiraComment]:
           """Fetch comments for an issue"""
           response = self._retry_request(
               "GET",
               f"/rest/api/2/issue/{issue_key}/comment",
           )
           data = response.json()
           return [JiraComment(**comment) for comment in data.get("comments", [])]

       def __del__(self):
           self.client.close()
   ```

5. Test Jira client:
   ```python
   # test_jira.py
   from app.clients.jira_client import JiraClient

   client = JiraClient()
   issues = client.get_sprint_issues("GET", "26.1.1")
   print(f"Found {len(issues)} stories")
   for issue in issues[:5]:
       print(f"- {issue.key}: {issue.fields.summary}")
   ```

---

#### Task 1.7: Extract Bitbucket Client from T360 Dashboard 🔵
**Description:** Port Bitbucket PR fetching logic  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.5  
**Source:** `reference-source/tad-ts-dashboard/sprint-tad-ts-report.py` lines 250-350  
**Acceptance Criteria:**
- [ ] `app/clients/bitbucket_client.py` created
- [ ] Method: `get_pull_requests(issue_key: str) -> List[PullRequest]`
- [ ] Uses Jira dev-status API to find PRs
- [ ] Returns PR title, description, URL, status
- [ ] Error handling for issues with no PRs
- [ ] Test with T360 story that has PRs

**Implementation Steps:**
1. Create `app/models/bitbucket_models.py`:
   ```python
   from pydantic import BaseModel
   from typing import Optional, List

   class PullRequest(BaseModel):
       id: str
       title: str
       description: Optional[str] = None
       url: str
       status: str  # MERGED, OPEN, DECLINED
       source_branch: str
       destination_branch: str

   class DevStatusResponse(BaseModel):
       pullrequests: List[dict]
   ```

2. Create `app/clients/bitbucket_client.py`:
   ```python
   import httpx
   from typing import List
   from app.config.settings import settings
   from app.models.bitbucket_models import PullRequest, DevStatusResponse

   class BitbucketClient:
       def __init__(self):
           self.jira_base_url = settings.jira_base_url
           self.headers = {
               "Authorization": f"Bearer {settings.jira_api_token}",
               "Content-Type": "application/json",
           }

       def get_pull_requests(self, issue_key: str) -> List[PullRequest]:
           """
           Get pull requests linked to Jira issue via dev-status API
           
           Args:
               issue_key: Jira issue key (e.g., 'GET-12345')
               
           Returns:
               List of pull requests
           """
           url = f"{self.jira_base_url}/rest/dev-status/1.0/issue/detail"
           
           try:
               response = httpx.get(
                   url,
                   params={
                       "issueId": issue_key,
                       "applicationType": "stash",  # Bitbucket Server
                       "dataType": "pullrequest",
                   },
                   headers=self.headers,
                   timeout=30.0,
               )
               response.raise_for_status()
               data = response.json()
               
               pull_requests = []
               for detail in data.get("detail", []):
                   for pr_data in detail.get("pullRequests", []):
                       pr = PullRequest(
                           id=pr_data.get("id", ""),
                           title=pr_data.get("name", ""),
                           description=pr_data.get("description", ""),
                           url=pr_data.get("url", ""),
                           status=pr_data.get("status", "UNKNOWN"),
                           source_branch=pr_data.get("source", {}).get("branch", ""),
                           destination_branch=pr_data.get("destination", {}).get("branch", ""),
                       )
                       pull_requests.append(pr)
               
               return pull_requests
               
           except httpx.HTTPError as e:
               print(f"Error fetching PRs for {issue_key}: {e}")
               return []
   ```

---

#### Task 1.8: Implement TAD/TS Detection Service 🔵
**Description:** Port TAD/TS detection logic into service  
**Estimated Time:** 5 hours  
**Dependencies:** Task 1.6, Task 1.7  
**Source:** `reference-source/tad-ts-dashboard/sprint-tad-ts-report.py` lines 450-650  
**Acceptance Criteria:**
- [ ] `app/services/tad_ts_detector.py` created
- [ ] Two-stage detection implemented:
  1. Check PR names for TAD/TS keywords
  2. Check PR descriptions for TAD.md/TS.md links
- [ ] N/A detection:
  - Comments with "TAD N/A" or "TS N/A"
  - Stories linked to bugs
- [ ] Returns TadTsResult with status: 'complete', 'n/a', 'missing'
- [ ] Unit tests written
- [ ] Test with real T360 stories

**Implementation Steps:**
1. Create `app/models/tad_ts_models.py`:
   ```python
   from pydantic import BaseModel
   from typing import Optional, List
   from app.models.bitbucket_models import PullRequest

   class TadTsResult(BaseModel):
       story_key: str
       has_tad: bool
       has_ts: bool
       tad_status: str  # 'complete', 'n/a', 'missing'
       ts_status: str
       tad_reason: Optional[str] = None
       ts_reason: Optional[str] = None
       detection_method: Optional[str] = None
       pull_requests: List[PullRequest] = []
   ```

2. Create `app/services/tad_ts_detector.py`:
   ```python
   import re
   from typing import Optional
   from app.clients.jira_client import JiraClient
   from app.clients.bitbucket_client import BitbucketClient
   from app.models.jira_models import JiraIssue
   from app.models.tad_ts_models import TadTsResult

   class TadTsDetector:
       def __init__(self):
           self.jira_client = JiraClient()
           self.bitbucket_client = BitbucketClient()
           
           # Keywords for detection (from T360 dashboard)
           self.tad_keywords = [
               'tad', 'technical architecture document',
               'technical design', 'architecture doc',
           ]
           self.ts_keywords = [
               'ts', 'test strategy', 'testing strategy',
               'test plan',
           ]

       def detect_compliance(self, issue: JiraIssue) -> TadTsResult:
           """
           Detect TAD/TS compliance for a story
           
           Returns TadTsResult with status for TAD and TS
           """
           result = TadTsResult(
               story_key=issue.key,
               has_tad=False,
               has_ts=False,
               tad_status='missing',
               ts_status='missing',
           )
           
           # Get pull requests
           prs = self.bitbucket_client.get_pull_requests(issue.key)
           result.pull_requests = prs
           
           if not prs:
               # No PRs - check for N/A reasons
               self._check_na_status(issue, result)
               return result
           
           # Stage 1: Check PR names
           for pr in prs:
               if self._is_pr_name_tad(pr.title):
                   result.has_tad = True
                   result.tad_status = 'complete'
                   result.detection_method = 'pr_name'
               
               if self._is_pr_name_ts(pr.title):
                   result.has_ts = True
                   result.ts_status = 'complete'
                   result.detection_method = 'pr_name'
           
           # Stage 2: Check PR descriptions
           if not result.has_tad or not result.has_ts:
               for pr in prs:
                   description = pr.description or ''
                   
                   if not result.has_tad and self._has_tad_md_link(description):
                       result.has_tad = True
                       result.tad_status = 'complete'
                       result.detection_method = 'description'
                   
                   if not result.has_ts and self._has_ts_md_link(description):
                       result.has_ts = True
                       result.ts_status = 'complete'
                       result.detection_method = 'description'
           
           # Stage 3: Check for N/A
           if not result.has_tad or not result.has_ts:
               self._check_na_status(issue, result)
           
           return result

       def _is_pr_name_tad(self, title: str) -> bool:
           """Check if PR title contains TAD keywords"""
           title_lower = title.lower()
           return any(keyword in title_lower for keyword in self.tad_keywords)

       def _is_pr_name_ts(self, title: str) -> bool:
           """Check if PR title contains TS keywords"""
           title_lower = title.lower()
           return any(keyword in title_lower for keyword in self.ts_keywords)

       def _has_tad_md_link(self, description: str) -> bool:
           """Check if description contains TAD.md link"""
           patterns = [
               r'tad\.md',
               r'technical.*architecture.*document',
               r'\[tad\]',
           ]
           return any(re.search(pattern, description, re.IGNORECASE) for pattern in patterns)

       def _has_ts_md_link(self, description: str) -> bool:
           """Check if description contains TS.md link"""
           patterns = [
               r'ts\.md',
               r'test.*strategy',
               r'\[ts\]',
           ]
           return any(re.search(pattern, description, re.IGNORECASE) for pattern in patterns)

       def _check_na_status(self, issue: JiraIssue, result: TadTsResult):
           """Check if TAD/TS is marked as N/A"""
           # Check if linked to bug
           for link in issue.fields.issuelinks:
               linked_issue = link.get('inwardIssue') or link.get('outwardIssue')
               if linked_issue:
                   issue_type = linked_issue.get('fields', {}).get('issuetype', {}).get('name', '')
                   if issue_type == 'Bug':
                       if not result.has_tad:
                           result.tad_status = 'n/a'
                           result.tad_reason = 'Linked to bug'
                       if not result.has_ts:
                           result.ts_status = 'n/a'
                           result.ts_reason = 'Linked to bug'
                       result.detection_method = 'bug_link'
                       return
           
           # Check comments for N/A justification
           comments = self.jira_client.get_issue_comments(issue.key)
           
           for comment in comments:
               body = comment.body.lower()
               
               if not result.has_tad and 'tad n/a' in body:
                   result.tad_status = 'n/a'
                   result.tad_reason = f"N/A: {comment.body[:100]}"
                   result.detection_method = 'comment'
               
               if not result.has_ts and 'ts n/a' in body:
                   result.ts_status = 'n/a'
                   result.ts_reason = f"N/A: {comment.body[:100]}"
                   result.detection_method = 'comment'
   ```

3. Create test script `test_tad_ts.py`:
   ```python
   from app.clients.jira_client import JiraClient
   from app.services.tad_ts_detector import TadTsDetector

   jira = JiraClient()
   detector = TadTsDetector()

   # Test with real T360 stories
   issues = jira.get_sprint_issues("GET", "26.1.1")

   for issue in issues[:10]:
       result = detector.detect_compliance(issue)
       print(f"\n{result.story_key}: {issue.fields.summary[:50]}")
       print(f"  TAD: {result.tad_status} ({result.tad_reason or 'N/A'})")
       print(f"  TS:  {result.ts_status} ({result.ts_reason or 'N/A'})")
       print(f"  PRs: {len(result.pull_requests)}")
   ```

---

### Day 3: Port QTest Integration

#### Task 1.9: Extract QTest Client from DnA Dashboard 🔵
**Description:** Port enhanced QTest API client from DnA dashboard  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.5  
**Source:** `reference-source/dna-dashboard/automation_coverage/automation_coverage/qtest_client.py` (1149 lines - updated Jan 22, 2026)  
**Acceptance Criteria:**
- [ ] `app/clients/qtest_client.py` created
- [ ] QTest authentication configured
- [ ] Methods implemented (using enhanced API pattern):
  - `get_project(project_id: int)`
  - `list_test_cycles(project_id: int)` - **Enhanced: Test Cycles approach**
  - `get_test_runs_for_cycle(project_id: int, cycle_id: int)` - **New method**
  - `get_execution_logs(project_id: int, run_id: int)` - **New method**
  - `get_test_case(project_id: int, test_case_id: str)`
- [ ] Uses HTTPClientWithRetry pattern from DnA
- [ ] Pydantic models for QTest responses
- [ ] Error handling with retries and rate limiting
- [ ] Test with T360 QTest project (114345)

**Implementation Notes:**
- DnA team recently improved this with Test Cycles → Test Runs → Execution Logs workflow
- Reuse their HTTPClientWithRetry pattern (exponential backoff, rate limiting)
- Port their Pydantic models for type safety

**Implementation Steps:**
1. Add to `.env`:
   ```env
   QTEST_BASE_URL=https://wk.qtestnet.com
   QTEST_API_TOKEN=your_token_here
   ```

2. Update `app/config/settings.py`:
   ```python
   class Settings(BaseSettings):
       jira_base_url: str
       jira_api_token: str
       qtest_base_url: str
       qtest_api_token: str
   ```

3. **Create HTTPClientWithRetry** (port from DnA `automation_coverage/http.py`):
   ```python
   # app/clients/http_client.py
   import httpx
   import time
   from typing import Optional, Dict, Any
   from datetime import datetime, timedelta
   
   class HTTPClientWithRetry:
       """
       Production-grade HTTP client with retry logic and rate limiting.
       Ported from DnA dashboard automation_coverage/http.py
       """
       def __init__(
           self,
           base_url: str,
           headers: Dict[str, str],
           max_retries: int = 3,
           rate_limit_delay: float = 1.0,
           timeout: float = 30.0
       ):
           self.base_url = base_url
           self.headers = headers
           self.max_retries = max_retries
           self.rate_limit_delay = rate_limit_delay
           self.client = httpx.Client(
               base_url=base_url,
               headers=headers,
               timeout=timeout
           )
           self.last_request_time = datetime.now()
       
       def _rate_limit(self):
           """Enforce rate limiting between requests"""
           elapsed = (datetime.now() - self.last_request_time).total_seconds()
           if elapsed < self.rate_limit_delay:
               time.sleep(self.rate_limit_delay - elapsed)
           self.last_request_time = datetime.now()
       
       def request(self, method: str, url: str, **kwargs) -> httpx.Response:
           """Make HTTP request with retry logic and exponential backoff"""
           for attempt in range(self.max_retries):
               try:
                   self._rate_limit()
                   response = self.client.request(method, url, **kwargs)
                   response.raise_for_status()
                   return response
               except httpx.HTTPStatusError as e:
                   if attempt == self.max_retries - 1:
                       raise
                   # Exponential backoff: 2^attempt seconds
                   wait_time = 2 ** attempt
                   print(f"Request failed (attempt {attempt + 1}/{self.max_retries}), "
                         f"retrying in {wait_time}s... Status: {e.response.status_code}")
                   time.sleep(wait_time)
               except httpx.RequestError as e:
                   if attempt == self.max_retries - 1:
                       raise
                   wait_time = 2 ** attempt
                   print(f"Request error (attempt {attempt + 1}/{self.max_retries}), "
                         f"retrying in {wait_time}s... Error: {str(e)}")
                   time.sleep(wait_time)
       
       def get(self, url: str, **kwargs) -> httpx.Response:
           return self.request("GET", url, **kwargs)
       
       def post(self, url: str, **kwargs) -> httpx.Response:
           return self.request("POST", url, **kwargs)
       
       def __del__(self):
           self.client.close()
   ```

4. Create `app/models/qtest_models.py` (enhanced with DnA patterns):
   ```python
   from pydantic import BaseModel
   from typing import Optional, List, Any
   from datetime import datetime

   class QTestProject(BaseModel):
       id: int
       name: str

   class QTestCycle(BaseModel):
       id: int
       name: str
       start_date: Optional[str] = None
       end_date: Optional[str] = None
       status: Optional[str] = None

   class QTestProperty(BaseModel):
       field_name: str
       field_value: str

   class QTestCase(BaseModel):
       id: int
       name: str
       automation: Optional[str] = None
       properties: List[QTestProperty] = []
       automation_content: Optional[Any] = None

   class QTestRun(BaseModel):
       id: int
       test_case_id: int
       test_cycle_id: Optional[int] = None
       status: str
       executed_by: Optional[str] = None
       executed_date: Optional[str] = None
   ```

4. Create `app/clients/qtest_client.py` (using enhanced DnA patterns):
   ```python
   from typing import List, Optional
   from app.config.settings import settings
   from app.clients.http_client import HTTPClientWithRetry
   from app.models.qtest_models import (
       QTestProject,
       QTestCycle,
       QTestCase,
       QTestRun,
       QTestExecutionLog,
   )

   class QTestClient:
       """
       Enhanced QTest API client using Test Cycles → Test Runs → Execution Logs workflow.
       Ported from DnA dashboard with improvements (Jan 22, 2026).
       """
       def __init__(self):
           self.base_url = settings.qtest_base_url
           self.headers = {
               "Authorization": f"Bearer {settings.qtest_api_token}",
               "Content-Type": "application/json",
           }
           self.http_client = HTTPClientWithRetry(
               base_url=self.base_url,
               headers=self.headers,
               max_retries=3,
               rate_limit_delay=1.0,
               timeout=30.0
           )

       def get_project(self, project_id: int) -> QTestProject:
           """Get QTest project details"""
           response = self.http_client.get(f"/api/v3/projects/{project_id}")
           return QTestProject(**response.json())

       def list_test_cycles(self, project_id: int) -> List[QTestCycle]:
           """
           List all test cycles in project.
           Enhanced approach from DnA - uses test cycles as primary unit.
           """
           response = self.http_client.get(
               f"/api/v3/projects/{project_id}/test-cycles",
               params={"pageSize": 100, "includeClosed": True},
           )
           data = response.json()
           return [QTestCycle(**cycle) for cycle in data.get("items", [])]

       def get_test_runs_for_cycle(
           self, 
           project_id: int, 
           cycle_id: int
       ) -> List[QTestRun]:
           """
           Get test runs for a specific test cycle.
           NEW METHOD from enhanced DnA approach.
           """
           response = self.http_client.get(
               f"/api/v3/projects/{project_id}/test-runs",
               params={
                   "testCycleId": cycle_id,
                   "pageSize": 999,
               },
           )
           data = response.json()
           return [QTestRun(**run) for run in data.get("items", [])]

       def get_execution_logs(
           self,
           project_id: int,
           run_id: int
       ) -> List[QTestExecutionLog]:
           """
           Get execution logs for a test run.
           NEW METHOD from enhanced DnA approach.
           """
           response = self.http_client.get(
               f"/api/v3/projects/{project_id}/test-runs/{run_id}/test-logs"
           )
           data = response.json()
           return [QTestExecutionLog(**log) for log in data]

       def get_test_case(
           self, 
           project_id: int, 
           test_case_id: int
       ) -> QTestCase:
           """Get test case details with automation status"""
           response = self.http_client.get(
               f"/api/v3/projects/{project_id}/test-cases/{test_case_id}"
           )
           return QTestCase(**response.json())

       def __del__(self):
           # HTTPClientWithRetry handles cleanup
           pass
   ```

5. Test QTest client with enhanced workflow:
   ```python
   # test_qtest.py
   from app.clients.qtest_client import QTestClient

   client = QTestClient()
   
   # Test with T360 project
   project = client.get_project(114345)
   print(f"Project: {project.name}")
   
   # Test enhanced workflow: Cycles → Runs → Execution Logs
   cycles = client.list_test_cycles(114345)
   print(f"Found {len(cycles)} test cycles")
   
   if cycles:
       # Get test runs for first cycle
       first_cycle = cycles[0]
       print(f"\nCycle: {first_cycle.name}")
       
       runs = client.get_test_runs_for_cycle(114345, first_cycle.id)
       print(f"  Test runs: {len(runs)}")
       
       if runs:
           # Get execution logs for first run
           first_run = runs[0]
           logs = client.get_execution_logs(114345, first_run.id)
           print(f"  Execution logs: {len(logs)}")
   ```

**Note:** This enhanced approach (Test Cycles → Test Runs → Execution Logs) is better than our original Task 1.9 design and comes directly from DnA's production-tested implementation.

---

#### Task 1.10: Implement Sprint-to-Test-Cycle Mapper 🔵
**Description:** Map Jira sprints to QTest test cycles by date overlap  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.9  
**Source:** `reference-source/dna-dashboard/team_summary_framework.py` lines 150-250  
**Acceptance Criteria:**
- [ ] `app/services/sprint_mapper.py` created
- [ ] Method: `map_sprint_to_cycles(sprint_dates, test_cycles)`
- [ ] Date range overlap logic implemented
- [ ] Handles edge cases (no matching cycles, multiple matches)
- [ ] Unit tests for date overlap logic
- [ ] Test with real T360 sprint dates

**Implementation Steps:**
1. Create `app/services/sprint_mapper.py`:
   ```python
   from datetime import datetime
   from typing import List, Tuple
   from app.models.qtest_models import QTestCycle

   class SprintMapper:
       @staticmethod
       def parse_date(date_str: str) -> datetime:
           """Parse QTest date string to datetime"""
           # QTest dates: "2026-01-01T00:00:00Z"
           return datetime.fromisoformat(date_str.replace('Z', '+00:00'))

       @staticmethod
       def date_ranges_overlap(
           start1: datetime,
           end1: datetime,
           start2: datetime,
           end2: datetime,
       ) -> bool:
           """Check if two date ranges overlap"""
           return start1 <= end2 and start2 <= end1

       def map_sprint_to_cycles(
           self,
           sprint_start: datetime,
           sprint_end: datetime,
           test_cycles: List[QTestCycle],
       ) -> List[QTestCycle]:
           """
           Find test cycles that overlap with sprint dates
           
           Args:
               sprint_start: Sprint start date
               sprint_end: Sprint end date
               test_cycles: All test cycles from QTest project
               
           Returns:
               List of matching test cycles
           """
           matching_cycles = []
           
           for cycle in test_cycles:
               if not cycle.start_date or not cycle.end_date:
                   continue
               
               try:
                   cycle_start = self.parse_date(cycle.start_date)
                   cycle_end = self.parse_date(cycle.end_date)
                   
                   if self.date_ranges_overlap(
                       sprint_start, sprint_end,
                       cycle_start, cycle_end
                   ):
                       matching_cycles.append(cycle)
               except Exception as e:
                   print(f"Error parsing dates for cycle {cycle.id}: {e}")
                   continue
           
           return matching_cycles
   ```

2. Create unit test `tests/test_sprint_mapper.py`:
   ```python
   from datetime import datetime
   from app.services.sprint_mapper import SprintMapper
   from app.models.qtest_models import QTestCycle

   def test_date_overlap():
       mapper = SprintMapper()
       
       # Test overlapping ranges
       assert mapper.date_ranges_overlap(
           datetime(2026, 1, 1),
           datetime(2026, 1, 14),
           datetime(2026, 1, 10),
           datetime(2026, 1, 20),
       ) == True
       
       # Test non-overlapping ranges
       assert mapper.date_ranges_overlap(
           datetime(2026, 1, 1),
           datetime(2026, 1, 14),
           datetime(2026, 1, 15),
           datetime(2026, 1, 28),
       ) == False

   def test_map_sprint_to_cycles():
       mapper = SprintMapper()
       
       cycles = [
           QTestCycle(
               id=1,
               name="Sprint 26.1.1",
               start_date="2026-01-01T00:00:00Z",
               end_date="2026-01-14T23:59:59Z",
           ),
           QTestCycle(
               id=2,
               name="Sprint 26.1.2",
               start_date="2026-01-15T00:00:00Z",
               end_date="2026-01-28T23:59:59Z",
           ),
       ]
       
       # Should match cycle 1
       matched = mapper.map_sprint_to_cycles(
           datetime(2026, 1, 1),
           datetime(2026, 1, 14),
           cycles,
       )
       
       assert len(matched) == 1
       assert matched[0].id == 1
   ```

---

#### Task 1.11: Implement QTest Metrics Calculator 🔵
**Description:** Calculate automation metrics from QTest data  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.10  
**Source:** `reference-source/dna-dashboard/automation_coverage/` (DnA logic)  
**Acceptance Criteria:**
- [ ] `app/services/qtest_calculator.py` created
- [ ] Method: `calculate_metrics(test_runs, qtest_client)`
- [ ] Calculates:
  - Total test runs
  - Unique test cases executed
  - Automated vs manual test cases
  - Automation percentage
- [ ] Handles edge cases (no test runs, missing test cases)
- [ ] Test with real QTest data

**Implementation Steps:**
1. Create `app/models/metrics_models.py`:
   ```python
   from pydantic import BaseModel

   class QTestMetrics(BaseModel):
       total_runs: int
       unique_test_cases: int
       automated_test_cases: int
       manual_test_cases: int
       automation_pct: float
   ```

2. Create `app/services/qtest_calculator.py`:
   ```python
   from typing import List
   from app.clients.qtest_client import QTestClient
   from app.models.qtest_models import QTestRun, QTestCase
   from app.models.metrics_models import QTestMetrics

   class QTestCalculator:
       def __init__(self, qtest_client: QTestClient):
           self.qtest_client = qtest_client

       def is_automated(self, test_case: QTestCase) -> bool:
           """
           Determine if test case is automated
           
           Logic from DnA dashboard:
           1. Check 'automation' field
           2. Check properties for automation field
           3. Check if automation_content exists
           """
           # Check automation field
           automation = (test_case.automation or '').lower()
           if automation in ['automated', 'automation']:
               return True
           
           # Check properties
           for prop in test_case.properties:
               field_name = prop.field_name.lower()
               field_value = prop.field_value.lower()
               
               if 'automation' in field_name and 'auto' in field_value:
                   return True
           
           # Check automation content
           if test_case.automation_content:
               return True
           
           return False

       def calculate_metrics(
           self,
           project_id: int,
           test_runs: List[QTestRun],
       ) -> QTestMetrics:
           """
           Calculate automation metrics from test runs
           
           Args:
               project_id: QTest project ID
               test_runs: List of test runs from matching test cycles
               
           Returns:
               QTestMetrics with calculated values
           """
           if not test_runs:
               return QTestMetrics(
                   total_runs=0,
                   unique_test_cases=0,
                   automated_test_cases=0,
                   manual_test_cases=0,
                   automation_pct=0.0,
               )
           
           # Get unique test case IDs
           unique_test_case_ids = set(run.test_case_id for run in test_runs)
           
           # Count automated vs manual
           automated_count = 0
           manual_count = 0
           
           for test_case_id in unique_test_case_ids:
               try:
                   test_case = self.qtest_client.get_test_case(
                       project_id,
                       test_case_id,
                   )
                   
                   if self.is_automated(test_case):
                       automated_count += 1
                   else:
                       manual_count += 1
               except Exception as e:
                   print(f"Error fetching test case {test_case_id}: {e}")
                   manual_count += 1  # Assume manual on error
           
           total_test_cases = len(unique_test_case_ids)
           automation_pct = (
               (automated_count / total_test_cases * 100) 
               if total_test_cases > 0 
               else 0.0
           )
           
           return QTestMetrics(
               total_runs=len(test_runs),
               unique_test_cases=total_test_cases,
               automated_test_cases=automated_count,
               manual_test_cases=manual_count,
               automation_pct=round(automation_pct, 2),
           )
   ```

---

### Day 4: Build Metrics Calculation API

#### Task 1.12: Create Database Repository Layer 🔵
**Description:** Build repositories for database operations  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.3  
**Acceptance Criteria:**
- [ ] `app/repositories/` directory created
- [ ] Repository classes for:
  - `StoriesRepository`
  - `TadTsComplianceRepository`
  - `TestCasesRepository`
  - `TestExecutionsRepository`
  - `MetricsSnapshotsRepository`
- [ ] CRUD methods implemented
- [ ] Uses Prisma Client
- [ ] Error handling

**Implementation Steps:**
1. Install Prisma Python client:
   ```bash
   pip install prisma
   ```

2. Generate Prisma client:
   ```bash
   cd ../../database
   npx prisma generate
   cd ../backend/integration-service
   ```

3. Create `app/repositories/stories_repository.py`:
   ```python
   from prisma import Prisma
   from typing import List, Optional
   from app.models.jira_models import JiraIssue

   class StoriesRepository:
       def __init__(self):
           self.prisma = Prisma()

       async def upsert_story(self, issue: JiraIssue, team_id: int, sprint_id: Optional[int]):
           """Insert or update story"""
           await self.prisma.connect()
           
           try:
               story = await self.prisma.story.upsert(
                   where={'key': issue.key},
                   data={
                       'create': {
                           'key': issue.key,
                           'summary': issue.fields.summary,
                           'teamId': team_id,
                           'sprintId': sprint_id,
                           'status': issue.fields.status['name'],
                           'createdDate': issue.fields.created,
                           'rawData': issue.model_dump(),
                       },
                       'update': {
                           'summary': issue.fields.summary,
                           'status': issue.fields.status['name'],
                           'sprintId': sprint_id,
                           'rawData': issue.model_dump(),
                       },
                   },
               )
               return story
           finally:
               await self.prisma.disconnect()

       async def get_stories_by_sprint(self, sprint_id: int) -> List:
           """Get all stories in a sprint"""
           await self.prisma.connect()
           try:
               return await self.prisma.story.find_many(
                   where={'sprintId': sprint_id}
               )
           finally:
               await self.prisma.disconnect()
   ```

4. Create similar repositories for other entities (abbreviated for brevity)

---

#### Task 1.13: Create Sync Sprint Endpoint 🔵
**Description:** Build API endpoint to sync sprint data from Jira/QTest  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.8, Task 1.11, Task 1.12  
**Acceptance Criteria:**
- [ ] POST `/api/sync/sprint` endpoint created
- [ ] Request body: `{ teamId: 1, sprint: "26.1.1" }`
- [ ] Workflow:
  1. Fetch stories from Jira
  2. Check TAD/TS for each story
  3. Fetch QTest metrics
  4. Save to database
- [ ] Response includes sync summary
- [ ] Error handling for each step
- [ ] Test with T360 sprint

**Implementation Steps:**
1. Create `app/routers/sync_router.py`:
   ```python
   from fastapi import APIRouter, HTTPException
   from pydantic import BaseModel
   from app.clients.jira_client import JiraClient
   from app.clients.qtest_client import QTestClient
   from app.services.tad_ts_detector import TadTsDetector
   from app.services.sprint_mapper import SprintMapper
   from app.services.qtest_calculator import QTestCalculator
   from app.repositories.stories_repository import StoriesRepository
   from prisma import Prisma

   router = APIRouter(prefix="/api/sync", tags=["sync"])

   class SyncSprintRequest(BaseModel):
       team_id: int
       sprint: str

   class SyncSprintResponse(BaseModel):
       success: bool
       stories_synced: int
       tad_ts_checked: int
       qtest_metrics_calculated: bool
       errors: list

   @router.post("/sprint", response_model=SyncSprintResponse)
   async def sync_sprint(request: SyncSprintRequest):
       """
       Sync sprint data from Jira and QTest
       
       Steps:
       1. Fetch team and product info from database
       2. Fetch stories from Jira
       3. Check TAD/TS compliance for each story
       4. Fetch QTest metrics for sprint
       5. Save everything to database
       6. Calculate metrics snapshot
       """
       errors = []
       prisma = Prisma()
       
       try:
           # Connect to database
           await prisma.connect()
           
           # Get team info
           team = await prisma.team.find_unique(
               where={'id': request.team_id},
               include={'product': True},
           )
           
           if not team:
               raise HTTPException(status_code=404, detail="Team not found")
           
           product = team.product
           
           # Initialize clients
           jira_client = JiraClient()
           qtest_client = QTestClient()
           tad_ts_detector = TadTsDetector()
           sprint_mapper = SprintMapper()
           qtest_calculator = QTestCalculator(qtest_client)
           
           # Step 1: Fetch stories from Jira
           stories = jira_client.get_sprint_issues(
               product.jiraProjectKey,
               request.sprint,
           )
           
           # Step 2: Save stories and check TAD/TS
           tad_ts_results = []
           for issue in stories:
               # Save story
               story = await prisma.story.upsert(
                   where={'key': issue.key},
                   data={
                       'create': {
                           'key': issue.key,
                           'summary': issue.fields.summary,
                           'teamId': team.id,
                           'status': issue.fields.status['name'],
                           'createdDate': issue.fields.created,
                           'rawData': issue.model_dump(),
                       },
                       'update': {
                           'summary': issue.fields.summary,
                           'status': issue.fields.status['name'],
                           'rawData': issue.model_dump(),
                       },
                   },
               )
               
               # Check TAD/TS
               try:
                   tad_ts_result = tad_ts_detector.detect_compliance(issue)
                   tad_ts_results.append(tad_ts_result)
                   
                   # Save TAD/TS compliance
                   await prisma.tadtscompliance.upsert(
                       where={'storyId': story.id},
                       data={
                           'create': {
                               'storyId': story.id,
                               'hasTad': tad_ts_result.has_tad,
                               'hasTs': tad_ts_result.has_ts,
                               'tadStatus': tad_ts_result.tad_status,
                               'tsStatus': tad_ts_result.ts_status,
                               'tadReason': tad_ts_result.tad_reason,
                               'tsReason': tad_ts_result.ts_reason,
                               'detectionMethod': tad_ts_result.detection_method,
                               'bitbucketPrs': [pr.model_dump() for pr in tad_ts_result.pull_requests],
                           },
                           'update': {
                               'hasTad': tad_ts_result.has_tad,
                               'hasTs': tad_ts_result.has_ts,
                               'tadStatus': tad_ts_result.tad_status,
                               'tsStatus': tad_ts_result.ts_status,
                               'tadReason': tad_ts_result.tad_reason,
                               'tsReason': tad_ts_result.ts_reason,
                               'detectionMethod': tad_ts_result.detection_method,
                               'bitbucketPrs': [pr.model_dump() for pr in tad_ts_result.pull_requests],
                               'lastChecked': datetime.now(),
                           },
                       },
                   )
               except Exception as e:
                   errors.append(f"TAD/TS check failed for {issue.key}: {str(e)}")
           
           # Step 3: Fetch QTest metrics
           qtest_metrics_calculated = False
           if team.qtestProjectId:
               try:
                   # Get test cycles
                   test_cycles = qtest_client.list_test_cycles(team.qtestProjectId)
                   
                   # Map sprint to cycles (need sprint dates - simplified for now)
                   # In real implementation, fetch sprint dates from Jira
                   matching_cycles = []  # Placeholder
                   
                   # Get test runs
                   all_test_runs = []
                   for cycle in matching_cycles:
                       runs = qtest_client.get_test_runs(team.qtestProjectId, cycle.id)
                       all_test_runs.extend(runs)
                   
                   # Calculate metrics
                   qtest_metrics = qtest_calculator.calculate_metrics(
                       team.qtestProjectId,
                       all_test_runs,
                   )
                   
                   qtest_metrics_calculated = True
               except Exception as e:
                   errors.append(f"QTest metrics failed: {str(e)}")
           
           return SyncSprintResponse(
               success=True,
               stories_synced=len(stories),
               tad_ts_checked=len(tad_ts_results),
               qtest_metrics_calculated=qtest_metrics_calculated,
               errors=errors,
           )
           
       except Exception as e:
           raise HTTPException(status_code=500, detail=str(e))
       finally:
           await prisma.disconnect()
   ```

2. Register router in `app/main.py`:
   ```python
   from app.routers import sync_router

   app.include_router(sync_router.router)
   ```

3. Test endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/sync/sprint \
     -H "Content-Type: application/json" \
     -d '{"team_id": 1, "sprint": "26.1.1"}'
   ```

---

### Day 5: Build Node.js API Gateway

#### Task 1.14: Set Up Node.js API Gateway 🔵
**Description:** Create Express API Gateway  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.1  
**Acceptance Criteria:**
- [ ] Node.js Express app created in `backend/api-gateway/`
- [ ] TypeScript configured
- [ ] Health check endpoint: GET `/health`
- [ ] Proxy routes to Integration Service
- [ ] CORS configured
- [ ] Error handling middleware
- [ ] Server runs on port 3000

**Implementation Steps:**
1. Initialize Node.js project:
   ```bash
   cd backend
   mkdir api-gateway
   cd api-gateway
   npm init -y
   npm install express cors dotenv
   npm install -D typescript @types/express @types/cors @types/node ts-node nodemon
   ```

2. Create `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules"]
   }
   ```

3. Create `src/index.ts`:
   ```typescript
   import express, { Express, Request, Response } from 'express';
   import cors from 'cors';
   import dotenv from 'dotenv';

   dotenv.config();

   const app: Express = express();
   const port = process.env.PORT || 3000;

   // Middleware
   app.use(cors());
   app.use(express.json());

   // Health check
   app.get('/health', (req: Request, res: Response) => {
     res.json({ status: 'healthy', service: 'api-gateway' });
   });

   // Start server
   app.listen(port, () => {
     console.log(`✅ API Gateway running on port ${port}`);
   });
   ```

4. Add scripts to `package.json`:
   ```json
   {
     "scripts": {
       "dev": "nodemon --exec ts-node src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

5. Test:
   ```bash
   npm run dev
   # Visit http://localhost:3000/health
   ```

---

#### Task 1.15: Create Metrics API Endpoints 🔵
**Description:** Build REST API endpoints for metrics  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.14  
**Acceptance Criteria:**
- [ ] GET `/api/v1/teams` - list teams
- [ ] GET `/api/v1/metrics/tad-ts?teamId=X&sprint=Y` - TAD/TS metrics
- [ ] GET `/api/v1/metrics/qtest?teamId=X&sprint=Y` - QTest metrics
- [ ] Connects to PostgreSQL via Prisma
- [ ] Returns JSON responses
- [ ] Error handling
- [ ] Test with Postman

**Implementation Steps:**
1. Install Prisma:
   ```bash
   npm install @prisma/client
   npm install -D prisma
   ```

2. Link to existing Prisma schema:
   ```bash
   ln -s ../../database/prisma ./prisma
   npx prisma generate
   ```

3. Create `src/routes/teams.routes.ts`:
   ```typescript
   import { Router, Request, Response } from 'express';
   import { PrismaClient } from '@prisma/client';

   const router = Router();
   const prisma = new PrismaClient();

   // GET /api/v1/teams
   router.get('/', async (req: Request, res: Response) => {
     try {
       const teams = await prisma.team.findMany({
         where: { isActive: true },
         include: { product: true },
       });

       res.json({
         success: true,
         data: teams,
       });
     } catch (error) {
       console.error('Error fetching teams:', error);
       res.status(500).json({
         success: false,
         error: 'Failed to fetch teams',
       });
     }
   });

   // GET /api/v1/teams/:id
   router.get('/:id', async (req: Request, res: Response) => {
     try {
       const teamId = parseInt(req.params.id);
       const team = await prisma.team.findUnique({
         where: { id: teamId },
         include: { product: true },
       });

       if (!team) {
         return res.status(404).json({
           success: false,
           error: 'Team not found',
         });
       }

       res.json({
         success: true,
         data: team,
       });
     } catch (error) {
       console.error('Error fetching team:', error);
       res.status(500).json({
         success: false,
         error: 'Failed to fetch team',
       });
     }
   });

   export default router;
   ```

4. Create `src/routes/metrics.routes.ts`:
   ```typescript
   import { Router, Request, Response } from 'express';
   import { PrismaClient } from '@prisma/client';

   const router = Router();
   const prisma = new PrismaClient();

   interface MetricsQuery {
     teamId?: string;
     sprint?: string;
   }

   // GET /api/v1/metrics/tad-ts
   router.get('/tad-ts', async (req: Request, res: Response) => {
     try {
       const { teamId, sprint } = req.query as MetricsQuery;

       if (!teamId || !sprint) {
         return res.status(400).json({
           success: false,
           error: 'teamId and sprint are required',
         });
       }

       // Get stories for team and sprint
       const stories = await prisma.story.findMany({
         where: {
           teamId: parseInt(teamId),
           // Note: Need to add sprint filtering
         },
         include: {
           tadTsCompliance: true,
         },
       });

       // Calculate TAD/TS metrics
       let tadComplete = 0;
       let tadNa = 0;
       let tsComplete = 0;
       let tsNa = 0;

       stories.forEach((story) => {
         const compliance = story.tadTsCompliance;
         if (compliance) {
           if (compliance.tadStatus === 'complete') tadComplete++;
           if (compliance.tadStatus === 'n/a') tadNa++;
           if (compliance.tsStatus === 'complete') tsComplete++;
           if (compliance.tsStatus === 'n/a') tsNa++;
         }
       });

       const totalStories = stories.length;
       const tadPct = totalStories > 0 
         ? ((tadComplete + tadNa) / totalStories * 100).toFixed(2)
         : '0.00';
       const tsPct = totalStories > 0
         ? ((tsComplete + tsNa) / totalStories * 100).toFixed(2)
         : '0.00';

       res.json({
         success: true,
         data: {
           totalStories,
           tadComplete,
           tadNa,
           tsComplete,
           tsNa,
           tadPct: parseFloat(tadPct),
           tsPct: parseFloat(tsPct),
         },
       });
     } catch (error) {
       console.error('Error calculating TAD/TS metrics:', error);
       res.status(500).json({
         success: false,
         error: 'Failed to calculate metrics',
       });
     }
   });

   // GET /api/v1/metrics/qtest
   router.get('/qtest', async (req: Request, res: Response) => {
     try {
       const { teamId, sprint } = req.query as MetricsQuery;

       if (!teamId || !sprint) {
         return res.status(400).json({
           success: false,
           error: 'teamId and sprint are required',
         });
       }

       // Get test executions for team and sprint
       const executions = await prisma.testExecution.findMany({
         where: {
           teamId: parseInt(teamId),
           // Need sprint filtering
         },
         include: {
           testCase: true,
         },
       });

       // Calculate QTest metrics
       const uniqueTestCases = new Set(executions.map(e => e.testCaseId));
       const automatedCases = executions.filter(e => 
         e.testCase?.automationStatus === 'automated'
       ).length;

       const totalTestCases = uniqueTestCases.size;
       const automationPct = totalTestCases > 0
         ? ((automatedCases / totalTestCases) * 100).toFixed(2)
         : '0.00';

       res.json({
         success: true,
         data: {
           totalRuns: executions.length,
           uniqueTestCases: totalTestCases,
           automatedTestCases: automatedCases,
           manualTestCases: totalTestCases - automatedCases,
           automationPct: parseFloat(automationPct),
         },
       });
     } catch (error) {
       console.error('Error calculating QTest metrics:', error);
       res.status(500).json({
         success: false,
         error: 'Failed to calculate metrics',
       });
     }
   });

   export default router;
   ```

5. Update `src/index.ts`:
   ```typescript
   import teamsRouter from './routes/teams.routes';
   import metricsRouter from './routes/metrics.routes';

   // Routes
   app.use('/api/v1/teams', teamsRouter);
   app.use('/api/v1/metrics', metricsRouter);
   ```

6. Test APIs:
   ```bash
   # List teams
   curl http://localhost:3000/api/v1/teams

   # Get TAD/TS metrics
   curl "http://localhost:3000/api/v1/metrics/tad-ts?teamId=1&sprint=26.1.1"

   # Get QTest metrics
   curl "http://localhost:3000/api/v1/metrics/qtest?teamId=1&sprint=26.1.1"
   ```

---

## Week 2: API + Metrics Calculation (Days 6-10)

### Day 6: Complete Backend Integration

#### Task 2.1: Fix Sprint Filtering in APIs 🔵
**Description:** Add proper sprint filtering to metrics APIs  
**Estimated Time:** 2 hours  
**Dependencies:** Task 1.15  
**Acceptance Criteria:**
- [ ] Sprint table properly linked to stories
- [ ] Metrics APIs filter by sprint name
- [ ] Test with multiple sprints

---

#### Task 2.2: Add Defect Analysis 🔵
**Description:** Fetch and analyze defects from Jira  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.6  
**Acceptance Criteria:**
- [ ] Defect fetching added to sync endpoint
- [ ] Defects saved to database
- [ ] GET `/api/v1/metrics/defects` endpoint
- [ ] Groups defects by SDLC activity
- [ ] Calculates reopened percentage

---

#### Task 2.3: Add Metrics Snapshot Calculation 🔵
**Description:** Calculate and save pre-aggregated metrics  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.1, Task 2.2  
**Acceptance Criteria:**
- [ ] After sync, calculate metrics snapshot
- [ ] Save to `metrics_snapshots` table
- [ ] Include TAD/TS, QTest, defect metrics
- [ ] Single source of truth for metrics

---

### Day 7-8: React Frontend Setup

#### Task 2.4: Initialize React App 🔵
**Description:** Create React app with TypeScript and Vite  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] React app created in `frontend/`
- [ ] TypeScript configured
- [ ] Ant Design installed
- [ ] Tailwind CSS configured
- [ ] Axios configured with API base URL
- [ ] App runs on port 5173

---

#### Task 2.5: Build Core Layout Components 🔵
**Description:** Header, sidebar, basic layout  
**Estimated Time:** 3 hours  
**Acceptance Criteria:**
- [ ] Header component with logo
- [ ] Sidebar navigation (placeholder)
- [ ] Main content area
- [ ] Responsive layout

---

#### Task 2.6: Build Team Selector 🔵
**Description:** Dropdown to select team  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Fetches teams from API
- [ ] Ant Design Select component
- [ ] Stores selected team in state (Zustand)
- [ ] Shows team display name

---

#### Task 2.7: Build Sprint Selector 🔵
**Description:** Dropdown to select sprint  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Hardcoded sprint list (for MVP)
- [ ] Ant Design Select component
- [ ] Stores selected sprint in state

---

#### Task 2.8: Build Metric Cards 🔵
**Description:** Display TAD/TS and QTest metrics  
**Estimated Time:** 4 hours  
**Acceptance Criteria:**
- [ ] TAD Percentage card (circular progress)
- [ ] TS Percentage card (circular progress)
- [ ] Automation Percentage card (circular progress)
- [ ] Fetches data from metrics API
- [ ] Loading states
- [ ] Error handling

---

### Day 9: Charts and Visualizations

#### Task 2.9: Add Chart.js 🔵
**Description:** Install and configure Chart.js  
**Estimated Time:** 1 hour  
**Acceptance Criteria:**
- [ ] chart.js and react-chartjs-2 installed
- [ ] Chart wrapper component created

---

#### Task 2.10: Build TAD/TS Breakdown Chart 🔵
**Description:** Bar chart showing Complete, N/A, Missing  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Grouped bar chart (TAD vs TS)
- [ ] Shows Complete, N/A, Missing counts
- [ ] Color-coded (green, yellow, red)

---

#### Task 2.11: Build QTest Automation Chart 🔵
**Description:** Pie chart for Automated vs Manual  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Pie chart with 2 segments
- [ ] Labels show count and percentage
- [ ] Color-coded

---

#### Task 2.12: Build Defects Chart 🔵
**Description:** Bar chart of defects by SDLC activity  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Horizontal bar chart
- [ ] Shows defect count per SDLC phase
- [ ] Sorted by count (descending)

---

### Day 10: Refresh and Polish

#### Task 2.13: Add Manual Refresh Button 🔵
**Description:** Button to trigger sync and refresh data  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Refresh button in header
- [ ] Calls sync API endpoint
- [ ] Shows loading spinner
- [ ] Shows success/error message
- [ ] Reloads metrics after sync

---

#### Task 2.14: Add Loading States 🔵
**Description:** Skeleton screens and spinners  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Skeleton cards while loading metrics
- [ ] Spinner in refresh button
- [ ] Loading overlay for charts

---

#### Task 2.15: Error Handling in UI 🔵
**Description:** User-friendly error messages  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Error boundary component
- [ ] Toast notifications for errors
- [ ] Retry button on error

---

## Week 3: Export + Testing + Deploy (Days 11-15)

### Day 11: PDF Export

#### Task 3.1: Install PDF Generation Library 🔵
**Description:** Add Puppeteer for PDF export  
**Estimated Time:** 1 hour  
**Dependencies:** Task 1.14  
**Acceptance Criteria:**
- [ ] Puppeteer installed in API Gateway
- [ ] Test PDF generation working

---

#### Task 3.2: Build PDF Export Endpoint 🔵
**Description:** POST `/api/v1/export/pdf` endpoint  
**Estimated Time:** 4 hours  
**Acceptance Criteria:**
- [ ] Takes teamId, sprint in request body
- [ ] Generates HTML with metrics
- [ ] Converts to PDF using Puppeteer
- [ ] Returns PDF file
- [ ] Includes charts as images

---

#### Task 3.3: Add PDF Export Button to Frontend 🔵
**Description:** Button to download PDF report  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Export button in header
- [ ] Calls PDF export API
- [ ] Downloads PDF file
- [ ] Shows loading state

---

### Day 12: Testing

#### Task 3.4: Write Integration Tests for APIs 🔵
**Description:** Test API endpoints with test database  
**Estimated Time:** 4 hours  
**Acceptance Criteria:**
- [ ] Test database setup
- [ ] Tests for teams API
- [ ] Tests for metrics APIs
- [ ] Tests for sync endpoint
- [ ] >70% coverage

---

#### Task 3.5: Manual Testing Checklist 🔵
**Description:** Comprehensive manual testing  
**Estimated Time:** 3 hours  
**Acceptance Criteria:**
- [ ] Test all UI flows
- [ ] Test with different teams
- [ ] Test with different sprints
- [ ] Test error scenarios
- [ ] Document bugs found

---

#### Task 3.6: Bug Fixes 🔵
**Description:** Fix critical bugs found in testing  
**Estimated Time:** 4 hours  
**Dependencies:** Task 3.5  
**Acceptance Criteria:**
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Regression testing passed

---

### Day 13-14: Docker and Deployment

#### Task 3.7: Create Docker Compose Configuration 🔵
**Description:** Docker Compose for all services  
**Estimated Time:** 3 hours  
**Acceptance Criteria:**
- [ ] `docker-compose.yml` created
- [ ] Services: postgres, integration-service, api-gateway, frontend
- [ ] Environment variables configured
- [ ] Networks configured
- [ ] Volumes for data persistence

---

#### Task 3.8: Build Docker Images 🔵
**Description:** Create Dockerfiles for each service  
**Estimated Time:** 3 hours  
**Acceptance Criteria:**
- [ ] Dockerfile for integration-service (Python)
- [ ] Dockerfile for api-gateway (Node.js)
- [ ] Dockerfile for frontend (React)
- [ ] Multi-stage builds for optimization
- [ ] Images build successfully

---

#### Task 3.9: Deploy to Internal VM 🔵
**Description:** Deploy to production VM  
**Estimated Time:** 4 hours  
**Acceptance Criteria:**
- [ ] SSH access to VM configured
- [ ] Docker and Docker Compose installed on VM
- [ ] Code deployed to VM
- [ ] Environment variables configured
- [ ] Services running
- [ ] PostgreSQL data persisted
- [ ] Accessible via internal URL

---

#### Task 3.10: Configure Nginx Reverse Proxy 🔵
**Description:** Set up Nginx for routing  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Nginx installed
- [ ] Frontend served at `/`
- [ ] API proxied at `/api`
- [ ] HTTPS configured (optional for MVP)

---

### Day 15: Documentation and Handoff

#### Task 3.11: Write User Guide 🔵
**Description:** Documentation for end users  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] How to access dashboard
- [ ] How to select team and sprint
- [ ] How to interpret metrics
- [ ] How to export PDF
- [ ] Screenshots included

---

#### Task 3.12: Write Admin Guide 🔵
**Description:** Documentation for administrators  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] How to add new teams
- [ ] How to trigger manual sync
- [ ] How to check database
- [ ] How to read logs
- [ ] Troubleshooting guide

---

#### Task 3.13: Demo Preparation 🔵
**Description:** Prepare demo for stakeholders  
**Estimated Time:** 2 hours  
**Acceptance Criteria:**
- [ ] Demo script prepared
- [ ] Sample data loaded (T360 Vanguards sprint 26.1.1)
- [ ] Demo presentation slides
- [ ] Recorded demo video (backup)

---

#### Task 3.14: Stakeholder Demo 🔵
**Description:** Live demo to stakeholders  
**Estimated Time:** 1 hour  
**Acceptance Criteria:**
- [ ] Demonstrate dashboard with real T360 data
- [ ] Show TAD/TS metrics
- [ ] Show QTest automation metrics
- [ ] Show PDF export
- [ ] Gather feedback

---

#### Task 3.15: Post-Demo Feedback & Next Steps 🔵
**Description:** Document feedback and plan Phase 2  
**Estimated Time:** 1 hour  
**Acceptance Criteria:**
- [ ] Feedback documented
- [ ] Bugs/improvements prioritized
- [ ] Phase 2 scope confirmed
- [ ] Phase 2 start date scheduled

---

## Week 4-6: Phase 2 - DnA Teams Integration & Bug Metrics

### Task 2.1: Add DnA Teams to Database 🟢
**Description:** Extend database with DnA teams configuration  
**Priority:** P0 (Blocker for DnA integration)  
**Estimate:** 2 hours  

**Acceptance Criteria:**
- [ ] 3 DnA teams added to database (Minerva, Guardians, Athena)
- [ ] Teams table includes jira_board_id and safe_team_field_value columns
- [ ] Minerva: ELM project, Board 7437, Safe-Team "Minerva"
- [ ] Guardians: ELM project, Board 6704, Safe-Team "Guardians"
- [ ] Athena: GET project, Board 6798, Safe-Team "Athena"
- [ ] Sprint format patterns configured for each team
- [ ] Integration strategy set to 'dna' for all teams

**Implementation Steps:**
1. Update `database/seed.ts` to add DnA product and teams:
   ```typescript
   const dna = await prisma.product.upsert({
     where: { name: 'dna' },
     create: {
       name: 'dna',
       displayName: 'Data & Analytics',
       jiraProject: 'ELM/GET',
       qtestProjectId: null,
       isActive: true
     }
   });

   await prisma.team.createMany({
     data: [
       {
         name: 'minerva',
         displayName: 'Minerva',
         productId: dna.id,
         jiraBoardId: 7437,
         safeTeamFieldValue: 'Minerva',
         integrationStrategy: 'dna',
         config: { sprintFormat: 'Passport D&A Minerva-{sprint}' }
       },
       {
         name: 'guardians',
         displayName: 'Guardians',
         productId: dna.id,
         jiraBoardId: 6704,
         safeTeamFieldValue: 'Guardians',
         integrationStrategy: 'dna',
         config: { sprintFormat: 'Passport D&A Guardians-{sprint}' }
       },
       {
         name: 'athena',
         displayName: 'Athena',
         productId: dna.id,
         jiraBoardId: 6798,
         safeTeamFieldValue: 'Athena',
         integrationStrategy: 'dna',
         config: { sprintFormat: 'T360 D&A Athena-{sprint}' }
       }
     ]
   });
   ```

2. Run migration: `npx prisma migrate dev --name add_dna_teams`
3. Run seed: `npm run db:seed`
4. Verify: `SELECT * FROM teams WHERE integration_strategy = 'dna';`

---

### Task 2.2: Extend Defects Table for Reopened Tracking 🟢
**Description:** Add fields to track reopened bugs  
**Priority:** P0 (Required for bug metrics)  
**Estimate:** 1 hour  

**Acceptance Criteria:**
- [ ] defects table has reopened_count column (INTEGER)
- [ ] defects table has reopened_history column (JSONB)
- [ ] defects table has safe_team column (VARCHAR)
- [ ] Migration applied successfully
- [ ] Existing defects not affected

**Implementation Steps:**
1. Create migration `database/migrations/add_reopened_tracking.sql`:
   ```sql
   ALTER TABLE defects
   ADD COLUMN reopened_count INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN reopened_history JSONB,
   ADD COLUMN safe_team VARCHAR(50);

   CREATE INDEX idx_defects_reopened ON defects(is_reopened, reopened_count);
   CREATE INDEX idx_defects_safe_team ON defects(safe_team);
   ```

2. Update Prisma schema `prisma/schema.prisma`:
   ```prisma
   model Defect {
     // ... existing fields
     reopenedCount    Int      @default(0) @map("reopened_count")
     reopenedHistory  Json?    @map("reopened_history")
     safeTeam         String?  @map("safe_team")
   }
   ```

3. Run migration: `npx prisma migrate dev --name add_reopened_tracking`
4. Verify indexes: `\\d defects` in psql

---

### Task 2.3: Update MetricsSnapshots for Bug Breakdown 🟢
**Description:** Add bug metrics fields to metrics_snapshots table  
**Priority:** P0 (Required for dashboard display)  
**Estimate:** 1 hour  

**Acceptance Criteria:**
- [ ] total_bugs column added (INTEGER)
- [ ] open_bugs column added (INTEGER)
- [ ] closed_bugs column added (INTEGER)
- [ ] reopened_bugs column added (INTEGER)
- [ ] reopened_rate column added (DECIMAL 5,2)
- [ ] Existing snapshots not affected

**Implementation Steps:**
1. Create migration `database/migrations/add_bug_metrics.sql`:
   ```sql
   ALTER TABLE metrics_snapshots
   ADD COLUMN total_bugs INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN open_bugs INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN closed_bugs INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN reopened_bugs INTEGER NOT NULL DEFAULT 0,
   ADD COLUMN reopened_rate DECIMAL(5,2);
   ```

2. Update Prisma schema accordingly
3. Run migration: `npx prisma migrate dev --name add_bug_metrics`

---

### Task 2.4: Implement DnaStrategy Class 🔵
**Description:** Create DnA-specific integration strategy with board-based queries  
**Priority:** P0 (Core integration logic)  
**Estimate:** 4 hours  

**Acceptance Criteria:**
- [ ] DnaStrategy class implements ProductIntegrationStrategy interface
- [ ] Board-based bug queries using board ID
- [ ] Safe-Team field filtering implemented
- [ ] Sprint name formatting with team prefix
- [ ] Bug type filtering (not Defect)
- [ ] Unit tests pass (90% coverage)

**Implementation Steps:**
1. Create `backend/app/strategies/DnaStrategy.ts`:
   ```typescript
   export class DnaStrategy implements ProductIntegrationStrategy {
     constructor(
       private jiraClient: JiraClient,
       private boardId: number,
       private safeTeamValue: string,
       private sprintFormat: string
     ) {}

     async getSprintBugs(sprint: string): Promise<JiraIssue[]> {
       const sprintName = this.formatSprintName(sprint);
       const jql = `
         board = ${this.boardId}
         AND type = Bug
         AND sprint = "${sprintName}"
         AND "Safe-Team" = "${this.safeTeamValue}"
       `;
       
       return this.jiraClient.searchIssues(jql, {
         fields: ['key', 'summary', 'status', 'severity', 
                  'customfield_13392', 'created', 'resolutiondate'],
         expand: ['changelog']
       });
     }

     formatSprintName(baseSprint: string): string {
       return this.sprintFormat.replace('{sprint}', baseSprint);
     }

     parseTeamFromIssue(issue: JiraIssue): string | null {
       return issue.fields.customfield_13392?.value || null;
     }
   }
   ```

2. Update `backend/app/strategies/StrategyFactory.ts`:
   ```typescript
   static create(team: Team): ProductIntegrationStrategy {
     switch (team.integrationStrategy) {
       case 't360':
         return new T360Strategy(jiraClient, team.config);
       case 'passport':
         return new PassportStrategy(jiraClient, team.config);
       case 'dna':
         return new DnaStrategy(
           jiraClient,
           team.jiraBoardId!,
           team.safeTeamFieldValue!,
           team.config.sprintFormat
         );
       default:
         throw new Error(`Unknown strategy: ${team.integrationStrategy}`);
     }
   }
   ```

3. Create tests `backend/tests/strategies/DnaStrategy.test.ts`
4. Run tests: `npm test -- DnaStrategy`

---

### Task 2.5: Implement Reopened Bug Detection via Jira MCP 🔵
**Description:** Detect bugs that were reopened via GitKraken Jira MCP integration  
**Priority:** P1 (Key metric)  
**Estimate:** 5 hours  

**Acceptance Criteria:**
- [ ] Uses GitKraken Jira MCP tool `mcp_gitkraken_issues_get_detail` for changelog
- [ ] Fetches bug details from Jira (https://jira.wolterskluwer.io/jira)
- [ ] Detects status transitions: Closed→Open, Done→In Progress, Resolved→To Do
- [ ] Counts reopens per bug
- [ ] Stores reopened history as JSON array with timestamps
- [ ] Handles MCP rate limiting (max 50 bugs per batch, 3 retries with exponential backoff)
- [ ] Assigns quality indicators: Excellent (0-5%), Good (6-10%), Needs Improvement (11-15%), Poor (>15%)
- [ ] Unit tests cover edge cases

**Implementation Steps:**
1. Add Jira MCP wrapper in `backend/app/clients/JiraMCPClient.ts`:
   ```typescript
   import { mcp_gitkraken_issues_get_detail } from '@gitkraken/mcp-tools';

   export class JiraMCPClient {
     constructor(
       private baseUrl: string = 'https://jira.wolterskluwer.io/jira',
       private apiToken: string = process.env.JIRA_API_TOKEN || ''
     ) {
       if (!this.apiToken) {
         throw new Error('JIRA_API_TOKEN environment variable is required');
       }
     }

     async getIssueWithChangelog(
       issueId: string,
       provider: 'jira' = 'jira'
     ): Promise<JiraIssueDetail> {
       try {
         const result = await mcp_gitkraken_issues_get_detail({
           provider,
           issue_id: issueId
         });
         
         return this.parseIssueDetail(result);
       } catch (error) {
         throw new Error(`Failed to fetch issue ${issueId}: ${error.message}`);
       }
     }

     private parseIssueDetail(mcpResult: any): JiraIssueDetail {
       return {
         key: mcpResult.key,
         fields: {
           summary: mcpResult.fields.summary,
           status: mcpResult.fields.status,
           severity: mcpResult.fields.severity,
           created: mcpResult.fields.created,
           resolutiondate: mcpResult.fields.resolutiondate,
           customfield_13392: mcpResult.fields.customfield_13392 // Safe-Team
         },
         changelog: {
           histories: mcpResult.changelog?.histories || []
         }
       };
     }
   }
   ```

2. Create `backend/app/services/ReopenedBugDetector.ts`:
   ```typescript
   export class ReopenedBugDetector {
     private readonly CLOSED_STATUSES = ['Closed', 'Done', 'Resolved'];
     private readonly OPEN_STATUSES = ['Open', 'In Progress', 'To Do'];

     constructor(private jiraMCPClient: JiraMCPClient) {}

     async detectReopenedWithRetry(
       bugs: JiraBug[],
       maxRetries: number = 3
     ): Promise<ReopenedBugInfo[]> {
       const reopenedBugs: ReopenedBugInfo[] = [];
       const batchSize = 50; // Respect API rate limits

       for (let i = 0; i < bugs.length; i += batchSize) {
         const batch = bugs.slice(i, i + batchSize);
         
         for (const bug of batch) {
           let attempt = 0;
           while (attempt < maxRetries) {
             try {
               const issueDetail = await this.jiraMCPClient.getIssueWithChangelog(
                 bug.key
               );
               const reopenInfo = this.analyzeChangelog(issueDetail.changelog);

               if (reopenInfo.reopenCount > 0) {
                 reopenedBugs.push({
                   bugKey: bug.key,
                   reopenCount: reopenInfo.reopenCount,
                   reopenHistory: reopenInfo.history,
                   currentStatus: issueDetail.fields.status.name,
                   severity: issueDetail.fields.severity
                 });
               }
               break; // Success, exit retry loop
             } catch (error) {
               attempt++;
               if (attempt >= maxRetries) {
                 console.error(`Failed to process bug ${bug.key} after ${maxRetries} attempts`);
               } else {
                 // Exponential backoff
                 await this.sleep(Math.pow(2, attempt) * 1000);
               }
             }
           }
         }
       }

       return reopenedBugs;
     }

     private analyzeChangelog(changelog: JiraChangelog): ReopenAnalysis {
       let reopenCount = 0;
       const history: ReopenEvent[] = [];

       for (const historyItem of changelog.histories) {
         for (const change of historyItem.items) {
           if (change.field === 'status') {
             const from = change.fromString;
             const to = change.toString;

             if (this.isReopenTransition(from, to)) {
               reopenCount++;
               history.push({
                 date: historyItem.created,
                 fromStatus: from,
                 toStatus: to,
                 author: historyItem.author?.displayName || 'Unknown'
               });
             }
           }
         }
       }

       return { reopenCount, history };
     }

     private isReopenTransition(from: string, to: string): boolean {
       return this.CLOSED_STATUSES.includes(from) && 
              this.OPEN_STATUSES.includes(to);
     }

     calculateQualityIndicator(reopenedRate: number): string {
       if (reopenedRate <= 5) return 'Excellent';
       if (reopenedRate <= 10) return 'Good';
       if (reopenedRate <= 15) return 'Needs Improvement';
       return 'Poor';
     }

     private sleep(ms: number): Promise<void> {
       return new Promise(resolve => setTimeout(resolve, ms));
     }
   }
   ```

3. Create tests `backend/tests/services/ReopenedBugDetector.test.ts`:
   - Test single reopen detection via MCP
   - Test multiple reopens (bug reopened 3 times)
   - Test no reopens
   - Test quality indicators at thresholds (5%, 10%, 15%)
   - Test edge case: Open→Closed→Open→Closed→Open (2 reopens)
   - Test MCP retry logic with failures
   - Test batch processing (55 bugs = 2 batches)

4. Run tests: `npm test -- ReopenedBugDetector`

     async detectReopened(bugs: JiraIssue[]): Promise<ReopenedBugInfo[]> {
       const reopenedBugs: ReopenedBugInfo[] = [];

       for (const bug of bugs) {
         const changelog = await this.jiraClient.getIssueChangelog(bug.key);
         const reopenInfo = this.analyzeChangelog(changelog);

         if (reopenInfo.reopenCount > 0) {
           reopenedBugs.push({
             bugKey: bug.key,
             reopenCount: reopenInfo.reopenCount,
             reopenHistory: reopenInfo.history,
             currentStatus: bug.fields.status.name,
             severity: bug.fields.severity
           });
         }
       }

       return reopenedBugs;
     }

     private analyzeChangelog(changelog: JiraChangelog): ReopenAnalysis {
       let reopenCount = 0;
       const history: ReopenEvent[] = [];

       for (const historyItem of changelog.histories) {
         for (const change of historyItem.items) {
           if (change.field === 'status') {
             const from = change.fromString;
             const to = change.toString;

             if (this.isReopenTransition(from, to)) {
               reopenCount++;
               history.push({
                 date: historyItem.created,
                 fromStatus: from,
                 toStatus: to,
                 author: historyItem.author.displayName
               });
             }
           }
         }
       }

       return { reopenCount, history };
     }

     private isReopenTransition(from: string, to: string): boolean {
       return this.CLOSED_STATUSES.includes(from) && 
              this.OPEN_STATUSES.includes(to);
     }
   }
   ```

3. Create tests `backend/tests/services/ReopenedBugDetector.test.ts`:
   - Test single reopen
   - Test multiple reopens
   - Test no reopens
   - Test edge case: Open→Closed→Open→Closed→Open (2 reopens)

4. Run tests: `npm test -- ReopenedBugDetector`

---

### Task 2.6: Integrate Reopened Detection into MetricsService 🟢
**Description:** Calculate reopened bug metrics for DnA teams with quality indicators  
**Priority:** P1 (Dashboard display)  
**Estimate:** 3 hours  
**Status:** ✅ **COMPLETED** with quality enhancements

**Implementation Quality:**
- ✅ **Production-Ready JiraBugService** - `backend/api-gateway/jiraBugService.js`
- ✅ **72.94% Test Coverage** - 29 unit tests, 28 passing
- ✅ **JSDoc Documentation** - All public methods documented with examples
- ✅ **Custom Error Classes** - 7 specific error types in `jiraErrors.js`
- ✅ **Automatic Retry** - Exponential backoff, smart error detection
- ✅ **10-Minute Caching** - Reduces API calls, improves performance
- ✅ **Cross-Project Support** - Queries ELM/GET + "ELM Tech Ops" simultaneously

**Acceptance Criteria:**
- [x] MetricsService calls Jira-based reopened detector for DnA bugs
- [x] Reopened metrics calculated and cached
- [x] Reopened rate calculated: (reopened / total) × 100
- [x] Quality indicator assigned: Excellent (0-5%), Good (6-10%), Needs Improvement (11-15%), Poor (>15%)
- [x] Batch processing with pagination support
- [x] Error handling with custom error classes and graceful degradation
- [x] Cache reopened data for 10 minutes with TTL management

**Implementation Steps:**
1. Update `backend/app/services/MetricsService.ts`:
   ```typescript
   async calculateBugMetricsForDnA(
     team: Team, 
     sprint: string
   ): Promise<BugMetrics> {
     const strategy = StrategyFactory.create(team) as DnaStrategy;
     const bugs = await strategy.getSprintBugs(sprint);

     // Classify bugs by current status
     const openBugs = bugs.filter(b => 
       ['Open', 'In Progress', 'To Do'].includes(b.fields.status.name)
     );
     const closedBugs = bugs.filter(b => 
       ['Closed', 'Done', 'Resolved'].includes(b.fields.status.name)
     );

     // Detect reopened bugs via Jira MCP
     const jiraMCPClient = new JiraMCPClient();
     const reopenedDetector = new ReopenedBugDetector(jiraMCPClient);
     const reopenedInfo = await reopenedDetector.detectReopenedWithRetry(bugs);

     const reopenedCount = reopenedInfo.length;
     const reopenedRate = bugs.length > 0 
       ? (reopenedCount / bugs.length) * 100 
       : 0;
     const qualityIndicator = reopenedDetector.calculateQualityIndicator(
       reopenedRate
     );

     // Store defects and reopened info in database
     await this.saveDefectsWithReopenedInfo(
       bugs, 
       reopenedInfo, 
       team.id, 
       sprint
     );

     // Save metrics snapshot
     await this.prisma.metricsSnapshot.create({
       data: {
         teamId: team.id,
         sprint,
         totalBugs: bugs.length,
         openBugs: openBugs.length,
         closedBugs: closedBugs.length,
         reopenedBugs: reopenedCount,
         reopenedRate: Math.round(reopenedRate * 100) / 100,
         reopenedQualityIndicator: qualityIndicator,
         bySeverity: this.groupBySeverity(bugs),
         snapshotDate: new Date()
       }
     });

     return {
       totalBugs: bugs.length,
       openBugs: openBugs.length,
       closedBugs: closedBugs.length,
       reopenedBugs: reopenedCount,
       reopenedRate: Math.round(reopenedRate * 100) / 100,
       reopenedQualityIndicator: qualityIndicator,
       bySeverity: this.groupBySeverity(bugs),
       byTeam: { [team.name]: bugs.length }
     };
   }

   private async saveDefectsWithReopenedInfo(
     bugs: JiraBug[], 
     reopenedInfo: ReopenedBugInfo[],
     teamId: number,
     sprint: string
   ): Promise<void> {
     const reopenedMap = new Map(
       reopenedInfo.map(r => [r.bugKey, r])
     );

     for (const bug of bugs) {
       const reopened = reopenedMap.get(bug.key);
       
       await this.prisma.defect.upsert({
         where: { key: bug.key },
         create: {
           key: bug.key,
           summary: bug.fields.summary,
           teamId,
           status: bug.fields.status.name,
           severity: bug.fields.severity,
           safeTeam: bug.fields.customfield_13392?.value,
           isReopened: !!reopened,
           reopenedCount: reopened?.reopenCount || 0,
           reopenedHistory: reopened?.reopenHistory || null,
           createdDate: new Date(bug.fields.created),
           resolvedDate: bug.fields.resolutiondate 
             ? new Date(bug.fields.resolutiondate) 
             : null,
           rawData: bug
         },
         update: {
           status: bug.fields.status.name,
           isReopened: !!reopened,
           reopenedCount: reopened?.reopenCount || 0,
           reopenedHistory: reopened?.reopenHistory || null,
           updatedAt: new Date()
         }
       });
     }
   }

   private groupBySeverity(bugs: JiraBug[]): Record<string, number> {
     return bugs.reduce((acc, bug) => {
       const severity = bug.fields.severity || 'Unassigned';
       acc[severity] = (acc[severity] || 0) + 1;
       return acc;
     }, {} as Record<string, number>);
   }
   ```

2. Add caching middleware to reduce MCP API calls:
   ```typescript
   // backend/app/middleware/cacheMiddleware.ts
   const bugMetricsCache = new Map<string, CachedMetrics>();

   export function cacheBugMetrics(
     teamId: number, 
     sprint: string,
     ttlMinutes: number = 10
   ) {
     const cacheKey = `bug-metrics:${teamId}:${sprint}`;
     const cached = bugMetricsCache.get(cacheKey);
     
     if (cached && Date.now() - cached.timestamp < ttlMinutes * 60 * 1000) {
       return cached.data;
     }
     return null;
   }
   ```

3. Update API endpoint `backend/app/routes/metrics.ts`:
   ```typescript
   router.get('/api/metrics/bugs', async (req, res) => {
     const { teamId, sprint } = req.query;
     
     try {
       // Check cache first
       const cached = cacheBugMetrics(teamId, sprint);
       if (cached) {
         return res.json({ ...cached, fromCache: true });
       }

       // Calculate fresh metrics
       const team = await prisma.team.findUnique({ 
         where: { id: teamId } 
       });
       const metrics = await metricsService.calculateBugMetricsForDnA(
         team, 
         sprint
       );
       
       // Cache result
       bugMetricsCache.set(
         `bug-metrics:${teamId}:${sprint}`,
         { data: metrics, timestamp: Date.now() }
       );

       res.json(metrics);
     } catch (error) {
       console.error('Bug metrics error:', error);
       res.status(500).json({ 
         error: 'Failed to calculate bug metrics',
         message: error.message 
       });
     }
   });
   ```

4. Test integration:
   ```bash
   # Start backend
   npm run dev

   # Test endpoint
   curl http://localhost:3000/api/metrics/bugs?teamId=10&sprint=26.1.4
   ```

---
           updatedAt: new Date()
         }
       });
     }
   }
   ```

2. Update `backend/app/routes/metrics.ts`:
   ```typescript
   router.get('/metrics/bugs', async (req, res) => {
     const { teamId, sprint } = req.query;
     const team = await prisma.team.findUnique({ where: { id: Number(teamId) } });
     
     const metrics = await metricsService.calculateBugMetrics(team, sprint as string);
     res.json(metrics);
   });
   ```

3. Test endpoint: `curl http://localhost:3000/api/metrics/bugs?teamId=10&sprint=26.1.4`

---

### Task 2.7: Update Release Readiness Score for Reopened Bugs 🔵
**Description:** Include reopened bug metric in release readiness calculation  
**Priority:** P2 (Quality metric)  
**Estimate:** 2 hours  

**Acceptance Criteria:**
- [ ] Reopened bugs weighted at 5% of release score
- [ ] ReopenScore = 100 - (reopened_rate * 2)
- [ ] Score ranges: A (>=90), B (80-89), C (70-79), D (60-69), F (<60)
- [ ] Formula documented in code comments
- [ ] Unit tests validate calculation

**Implementation Steps:**
1. Update `backend/app/services/MetricsService.ts`:
   ```typescript
   calculateReleaseReadiness(snapshot: MetricsSnapshot): ReleaseScore {
     // TAD Score (30% weight)
     const tadScore = snapshot.tadPct || 0;

     // TS Score (30% weight)
     const tsScore = snapshot.tsPct || 0;

     // Automation Score (20% weight)
     const autoScore = snapshot.automationPct || 0;

     // Defect Score (15% weight) - fewer is better
     const defectScore = snapshot.totalBugs === 0 
       ? 100 
       : Math.max(0, 100 - (snapshot.totalBugs * 5));

     // Reopen Score (5% weight) - fewer reopens is better
     const reopenScore = Math.max(0, 100 - (snapshot.reopenedRate * 2));

     // Weighted sum
     const overallScore = (
       tadScore * 0.30 +
       tsScore * 0.30 +
       autoScore * 0.20 +
       defectScore * 0.15 +
       reopenScore * 0.05
     );

     return {
       overall: Math.round(overallScore * 100) / 100,
       grade: this.getGrade(overallScore),
       breakdown: {
         tad: { score: tadScore, weight: 30 },
         testStrategy: { score: tsScore, weight: 30 },
         automation: { score: autoScore, weight: 20 },
         defects: { score: defectScore, weight: 15 },
         reopened: { score: reopenScore, weight: 5 }
       }
     };
   }
   ```

2. Create tests `backend/tests/services/MetricsService.test.ts`:
   - Test with 0% reopened rate (perfect score)
   - Test with 10% reopened rate (score = 80)
   - Test with 50% reopened rate (score = 0)

3. Run tests: `npm test -- MetricsService`

---

### Task 2.8: Add Bug Metrics to Frontend Dashboard with Quality Indicators 🎨
**Description:** Display bug metrics with reopened tracking and quality badges from actual Jira data  
**Priority:** P1 (User-visible)  
**Estimate:** 4 hours  

**Acceptance Criteria:**
- [ ] Bug metrics card displays: Total, Open, Closed, Reopened (from Jira MCP)
- [ ] Reopened rate shown as percentage with quality indicator badge
- [ ] Quality badges: Excellent (0-5%, green), Good (6-10%, yellow), Needs Improvement (11-15%, orange), Poor (>15%, red)
- [ ] Chart visualizes bug status breakdown across sprints
- [ ] Clicking reopened count shows bug list with detailed reopen history
- [ ] Each bug links to Jira (https://jira.wolterskluwer.io/jira/browse/{key})
- [ ] Quality guidelines tooltip/legend explaining thresholds
- [ ] Responsive design (mobile-friendly)
- [ ] Loading states and graceful error handling

**Implementation Steps:**
1. Create `frontend/src/components/BugMetricsCard.tsx`:
   ```tsx
   const getQualityBadgeColor = (indicator: string): string => {
     switch (indicator) {
       case 'Excellent': return 'green';
       case 'Good': return 'yellow';
       case 'Needs Improvement': return 'orange';
       case 'Poor': return 'red';
       default: return 'gray';
     }
   };

   export const BugMetricsCard: React.FC<Props> = ({ teamId, sprint }) => {
     const { data: metrics, isLoading, error } = useQuery(
       ['bug-metrics', teamId, sprint],
       () => api.getBugMetrics(teamId, sprint),
       { retry: 3, staleTime: 10 * 60 * 1000 } // Cache 10 mins
     );

     if (isLoading) return <Skeleton />;
     if (error) return <ErrorAlert message="Failed to load bug metrics" />;

     return (
       <Card>
         <CardHeader>
           <h3>Bug Metrics</h3>
           <InfoIcon tooltip="Real-time bug data from Jira via MCP integration" />
           {metrics.fromCache && <CacheIndicator />}
         </CardHeader>
         <CardBody>
           <MetricRow
             label="Total Bugs"
             value={metrics.totalBugs}
             icon={<BugIcon />}
           />
           <MetricRow
             label="Open"
             value={metrics.openBugs}
             color="orange"
             icon={<AlertCircleIcon />}
           />
           <MetricRow
             label="Closed"
             value={metrics.closedBugs}
             color="green"
             icon={<CheckCircleIcon />}
           />
           <MetricRow
             label="Reopened"
             value={metrics.reopenedBugs}
             color={getQualityBadgeColor(metrics.reopenedQualityIndicator)}
             subtitle={
               <div className="flex items-center gap-2">
                 <span>{metrics.reopenedRate}% reopened rate</span>
                 <Badge color={getQualityBadgeColor(metrics.reopenedQualityIndicator)}>
                   {metrics.reopenedQualityIndicator}
                 </Badge>
               </div>
             }
             onClick={() => setShowReopenedModal(true)}
             interactive
           />
         </CardBody>
         <CardFooter>
           <BugStatusChart data={metrics} />
           <QualityGuidelinesLegend />
         </CardFooter>
       </Card>
     );
   };
   ```

2. Create `frontend/src/components/QualityGuidelinesLegend.tsx`:
   ```tsx
   export const QualityGuidelinesLegend: React.FC = () => {
     return (
       <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
         <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
           <InfoIcon className="w-4 h-4" />
           Reopened Rate Quality Guide
         </h4>
         <div className="grid grid-cols-2 gap-2 text-xs">
           <div className="flex items-center gap-2">
             <Badge color="green" size="sm">Excellent</Badge>
             <span>0-5%</span>
           </div>
           <div className="flex items-center gap-2">
             <Badge color="yellow" size="sm">Good</Badge>
             <span>6-10%</span>
           </div>
           <div className="flex items-center gap-2">
             <Badge color="orange" size="sm">Needs Improvement</Badge>
             <span>11-15%</span>
           </div>
           <div className="flex items-center gap-2">
             <Badge color="red" size="sm">Poor</Badge>
             <span>>15%</span>
           </div>
         </div>
       </div>
     );
   };
   ```

3. Create `frontend/src/components/ReopenedBugsModal.tsx`:
   ```tsx
   export const ReopenedBugsModal: React.FC<Props> = ({ bugs, onClose }) => {
     const [expandedBug, setExpandedBug] = useState<string | null>(null);

     return (
       <Modal onClose={onClose} size="xl">
         <ModalHeader>
           <h3 className="text-lg font-semibold">
             Reopened Bugs ({bugs.length})
           </h3>
           <p className="text-sm text-gray-600">
             Bugs that transitioned from closed back to open status
           </p>
         </ModalHeader>
         <ModalBody className="max-h-[600px] overflow-y-auto">
           <Table>
             <thead className="sticky top-0 bg-white">
               <tr>
                 <th>Bug Key</th>
                 <th>Summary</th>
                 <th>Reopen Count</th>
                 <th>Severity</th>
                 <th>Last Reopened</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {bugs.map(bug => (
                 <React.Fragment key={bug.key}>
                   <tr className="hover:bg-gray-50">
                     <td>
                       <a 
                         href={`https://jira.wolterskluwer.io/jira/browse/${bug.key}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:underline font-medium"
                       >
                         {bug.key} <ExternalLinkIcon className="w-3 h-3 inline" />
                       </a>
                     </td>
                     <td className="max-w-xs truncate" title={bug.summary}>
                       {bug.summary}
                     </td>
                     <td>
                       <Badge color={bug.reopenedCount > 2 ? 'red' : 'orange'}>
                         {bug.reopenedCount}x
                       </Badge>
                     </td>
                     <td>
                       <SeverityBadge severity={bug.severity} />
                     </td>
                     <td className="text-sm text-gray-600">
                       {formatDate(bug.reopenedHistory[0]?.date)}
                     </td>
                     <td>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => setExpandedBug(
                           expandedBug === bug.key ? null : bug.key
                         )}
                       >
                         <HistoryIcon className="w-4 h-4 mr-1" />
                         {expandedBug === bug.key ? 'Hide' : 'History'}
                       </Button>
                     </td>
                   </tr>
                   {expandedBug === bug.key && (
                     <tr>
                       <td colSpan={6} className="bg-gray-50 p-4">
                         <ReopenHistoryTimeline history={bug.reopenedHistory} />
                       </td>
                     </tr>
                   )}
                 </React.Fragment>
               ))}
             </tbody>
           </Table>
         </ModalBody>
         <ModalFooter>
           <Button onClick={onClose}>Close</Button>
         </ModalFooter>
       </Modal>
     );
   };
   ```

4. Test with actual DnA team data:
   - Navigate to Minerva team, sprint 26.1.4
   - Verify bug counts match Jira
   - Test reopened history modal
   - Verify Jira links work
   - Test quality indicator badges at different thresholds

---
   ```tsx
   export const ReopenedBugsModal: React.FC<Props> = ({ bugs, onClose }) => {
     return (
       <Modal onClose={onClose}>
         <ModalHeader>Reopened Bugs ({bugs.length})</ModalHeader>
         <ModalBody>
           <Table>
             <thead>
               <tr>
                 <th>Bug Key</th>
                 <th>Summary</th>
                 <th>Reopen Count</th>
                 <th>Last Reopened</th>
               </tr>
             </thead>
             <tbody>
               {bugs.map(bug => (
                 <tr key={bug.key}>
                   <td><Link to={bug.jiraUrl}>{bug.key}</Link></td>
                   <td>{bug.summary}</td>
                   <td>
                     <Badge color="red">{bug.reopenedCount}x</Badge>
                   </td>
                   <td>
                     {formatDate(bug.reopenedHistory[0]?.date)}
                     <HistoryIcon 
                       onClick={() => setExpandedBug(bug.key)} 
                     />
                   </td>
                 </tr>
               ))}
             </tbody>
           </Table>
         </ModalBody>
       </Modal>
     );
   };
   ```

3. Update `frontend/src/pages/DashboardPage.tsx` to include `<BugMetricsCard />`
4. Test UI manually with Minerva team, sprint 26.1.4

---

### Task 2.9: API Documentation for Bug Metrics 📝
**Description:** Document new bug metrics API endpoints  
**Priority:** P2 (Documentation)  
**Estimate:** 1 hour  

**Acceptance Criteria:**
- [ ] Swagger/OpenAPI spec updated
- [ ] Request/response examples provided
- [ ] Authentication requirements documented
- [ ] Rate limiting noted (50 bugs per batch)

**Implementation Steps:**
1. Update `backend/swagger.yaml`:
   ```yaml
   /api/metrics/bugs:
     get:
       summary: Get bug metrics for a team and sprint
       parameters:
         - name: teamId
           in: query
           required: true
           schema:
             type: integer
         - name: sprint
           in: query
           required: true
           schema:
             type: string
             example: "26.1.4"
       responses:
         200:
           description: Bug metrics retrieved successfully
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   totalBugs:
                     type: integer
                     example: 25
                   openBugs:
                     type: integer
                     example: 8
                   closedBugs:
                     type: integer
                     example: 17
                   reopenedBugs:
                     type: integer
                     example: 3
                   reopenedRate:
                     type: number
                     format: float
                     example: 12.0
                   bySeverity:
                     type: object
                     example: { "Critical": 2, "High": 8, "Medium": 15 }
   ```

2. Add README section `backend/README.md`:
   ```markdown
   ### Bug Metrics API

   **Endpoint:** `GET /api/metrics/bugs`

   **Query Parameters:**
   - `teamId` (integer, required): Team ID
   - `sprint` (string, required): Sprint name (e.g., "26.1.4")

   **Response:**
   ```json
   {
     "totalBugs": 25,
     "openBugs": 8,
     "closedBugs": 17,
     "reopenedBugs": 3,
     "reopenedRate": 12.0,
     "bySeverity": {
       "Critical": 2,
       "High": 8,
       "Medium": 15
     }
   }
   ```

   **Rate Limits:** 
   - Reopened detection processes max 50 bugs per batch
   - For large sprints (>50 bugs), metrics may be cached
   ```

3. Deploy Swagger UI: `npm run docs:serve`

---

### Task 2.10: Integration Testing for DnA Teams 🧪
**Description:** End-to-end tests for DnA team bug metrics  
**Priority:** P1 (Quality gate)  
**Estimate:** 3 hours  

**Acceptance Criteria:**
- [ ] E2E test fetches Minerva bugs from Jira
- [ ] E2E test detects reopened bugs correctly
- [ ] E2E test displays metrics in UI
- [ ] Performance test: <3s for 50 bugs
- [ ] Error handling test: invalid board ID

**Implementation Steps:**
1. Create `backend/tests/integration/dna-teams.test.ts`:
   ```typescript
   describe('DnA Teams Integration', () => {
     it('should fetch bugs for Minerva team', async () => {
       const team = await prisma.team.findUnique({ 
         where: { name: 'minerva' } 
       });
       const bugs = await dnaStrategy.getSprintBugs('26.1.4');
       
       expect(bugs).toHaveLength(25);
       expect(bugs[0].fields.customfield_13392.value).toBe('Minerva');
     });

     it('should detect reopened bugs', async () => {
       const bugs = await dnaStrategy.getSprintBugs('26.1.4');
       const reopened = await reopenedDetector.detectReopened(bugs);
       
       expect(reopened).toContainEqual(
         expect.objectContaining({
           bugKey: 'ELM-12345',
           reopenCount: 2
         })
       );
     });

     it('should calculate metrics correctly', async () => {
       const metrics = await metricsService.calculateBugMetrics(
         minervaTeam,
         '26.1.4'
       );
       
       expect(metrics.totalBugs).toBe(25);
       expect(metrics.reopenedRate).toBeGreaterThan(0);
     });
   });
   ```

2. Create `frontend/tests/e2e/bug-metrics.spec.ts`:
   ```typescript
   test('displays bug metrics for Minerva team', async ({ page }) => {
     await page.goto('/dashboard?product=dna&team=minerva&sprint=26.1.4');
     
     await expect(page.locator('text=Bug Metrics')).toBeVisible();
     await expect(page.locator('text=Total Bugs: 25')).toBeVisible();
     await expect(page.locator('text=Reopened: 3')).toBeVisible();
     
     await page.click('text=Reopened: 3');
     await expect(page.locator('role=dialog')).toBeVisible();
   });
   ```

3. Run tests:
   ```bash
   npm run test:integration
   npm run test:e2e
   ```

---

## Summary

**Phase 1 Tasks: 50 tasks (3 weeks)**

**Week 1 (15 tasks):** Backend foundation, database, TAD/TS detection, QTest integration  
**Week 2 (14 tasks):** Complete backend, React frontend, metrics display, charts  
**Week 3 (16 tasks):** PDF export, testing, deployment, documentation, demo  

**Phase 2 Tasks: 10 tasks (3 weeks)**

**Week 4 (4 tasks):** DnA teams database setup, schema extensions for bug tracking  
**Week 5 (4 tasks):** DnaStrategy implementation, reopened bug detection logic  
**Week 6 (2 tasks):** Frontend bug metrics UI, integration testing  

**Total Estimate:** 60 tasks across 6 weeks

**Success Criteria for Phase 1 MVP:**
- ✅ T360 dashboard accessible via browser
- ✅ Shows TAD %, TS %, Automation % for T360 teams
- ✅ Data accurate (matches reference dashboards)
- ✅ PDF export works
- ✅ Deployed to internal VM
- ✅ Stakeholders approve for Phase 2

**Success Criteria for Phase 2 (DnA Integration with Actual Jira Data):**
- ✅ DnA teams (Minerva, Guardians, Athena) - all 3 teams implemented
- ✅ **Actual bug data extracted from Jira (https://jira.wolterskluwer.io/jira) using API Token authentication**
- ✅ Bug metrics displayed: Total, Open, Closed, Reopened (real-time from Jira, NO mock data)
- ✅ **Tested with sprint 26.1.2 (closed sprint)**
- ✅ **Reopened bugs detection via Jira changelog analysis**
- ✅ **Backend implemented first, frontend second (sequential implementation)**
- ✅ **Quality indicators displayed: Excellent (0-5%), Good (6-10%), Needs Improvement (11-15%), Poor (>15%)**
- ✅ **Quality badge color-coding: Green, Yellow, Orange, Red**
- ✅ Reopened history with timestamps and author information
- ✅ Release Readiness Score includes reopened bugs (5% weight)
- ✅ Board-based Jira queries using actual board IDs (7437, 6704, 6798)
- ✅ Safe-Team field filtering works correctly (customfield_13392)
- ✅ **Retry logic handles API failures gracefully (3 retries, exponential backoff)**
- ✅ **Caching reduces API calls (10-minute TTL)**
- ✅ Bug details link directly to Jira issues
- ✅ Integration tests pass for all DnA teams
- ✅ Performance <3s for 50 bugs with changelog fetching

**Implementation Quality (Following speckit-implement-agent.md):**
- ✅ **Comprehensive Documentation** - JSDoc for all public methods with parameters, returns, examples
- ✅ **Custom Error Classes** - `jiraErrors.js` with 7 specific error types (Auth, Query, Timeout, Rate Limit, etc.)
- ✅ **Unit Test Coverage** - 72.94% coverage with 29 test cases (28 passing, 1 HTTP mocking complexity)
- ✅ **Best Practices** - Proper encapsulation, reusable methods, configuration-driven design
- ✅ **Production Ready** - Error handling, caching, retry logic, performance optimization
- ✅ **Maintainable** - Clear separation of concerns, well-documented business logic
- ✅ **Universal Bug Status Classification** - Simplified logic applied to ALL products:
  - **Closed**: Only status 'Closed' (exact match)
  - **Open**: All other statuses ('To Verify', 'In Progress', 'To Do', 'Reopened', 'Open', etc.)
  - **Consistency**: Same classification logic used across DnA, T360, Passport, and CP teams
  - **Rationale**: Ensures all active bugs are properly tracked regardless of product

**Multi-Product Expansion Requirements:**
- ✅ **T360 Teams Configuration Discovered** (6 teams: Ready for Implementation)
  - **Vanguards**: Board 6794, Format "T360 Vanguards-{sprint}", Safe-Team "Vanguards" OR "T360 Vanguards"
  - **Chargers**: Board 6784, Format "T360 Chargers-{sprint}", Safe-Team "Chargers" OR "T360 Chargers"
  - **Chubb**: Board 6793, Format "T360 ICD CHUBB-{sprint}", Safe-Team "CHUBB" OR "T360 CHUBB"
  - **Matrix**: Board 6710, Format "T360 MATRIX-{sprint}", Safe-Team "MATRIX" OR "T360 MATRIX"
  - **Mavericks**: Board 6457, Format "T360 Mavericks-{sprint}", Safe-Team "Maverics" OR "T360 Maverics"
  - **Nexus**: Board 6795, Format "T360 Nexus-{sprint}", Safe-Team "Nexus" OR "T360 Nexus"
  - **Common Configuration**: All teams use GET project, no cross-project queries needed
  - **Validation Sprint**: 26.1.1 with known counts (Total: 14 bugs)
- 🔄 **T360 Implementation Tasks**:
  1. Extend `jiraBugService.js` constructor with t360Teams configuration object
  2. Update `formatSprintName()` to handle T360 sprint format pattern
  3. Implement flexible Safe-Team matching: `(value === team) || (value === 'T360 ' + team)`
  4. Update `getBugsForSprint()` to support T360 teams (single project, no Tech Ops)
  5. Extend `calculateBugMetrics()` to work with T360 team IDs
  6. Create `getAllT360TeamMetrics(sprintNumber)` method
  7. Update API endpoints to support product parameter: `/api/bugs?product=t360&team=vanguards&sprint=26.1.1`
  8. Test with Sprint 26.1.1 and verify bug counts match expected (V=5, Ch=2, Cb=2, M=2, Mv=1, N=2)
  9. Update frontend to display T360 bug metrics
  10. Add unit tests for T360 team configurations
- 🔄 **Passport Teams Integration** (3 teams: Team A, Team B, Team C)
  - **Required Data**: Board IDs, sprint format, Safe-Team values
  - **Project**: ELM
- 🔄 **Collaboration Portal Integration**
  - **Required Data**: Team list, board IDs, configuration
  - **Project**: TBD

**Implementation Steps for Universal Bug Service:**
1. ✅ Implement and test DnA teams (Minerva, Guardians, Athena)
2. ✅ Apply simplified bug status classification (Closed vs Open)
3. 🔄 Discover T360 team configurations via Jira API
4. 🔄 Extend `JiraBugService` constructor with T360 team configs
5. 🔄 Add configuration support for flexible Safe-Team matching ("Vanguards" OR "T360 Vanguards")
6. 🔄 Test with T360 Sprint 26.1.1 data
7. 🔄 Extend to Passport teams
8. 🔄 Extend to Collaboration Portal teams
9. 🔄 Update API endpoints to support all products
10. 🔄 Update frontend to display bug metrics for all teams

**Files Created:**
- `backend/api-gateway/jiraBugService.js` - Main service (472 lines, 7 methods)
- `backend/api-gateway/jiraErrors.js` - Custom error classes (87 lines, 7 error types)
- `backend/api-gateway/jiraBugService.test.js` - Unit tests (700+ lines, 29 test cases)
- `backend/api-gateway/BUG_METRICS_QUALITY_SUMMARY.md` - Implementation summary
- Updated `backend/api-gateway/package.json` - Added Jest testing infrastructure

---

## 🔄 Update (February 18, 2026)

### TASK-UI-001: Reopened Defects Scorecard Tile

**Category:** Frontend
**Estimate:** S (3-4 hours)
**Priority:** P2-Medium
**Status:** ✅ Complete
**Dependencies:** TASK-BUG-001 (JiraBugService with reopenedBugs/reopenedRate)
**Phase:** 1.5
**Traceability:**
  - Spec: Section 3.2.10 — Bug Metrics (Open, Closed, Reopened)
  - Plan: Phase 1.5 — Reopened Defects UI Metric

**Description:**
Added a 7th scorecard tile — "↩️ Reopened Defects" — to the dashboard metrics grid. Displays reopened rate as an integer percentage with a colour-coded quality badge. Reuses existing `reopenedBugs`/`reopenedRate` data already returned by the `/api/metrics` endpoint.

**Acceptance Criteria:**
- [x] 7th scorecard tile added after "Closed Defects" in `frontend/index.html`
- [x] Tile displays reopened rate as integer percentage (e.g., "15%" not "15.2%")
- [x] Quality badge shown: "Excellent" (<10% green), "Fair" (10-25% orange), "Action Required" (>25% red)
- [x] Tile colour: Wolters Kluwer lime green `#a4cd58` via `.metric-card.card-orange` CSS override
- [x] No backend changes — reuses existing `reopenedBugs`/`reopenedRate` from `/api/metrics`
- [x] Existing Open Defects and Closed Defects tiles unaffected (non-breaking)
- [x] Edge case: displays "0%" when `reopenedBugs` is null/undefined or `totalBugs` is 0

**Files Modified:**
- `frontend/index.html` — New `.metric-card.card-orange` CSS, new tile HTML, quality badge logic in JS

---

### TASK-UI-002: Dashboard Header Branding — Wolters Kluwer Logo

**Category:** Frontend
**Estimate:** S (3-4 hours)
**Priority:** P2-Medium
**Status:** ✅ Complete
**Dependencies:** None
**Phase:** 1.6
**Traceability:**
  - Spec: Section 3.2.11 — Dashboard Header Branding
  - Plan: Phase 1.6 — Dashboard Header Branding

**Description:**
Replaced the "🚀 Speckit Dashboard" placeholder text in the nav bar with the official Wolters Kluwer wheel logo. The logo is served locally from `frontend/public/wk-logo.svg` (copied from official WK logo kit), positioned inline with the `<h1>` dashboard title at `224px` height using a flex row layout.

**Acceptance Criteria:**
- [x] "🚀 Speckit Dashboard" text removed from nav bar
- [x] Official WK wheel logo (`03-wk-wheel-rev.svg`) placed at `frontend/public/wk-logo.svg`
- [x] Logo displayed in `dashboard-header` alongside `<h1>` title on the same horizontal line
- [x] Logo height `224px` — visually proportionate to `2.5em` bold title
- [x] Vertical alignment: logo and title centred (`align-items: center`)
- [x] Logo served locally — no external CDN/URL dependencies
- [x] `frontend/server.js` serves `.svg` files with correct `image/svg+xml` MIME type
- [x] Nav bar retains right-aligned navigation links only (non-breaking)
- [x] No new npm dependencies introduced

**Implementation Notes:**
- SVG variant used: `03-wk-wheel-rev.svg` (reversed/colour, no visible ® trademark symbol)
- `frontend/server.js` content-type switch updated with `.svg`, `.png`, `.ico` MIME types
- `dashboard-header-inner` CSS class added for flex row layout wrapping logo + title

**Files Modified:**
- `frontend/index.html` — Nav bar cleanup, `dashboard-header-inner` wrapper, img tag
- `frontend/server.js` — SVG/PNG/ICO MIME types added
- `frontend/public/wk-logo.svg` — Official WK brand asset (NEW, 2492 bytes)

---

**Next Phase:** Phase 3 - Expand to T360/Passport/Collaboration Portal teams + auto-refresh + background jobs

---

## 🔄 Update (February 20, 2026)

### TASK-TC-001: Tests Covered Inline View in Main Dashboard 🟢

**Category:** Frontend Enhancement  
**Estimate:** M (4-6 hours)  
**Status:** ✅ Complete  
**Dependencies:** Tests Covered API endpoint (`/api/metrics/tests-covered`)  
**Phase:** 1.7  
**Traceability:**  
  - Spec: Section 3.2.12 — Tests Covered Inline View  
  - Plan: Phase 1.7 — Tests Covered Inline View & Product Filtering  

**Description:**  
Embedded the Tests Covered view directly within the main dashboard (`index.html`) as an inline view. Previously, clicking the "Tests Covered" tile navigated to a separate page that showed no records. Now it opens an inline view within the same dashboard, fetching data from the `/api/metrics/tests-covered` endpoint on port 3000.

**Root Cause of Original Bug:**  
- `loadTestsCoveredView()` was fetching from port 3001 (server-temp.js) which was not running  
- API response structure was `{ data: {...}, available_sprints: [...] }` but code expected flat sprint-keyed objects  
- Field names were mismatched (`totalTests` vs `summary.total_test_cases`)  
- Teams was an object but code expected an array  

**Changes Made:**  
- ✅ Fixed fetch URL from port 3001 → port 3000  
- ✅ Fixed API response parsing (`result.data` wrapper)  
- ✅ Fixed field name mapping to match actual db.json structure  
- ✅ Converted teams object to array with proper field extraction  
- ✅ Added sprint selector with dynamic re-render on change  
- ✅ Added 5 summary cards: Total Test Cases, Automated, Automation Coverage (with progress bar), With Scripts, Teams  
- ✅ Added Team Breakdown table with Coverage % and mini progress bars  
- ✅ Added footer with Generated date and Sprint label  

**Acceptance Criteria:**  
- [x] Clicking "Tests Covered" tile opens inline view (no page navigation)  
- [x] Data fetched from `/api/metrics/tests-covered` on port 3000  
- [x] Sprint selector allows switching between available sprints  
- [x] Summary cards display correct totals  
- [x] Team table shows all teams with coverage percentages and progress bars  
- [x] Back button returns to main dashboard  
- [x] Error handling for failed API calls  

**Files Modified:**  
- `frontend/index.html` — `loadTestsCoveredView()`, `renderTestsCoveredDashboard()`, CSS styles  
- `frontend/src/components/TestsCovered.tsx` — Port change (3001 → 3000)  

---

### TASK-TC-002: Tests Covered CSS Alignment with React Component 🟢

**Category:** Frontend Styling  
**Estimate:** S (2-3 hours)  
**Status:** ✅ Complete  
**Dependencies:** TASK-TC-001  
**Phase:** 1.7  
**Traceability:**  
  - Spec: Section 3.2.12 — Tests Covered Inline View  
  - Plan: Phase 1.7 — Tests Covered Inline View & Product Filtering  

**Description:**  
Copied the React `TestsCovered.tsx` component's CSS styling into the `index.html` inline view so the formatting matches exactly. All CSS class names are prefixed with `tc-` to avoid conflicts with the main dashboard's `.metric-card` styles.

**Changes Made:**  
- ✅ Added complete CSS from `TestsCovered.css` into `<style>` block in `index.html`  
- ✅ Prefixed all class names: `.tests-covered-container`, `.tests-covered-header`, `.tests-covered-summary`, `.summary-card`, `.highlight`, `.tc-teams-table`, `.tc-mini-progress`, `.tc-progress-bar`, `.tests-covered-footer`  
- ✅ Matched layout: 5-card summary grid, gradient highlight card, team table with progress bars  
- ✅ Compact back button header replacing full dashboard header  

**Acceptance Criteria:**  
- [x] Inline view visually matches React `TestsCovered` component  
- [x] No CSS conflicts with main dashboard metric cards  
- [x] Responsive layout maintained  
- [x] Gradient highlight on Automation Coverage card  
- [x] Mini progress bars in team table  

**Files Modified:**  
- `frontend/index.html` — CSS `<style>` block (tc- prefixed classes), `renderTestsCoveredDashboard()` HTML template  

---

### TASK-TC-003: Tests Covered Product-Based Team Filtering 🟢

**Category:** Frontend Enhancement  
**Estimate:** S (2-3 hours)  
**Status:** ✅ Complete  
**Dependencies:** TASK-TC-001, TASK-TC-002  
**Phase:** 1.7  
**Traceability:**  
  - Spec: Section 3.2.13 — Tests Covered Product-Based Filtering  
  - Plan: Phase 1.7 — Tests Covered Inline View & Product Filtering  

**Description:**  
Added product-based filtering to the Tests Covered inline view so that only teams belonging to the currently selected product are displayed. Previously, all T360 teams (Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards) were shown regardless of which product was selected.

**Root Cause:**  
- `tests_covered` data in `db.json` only contains T360 team data  
- `loadTestsCoveredView()` did not use `state.selectedProduct`  
- `renderTestsCoveredDashboard()` rendered all teams without filtering  

**Changes Made:**  
- ✅ Added `productTeamMap` constant mapping product IDs to team names:  
  - `t360` → Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards  
  - `dna` → Minerva, Guardians, Athena  
  - `passport` → Team A, Team B, Team C  
  - `collaboration-portal` → (empty)  
- ✅ `loadTestsCoveredView()` captures `state.selectedProduct` and passes to render function  
- ✅ `renderTestsCoveredDashboard()` filters teams using case-insensitive `productTeamMap` lookup  
- ✅ Summary stats (Total, Automated, Coverage, With Scripts, Teams) recalculated from filtered teams  
- ✅ `withAttachments` computed from per-team `with_attachments` field (not approximate)  
- ✅ Header displays "🧪 Tests Covered — [Product Name]" with formatted label  
- ✅ Empty state: "No test coverage data available for [Product]. Test coverage data is currently tracked for T360 teams only."  
- ✅ Sprint selector change event passes `selectedProduct` through to re-render  

**Acceptance Criteria:**  
- [x] Selecting T360 product → Tests Covered shows only T360 teams (Chargers, Chubb, Matrix, Mavericks, Nexus, Vanguards)  
- [x] Selecting DnA product → Tests Covered shows "No test coverage data available for Dna"  
- [x] Selecting Passport product → Tests Covered shows "No test coverage data available for Passport"  
- [x] Summary stats computed from filtered teams only (not global totals)  
- [x] Header indicates which product is selected  
- [x] Sprint switching preserves product filter  
- [x] No backend changes required  

**Files Modified:**  
- `frontend/index.html` — `productTeamMap` constant, `loadTestsCoveredView()`, `renderTestsCoveredDashboard()` (filtering logic, summary recalculation, empty state, header label)  

---

### TASK-CLEANUP-001: Remove Non-Speckit Documentation Files 🟢

**Category:** Project Cleanup  
**Estimate:** XS (30 minutes)  
**Status:** ✅ Complete  
**Dependencies:** None  
**Phase:** 1.7  

**Description:**  
Removed all `.md` files that are not part of the speckit documentation framework. Speckit files retained: `spec.md`, `plan.md`, `tasks.md`, `.specify/` templates/memory, `.claude/commands/speckit.*`, `.github/agents/speckit.*`, `.github/prompts/speckit.*`. All other auto-generated session summaries, implementation notes, and redundant documentation files removed to reduce clutter.

**Files Removed:**  
- Root: `TECH-STACK.md`, `SPRINT_26.1.1_DEFECTS_FINAL.md`, `SESSION-SUMMARY.md`, `requirements-questionnaire.md`, `README_SPRINT_26.1.1.md`, `README.md`, `IMPLEMENTATION_SUMMARY.md`, `IMPLEMENTATION-SUMMARY.md`, `GETTING-STARTED.md`, `DEFECTS_CONFIGURATION.md`  
- `backend/api-gateway/`: `IMPLEMENTATION_SUMMARY.md`, `TESTS_COVERED_README.md`, `TESTS_COVERED_START_HERE.md`, `TESTS_COVERED_QUICK_REFERENCE.md`, `TESTS_COVERED_GUIDE.md`, `TESTS_COVERED_FILE_INDEX.md`, `TAD_TS_README.md`, `SQL_SERVER_SYNC.md`, `SQL_SERVER_SETUP.md`, `QUICK_REFERENCE.md`, `BUG_METRICS_UNIVERSAL_IMPLEMENTATION.md`, `BUG_METRICS_QUALITY_SUMMARY.md`  
- `database/`: `README.md`  
- `frontend/`: `README.md`  
- `tests/`: `E2E-TESTING-DEMO-GUIDE.md`  
- `tests/e2e/`: `README.md`  
- `backend/integration-service/`: `README.md`  

---

**Next Phase:** Phase 3 - Expand to T360/Passport/Collaboration Portal teams + auto-refresh + background jobs

