# Passport CPOD Fix Specification

## Overview
Remove CPOD from Passport team configurations as it is not a valid SAFe Team value in JIRA's `cf[13392]` (SAFe Team) custom field.

## Problem Statement
When fetching TAD/TS compliance for Passport teams, the JIRA API returns error:
```
{"errorMessages":["The option 'CPOD' for field 'cf[13392]' does not exist."],"errors":{}}
```

This causes the entire TAD/TS compliance query to fail for all Passport teams.

## Root Cause
- `CPOD` was configured as a Passport team in both:
  1. `passportTadTsComplianceService.js` - TEAM_MAPPING
  2. `jiraBugService.js` - passportTeams
- However, `CPOD` is not a valid option in JIRA's `cf[13392]` (SAFe Team) field

## Solution

### Files Changed

#### 1. `backend/api-gateway/passportTadTsComplianceService.js`
**Before:**
```javascript
const TEAM_MAPPING = {
  'PP Genesis': 'PP Genesis',
  'PP Pioneers': 'PP Pioneers',
  'PP Spartacles': 'PP Spartacles',
  'CPOD': 'CPOD',
};
```

**After:**
```javascript
// Note: CPOD removed - not a valid SAFe Team value in JIRA cf[13392]
const TEAM_MAPPING = {
  'PP Genesis': 'PP Genesis',
  'PP Pioneers': 'PP Pioneers',
  'PP Spartacles': 'PP Spartacles'
};
```

#### 2. `backend/api-gateway/jiraBugService.js`
**Before:**
```javascript
'pp-spartacles': {
  name: 'PP Spartacles',
  jiraProject: 'ELM',
  boardId: null,
  sprintFormat: '{sprint}',
  safeTeamValues: ['PP Spartacles']
},
'cpod': {
  name: 'CPOD',
  jiraProject: 'ELM',
  boardId: null,
  sprintFormat: '{sprint}',
  safeTeamValues: ['CPOD']
}
```

**After:**
```javascript
'pp-spartacles': {
  name: 'PP Spartacles',
  jiraProject: 'ELM',
  boardId: null,
  sprintFormat: '{sprint}',
  safeTeamValues: ['PP Spartacles']
}
// Note: CPOD removed - not a valid SAFe Team value in JIRA cf[13392]
```

## Testing

### Manual Verification
1. Start backend server: `cd backend/api-gateway && node server.js`
2. Test bug metrics endpoint:
   ```
   GET http://localhost:3000/api/bugs/passport/all?sprint=26.1.1
   ```
3. Verify no JIRA 400 error about CPOD
4. Verify PP Genesis, PP Pioneers, PP Spartacles data returns correctly

### Test Results (March 4, 2026)

| Sprint | PP Genesis | PP Pioneers | PP Spartacles |
|--------|------------|-------------|---------------|
| 26.1.1 | 1 bug (0 open) | 0 bugs | 4 bugs (0 open) |
| 26.1.2 | 1 bug (0 open) | 0 bugs | 4 bugs (0 open) |
| 26.1.3 | 0 bugs | 0 bugs | 1 bug (0 open) |
| 26.1.4 | 4 bugs (1 open) | 0 bugs | 2 bugs (1 open) |
| 26.1.5 | 4 bugs (2 open) | 1 bug (1 open) | 1 bug (0 open) |

**Note:** PP Pioneers has very few bugs in JIRA - this is correct data, not a bug.

### Expected Behavior
- TAD/TS compliance queries should execute without JIRA 400 errors
- Only valid Passport teams (PP Genesis, PP Pioneers, PP Spartacles) are queried
- Bug metrics return real-time data from JIRA for all sprints

## Impact
- **Frontend**: CPOD will no longer appear in Passport team dropdown
- **Backend**: TAD/TS compliance queries will succeed for Passport
- **Tests**: `cpod.logic.spec.ts` tests may need updates (T071-T082)

## Related Files
- `tests/e2e/cpod.logic.spec.ts` - May need test updates
- `frontend/src/services/api.ts` - CPOD_TEAM_ID constant may need removal

## Date
March 4, 2026
