# Passport qTest Integration Specification

## Overview

Add Passport-specific qTest integration for "Tests Covered" automation coverage tracking. Unlike DnA/T360 which uses module-based test case retrieval, Passport uses **requirement-based linking** where ELM cards are linked to test cases in qTest.

## Problem Statement

The existing `qtest-integration.js` is designed for DnA/T360 teams:
- Uses project ID `114345` (T360 Test Management)
- Retrieves test cases by sprint module IDs
- Teams are determined by module folder structure

Passport requires a different approach:
- Uses project IDs `119791` (Passport) and `123759` (Collaboration Portal)
- Links ELM cards to qTest requirements
- Test cases are retrieved via requirement → linked artifacts
- Different bearer token for authentication

## Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXISTING (DnA/T360)                             │
├─────────────────────────────────────────────────────────────────────┤
│ qtest-integration.js                                                │
│   - Project: 114345                                                 │
│   - Approach: Sprint Module → Team Submodules → Test Cases          │
│   - Token: d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d                     │
│   - API: GET /api/qtest/sprint/:sprint                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     NEW (Passport Only)                             │
├─────────────────────────────────────────────────────────────────────┤
│ passport-qtest-integration.js                                       │
│   - Projects: 119791 (Passport), 123759 (Collab Portal)             │
│   - Approach: ELM Card → Search Requirement → Linked Test Cases     │
│   - Token: ***REMOVED_QTEST_TOKEN***                     │
│   - API: GET /api/qtest/passport/sprint/:sprint                     │
│          POST /api/qtest/passport/sync/:sprint                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
ELM Cards (from TAD-TS Compliance)
       │
       ▼
Search qTest Requirement (POST /api/v3/projects/{id}/search)
       │
       ▼
Get Linked Test Cases (GET /api/v3/projects/{id}/linked-artifacts)
       │
       ▼
Get Test Case Details (GET /api/v3/projects/{id}/test-cases/{tcId})
       │
       ▼
Extract Automation Status (field 13104748)
       │
       ▼
Calculate Coverage Metrics
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `passport-qtest-integration.js` | **NEW** | Passport-specific qTest API functions |
| `server.js` | Modified | Added Passport qTest API endpoints |
| `.env` | Modified | Added Passport qTest configuration |
| `specs/003-passport-qtest/spec.md` | **NEW** | This specification |

## API Endpoints

### GET /api/qtest/passport/sprint/:sprint

Retrieve Passport test coverage for a sprint.

**Response:**
```json
{
  "sprint_name": "26.1.3",
  "generated": "2026-03-04T10:00:00Z",
  "source": "passport-qtest-live",
  "totals": {
    "total": 45,
    "automated": 30,
    "with_attachments": 0,
    "without_attachments": 0
  },
  "teams": {
    "PP Genesis": { "total": 20, "automated": 15, "test_cases": [...] },
    "PP Pioneers": { "total": 15, "automated": 10, "test_cases": [...] },
    "PP Spartacles": { "total": 10, "automated": 5, "test_cases": [...] }
  }
}
```

### POST /api/qtest/passport/sync/:sprint

Sync Passport qTest data from live API.

**Request Body:**
```json
{
  "elmCards": [
    { "key": "ELM-39559", "team": "PP Genesis" },
    { "key": "ELM-40123", "team": "PP Pioneers" }
  ]
}
```

### GET /api/qtest/passport/config

Get Passport qTest configuration (for debugging).

## Configuration

### Environment Variables (.env)

```dotenv
# Passport qTest Configuration
QTEST_URL=https://wk.qtestnet.com
QTEST_BEARER_TOKEN_PASSPORT=***REMOVED_QTEST_TOKEN***
QTEST_PROJECT_ID_PASSPORT=119791
QTEST_PROJECT_ID_PASSPORT_SECONDARY=123759
```

## Key Functions

| Function | Description |
|----------|-------------|
| `searchRequirement(elmKey, projectId)` | Search for ELM card as requirement |
| `getLinkedTestCases(reqId, projectId)` | Get test cases linked to requirement |
| `getTestCaseDetails(tcId, projectId)` | Get full TC details with automation status |
| `classifyAutomationStatus(properties)` | Extract automation status from properties |
| `fetchPassportSprintCoverage(sprint, elmCards)` | Main orchestration function |

## Backward Compatibility

- **DnA/T360 unchanged**: Existing `/api/qtest/sprint/:sprint` endpoint unchanged
- **Passport isolated**: New endpoints use `/api/qtest/passport/` prefix
- **Separate cache**: Passport uses `.passport-qtest-cache/` directory
- **Separate token**: Passport uses its own bearer token

## Testing

### Manual Verification

```bash
# Check configuration
curl http://localhost:3000/api/qtest/passport/config

# Get Passport coverage (uses db.json or cache)
curl http://localhost:3000/api/qtest/passport/sprint/26.1.3

# Sync from live qTest (requires ELM cards)
curl -X POST http://localhost:3000/api/qtest/passport/sync/26.1.3 \
  -H "Content-Type: application/json" \
  -d '{"elmCards":[{"key":"ELM-39559","team":"PP Genesis"}]}'
```

## Date
March 4, 2026
