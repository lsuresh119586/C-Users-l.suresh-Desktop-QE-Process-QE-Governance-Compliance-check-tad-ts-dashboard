# Plan — SDD-005: Azure Pipeline Tile in Legacy Dashboard

## Phase 1: Add Tile to Metrics Grid

1. **CSS** — Add `.metric-card:nth-child(8)` animation delay and optional `card-cyan` color variant in the `<style>` block
2. **Tile HTML** — Inside `render()`, within the `.metrics-grid` block, add the 8th card conditionally when `state.selectedProduct === 'passport'`. Show **0%** as the default value when no data is loaded (consistent with the Automation Coverage % tile) instead of “—”.
3. **Click handler** — After `app.innerHTML = html`, attach click listener on `#azurePipelineCard` that sets `state.currentView = 'azurePipelines'` and calls `render()`

## Phase 2: Drill-Down View

4. **State additions** — Add `state.azurePipelineData`, `state.azurePipelineSyncing`, `state.azurePipelineProject` (filter)
5. **View rendering** — Add `if (state.currentView === 'azurePipelines')` block in `render()` with:
   - Back button
   - Header + Sync Now button
   - Project filter buttons
   - Summary cards row
   - Sub-tabs (overview / history / category / export)
6. **Event listeners** — After render, attach listeners for Sync Now, project filter, sub-tabs, export button

## Phase 3: Data Functions

7. **`syncAzurePipeline()`** — POST to `/api/azure-pipeline/sync/passport`, store in `state.azurePipelineData`, re-render
8. **`loadAzurePipelineData()`** — GET cached data from `/api/azure-pipeline/passport`, fallback to sync
9. **`exportAzurePipelineCsv()`** — Fetch CSV endpoint, trigger download
10. **`aggregateAzureMetrics(data, project)`** — Compute totals across projects or for a single project

## Phase 4: Date Range Filter

11. **State additions** — Add `azurePipelineDateFrom` (default: 30 days ago) and `azurePipelineDateTo` (default: today)
12. **Date picker UI** — Add From / To date inputs between project filters and summary cards in the drill-down view
13. **Client-side filtering** — Update `aggregateAzureMetrics()` to accept `dateFrom`/`dateTo` params and filter `recent_runs` by `startTime`
14. **CSV export** — Pass `dateFrom`/`dateTo` query params to the backend CSV endpoint
15. **Event listeners** — On date change, update state and re-render

## Phase 5: Enhanced Playwright Category Detection

16. **YAML detection helper** — Add `detectPlaywrightFromYaml(definition)` to `azure-pipeline.integration.js` that fetches YAML content via Azure DevOps File Contents API and searches for Playwright references
17. **Category override** — In `mapBuild()` / `fetchPipelineRuns()`, if `classifyCategory()` returns `'Other'`, check YAML detection; if Playwright found, override category to `'Playwright'`
18. **Scope** — Applies to all three project folders (Passport, CITI, Collaboration Portal) so Passport and CP pipelines using Playwright are correctly classified

## Phase 7: Bug Fixes

19. **Canceled runs card** — Add a "Canceled" summary card (gray `#78909c`) between Partial and Success Rate in the drill-down view to account for canceled builds. Previously, Total Runs ≠ Succeeded + Failed + Partial because canceled runs were not displayed.
20. **Dynamic tile %** — Pass `state.azurePipelineDateFrom` / `state.azurePipelineDateTo` to `aggregateAzureMetrics()` in the main tile render, so the 8th card success-rate % reflects the user's current date filter.
21. **CSS for canceled card** — Add `.az-card-cancel` border+text styles (gray `#78909c`).
22. **Subfolder pipeline detection** — In `fetchPipelineRuns()`, pipelines in subfolders of the configured path are auto-included (skip `isTestingPipeline()` name check). Only root-level pipelines use name-based filtering. Root cause: `imanage` (Genesis subfolder) was excluded because its name didn't match any testing pattern.
23. **Subfolder log** — Log count of pipelines included via subfolder detection for visibility.
24. **Branch-aware YAML fetch** — When YAML file doesn't exist on repo default branch (master), read `repository.defaultBranch` from the full definition and retry on the pipeline's configured branch (e.g. `Spartacles`, `Genesis`). Fixes `Bulk_Reassign` and similar team-branch pipelines.

## Phase 8: Sprint-Aware Pipeline Tile (JIRA Sprint Dates)

25. **JIRA Sprint Date Service** — New `jira-sprint-dates.js`: fetches sprint start/end dates from JIRA Agile REST API (`GET /rest/agile/1.0/board/{boardId}/sprint`). Board IDs: Genesis 5414, Pioneers 5812, Spartacles 7916. Cached 30 min.
26. **Pipeline folderPath** — Add `folderPath` field to `mapBuild()` output in `azure-pipeline.integration.js`, pass `d.path` through `fetchBuildsForPipeline()`.
27. **Team-folder mapping** — `TEAM_FOLDER_PATTERNS`: `pp-spartacles → /spartacles/i`, `pp-genesis → /genesis/i`, `pp-pioneers → /pioneers/i`.
28. **API routes** — `GET /api/sprint-dates/:teamId/:sprintId`, `GET /api/sprint-dates/:teamId`, `GET /api/team-folder-patterns` in `server.js`.
29. **Frontend state** — Add `sprintDatesCache`, `teamFolderPatterns` to state. Call `fetchSprintDatesForTile()` on team/sprint change.
30. **Tile logic** — `getAzureTileMetrics()` uses sprint dates + team folder filter when available; falls back to 30-day window. Tile hint: "Sprint 26.1.3 · Click →" or "Last 30 days · Click →".
31. **Board IDs** — Update `jiraBugService.js` Passport team `boardId` from `null` to actual values.

## Phase 9: Validation

22. Test: Select Passport → 8th tile appears with value
23. Test: Select DnA/T360 → tile NOT shown
24. Test: Click tile → drill-down renders
25. Test: Sync Now → data refreshes
26. Test: Back button → returns to dashboard
27. Test: Export → CSV downloads
28. Test: Original theme/navigation completely intact
29. Test: Date range filter — change dates, verify summary cards and tables update
30. Test: Total Runs count equals Succeeded + Failed + Partial + Canceled
31. Test: Main tile % updates when date range is changed in drill-down
32. Test: Subfolder pipelines (Genesis: edocs, imanage, spol) appear in results after sync
33. Test: Playwright category — verify Passport/CP pipelines using Playwright appear under "Playwright" in By Category tab
34. Test: Select Spartacles + Sprint 26.1.3 → tile shows success rate for runs during Jan 28–Feb 11 in Spartacles folders only
35. Test: Select Genesis + Sprint 26.1.1 → tile filters to Genesis folders during Dec 31–Jan 14
36. Test: Sprint dates fetched from JIRA, tile hint shows "Sprint 26.1.X · Click →"
