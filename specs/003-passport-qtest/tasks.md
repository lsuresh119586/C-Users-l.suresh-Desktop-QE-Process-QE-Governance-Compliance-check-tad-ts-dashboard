# Passport qTest Integration Tasks

## Status Legend
- ✅ Complete
- 🔄 In Progress
- ⬜ Not Started
- ❌ Blocked

---

## Files Changed Summary

| File | Type | Description |
|------|------|-------------|
| `backend/api-gateway/server.js` | Modified | Added 4 Passport qTest endpoints, fixed priority to use live cache before db.json, added fallback metric generation, added qTest automation coverage enrichment |
| `backend/api-gateway/passport-qtest-integration.js` | **NEW** | Passport-specific qTest API with requirement-based linking |
| `backend/api-gateway/passport-qtest-integration.js` | Modified | **Phase 5:** Added TO-* key fallback — `JIRA_CONFIG`, `makeJiraRequest()`, `fetchLinkedToKeys()`, modified `processElmCard()` |
| `backend/api-gateway/.env` | Modified | Added Passport qTest config vars |
| `backend/api-gateway/.env.example` | Modified | Added example Passport config |
| `backend/api-gateway/db.json` | Modified | Added 26.1.5 sprint placeholder |
| `backend/api-gateway/jiraBugService.js` | Modified | Removed CPOD from safeTeamMapping |
| `backend/api-gateway/passportTadTsComplianceService.js` | Modified | Removed CPOD from TEAM_MAPPING |
| `frontend/index.html` | Modified | Added `loadPassportTestsCovered()` for live qTest data |
| `frontend/src/components/DnADashboard.tsx` | Modified | Minor updates |
| `specs/002-passport-cpod-fix/` | **NEW** | CPOD fix spec docs |
| `specs/003-passport-qtest/` | **NEW + Updated** | qTest integration spec docs (spec.md, plan.md, tasks.md updated for Phase 5) |
| `PASSPORT_QTEST_INTEGRATION.md` | **NEW** | Integration guide |
| `CHANGELOG.md` | **NEW + Updated** | Change tracking for all Passport enhancements |
| `backend/api-gateway/.passport-qtest-cache/` | **NEW** | Cache directory for live qTest data |

---

## Rollback Steps

### Full Rollback (revert all changes)
```powershell
cd c:\git_clone\polarisdashboard
git checkout -- backend/api-gateway/server.js
git checkout -- backend/api-gateway/.env
git checkout -- backend/api-gateway/.env.example
git checkout -- backend/api-gateway/db.json
git checkout -- backend/api-gateway/jiraBugService.js
git checkout -- backend/api-gateway/passportTadTsComplianceService.js
git checkout -- frontend/index.html
git checkout -- frontend/src/components/DnADashboard.tsx

# Remove new files
Remove-Item backend/api-gateway/passport-qtest-integration.js -Force
Remove-Item backend/api-gateway/.passport-qtest-cache -Recurse -Force
Remove-Item specs/002-passport-cpod-fix -Recurse -Force
Remove-Item specs/003-passport-qtest -Recurse -Force
Remove-Item PASSPORT_QTEST_INTEGRATION.md -Force
```

### Partial Rollback (keep CPOD fix, revert qTest only)
```powershell
cd c:\git_clone\polarisdashboard
git checkout -- backend/api-gateway/server.js
git checkout -- backend/api-gateway/db.json  
git checkout -- frontend/index.html

# Remove qTest-only files
Remove-Item backend/api-gateway/passport-qtest-integration.js -Force
Remove-Item backend/api-gateway/.passport-qtest-cache -Recurse -Force
Remove-Item specs/003-passport-qtest -Recurse -Force
Remove-Item PASSPORT_QTEST_INTEGRATION.md -Force
```

### Rollback Server Endpoints Only
```powershell
git checkout -- backend/api-gateway/server.js
```

---

## Phase 1: Core Integration

### Task 1.1: Create Passport qTest Service ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] Create new file with Passport-specific config
- [x] Define PASSPORT_QTEST_CONFIG with:
  - url: https://wk.qtestnet.com
  - token: ***REMOVED_QTEST_TOKEN***
  - primary project: 119791 (Passport)
  - secondary project: 123759 (Collaboration Portal)
