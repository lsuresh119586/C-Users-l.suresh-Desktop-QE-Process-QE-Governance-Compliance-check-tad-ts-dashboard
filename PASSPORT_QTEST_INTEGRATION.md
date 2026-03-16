# Passport QTest Integration Documentation

## Overview

This document describes the QTest integration for Passport's "Tests Covered" automation coverage tracking. The system queries QTest API to determine test case automation status linked to ELM (JIRA) cards.

---

## Configuration

### Environment Variables

#### QTest Settings (`backend/passport-api/.env`)

```dotenv
QTEST_URL=https://wk.qtestnet.com
QTEST_BEARER_TOKEN=***REMOVED_QTEST_TOKEN***
QTEST_PROJECT_NAME=Passport
QTEST_PROJECT_ID=119791
QTEST_PROJECT_NAME_SECONDARY=Collaboration Portal
QTEST_PROJECT_ID_SECONDARY=123759
```

#### JIRA Settings (for linking ELM cards)

```dotenv
JIRA_URL=https://jira.wolterskluwer.io/jira
JIRA_API_TOKEN=***REMOVED_JIRA_TOKEN_PASSPORT***
JIRA_PROJECT_KEY=ELM
JIRA_ALLOWED_SPRINTS=26.1.1,26.1.2,26.1.3,26.1.4,26.1.5,26.1.IP
JIRA_ALLOWED_TEAMS=PP Genesis,PP Pioneers,PP Spartacles
```

---

## API Authentication

### QTest API

- **Base URL**: `https://wk.qtestnet.com/api/v3`
- **Authentication**: Bearer Token
- **Header Format**:
```javascript
{
  'Authorization': 'Bearer ***REMOVED_QTEST_TOKEN***',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}
```

### JIRA API

- **Base URL**: `https://jira.wolterskluwer.io/jira`
- **Authentication**: Bearer Token (PAT)
- **Header Format**:
```javascript
{
  'Authorization': 'Bearer ***REMOVED_JIRA_TOKEN_PASSPORT***',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}
```

---

## QTest API Endpoints

### 1. Search Requirements

Find a requirement (ELM card) in QTest by name.

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/api/v3/projects/{projectId}/search` |
| **Purpose** | Search for ELM card as a requirement |

**Request Body:**
```json
{
  "object_type": "requirements",
  "fields": ["id", "pid", "name"],
  "query": "'name' ~ 'ELM-39559'"
}
```

**Response:**
```json
{
  "items": [
    {
      "id": 12345678,
      "pid": "RQ-1234",
      "name": "[ELM-39559] Feature description"
    }
  ]
}
```

---

### 2. Get Linked Test Cases

Retrieve test cases linked to a requirement.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/v3/projects/{projectId}/linked-artifacts?type=requirements&ids={requirementId}` |
| **Purpose** | Get test cases linked to a requirement |

**Response:**
```json
[
  {
    "objects": [
      {
        "id": 87654321,
        "pid": "TC-5678",
        "name": "Test Case Name",
        "target_id": 87654321
      }
    ]
  }
]
```

---

### 3. Get Test Case Details

Fetch full test case information including automation properties.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/v3/projects/{projectId}/test-cases/{testCaseId}` |
| **Purpose** | Get test case properties including automation status |

**Response:**
```json
{
  "id": 87654321,
  "pid": "TC-5678",
  "name": "Verify login functionality",
  "properties": [
    {
      "field_id": 13104748,
      "field_name": "Automation Status",
      "field_value": "Automated",
      "field_value_name": "Automated"
    },
    {
      "field_id": 13593298,
      "field_name": "Automation Tool",
      "field_value": "Playwright",
      "field_value_name": "Playwright"
    }
  ]
}
```

---

### 4. Get Test Cases in Module

Retrieve all test cases within a QTest module.

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/v3/projects/{projectId}/test-cases?parentId={moduleId}&parentType=module&expandProps=true` |
| **Purpose** | Fallback when requirement link not found |

---

## Field IDs

| Field Name | Field ID | Values |
|------------|----------|--------|
| Automation Status | `13104748` | Automated, Manual, Partially Automated, Not Possible, Automation Candidate, Not Evaluated |
| Automation Tool | `13593298` | Playwright, Selenium, Manual, etc. |

---

## Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTOMATION COVERAGE SYNC                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. GET TAD-TS DATA                                                  │
│    Read ELM cards from TAD-TS compliance data (db.json)             │
│    Filter by sprint (e.g., 26.1.3)                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. FOR EACH ELM CARD                                                │
│                                                                     │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ 2a. Search QTest for requirement                            │  │
│    │     POST /api/v3/projects/119791/search                     │  │
│    │     Query: 'name' ~ 'ELM-XXXXX'                             │  │
│    │                                                             │  │
│    │     Try Primary Project (Passport: 119791)                  │  │
│    │     If not found, try Secondary (Collab Portal: 123759)     │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ 2b. Get linked test cases                                   │  │
│    │     GET /api/v3/projects/{id}/linked-artifacts              │  │
│    │     ?type=requirements&ids={requirementId}                  │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ 2c. For each test case, get details                         │  │
│    │     GET /api/v3/projects/{id}/test-cases/{tcId}             │  │
│    │     Extract: Automation Status (field 13104748)             │  │
│    │              Automation Tool (field 13593298)               │  │
│    └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ 2d. Classify automation status                              │  │
│    │     normalizeAutomationStatus(status) →                     │  │
│    │       'Automated' | 'Partially Automated' | 'Manual' |      │  │
│    │       'Not Possible' | 'Automation Candidate' |             │  │
│    │       'Not Evaluated'                                       │  │
│    └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. CALCULATE COVERAGE                                               │
│                                                                     │
│    Per ELM Card:                                                    │
│    ┌──────────────────────────────────────────────────────────────┐ │
│    │ coveragePercentage = (automated + partiallyAutomated)        │ │
│    │                      / totalTestCases * 100                  │ │
│    └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    Per Sprint:                                                      │
│    ┌──────────────────────────────────────────────────────────────┐ │
│    │ Aggregate all ELM card metrics                               │ │
│    │ Calculate by team, by tool breakdowns                        │ │
│    └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. STORE RESULTS                                                    │
│    Save to db.json under metrics.automation-coverage                │
│    Update syncHistory with timestamp                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Code Files

