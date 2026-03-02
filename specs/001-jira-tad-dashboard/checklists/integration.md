# Integration Checklist

Feature: `001-jira-tad-dashboard`
Focus: API/request behavior for CPOD calendar mode and CPOD Closed Defects

## Request Contract
- [ ] CPOD requests send `product=passport` and `team=cpod`
- [ ] CPOD requests include `startDate` and `endDate`
- [ ] Non-CPOD requests continue sending sprint-based parameters
- [ ] CPOD closed-defects request uses Jira `created` date range with UTC full-day bounds
- [ ] Product/team matching is case/whitespace tolerant end-to-end (`Passport`/` CPOD ` still resolves to CPOD mode)

## Backend Handling
- [ ] Backend recognizes CPOD calendar mode without breaking sprint mode
- [ ] Backend logs identify calendar-based vs sprint-based query paths
- [ ] Invalid CPOD inputs are handled gracefully (no 5xx)
- [ ] Backend rejects CPOD requests where `startDate > endDate` with validation error
- [ ] Backend ignores date-range parameters for non-CPOD requests
- [ ] Backend applies CPOD Jira filter clauses for Project/Type/Status/Engagement Reason
- [ ] Backend enforces Safe Product and Safe-Team constraints in CPOD Jira queries
- [ ] Backend enforces `is Related to` + `TO Patch` association for CPOD count
- [ ] Backend deduplicates by issue key before returning CPOD closed-defect count
- [ ] Backend returns text-only `Data unavailable` state contract on Jira/API failure
- [ ] Backend CPOD Jira failure response uses HTTP `503` with code `CPOD_DATA_UNAVAILABLE`
- [ ] Backend CPOD validation failure response uses HTTP `400` (distinct from `Data unavailable`)

## External Data Dependencies
- [ ] Jira fetch path works for CPOD date range filters
- [ ] Existing Jira/QTest integrations unaffected for non-CPOD paths
- [ ] Error messages are user-meaningful when integration data is unavailable
- [ ] Jira field-name mapping for Engagement Reason/Safe Product/Safe-Team resolves correctly
- [ ] Frontend API client propagates non-2xx responses so CPOD validation and availability states can be distinguished
