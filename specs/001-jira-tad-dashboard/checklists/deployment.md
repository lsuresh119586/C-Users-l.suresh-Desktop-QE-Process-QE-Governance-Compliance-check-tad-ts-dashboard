# Deployment Checklist

Feature: `001-jira-tad-dashboard`
Focus: Release readiness and post-deploy verification

## Pre-Deploy
- [ ] Dependency install succeeds in frontend and backend
- [ ] Build/start scripts execute successfully in target environment
- [ ] Script-based startup verified via `./start-servers.ps1`
- [ ] Environment configuration validated for Jira/QTest integrations
- [ ] Backend required env vars (`JIRA_API_TOKEN`, `QTEST_API_TOKEN`, `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) are present in target runtime

## Local Publish (Implementation Baseline)
- [ ] Run `./start-servers.ps1` from workspace root
- [ ] Verify backend responds on `http://localhost:3000/api/products`
- [ ] Verify frontend responds on `http://localhost:5173/unified-dashboard.html`
- [ ] Confirm script output shows both backend and frontend as healthy
- [ ] If placeholder env mode is used, note that CPOD Jira card may return `Data unavailable` until real credentials are configured

## Deploy
- [ ] Deploy backend and frontend artifacts to target environment
- [ ] Restart services and verify healthy startup logs
- [ ] Confirm no regression in existing product/team dashboard flows

## Post-Deploy Verification
- [ ] Passport shows CPOD team option
- [ ] CPOD hides Sprint Details and shows Calendar range
- [ ] CPOD run with blank dates auto-fills Today and executes
- [ ] Non-CPOD teams retain sprint-based behavior
- [ ] CPOD Closed Defects card replaces standard Closed Defects card position
- [ ] CPOD date-range change updates Closed Defects count from Jira
- [ ] CPOD no-result scenario renders count `0`
- [ ] CPOD Jira/API failure renders text-only `Data unavailable`
- [ ] CPOD invalid date range (`startDate > endDate`) returns validation error (not `Data unavailable`)
- [ ] CPOD product/team inputs are case/whitespace tolerant in backend filtering

## Rollback Readiness
- [ ] Rollback procedure documented and tested
- [ ] Previous stable artifact references are available
