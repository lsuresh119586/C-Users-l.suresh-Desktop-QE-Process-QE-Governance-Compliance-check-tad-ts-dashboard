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
       ├── Found? ──► Get Linked Test Cases
       │
       └── Not Found? ──► TO-* Key Fallback (Passport Only)
                              │
                              ▼
                    Fetch Jira Issue Links for ELM card
                    (GET /rest/api/2/issue/{elmKey}?fields=issuelinks)
                              │
                              ▼
                    Extract linked TO-* issue keys
                              │
                              ▼
                    Search qTest Requirement for each TO-* key
                              │
                              ├── Found? ──► Get Linked Test Cases
                              └── Not Found? ──► Mark as not_found
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

### TO-* Key Fallback (Passport Only)

Some Passport ELM cards have their test cases linked via TO-* (Test Orchestration) 
tickets in qTest rather than the ELM key itself. This is common for PP Genesis team.

**How it works:**
1. When an ELM card (e.g., `ELM-40980`) is not found as a requirement in qTest
2. The system fetches the ELM issue from Jira and inspects its `issuelinks` field
3. Any linked issues with keys starting with `TO-` are extracted (e.g., `TO-8883`)
4. Each TO-* key is searched in qTest as a requirement (primary project, then secondary)
5. If found, the linked test cases are processed normally
6. The `linkedToKey` field tracks which TO-* key resolved the ELM card

**Scope:** This fallback ONLY applies to Passport product (`passport-qtest-integration.js`). 
DnA/T360 uses a completely separate module-based approach in `qtest-integration.js` and 
is NOT affected by this change.

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `passport-qtest-integration.js` | **NEW** | Passport-specific qTest API functions |
| `passport-qtest-integration.js` | **Modified** | Added TO-* key fallback lookup via Jira issue links |
| `server.js` | Modified | Added Passport qTest API endpoints, fallback metrics, qTest enrichment |
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
| `searchRequirement(elmKey, projectId)` | Search for ELM/TO card as requirement |
| `getLinkedTestCases(reqId, projectId)` | Get test cases linked to requirement |
| `getTestCaseDetails(tcId, projectId)` | Get full TC details with automation status |
| `classifyAutomationStatus(properties)` | Extract automation status from properties |
| `fetchPassportSprintCoverage(sprint, elmCards)` | Main orchestration function |
| `fetchLinkedToKeys(elmKey)` | **NEW** Fetch linked TO-* keys from Jira for an ELM card |
| `makeJiraRequest(method, urlPath)` | **NEW** Internal Jira API helper for TO-* lookup |

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
March 4, 2026 (initial) | Updated: March 10, 2026

---

## Changelog

### [2026-03-10] — TO-* Key Fallback Lookup (Passport Only)

**Problem:** PP Genesis ELM cards (ELM-40980, ELM-40220, ELM-40483) returned `not_found` in qTest, giving Genesis 0% automation coverage. Investigation via TO-8883 revealed that Genesis test cases are linked in qTest via TO-* (Test Orchestration) tickets, not the ELM key itself.

**Root Cause:** `processElmCard()` only searched qTest for the ELM key as a requirement. When the requirement is registered under a linked TO-* key instead, the search returned nothing.

**Fix:** Added TO-* key fallback logic to `processElmCard()` in `passport-qtest-integration.js`:
1. When ELM key not found in qTest (both primary 119791 + secondary 123759 projects)
2. Calls Jira API `GET /rest/api/2/issue/{elmKey}?fields=issuelinks` to fetch issue links
3. Extracts linked TO-* issue keys from `issuelinks` array
4. Tries each TO-* key in `searchRequirement()` against both qTest projects
5. If found, processes linked test cases normally; tracks via `result.linkedToKey` field

**Scope:** Passport ONLY — `qtest-integration.js` (DnA/T360) is NOT modified.

#### Files Changed (March 10)