| File | Purpose |
|------|---------|
| `backend/passport-api/integrations/qtest.integration.js` | Core QTest API functions |
| `backend/passport-api/services/automation-coverage.service.js` | Coverage orchestration |
| `backend/passport-api/server.js` | REST API endpoints |
| `backend/passport-api/.env` | Configuration |

---

## Key Functions

### `qtest.integration.js`

```javascript
// Search for requirement by ELM key (searches both projects)
export async function searchRequirement(elmKey)

// Search remaining projects if first had 0 linked TCs
export async function searchRequirementSkipping(elmKey, skipProjectId)

// Get test cases linked to a requirement
export async function getLinkedTestCases(requirementId, projectBaseUrl)

// Get test cases in a module (fallback)
export async function getTestCasesInModule(moduleId, projectBaseUrl)

// Get full test case details
export async function getTestCaseDetails(testCaseId, projectBaseUrl)

// Extract automation status from properties
export function classifyAutomationStatus(properties)

// Normalize status to standard values
export function normalizeAutomationStatus(status)

// Build QTest URL for browser link
export function buildQTestUrl(testCaseId, projectId)
```

### `automation-coverage.service.js`

```javascript
// Main sync function
export async function syncAutomationCoverage(db, productId, sprints)

// Process single ELM card
async function processElmCard(elmCard)

// Process entire sprint
async function processSprint(sprintName, tadTsData)

// Aggregate metrics across cards
function aggregateSprintMetrics(elmCards)

// Get ELM cards for sprint from TAD-TS data
function getElmCardsForSprint(tadTsData, sprintName)
```

---

## Output Data Structure

### Per ELM Card

```javascript
{
  elmKey: "ELM-39559",
  summary: "Implement login feature",
  team: "PP Genesis",
  sprint: "Passport D&A PP Genesis-26.1.3",
  jiraUrl: "https://jira.wolterskluwer.io/jira/browse/ELM-39559",
  qtestSource: "requirement",  // or "module_mapping" or null
  qtestId: 12345678,
  qtestProject: "Passport",
  testCases: [
    {
      id: 87654321,
      pid: "TC-5678",
      name: "Verify login functionality",
      automationStatus: "Automated",
      automationTool: "Playwright",
      qtestUrl: "https://wk.qtestnet.com/p/119791/portal/project#tab=testdesign&object=1&id=87654321"
    }
  ],
  metrics: {
    total: 5,
    automated: 3,
    partiallyAutomated: 1,
    manual: 1,
    notPossible: 0,
    automationCandidate: 0,
    notEvaluated: 0,
    coveragePercentage: 80.0
  }
}
```

### Per Sprint

```javascript
{
  sprint: "Passport D&A PP Genesis-26.1.3",
  elmCards: [ /* array of card results */ ],
  metrics: {
    totalElmCards: 15,
    elmCardsInQtest: 12,
    elmCardsMissing: 3,
    totalTestCases: 45,
    automated: 30,
    partiallyAutomated: 5,
    manual: 8,
    notPossible: 1,
    automationCandidate: 0,
    notEvaluated: 1,
    coveragePercentage: 77.8,
    byTool: {
      "Playwright": 25,
      "Selenium": 10
    },
    byTeam: {
      "PP Genesis": { total: 20, automated: 15, coverage: 75.0 },
      "PP Pioneers": { total: 25, automated: 20, coverage: 80.0 }
    }
  }
}
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| QTest API timeout | 30-second timeout, retry up to 3 times with exponential backoff |
| Requirement not found | Try secondary project, then check module mapping, else mark as missing |
| 0 linked TCs | Search other projects for same requirement |
| API authentication failure | Return error, token may be expired |

---

## Retry Logic

```javascript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}
```

---

## Multi-Project Support

The integration searches **two QTest projects** in order:

1. **Passport** (Project ID: `119791`) - Primary
2. **Collaboration Portal** (Project ID: `123759`) - Secondary

If a requirement is found in the primary project but has 0 linked test cases, the system automatically searches the secondary project.

---

## Quick Reference

| Item | Value |
|------|-------|
| QTest URL | `https://wk.qtestnet.com` |
| QTest Token | `***REMOVED_QTEST_TOKEN***` |
| Primary Project | Passport (`119791`) |
| Secondary Project | Collaboration Portal (`123759`) |
| JIRA URL | `https://jira.wolterskluwer.io/jira` |
| JIRA Token | `***REMOVED_JIRA_TOKEN_PASSPORT***` |
| Automation Status Field ID | `13104748` |
| Automation Tool Field ID | `13593298` |

---

## Running the Sync

### Via API

```bash
POST http://localhost:3002/api/passport/sync/automation-coverage

# Optional: specify sprints
POST http://localhost:3002/api/passport/sync/automation-coverage
Content-Type: application/json
{
  "sprints": ["26.1.3", "26.1.4"]
}
```

### Programmatically

```javascript
import { syncAutomationCoverage } from './services/automation-coverage.service.js';

const result = await syncAutomationCoverage(db, 'passport', ['26.1.3']);
console.log(result.summary);
```

---

*Generated: March 4, 2026*
