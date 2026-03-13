# Azure Pipeline Integration Documentation

## Overview

This integration fetches pipeline build data from Azure DevOps REST API for three Passport-related projects, computes testing metrics (success/failure rates, durations), caches results in LowDB, and exposes them via REST endpoints for the Passport dashboard.

---

## Configuration

### Environment Variables (`backend/passport-api/.env`)

```dotenv
# Azure DevOps Configuration
AZURE_DEVOPS_PAT=***REMOVED_AZURE_PAT***
AZURE_DEVOPS_ORG=GRC-ELM
AZURE_DEVOPS_PROJECT=Passport
```

### Authentication

- **Method**: Basic Auth with Personal Access Token (PAT)
- **Header**: `Authorization: Basic <base64(':' + PAT)>`
- **Base URL**: `https://dev.azure.com/GRC-ELM/Passport/_apis`

```javascript
const authHeader = 'Basic ' + Buffer.from(':' + pat).toString('base64');
```

---

## Project Folders

Three Azure DevOps folder paths are monitored for testing pipelines:

| Project Key | Label | Azure DevOps Folder Path |
|-------------|-------|--------------------------|
| `passport` | Passport | `\Passport-CI\CT-Pipeline` |
| `citi` | CITI | `\Passport-Client-Automation\CITI` |
| `collaborationPortal` | Collaboration Portal | `\Collaboration Portal-CI` |

---

## API Endpoints (Passport API — Port 3002)

### 1. Sync Pipeline Data

Triggers a fresh fetch from Azure DevOps for all three projects.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/api/sync/azure-pipeline/:productId` |
| **Example** | `POST http://localhost:3002/api/sync/azure-pipeline/passport` |

**Response:**
```json
{
  "success": true,
  "data": {
    "passport": { "metrics": { ... }, "recent_runs": [ ... ] },
    "citi": { "metrics": { ... }, "recent_runs": [ ... ] },
    "collaborationPortal": { "metrics": { ... }, "recent_runs": [ ... ] }
  },
  "errors": [
    { "project": "citi", "label": "CITI", "message": "error details" }
  ]
}
```

### 2. Get Cached Pipeline Data

Returns previously synced pipeline data.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/azure-pipeline/:productId` |
| **Query Params** | `?project=passport\|citi\|collaborationPortal` (optional) |
| **Example** | `GET http://localhost:3002/api/azure-pipeline/passport?project=citi` |

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "passport",
    "projectKey": "citi",
    "label": "CITI",
    "syncedAt": "2026-03-12T10:00:00.000Z",
    "folderPath": "\\Passport-Client-Automation\\CITI",
    "buildUrl": "https://dev.azure.com/GRC-ELM/Passport/_build?definitionScope=...",
    "metrics": { ... },
    "recent_runs": [ ... ],
    "pipeline_names": [ ... ],
    "pipeline_count": 15
  }
}
```

### 3. Export CSV

Download filtered pipeline runs as a CSV file.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/azure-pipeline/:productId/export/csv` |
| **Query Params** | `project`, `category`, `upgradeType`, `dateFrom`, `dateTo` |
| **Example** | `GET http://localhost:3002/api/azure-pipeline/passport/export/csv?project=passport&category=Tosca&dateFrom=2026-01-01` |

**CSV Headers:**
```
Build #, Pipeline Name, Category, Upgrade Type, Status, Result, Start Time, Finish Time, Duration (min), URL
```

---

## Azure DevOps REST API Calls

### 1. List All Pipeline Definitions

```
GET https://dev.azure.com/GRC-ELM/Passport/_apis/build/definitions?$top=1000&api-version=7.1
```

- Paginated using `x-ms-continuationtoken` header
- Client-side filtered by folder path prefix
- Then filtered to **testing pipelines only** via regex patterns

### 2. Fetch Builds Per Pipeline