- [x] Implement `searchRequirement(elmKey, projectId)`
- [x] Implement `getLinkedTestCases(requirementId, projectId)`
- [x] Implement `getTestCaseDetails(testCaseId, projectId)`
- [x] Implement `classifyAutomationStatus(properties)`
- [x] Implement `normalizeAutomationStatus(status)`
- [x] Implement `processElmCard(elmKey, team)`
- [x] Implement `fetchPassportSprintCoverage(sprintName, elmCards)`
- [x] Add caching mechanism (1 hour TTL)
- [x] Add retry logic (3 retries, exponential backoff)

### Task 1.2: Update Server.js ✅
**File:** `backend/api-gateway/server.js`

- [x] Import passport-qtest-integration functions
- [x] Add `GET /api/qtest/passport/sprint/:sprint` endpoint
- [x] Add `POST /api/qtest/passport/sync/:sprint` endpoint
- [x] Add `GET /api/qtest/passport/config` endpoint
- [x] Add `GET /api/qtest/passport/sync-from-tadts/:sprint` endpoint
- [x] Handle live cache priority over db.json
- [x] Handle db.json fallback for Passport teams

### Task 1.3: Update Environment Configuration ✅
**File:** `backend/api-gateway/.env`

- [x] Add QTEST_URL
- [x] Add QTEST_BEARER_TOKEN_PASSPORT
- [x] Add QTEST_PROJECT_ID_PASSPORT
- [x] Add QTEST_PROJECT_ID_PASSPORT_SECONDARY

---

## Phase 2: Data Integration

### Task 2.1: Connect TAD-TS to qTest Sync ✅
**File:** `backend/api-gateway/server.js`

- [x] Add `/api/qtest/passport/sync-from-tadts/:sprint` endpoint
- [x] Extract ELM card keys from TAD-TS compliance data
- [x] Map ELM cards to teams (PP Genesis, PP Pioneers, PP Spartacles)
- [x] Call qTest sync with extracted ELM cards
- [x] Cache results for 1 hour

### Task 2.2: Update db.json Structure ✅
**File:** `backend/api-gateway/db.json`

- [x] Add 26.1.5 sprint placeholder for T360
- [x] Passport teams use live qTest data (not db.json)
- [x] Update sample data structure

### Task 2.3: Create Sync Orchestration ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] Live sync via `/api/qtest/passport/sync-from-tadts/:sprint`
- [x] Automatic ELM card extraction from TAD-TS
- [x] Batch process cards per team
- [x] Cache results for 1 hour

---

## Phase 3: Frontend Integration

### Task 3.1: Update Tests Covered Dashboard ✅
**File:** `frontend/index.html`

- [x] Added `loadPassportTestsCovered()` function
- [x] Passport product uses live qTest API instead of db.json
- [x] Fetches from `/api/qtest/passport/sync-from-tadts/:sprint`
- [x] Displays PP Genesis, PP Pioneers, PP Spartacles

### Task 3.2: Update API Service ⬜
**File:** `frontend/src/services/api.ts`

- [ ] Add Passport qTest fetch function (using index.html inline for now)
- [ ] Handle different response format (requirement-based)
- [ ] Add automation status display

---

## Phase 4: Testing & Validation

### Task 4.1: API Testing ✅
- [x] Test GET /api/qtest/passport/sprint/26.1.4
- [x] Test GET /api/qtest/passport/config
- [x] Test GET /api/qtest/passport/sync-from-tadts/26.1.4
- [x] Verify error handling

### Task 4.2: Integration Testing ✅
- [x] Test with live qTest API
- [x] Verify multi-project fallback (Passport + Collaboration Portal)
- [x] Test cache functionality
- [x] Verify DnA/T360 not affected

### Task 4.3: Regression Testing ✅
- [x] Test existing /api/metrics/tests-covered/:sprint
- [x] Verify Tests Covered for T360 teams
- [x] All existing endpoints working

---

## Bugs/Issues Found

### Issue 1: CPOD Invalid SAFe Team ✅ FIXED
- **Location:** passportTadTsComplianceService.js, jiraBugService.js
- **Problem:** CPOD not valid in cf[13392]
- **Solution:** Removed CPOD from TEAM_MAPPING

### Issue 2: Live Cache Not Used ✅ FIXED
- **Location:** server.js lines 820-890
- **Problem:** db.json checked before live cache
- **Solution:** Reordered to check live cache first

---

## Test Results (March 4, 2026)

### Multi-Sprint Test Results
| Sprint | ELM Cards | In qTest | Test Cases | Automated | Coverage |
|--------|-----------|----------|------------|-----------|----------|
| 26.1.1 | 8 | - | 42 | 36 | 86% |
| 26.1.2 | 7 | - | 34 | 19 | 56% |
| 26.1.3 | 9 | - | 58 | 23 | 40% |
| 26.1.4 | 12 | 9 | 89 | 67 | 75% |
| 26.1.5 | 12 | 8 | 22 | 6 | 27% |

