# QTest Sprint References

## Sprint Locations in QTest

This document maps Polaris ELM sprints to their actual QTest project IDs and locations.

### Sprint Information

| Sprint | QTest Project ID | Test Design URL |
|--------|------------------|-----------------|
| 26.1.1 | 68209713 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#id=68209713&object=0&tab=testdesign) |
| 26.1.2 | 68209714 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#id=68209714&object=0&tab=testdesign) |
| 26.1.3 | 68209719 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#id=68209719&object=0&tab=testdesign) |
| 26.1.4 | 68289134 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#id=68289134&object=0&tab=testdesign) |
| 26.1.5 | 68341069 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#create=1&id=68341069&object=0&tab=testdesign) |
| 26.1.6 | 68341070 | [View in QTest](https://wk.qtestnet.com/p/114345/portal/project#create=1&id=68341070&object=0&tab=testdesign) |

### QTest API Configuration

**API Base URL**: `https://wk.qtestnet.com/api/v3`

**Project ID**: 114345

### Usage

These sprint IDs can be used to:
1. Fetch real-time test case data from QTest
2. Retrieve team-specific test metrics
3. Link test cases to sprints in the dashboard
4. Sync test results and automation coverage

### Related Files

- Backend API: `backend/api-gateway/server.js` - Contains `/api/qtest/sprint/<sprint>` endpoint
- Frontend Dashboard: `frontend/unified-dashboard.html` - Displays sprint data
- Database: `backend/api-gateway/db.json` - Currently uses mock data

### Integration Notes

- Current dashboard uses mock data from `db.json`
- To use live QTest data, update the backend API to call QTest endpoints using these sprint IDs
- Frontend automatically loads data for selected sprint via `/api/qtest/sprint/{sprint-name}`
