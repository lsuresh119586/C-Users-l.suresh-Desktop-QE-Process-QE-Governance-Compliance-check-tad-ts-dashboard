# SDD-005: Azure Pipeline Tile in Legacy Dashboard

## 1. Overview

Add an **Azure Pipeline** metric tile to the original legacy dashboard (`index.html`) so it appears alongside the existing 7 metric cards when the user selects the **Passport** product. Clicking the tile opens a drill-down view showing pipeline run history, success rates, and category breakdowns — all within the same single-page dashboard.

> **Constraint:** No changes to `vite.config.ts`, the React app (`App.tsx`), or any other product dashboards. This feature lives entirely in `index.html`.

---

## 2. Current Architecture

### Navigation Flow
1. User loads `index.html` → `loadProducts()` fetches `/api/products` → auto-selects first product
2. Product dropdown change → `handleProductChange()` → fetches teams → sprints → metrics
3. `render()` draws the control bar (dropdowns) + `.metrics-grid` with 7 cards
4. Clicking a card sets `state.currentView` and re-renders a drill-down view

### Existing Metric Cards (non-CPOD)
| # | Card | CSS | Clickable → View |
|---|---|---|---|
| 1 | DoR Readiness % | `card-blue` | `dorCompliance` |
| 2 | Automation Coverage % | `card-green` | `testsCovered` |
| 3 | Open Defects | `card-purple` | `openDefects` |
| 4 | Closed Defects | `card-red` | `closedDefects` |
| 5 | Reopened Defects | `card-orange` | `reopenedDefects` |
| 6 | DoD Completion % | `card-blue` | — |
| 7 | Automation Code Quality | `card-green` | — |

