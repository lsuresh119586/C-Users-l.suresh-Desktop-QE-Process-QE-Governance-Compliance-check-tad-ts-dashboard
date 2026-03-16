# Polaris Dashboard - Change Log

## [2026-03-10] - TO-* Key Fallback Lookup (Passport Only)

### Enhancement: Cross-Project Jira Key Lookup in qTest
**File:** `backend/api-gateway/passport-qtest-integration.js`

**Problem:** PP Genesis ELM cards (ELM-40980, ELM-40220, ELM-40483) returned `not_found` in qTest, giving Genesis 0% automation coverage. Investigation via TO-8883 revealed that Genesis test cases are linked in qTest via TO-* (Test Orchestration) tickets, not the ELM key itself.

**Root Cause:** `processElmCard()` only searched qTest for the ELM key as a requirement. When the requirement is registered under a linked TO-* key instead, the search returned nothing.

**Fix:** Added TO-* key fallback logic to `processElmCard()`:
1. When ELM key not found in qTest (both primary 119791 + secondary 123759 projects)
2. Calls Jira API `GET /rest/api/2/issue/{elmKey}?fields=issuelinks` to fetch issue links
3. Extracts linked TO-* issue keys from `issuelinks` array
4. Tries each TO-* key in `searchRequirement()` against both qTest projects
5. If found, processes linked test cases normally
6. Tracks resolution via `result.linkedToKey` field

**New Functions Added:**
| Function | Purpose |
|----------|---------|
| `makeJiraRequest(method, urlPath)` | Jira HTTPS helper (uses `JIRA_API_TOKEN_PASSPORT`) |
| `fetchLinkedToKeys(elmKey)` | Extracts TO-* keys from ELM card's Jira issue links |

**Scope:** Passport ONLY — `qtest-integration.js` (DnA/T360) is NOT modified.

**Documentation Updated:** `spec.md`, `plan.md`, `tasks.md`

---

## [2026-03-09] - Passport Metrics Fixes

### Bug Fix: Missing Metrics for Passport Teams (PP Spartacles, PP Pioneers, PP Genesis)
**File:** `backend/api-gateway/server.js`

**Problem:** Selecting any Passport team + sprint on the dashboard showed "No metrics available." Only `pp-genesis` had seed metric rows in `db.json`; other teams (`pp-spartacles`, `pp-pioneers`) had none.

**Root Cause:** The `/api/metrics` endpoint required a pre-existing metric entry in `db.json` to return data. Since only `pp-genesis` had entries, other teams returned empty arrays.

**Fix:** Added fallback metric generation logic (~line 1015-1035 in server.js). When `metrics.length === 0` for a non-CPOD product with valid product/team/sprint params, a placeholder metric is generated with zeroed fields. This placeholder is then enriched by:
1. **Jira Bug Enrichment** — overwrites `defectsOpen`, `defectsClosed`, `totalBugs`, `bugDetails` with real Jira data
2. **TAD/TS Compliance Enrichment** — overwrites `requirementsCovered` (DoR %) with live qTest TAD/TS data
3. **qTest Automation Coverage Enrichment** — overwrites `testsCovered` with actual automation % (see below)

---

### Bug Fix: Automation Coverage % Always 0 for Passport Teams
**File:** `backend/api-gateway/server.js`

**Problem:** Dashboard showed `Automation Coverage % = 0` for all Passport teams, even though qTest cache files had real automation data (e.g., PP Spartacles 26.1.4: 39/39 = 100%).

**Root Cause:** The metrics enrichment pipeline had steps for Jira bugs and TAD/TS compliance, but **no step** to pull automation coverage from qTest cache into the `testsCovered` field.

**Fix:** Added a new enrichment step after TAD/TS compliance enrichment that:
1. Extracts the sprint version number (e.g., `pp-spartacles-26.1.4` → `26.1.4`)
2. Reads `getCachedPassportData(sprintVersion)` to get qTest cache
3. Matches team names (normalizing `pp-spartacles` ↔ `PP Spartacles`)
4. Calculates `coveragePct = Math.round((automated / total) * 100)`
5. Sets `testsCovered` and `automationSource: 'qtest-cache'` on the metric

**Verified Results (Sprint 26.1.4):**
| Team | testsCovered | Data |
|------|-------------|------|
| PP Genesis | 0% | 0 total / 0 automated (ELM cards not found in qTest) |
| PP Pioneers | 58% | 50 total / 29 automated |
| PP Spartacles | 100% | 39 total / 39 automated |

**Verified Results (Sprint 26.1.5):**
| Team | testsCovered | Data |
|------|-------------|------|
| PP Genesis | 0% | 0 total / 0 automated |
| PP Pioneers | 43% | 30 total / 13 automated |
| PP Spartacles | 100% | 7 total / 7 automated |

---

### Modified Files Summary
| File | Change |
|------|--------|
| `backend/api-gateway/server.js` | +fallback metric generation, +qTest automation coverage enrichment |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.1.json` | Updated qTest cache data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.4.json` | Updated qTest cache data |
| `backend/api-gateway/.passport-qtest-cache/passport-qtest-26.1.5.json` | Updated qTest cache data |

### Status: LOCAL ONLY (not committed/pushed)
