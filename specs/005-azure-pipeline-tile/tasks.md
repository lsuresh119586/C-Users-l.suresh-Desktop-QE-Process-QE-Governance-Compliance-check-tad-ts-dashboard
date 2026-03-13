# Tasks — SDD-005: Azure Pipeline Tile in Legacy Dashboard

All changes are in **`frontend/index.html`** only.

---

## Task 1: CSS for 8th Card + Drill-Down View

- [x] 1.1 Add `.metric-card:nth-child(8) { animation-delay: 0.4s; }` after existing nth-child rules
- [x] 1.2 Reuse existing `card-purple` style for the tile (no new color variant needed)
- [x] 1.3 Add result badge styles: `.badge-success`, `.badge-fail`, `.badge-partial`, `.badge-cancel`
- [x] 1.4 Add `.az-summary-cards` grid, `.az-table`, `.az-sub-tabs`, `.az-back-btn` styles

## Task 2: Tile in Metrics Grid

- [x] 2.1 In `render()`, inside the `.metrics-grid` block (after card #7), add conditional 8th card.
  Display **0%** as the default metric value when no pipeline data is loaded (consistent with Automation Coverage %):
  ```js
  ${state.selectedProduct === 'passport' && state.selectedTeam !== 'cpod' ? `
    <div class="metric-card card-purple clickable" id="azurePipelineCard">
      <div class="metric-label">🔧 Azure Pipelines</div>
      <div class="metric-value">${state.azurePipelineData ? (aggregateAzureMetrics(state.azurePipelineData, 'all').success_rate + '%') : '0%'}</div>
      <div class="card-hint">Click to view pipeline runs →</div>
    </div>
  ` : ''}
  ```
- [x] 2.2 After `app.innerHTML = html`, add click handler:
  ```js
  document.getElementById('azurePipelineCard')?.addEventListener('click', () => {
    state.currentView = 'azurePipelines';
    render(); // Shows empty state with Sync Now if no data
  });
  ```

## Task 3: State Additions

- [x] 3.1 Add to `state` object:
  ```js
  azurePipelineData: null,
  azurePipelineSyncing: false,
  azurePipelineProject: 'all',
  azurePipelineSubTab: 'overview',
  ```

## Task 4: Data Functions

- [x] 4.1 Add `async function loadAzurePipelineData()` — GET `/api/azure-pipeline/passport`, store in state, render
- [x] 4.2 Add `async function syncAzurePipeline()` — POST `/api/azure-pipeline/sync/passport`, store, render
- [x] 4.3 Add `function aggregateAzureMetrics(data, project)` — sum totals, compute success rate, avg duration
- [x] 4.4 Add `async function exportAzurePipelineCsv()` — fetch CSV endpoint, create blob, trigger download

## Task 5: Drill-Down View

- [x] 5.1 In `render()`, add `if (state.currentView === 'azurePipelines')` block with full HTML:
  - Back button (← Back to Dashboard)
  - Header row with title + Sync Now button + synced timestamp
  - Project filter buttons (All / Passport / CITI / Collaboration Portal)
  - Summary cards: Total Runs | Succeeded | Failed | Partial | Success Rate | Avg Duration
  - Sub-tab buttons: Overview | Run History | By Category
  - Tab content areas (conditionally rendered by `state.azurePipelineSubTab`)
- [x] 5.2 After render, attach event listeners for:
  - Back button → `state.currentView = 'dashboard'; render()`
  - Sync Now → `syncAzurePipeline()`
  - CSV Export (header button) → `exportAzurePipelineCsv()`
  - Project filter buttons → update `state.azurePipelineProject`, re-render
  - Sub-tab buttons → update `state.azurePipelineSubTab`, re-render

## Task 6: Date Range Filter in Drill-Down View

- [x] 6.1 Add to `state` object:
  ```js
  azurePipelineDateFrom: new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10),
  azurePipelineDateTo: new Date().toISOString().slice(0,10),
  ```
- [x] 6.2 Add `.az-date-filters` CSS styles (flex row, matches existing control styles)
- [x] 6.3 In the `azurePipelines` drill-down view, insert date pickers between project filters and summary cards:
  ```html
  <div class="az-date-filters">
    <label>From:</label> <input type="date" id="azDateFrom" value="..." />
    <label>To:</label> <input type="date" id="azDateTo" value="..." />
  </div>
  ```
- [x] 6.4 Update `aggregateAzureMetrics(data, projectFilter, dateFrom, dateTo)` to filter `recent_runs` by `startTime` within the date range, and re-compute metrics from the filtered runs only
- [x] 6.5 Pass `state.azurePipelineDateFrom` / `state.azurePipelineDateTo` to `aggregateAzureMetrics()` from the drill-down view render
- [x] 6.6 Attach `change` event listeners on the date inputs to update state and re-render
- [x] 6.7 Update `exportAzurePipelineCsv()` to pass `dateFrom`/`dateTo` query params to `GET /api/azure-pipeline/:productId/export/csv`

## Task 7: Enhanced Playwright Category Detection

- [x] 7.1 In `azure-pipeline.integration.js`, add `async function detectPlaywrightFromYaml(definition)` that:
  - Checks if `definition.process?.yamlFilename` exists
  - If so, fetches YAML content via Azure DevOps Items API: `GET /{org}/{project}/_apis/git/repositories/{repoId}/items?path={yamlFilename}&api-version=7.1`
  - Searches the YAML text for `/playwright/i` patterns (`playwright`, `npx playwright`, `@playwright/test`)
  - Returns `true` if found, `false` otherwise (catches errors gracefully)
- [x] 7.2 In `fetchPipelineRuns()`, after filtering to testing defs, enhance each definition:
  - For each definition where `classifyCategory(def.name) === 'Other'`, call `detectPlaywrightFromYaml(def)` to check YAML
  - If Playwright detected, store a `_playwrightDetected` flag on the definition
- [x] 7.3 In `mapBuild()`, accept an optional `yamlPlaywright` boolean param; if the category from `classifyCategory()` is `'Other'` and `yamlPlaywright` is `true`, set category to `'Playwright'`
- [x] 7.4 Update exports if needed

## Task 8: Validation

- [x] 8.1 Select Passport → verify 8th tile appears
- [x] 8.2 Select DnA → verify tile disappears
- [x] 8.3 Click tile → drill-down renders with back button
- [x] 8.4 Click Sync Now → data loads from Azure DevOps
- [x] 8.5 Verify original dashboard theme and all card colors unchanged
- [x] 8.6 Verify all existing click handlers (DoR, Tests Covered, Defects) still work
- [x] 8.7 Export CSV → file downloads
- [x] 8.8 Change From/To dates → summary cards and tables update to show only runs in range
- [x] 8.9 Verify Passport/CP pipelines using Playwright appear under "Playwright" in By Category tab

## Task 9: Bug Fix — Total Count Mismatch (Canceled Runs)

- [x] 9.1 Add `.az-card-cancel` CSS styles — gray border-left + text color (`#78909c`)
- [x] 9.2 Add "Canceled" summary card between Partial and Success Rate in the drill-down view showing `azAgg.canceled` count
- [x] 9.3 Verify: Total Runs = Succeeded + Failed + Partial + Canceled for all projects

## Task 10: Bug Fix — Tile % Not Updating with Date Filter

- [x] 10.1 In the main dashboard tile render, change `aggregateAzureMetrics(state.azurePipelineData, 'all')` to `aggregateAzureMetrics(state.azurePipelineData, 'all', state.azurePipelineDateFrom, state.azurePipelineDateTo)`
- [x] 10.2 The tile now dynamically reflects the selected date range without affecting other dashboard logic
- [x] 10.3 Verify: Change From/To date in drill-down → go back → tile % reflects the filtered range

## Task 11: Bug Fix — Subfolder Pipelines Excluded by Name Filter

- [x] 11.1 **Root cause**: `isTestingPipeline('imanage')` returned `false` because the name doesn't match any of the 10 testing patterns — pipeline was excluded before builds were fetched or YAML detection could run
- [x] 11.2 In `fetchPipelineRuns()`, change the filter: pipelines in **subfolders** (`d.path !== folderPath`) are auto-included; only root-level pipelines use `isTestingPipeline()` name check
- [x] 11.3 Add console log for subfolder-detected pipeline count
- [x] 11.4 Verify: Build `#20260129.7` (`imanage`, Genesis folder, Jan 29) now appears in Passport results after sync

## Task 12: Bug Fix — Branch-Aware YAML Detection (Bulk_Reassign)

- [x] 12.1 **Root cause**: `Bulk_Reassign` (Def 4952) references YAML file `Spartacles-Automation/azure-pipeline-passport-spartacles.yml` which exists only on the `Spartacles` branch, not `master`. The Items API returned `TF401174 GitItemNotFoundException` and YAML detection silently returned `false`.
- [x] 12.2 In `detectPlaywrightFromYaml()`, after fetching full definition detail, also capture `repository.defaultBranch` (e.g. `refs/heads/Spartacles`)
- [x] 12.3 When the default-branch YAML fetch fails with `TF401174`/`404`, retry with `versionDescriptor.version={branch}&versionDescriptor.versionType=branch` using the pipeline's configured branch
- [x] 12.4 Verify: `Bulk_Reassign` YAML fetched from `Spartacles` branch contains `pool: name: 'Playwright'` and `Run_Spatacles_Playwright` → now categorized as Playwright

## Task 13: Sprint-Aware Azure Pipeline Tile (JIRA Sprint Dates)

- [x] 13.1 **New file**: `backend/api-gateway/jira-sprint-dates.js` — JIRA Sprint Date Service
  - Fetches sprint dates from JIRA Agile REST API: `GET /rest/agile/1.0/board/{boardId}/sprint`
  - Board IDs: PP Genesis → 5414, PP Pioneers → 5812, PP Spartacles → 7916
  - Sprint name pattern: `Passport {TeamName}-{sprintNumber}` (e.g., `Passport Spartacles-26.1.3`)
  - Exports: `getSprintDates(teamId, sprintId)`, `getAllSprintDates(teamId)`, `TEAM_FOLDER_PATTERNS`, `PASSPORT_BOARDS`
  - In-memory cache with 30 min TTL
- [x] 13.2 **`azure-pipeline.integration.js`**: Add `folderPath` field to `mapBuild()` output; pass `d.path` through `fetchBuildsForPipeline()`
- [x] 13.3 **`server.js`**: Add 3 new API routes:
  - `GET /api/sprint-dates/:teamId/:sprintId` — returns `{ startDate, endDate, name, state }`
  - `GET /api/sprint-dates/:teamId` — returns all sprints with dates
  - `GET /api/team-folder-patterns` — returns team-to-regex mapping
- [x] 13.4 **`frontend/index.html`**: Add `sprintDatesCache` and `teamFolderPatterns` to state
- [x] 13.5 **`frontend/index.html`**: Update `aggregateAzureMetrics()` to accept optional `teamId` param; filter runs by `folderPath` regex when team specified
- [x] 13.6 **`frontend/index.html`**: Add `getAzureTileMetrics()` function — uses sprint dates + team filter when available, falls back to 30-day window
- [x] 13.7 **`frontend/index.html`**: Add `fetchSprintDatesForTile()` function — fetches sprint dates from `/api/sprint-dates/:teamId/:sprintId`, caches in state, triggers re-render
- [x] 13.8 **`frontend/index.html`**: Call `fetchSprintDatesForTile()` on team/sprint change (4 locations: initial auto-select, product change, team change handler, sprint dropdown change)
- [x] 13.9 **`frontend/index.html`**: Update tile to use `getAzureTileMetrics()` and show "Sprint 26.1.3 · Click →" hint when sprint-filtered
- [x] 13.10 **`jiraBugService.js`**: Updated Passport team `boardId` values from `null` to actual board IDs (5414, 5812, 7916)
- [x] 13.11 **`frontend/index.html`**: Add `loadAzurePipelineData()` call in `loadProducts()` to load pipeline data on page init