### Backend Endpoints (already implemented — SDD-004)
| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/azure-pipeline/sync/:productId` | Trigger sync from Azure DevOps |
| `GET` | `/api/azure-pipeline/:productId` | Get cached pipeline data |
| `GET` | `/api/azure-pipeline/:productId/export/csv` | Download CSV |

---

## 3. Requirements

### 3.1 Tile (Card #8)
- **Visible only** when `state.selectedProduct === 'passport'` AND team is **not** CPOD
- Positioned as the 8th card in `.metrics-grid`
- Shows the **pipeline success rate %** as the metric value; defaults to **0%** when no data is loaded (consistent with Automation Coverage % tile)
- Uses `card-purple` color variant (reuses existing purple style)
- Emoji: 🔧 Azure Pipelines
- Hint text: "Click to view pipeline runs →"
- Clickable → sets `state.currentView = 'azurePipelines'`

### 3.2 Drill-Down View (`azurePipelines`)
When `state.currentView === 'azurePipelines'`:

1. **Back button** — returns to `dashboard` view
2. **Header** — "🔧 Azure Pipeline Dashboard" + Sync Now button + 📥 CSV Export button + last-synced timestamp
3. **Project filter tabs** — All Projects | Passport | CITI | Collaboration Portal
4. **Summary cards row** — Total Runs, Succeeded, Failed, Partial, **Canceled**, Success Rate %, Avg Duration
5. **Sub-tabs**: Overview | Run History | By Category
6. **Overview tab** — success rate bar
7. **Run History tab** — table of recent builds (pipeline name, build #, result badge, duration, started, branch, requested by)
8. **By Category tab** — tables grouped by test category and upgrade type

### 3.3 Data Flow
- On first click of the tile, show empty state with "No data — click Sync Now" message (no auto-sync)
- User clicks "Sync Now" → `POST /api/azure-pipeline/sync/passport` fetches data
- Cache the response in `state.azurePipelineData`
- Subsequent tile clicks use cached data unless user clicks "Sync Now" again
- After sync, update the tile's metric value with the success rate from the response

### 3.4 Styling
- Follow existing glassmorphism card style (`.metric-card` base)
- Add `.metric-card:nth-child(8) { animation-delay: 0.4s; }` for entry animation
- Drill-down view follows the same pattern as existing views (back button + content)
- Result badges: green (succeeded), red (failed), amber (partial), gray (canceled)
- Tables reuse existing dashboard table styles where possible

### 3.5 Date Range Filter
- Add **From Date** and **To Date** date-picker inputs in the Azure Pipeline drill-down view, placed between the project filter row and the summary cards
- Default: From = 30 days ago, To = today
- When either date changes, client-side filter `recent_runs` to only include runs whose `startTime` falls within the selected range
- Summary cards, Overview, Run History, and By Category tabs all reflect the filtered data
- CSV export also passes `dateFrom` / `dateTo` query params to the backend CSV endpoint
- State: `azurePipelineDateFrom` and `azurePipelineDateTo` added to `state` object

### 3.6 Enhanced Playwright Category Detection
- The existing `classifyCategory()` in `azure-pipeline.integration.js` already matches `/Playwright/i` in pipeline names
- Additionally, when the Azure DevOps pipeline definition has a `process.yamlFilename` field (indicating a YAML pipeline), fetch the YAML content and check for Playwright-related references (`playwright`, `npx playwright`, `@playwright`)
- If detected, override the category to `'Playwright'` even if the pipeline name doesn't contain "Playwright"
- This enhances detection for Passport and Collaboration Portal (CP) pipelines that use Playwright but don't have it in the name
- A new helper function `detectPlaywrightFromYaml(definition)` returns `true` if the YAML references Playwright
- The `mapBuild()` function checks YAML detection as a fallback when `classifyCategory()` returns `'Other'`
- **Branch-aware YAML fetch**: YAML files may live on a team branch (e.g. `Spartacles`, `Genesis`) rather than the repo default branch (`master`). When the default-branch fetch fails with `TF401174` (GitItemNotFoundException), the function reads `repository.defaultBranch` from the full pipeline definition and retries with `versionDescriptor.version={branch}&versionDescriptor.versionType=branch`
- **Example**: `Bulk_Reassign` (Def 4952) references `Spartacles-Automation/azure-pipeline-passport-spartacles.yml` which only exists on the `Spartacles` branch. Without branch-aware fetch, YAML detection silently failed and the pipeline was categorized as 'Other'

### 3.7 Bug Fix — Total Count Mismatch (Canceled Runs)
- Azure DevOps build results include: `succeeded`, `failed`, `partiallySucceeded`, and `canceled`
- Previously, the summary cards only displayed Total Runs, Succeeded, Failed, and Partial — omitting canceled runs
- This caused `Total Runs ≠ Succeeded + Failed + Partial` for CITI and Passport projects where canceled builds exist
- **Fix**: Add a **Canceled** summary card (gray, `#78909c`) between Partial and Success Rate to account for all runs
- Now: `Total Runs = Succeeded + Failed + Partial + Canceled`

### 3.8 Bug Fix — Tile % Not Updating with Date Filter
- The 8th tile on the main dashboard page showed pipeline success rate via `aggregateAzureMetrics(data, 'all')` without date params
- When the user changed From/To dates in the drill-down view and returned to the main page, the tile still showed the unfiltered overall rate
- **Fix**: Pass `state.azurePipelineDateFrom` / `state.azurePipelineDateTo` to `aggregateAzureMetrics()` in the tile render
- The tile now reflects the currently selected date range, making it dynamic without disturbing other dashboard logic

### 3.9 Bug Fix — Subfolder Pipelines Excluded by Name Filter
- **Symptom**: Build `#20260129.7` (pipeline `imanage`, path `\Passport-CI\CT-Pipeline\Genesis`, Definition ID 4546) was a Playwright test run (Jan 29 at 7:30 PM, 6m 10s) but never appeared in the dashboard
- **Root cause**: `isTestingPipeline(name)` uses 10 regex patterns (Tosca, Aura, Playwright, CT-Pipeline, SmokeTest, etc.). The name `imanage` matched none, so the pipeline was **excluded before builds were ever fetched** — YAML detection never ran
- **Scope**: Affected all 6 Genesis pipelines (edocs, imanage, spol × 2 subfolders) plus ~30 other subfolder pipelines (AFA, GEBTCM, ITK, Panel_Counsel, etc.) that are legitimate CT pipelines with plain functional names
- **Fix**: In `fetchPipelineRuns()`, changed the filter logic: pipelines in **subfolders** of the configured folder path are always included (they are purposely organized into test-category folders). Only pipelines at the **root** level of the configured path still use the name-based `isTestingPipeline()` check to exclude non-testing items like "PPOD Train Release" and "demo-delete later"
- **Detection logic**: `d.path !== folderPath` → subfolder → auto-include; `d.path === folderPath` → root → use name check