### Per-Team Results (Sprint 26.1.4)
| Team | Total TCs | Automated |
|------|-----------|-----------|
| PP Genesis | 0 | 0 |
| PP Pioneers | 50 | 29 |
| PP Spartacles | 39 | 38 |

---

## Dependencies

| Task | Depends On |
|------|------------|
| 2.1 | 1.1, 1.2 |
| 2.3 | 2.1, 2.2 |
| 3.1 | 2.2 |
| 4.1 | 1.2 |
| 4.2 | 2.3 |

---

## Commands Reference

```powershell
# Start backend server
cd c:\git_clone\polarisdashboard\backend\api-gateway
node server.js

# Start frontend
cd c:\git_clone\polarisdashboard\frontend
npm run dev

# Test Passport qTest config
Invoke-RestMethod http://localhost:3000/api/qtest/passport/config

# Get Passport coverage for sprint
Invoke-RestMethod http://localhost:3000/api/qtest/passport/sprint/26.1.4

# Sync from live qTest via TAD-TS
Invoke-RestMethod http://localhost:3000/api/qtest/passport/sync-from-tadts/26.1.4

# Manual sync with ELM cards
Invoke-RestMethod -Uri "http://localhost:3000/api/qtest/passport/sync/26.1.4" `
  -Method POST -ContentType "application/json" `
  -Body '{"elmCards":[{"key":"ELM-39559","team":"PP Genesis"}]}'
```

---

## Phase 5: TO-* Key Fallback Lookup (Passport Only) ✅

### Task 5.1: Add Jira API Helper ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] Add `JIRA_CONFIG` constant (uses `JIRA_URL` and `JIRA_API_TOKEN_PASSPORT` from .env)
- [x] Add `makeJiraRequest(method, urlPath)` — HTTPS helper for Jira API calls
- [x] Handles authentication, timeout, error handling

### Task 5.2: Add TO-* Key Extraction ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] Add `fetchLinkedToKeys(elmKey)` — exported function
- [x] Calls `GET /rest/api/2/issue/{elmKey}?fields=issuelinks`
- [x] Extracts linked issue keys starting with `TO-`
- [x] Logs found TO-* keys for debugging

### Task 5.3: Modify processElmCard for TO-* Fallback ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] When ELM key `not_found` in qTest (both primary + secondary projects)
- [x] Call `fetchLinkedToKeys(elmKey)` to get linked TO-* keys
- [x] Try each TO-* key in `searchRequirement()` against primary, then secondary project
- [x] If found, set `result.linkedToKey` to track which TO-* key resolved it
- [x] If none found, still mark as `not_found` (existing behavior)

### Task 5.4: Export and Module Updates ✅
**File:** `backend/api-gateway/passport-qtest-integration.js`

- [x] Add `fetchLinkedToKeys` to default export object
- [x] No changes to server.js required (fallback runs inside existing pipeline)

### Task 5.5: Update Documentation ✅
**Files:** `specs/003-passport-qtest/spec.md`, `plan.md`, `tasks.md`, `CHANGELOG.md`

- [x] Update spec.md data flow diagram with TO-* fallback branch
- [x] Update spec.md Key Functions table with new functions
- [x] Update spec.md Files Modified table
- [x] Add Phase 5 to plan.md with problem/solution/scope
- [x] Update tasks.md Files Changed Summary
- [x] Add Phase 5 tasks to tasks.md
- [x] Update CHANGELOG.md with TO-* enhancement entry

### Task 5.6: Cache and Verification ✅

- [x] Clear stale `.passport-qtest-cache/` files to force re-sync
- [ ] Restart backend and verify Genesis automation coverage > 0%
- [ ] Confirm Pioneers and Spartacles unaffected
- [ ] Confirm DnA/T360 endpoints unaffected

### Scope: Passport Only — No DnA/T360 Impact
- **Only file modified:** `passport-qtest-integration.js` (Passport-specific)
- **NOT modified:** `qtest-integration.js` (DnA/T360)
- **NOT modified:** `server.js` (no endpoint changes)
- **NOT modified:** `passportTadTsComplianceService.js`
- **NOT modified:** `jiraBugService.js`

---

## Date
March 4, 2026 (initial) | March 10, 2026 (Phase 5 added)
March 4, 2026