| File | Change Type | What Changed |
|------|------------|--------------|
| `backend/api-gateway/passport-qtest-integration.js` | Modified | +`JIRA_CONFIG` constant, +`makeJiraRequest()` Jira HTTPS helper, +`fetchLinkedToKeys(elmKey)` exported function, modified `processElmCard()` to try linked TO-* keys when ELM not found, added `fetchLinkedToKeys` to default exports |
| `specs/003-passport-qtest/spec.md` | Modified | Updated data flow diagram with TO-* fallback branch, updated Key Functions table, updated Files table, added this Changelog section |
| `specs/003-passport-qtest/plan.md` | Modified | Added Phase 5 (TO-* Key Fallback) with problem/solution/scope |
| `specs/003-passport-qtest/tasks.md` | Modified | Updated Files Changed Summary, added Phase 5 tasks (5.1–5.6) |
| `CHANGELOG.md` | Modified | Added [2026-03-10] TO-* enhancement entry |
| `backend/api-gateway/.passport-qtest-cache/*` | Deleted | Cleared all stale cache files to force re-sync with new TO-* logic |

#### Verification Results (March 10)

| ELM Card | Team | Before | After | Resolved Via |
|----------|------|--------|-------|-------------|
| ELM-40980 | PP Genesis | `not_found` | Found (qtestId: 59420334) | `TO-16734` |
| ELM-40483 | PP Genesis | `not_found` | Found (qtestId: 57323310) | `TO-12476` |
| ELM-40220 | PP Genesis | `not_found` | `not_found` (no TO-* links in Jira) | — |

`elm_cards_in_qtest`: 9 → 11 out of 12. Genesis requirements found but have **0 linked test cases** in qTest (data gap in qTest, not code issue).

---

### [2026-03-09] — Passport Metrics Fixes

#### Bug Fix 1: Missing Metrics for Passport Teams

**Problem:** Selecting any Passport team + sprint on the dashboard showed "No metrics available." Only `pp-genesis` had seed rows in `db.json`.

**Root Cause:** `/api/metrics` endpoint required a pre-existing metric entry in `db.json`. PP Spartacles and PP Pioneers had none.

**Fix:** Added fallback metric generation logic (~line 1015-1035 in `server.js`). When `metrics.length === 0` for a non-CPOD product with valid params, a placeholder metric is generated and then enriched by:
1. **Jira Bug Enrichment** — `defectsOpen`, `defectsClosed`, `totalBugs`, `bugDetails`
2. **TAD/TS Compliance Enrichment** — `requirementsCovered` (DoR %)
3. **qTest Automation Coverage Enrichment** — `testsCovered` (see Bug Fix 2)

#### Bug Fix 2: Automation Coverage % Always 0 for Passport Teams

**Problem:** Dashboard showed `Automation Coverage % = 0` for all Passport teams even though qTest cache had real data (e.g., PP Spartacles 26.1.4: 39/39 = 100%).

**Root Cause:** Metrics enrichment pipeline had Jira bugs + TAD/TS steps but **no step** to pull automation coverage from qTest cache into `testsCovered`.

**Fix:** Added qTest cache enrichment step in `server.js` after TAD/TS compliance:
1. Extracts sprint version number (`pp-spartacles-26.1.4` → `26.1.4`)
2. Reads `getCachedPassportData(sprintVersion)` 
3. Matches team names (normalizing `pp-spartacles` ↔ `PP Spartacles`)
4. Sets `testsCovered` and `automationSource: 'qtest-cache'`

#### Files Changed (March 9)