### 3.10 Sprint-Aware Azure Pipeline Tile
- **Requirement**: When user selects a team (e.g., pp-spartacles) and sprint (e.g., 26.1.3), the Azure Pipeline tile shows the success rate for pipelines executed **during that sprint's date window** AND matching **that team's Azure DevOps folder path**
- **Sprint dates source**: Fetched dynamically from **JIRA Agile REST API** (`GET /rest/agile/1.0/board/{boardId}/sprint`) — not hardcoded
- **Board IDs**: PP Genesis → 5414, PP Pioneers → 5812, PP Spartacles → 7916
- **Sprint name pattern**: `Passport {TeamName}-{sprintNumber}` (e.g., `Passport Spartacles-26.1.3`)
- **Team-to-folder mapping**: Azure pipeline runs have a new `folderPath` field from `d.path`; filtering uses regex patterns:
  - `pp-spartacles` → `/spartacles/i`
  - `pp-genesis` → `/genesis/i`
  - `pp-pioneers` → `/pioneers/i`
- **Cache**: Sprint dates cached in-memory (30 min TTL) to avoid repeated JIRA calls
- **Tile hint text**: Shows "Sprint 26.1.3 · Click →" when sprint-filtered, or "Last 30 days · Click →" as fallback
- **Fallback**: If no team/sprint selected, or JIRA call fails, falls back to the existing 30-day date window filter
- **New files**: `backend/api-gateway/jira-sprint-dates.js` — JIRA Sprint Date Service
- **New API routes**:
  - `GET /api/sprint-dates/:teamId/:sprintId` — single sprint dates
  - `GET /api/sprint-dates/:teamId` — all sprint dates for a team
  - `GET /api/team-folder-patterns` — team-to-folder regex mapping

---

## 4. Files Modified

| File | Change |
|---|---|
| `frontend/index.html` | Add tile HTML in `render()`, add `azurePipelines` view, add CSS for 8th card + drill-down, add JS functions, sprint-aware tile with JIRA date filtering |
| `backend/api-gateway/azure-pipeline.integration.js` | Enhanced Playwright YAML detection, subfolder auto-inclusion logic, `folderPath` field on pipeline runs |
| `backend/api-gateway/jira-sprint-dates.js` | **New** — JIRA Agile API sprint date fetcher with cache |
| `backend/api-gateway/server.js` | Sprint-dates API routes, import jira-sprint-dates module |
| `backend/api-gateway/jiraBugService.js` | Updated Passport team `boardId` values (was `null`) |

### Files NOT Modified
- `vite.config.ts` — no changes
- `App.tsx` — no changes (React app stays separate)
- `server.js` — backend routes already exist from SDD-004

---

## 5. Acceptance Criteria

1. Original dashboard loads at `/` with unchanged theme and navigation
2. When Passport is selected, an 8th "🔧 Azure Pipelines" tile appears in the grid
3. When any other product is selected, the tile is NOT shown
4. Clicking the tile shows the pipeline drill-down view
5. "Sync Now" fetches live data from Azure DevOps
6. Run History table displays pipeline builds with result badges
7. CSV export downloads a file
8. Back button returns to the main metrics grid
9. **Date range filter**: From/To date pickers filter all displayed pipeline data and summary metrics
10. **Playwright detection**: Passport and CP pipelines that use Playwright are categorised as "Playwright" even if not in the pipeline name
11. **Count accuracy**: Total Runs = Succeeded + Failed + Partial + Canceled (no missing runs)
12. **Dynamic tile %**: Main dashboard tile updates to reflect the currently selected date range
13. **Subfolder inclusion**: All pipelines in organized subfolders (Genesis, Spartacles, Passport modules, etc.) are included without needing a testing-keyword in the name
14. **Sprint-aware tile**: When team + sprint selected, tile shows success rate filtered by JIRA sprint dates AND team folder path
15. **JIRA sprint dates**: Sprint start/end fetched from JIRA Agile API (boards 5414, 5812, 7916), cached 30 min