```
GET https://dev.azure.com/GRC-ELM/Passport/_apis/build/builds?definitions={defId}&$top=50&statusFilter=completed&api-version=7.1
```

- Last 50 completed runs per pipeline
- Fetched in parallel batches of 10

---

## Testing Pipeline Detection

Pipelines are identified as "testing" pipelines using these regex patterns:

```javascript
const TESTING_PATTERNS = [
  /Tosca/i,
  /Aura/i,
  /Playwright/i,
  /^Preupgrade_/i,
  /^Postupgrade_/i,
  /-CT[- ]/i,
  /_CT[- _]/i,
  /CT[- ]Pipeline/i,
  /SmokeTest/i,
  /SmokeDataSetup/i,
];
```

---

## Pipeline Classification

### Category Classification

Each pipeline is classified into a category based on its name:

| Pattern | Category |
|---------|----------|
| `/Invoice/i` | Invoices |
| `/Matter/i` | Matter |
| `/People/i` | People |
| `/Organization/i` | Organization |
| `/Integration/i` | Integration |
| `/Diversity/i` | Diversity |
| `/Tosca/i` | Tosca |
| `/Aura/i` | Aura |
| `/Playwright/i` | Playwright |
| *(default)* | Other |

### Upgrade Type Classification

| Pattern | Type |
|---------|------|
| `/^Preupgrade_/i` | Preupgrade |
| `/^Postupgrade_/i` | Postupgrade |
| *(default)* | Other |

---

## Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AZURE PIPELINE SYNC                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. FETCH ALL PIPELINE DEFINITIONS                                   │
│    GET /build/definitions?$top=1000&api-version=7.1                 │
│    Paginate via x-ms-continuationtoken header                       │
│    Filter by folder path prefix (client-side)                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FILTER TO TESTING PIPELINES                                      │
│    Apply TESTING_PATTERNS regex array                               │
│    Keep only Tosca, Aura, Playwright, CT-Pipeline, etc.             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. FETCH BUILDS (parallel batches of 10)                            │
│    For each testing pipeline definition:                            │
│    GET /build/builds?definitions={id}&$top=50&statusFilter=completed│
│    Map each build → { pipelineName, category, upgradeType,          │
│                        status, result, duration, url }              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. COMPUTE METRICS                                                  │
│    ┌──────────────────────────────────────────────────────────────┐ │
│    │ total_runs, succeeded, failed, canceled                      │ │
│    │ success_rate = succeeded / (succeeded + failed) × 100        │ │
│    │ avg_duration_minutes = mean of all run durations              │ │
│    └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. REPEAT FOR ALL 3 PROJECTS                                        │
│    Passport → CITI → Collaboration Portal                           │
│    Cache each in db.data.azurePipeline[projectKey]                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. STORE IN LOWDB (db.json)                                         │
│    db.data.azurePipeline.passport = { ... }                         │
│    db.data.azurePipeline.citi = { ... }                             │
│    db.data.azurePipeline.collaborationPortal = { ... }              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Pipeline Run

```javascript
{
  id: 12345,
  buildNumber: "20260312.1",
  pipelineName: "Tosca_CT-Pipeline_Invoice",
  category: "Tosca",
  upgradeType: "Other",
  status: "completed",
  result: "succeeded",          // succeeded | failed | canceled | partiallySucceeded
  startTime: "2026-03-12T08:00:00Z",
  finishTime: "2026-03-12T08:45:00Z",
  duration: 45.0,              // minutes
  url: "https://dev.azure.com/GRC-ELM/Passport/_build?definitionScope=..."
}
```

### Metrics (Aggregated)

```javascript
{
  total_runs: 150,
  succeeded: 120,
  failed: 20,
  canceled: 5,
  partially_succeeded: 5,
  success_rate: 85.7,           // %
  failure_rate: 14.3,           // %
  avg_duration_minutes: 38.5    // minutes
}
```

### Cached Project Record