| File | Change Type | What Changed |
|------|------------|--------------|
| `backend/api-gateway/server.js` | Modified | +fallback metric generation (~line 1015-1035), +qTest automation coverage enrichment step (after TAD/TS block) |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.1.json` | Regenerated | Fresh qTest sync data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.2.json` | Regenerated | Fresh qTest sync data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.3.json` | Regenerated | Fresh qTest sync data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.4.json` | Regenerated | Fresh qTest sync data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.5.json` | Regenerated | Fresh qTest sync data |
| `CHANGELOG.md` | Created | Initial changelog with March 9 fixes |

#### Verified Results (March 9)

**Sprint 26.1.4:**
| Team | testsCovered | Data |
|------|-------------|------|
| PP Genesis | 0% | 0 total / 0 automated |
| PP Pioneers | 58% | 50 total / 29 automated |
| PP Spartacles | 100% | 39 total / 39 automated |

**Sprint 26.1.5:**
| Team | testsCovered | Data |
|------|-------------|------|
| PP Genesis | 0% | 0 total / 0 automated |
| PP Pioneers | 43% | 30 total / 13 automated |
| PP Spartacles | 100% | 7 total / 7 automated |

---

### [2026-03-04] — Initial Passport qTest Integration (Phase 1–4)

#### Files Created/Modified (March 4)

| File | Change Type | What Changed |
|------|------------|--------------|
| `backend/api-gateway/passport-qtest-integration.js` | **Created** | Passport-specific qTest service: `searchRequirement()`, `getLinkedTestCases()`, `getTestCaseDetails()`, `classifyAutomationStatus()`, `processElmCard()`, `fetchPassportSprintCoverage()`, caching (1hr TTL), retry logic |
| `backend/api-gateway/server.js` | Modified | +4 Passport qTest endpoints (`/api/qtest/passport/sprint/:sprint`, `/sync/:sprint`, `/config`, `/sync-from-tadts/:sprint`), live cache priority over db.json |
| `backend/api-gateway/.env` | Modified | +`QTEST_URL`, +`QTEST_BEARER_TOKEN_PASSPORT`, +`QTEST_PROJECT_ID_PASSPORT`, +`QTEST_PROJECT_ID_PASSPORT_SECONDARY` |
| `backend/api-gateway/.env.example` | Modified | Added example Passport config vars |
| `backend/api-gateway/db.json` | Modified | Added 26.1.5 sprint placeholder |
| `backend/api-gateway/jiraBugService.js` | Modified | Removed CPOD from `safeTeamMapping` |
| `backend/api-gateway/passportTadTsComplianceService.js` | Modified | Removed CPOD from `TEAM_MAPPING` |
| `frontend/index.html` | Modified | +`loadPassportTestsCovered()` for live qTest data |
| `frontend/src/components/DnADashboard.tsx` | Modified | Minor updates |
| `specs/002-passport-cpod-fix/` | **Created** | CPOD fix spec docs |
| `specs/003-passport-qtest/spec.md` | **Created** | This specification |
| `specs/003-passport-qtest/plan.md` | **Created** | Implementation plan |
| `specs/003-passport-qtest/tasks.md` | **Created** | Task tracking |
| `PASSPORT_QTEST_INTEGRATION.md` | **Created** | Integration guide |
| `backend/api-gateway/.passport-qtest-cache/` | **Created** | Cache directory |

---

### All Files Touched (Cumulative)

| File | Mar 4 | Mar 9 | Mar 10 |
|------|-------|-------|--------|
| `backend/api-gateway/passport-qtest-integration.js` | Created | — | Modified (TO-* fallback) |
| `backend/api-gateway/server.js` | Modified | Modified | — |
| `backend/api-gateway/.env` | Modified | — | — |
| `backend/api-gateway/.env.example` | Modified | — | — |
| `backend/api-gateway/db.json` | Modified | — | — |
| `backend/api-gateway/jiraBugService.js` | Modified | — | — |
| `backend/api-gateway/passportTadTsComplianceService.js` | Modified | — | — |
| `frontend/index.html` | Modified | — | — |
| `frontend/src/components/DnADashboard.tsx` | Modified | — | — |
| `backend/api-gateway/.passport-qtest-cache/*` | Created | Regenerated | Cleared + Regenerated |
| `specs/003-passport-qtest/spec.md` | Created | — | Modified |
| `specs/003-passport-qtest/plan.md` | Created | — | Modified |
| `specs/003-passport-qtest/tasks.md` | Created | — | Modified |
| `specs/002-passport-cpod-fix/*` | Created | — | — |
| `PASSPORT_QTEST_INTEGRATION.md` | Created | — | — |
| `CHANGELOG.md` | — | Created | Modified |

### Status: LOCAL ONLY (not committed/pushed)
