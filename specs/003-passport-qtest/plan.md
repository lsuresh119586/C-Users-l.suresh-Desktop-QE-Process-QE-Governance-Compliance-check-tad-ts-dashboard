# Passport qTest Integration Plan

## Objective

Add Passport-specific qTest integration for "Tests Covered" automation coverage tracking, using requirement-based linking instead of module-based approach.

## Phase 1: Core Integration (Completed ✅)

### 1.1 Create Passport qTest Service
- [x] Create `passport-qtest-integration.js`
- [x] Implement requirement search function
- [x] Implement linked test cases retrieval
- [x] Implement test case details fetching
- [x] Implement automation status classification
- [x] Implement caching mechanism

### 1.2 Add Server Endpoints
- [x] Add `GET /api/qtest/passport/sprint/:sprint`
- [x] Add `POST /api/qtest/passport/sync/:sprint`
- [x] Add `GET /api/qtest/passport/config`
- [x] Import passport-qtest-integration in server.js

### 1.3 Configuration
- [x] Add Passport qTest env variables to .env
- [x] Configure dual project support (Passport + Collab Portal)

## Phase 2: Data Integration (Next)

### 2.1 TAD-TS Integration
- [ ] Connect Passport TAD-TS compliance data to qTest sync
- [ ] Automatically extract ELM cards from compliance data
- [ ] Trigger qTest sync when TAD-TS data is refreshed

### 2.2 db.json Update
- [ ] Add Passport team data to tests_covered section
- [ ] Ensure db.json format matches existing structure
- [ ] Add sample data for development/testing

## Phase 3: Frontend Integration

### 3.1 Dashboard Updates
- [ ] Ensure Tests Covered dashboard fetches Passport data
- [ ] Add Passport teams to team dropdown
- [ ] Display automation coverage metrics

### 3.2 UI Enhancements
- [ ] Show qTest source indicator (requirement vs module)
- [ ] Add link to qTest test cases
- [ ] Display automation tool breakdown

## Phase 4: Testing & Validation

### 4.1 API Testing
- [ ] Test `/api/qtest/passport/sprint/:sprint` endpoint
- [ ] Test `/api/qtest/passport/sync/:sprint` endpoint
- [ ] Verify DnA/T360 endpoints still work

### 4.2 Integration Testing
- [ ] Test end-to-end flow with live qTest
- [ ] Verify multi-project fallback (Passport → Collab Portal)
- [ ] Test cache behavior

## Dependencies

| Dependency | Status |
|------------|--------|
| CPOD fix (TAD-TS) | ✅ Completed |
| Bug metrics fix | ✅ Completed |
| qTest bearer token | ✅ Configured |
| ELM cards from TAD-TS | 🔄 Available via compliance service |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| qTest token expiration | Token stored in .env, easy to update |
| ELM card not found in qTest | Fallback to secondary project |
| Slow API performance | 30-second timeout, retry logic, caching |
| DnA/T360 breakage | Separate endpoint, no shared code |

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Core Integration | 1 day | ✅ Complete |
| Phase 2: Data Integration | 1 day | 🔄 In Progress |
| Phase 3: Frontend Integration | 1 day | Not Started |
| Phase 4: Testing | 1 day | Not Started |

## Success Criteria

1. ✅ Passport qTest endpoints return valid data
2. ✅ DnA/T360 endpoints unchanged
3. ⬜ Tests Covered dashboard shows Passport teams
4. ⬜ Automation coverage percentages accurate
5. ⬜ No regressions in existing functionality

## Date
March 4, 2026