```javascript
{
  productId: "passport",
  projectKey: "passport",
  label: "Passport",
  syncedAt: "2026-03-12T10:00:00.000Z",
  folderPath: "\\Passport-CI\\CT-Pipeline",
  buildUrl: "https://dev.azure.com/GRC-ELM/Passport/_build?definitionScope=...",
  metrics: { /* aggregated metrics */ },
  recent_runs: [ /* array of pipeline runs */ ],
  pipeline_names: ["Tosca_CT-Pipeline_Invoice", "Playwright_SmokeTest", ...],
  pipeline_count: 15
}
```

---

## Code Files

| File | Purpose |
|------|---------|
| `backend/passport-api/integrations/azure-pipeline.integration.js` | Azure DevOps API calls, pattern matching, metrics computation |
| `backend/passport-api/services/azure-pipeline.service.js` | Sync orchestration, caching, CSV export |
| `backend/passport-api/server.js` | REST API route handlers |
| `backend/passport-api/.env` | Azure DevOps PAT and org config |
| `frontend/src/passport/services/api.ts` | Frontend API client + TypeScript types |
| `frontend/src/passport/pages/AzurePipelineDashboard.tsx` | Dashboard UI component |

---

## Key Functions

### Integration Layer (`azure-pipeline.integration.js`)

```javascript
// Fetch testing pipeline runs for a single folder
export async function fetchPipelineRuns(folderPath)

// Fetch all three projects (Passport, CITI, Collaboration Portal)
export async function fetchAllProjects()

// Detect if a pipeline name is a testing pipeline
function isTestingPipeline(name)

// Classify pipeline category (Invoices, Matter, Tosca, etc.)
function classifyCategory(pipelineName)

// Classify upgrade type (Preupgrade, Postupgrade, Other)
function classifyUpgradeType(pipelineName)

// Map Azure DevOps build object to structured run object
function mapBuild(b, defName, org, project, folderPath)
```

### Service Layer (`azure-pipeline.service.js`)

```javascript
// Sync all projects from Azure DevOps and cache in LowDB
export async function syncAzurePipeline(db, productId)

// Get cached data for specific or all projects
export function getAzurePipelineData(db, productId, projectKey)

// Generate filtered CSV export
export function exportAzurePipelineCsv(db, productId, projectKey, filters)
```

### Frontend API (`frontend/src/passport/services/api.ts`)

```typescript
// Get cached pipeline data
export async function getAzurePipelineData(productId, project?)

// Trigger sync from Azure DevOps
export async function syncAzurePipeline(productId)

// Download filtered CSV export
export async function exportAzurePipelineCsv(productId, project, filters?)
```

---

## CSV Export Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | string | `passport` \| `citi` \| `collaborationPortal` |
| `category` | string | `Invoices` \| `Matter` \| `Tosca` \| `Playwright` \| etc. |
| `upgradeType` | string | `Preupgrade` \| `Postupgrade` \| `Other` |
| `dateFrom` | string | ISO date (e.g., `2026-01-01`) |
| `dateTo` | string | ISO date (e.g., `2026-03-31`) |

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| `AZURE_DEVOPS_PAT` not set | Throws error: "AZURE_DEVOPS_PAT is not set in .env" |
| API returns non-200 | Throws with status code and response body (truncated to 300 chars) |
| Individual pipeline build fetch fails | Logs warning, returns empty array for that pipeline, continues with others |
| Individual project fetch fails | Returns error marker, other projects still sync |

---

## Quick Reference

| Item | Value |
|------|-------|
| Azure DevOps URL | `https://dev.azure.com/GRC-ELM/Passport` |
| Azure DevOps PAT | `***REMOVED_AZURE_PAT***` |
| Organization | `GRC-ELM` |
| Project | `Passport` |
| API Version | `7.1` |
| Builds Per Pipeline | Last 50 completed |
| Parallel Batch Size | 10 pipelines at once |
| Passport API Port | `3002` |

---

*Generated: March 12, 2026*
