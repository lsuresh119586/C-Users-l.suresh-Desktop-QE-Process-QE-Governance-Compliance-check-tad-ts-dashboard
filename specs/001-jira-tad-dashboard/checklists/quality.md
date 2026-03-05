# Quality Checklist

Feature: `001-jira-tad-dashboard`
Focus: Testing, reliability, and regressions

## Unit Tests
- [ ] Team option derivation tested for Passport vs non-Passport products
- [ ] UI visibility logic tested for CPOD and non-CPOD states
- [ ] Date validation helper tested for Today auto-fill path
- [ ] CPOD Jira query builder tested for all filter clauses (`FR-042`..`FR-045`)
- [ ] CPOD deduplication by issue key tested (`FR-051`)
- [ ] Missing-field exclusion behavior tested (`FR-050`)
- [ ] Backend query processor normalizes product/team input values (trim + case-insensitive)
- [ ] API service throws on non-2xx responses and surfaces backend error messages

## Integration Tests
- [ ] CPOD filter state maps to date-range API request parameters
- [ ] Non-CPOD filter state maps to sprint-based API request parameters
- [ ] Switching product/team clears invalid stale filter state
- [ ] CPOD date range uses `created` with UTC full-day inclusive boundaries (`FR-046`, `FR-047`)
- [ ] CPOD card replacement of standard Closed Defects verified (`FR-055`)
- [ ] CPOD invalid date-range response (400) is handled as validation error in UI (not `Data unavailable`)
- [ ] CPOD Jira fetch failure response (503) is handled as text-only `Data unavailable`

## E2E Tests (Playwright)
- [ ] Passport -> CPOD visibility flow passes
- [ ] CPOD selection hides Sprint Details and shows Calendar range
- [ ] Run with empty CPOD dates auto-fills Today and completes request
- [ ] Switching away from CPOD restores Sprint Details
- [ ] CPOD Closed Defects count updates when date range changes
- [ ] CPOD no-result state shows count `0`
- [ ] CPOD Jira/API failure shows text-only `Data unavailable`
- [ ] CPOD flow remains functional under script-based local publish (`./start-servers.ps1`)

## Reliability
- [ ] No new frontend runtime errors in console during CPOD flows
- [ ] No backend uncaught exceptions for CPOD requests
- [ ] Existing dashboard metrics pages continue functioning
- [ ] Non-CPOD Closed Defects behavior is unchanged
- [ ] Backend `/api/products` and frontend `/unified-dashboard.html` health checks pass after scripted startup
