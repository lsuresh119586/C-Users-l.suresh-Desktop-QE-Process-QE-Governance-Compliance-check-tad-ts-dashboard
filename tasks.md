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

## Summary

**Total Tasks: 50**

**Week 1 (15 tasks):** Backend foundation, database, TAD/TS detection, QTest integration  
**Week 2 (14 tasks):** Complete backend, React frontend, metrics display, charts  
**Week 3 (16 tasks):** PDF export, testing, deployment, documentation, demo  

**Completion Timeline:** 3 weeks (15 working days)

**Success Criteria for Phase 1 MVP:**
- ✅ T360 dashboard accessible via browser
- ✅ Shows TAD %, TS %, Automation % for T360 teams
- ✅ Data accurate (matches reference dashboards)
- ✅ PDF export works
- ✅ Deployed to internal VM
- ✅ Stakeholders approve for Phase 2

---

**Next Phase:** Phase 2 - Expand to all products + auto-refresh (Weeks 4-6)
