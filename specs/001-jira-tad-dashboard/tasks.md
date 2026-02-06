# Tasks: Jira TAD & Test Strategy Compliance Dashboard

**Input**: Design documents from `/specs/001-jira-tad-dashboard/`
**Prerequisites**: plan.md ✅, spec.md ✅

**Status**: Core implementation already exists (`dashboard_server.py`). These tasks document what exists and identify enhancements needed for production readiness.

**Tests**: Test tasks included as this is a production system requiring quality assurance.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Current structure (single directory):
```
tad-ts-dashboard/
├── dashboard_server.py (main server)
├── sprint-tad-ts-report.py (JIRA data collector)
├── analyze-ts-quality.py (quality analyzer)
├── generate-standalone-html.py (HTML generator)
├── cleanup_old_files.py (file cleanup)
└── [generated dashboard files]
```

---

## Phase 1: Setup & Documentation

**Purpose**: Project organization, dependency management, and configuration

**Status**: Partially complete - server exists but needs supporting infrastructure

- [ ] T001 Create requirements.txt with Python dependencies (jira, python-dotenv, pytest, pytest-mock)
- [ ] T002 [P] Create .env.example template with JIRA configuration variables
- [ ] T003 [P] Create config.py to load environment variables and server settings
- [ ] T004 [P] Create README.md with installation, configuration, and usage instructions
- [ ] T005 [P] Create .gitignore for Python (exclude .env, __pycache__, *.pyc, generated HTML/MD files)
- [ ] T006 Document JIRA API authentication in docs/jira-setup.md

---

## Phase 2: Foundational Testing Infrastructure

**Purpose**: Core test infrastructure that MUST be complete before user story testing

**⚠️ CRITICAL**: Test framework must be set up before implementing user story tests

- [ ] T007 Setup pytest configuration in pytest.ini or pyproject.toml
- [ ] T008 Create tests/conftest.py with shared fixtures (mock server, temp directories)
- [ ] T009 [P] Create tests/unit/ directory structure
- [ ] T010 [P] Create tests/integration/ directory structure
- [ ] T011 [P] Create tests/mocks/ directory with mock JIRA responses
- [ ] T012 Create test helper functions in tests/helpers.py (file cleanup, server lifecycle)

**Checkpoint**: Test infrastructure ready - user story testing can begin

---

## Phase 3: User Story 1 - View PR Merge Compliance Status (Priority: P1) 🎯 MVP

**Goal**: Dashboard displays real-time compliance status for all sprint issues with TAD/TS presence

**Independent Test**: Start server, verify it displays sample data with compliance indicators

**Current Status**: ✅ IMPLEMENTED in dashboard_server.py - needs testing and validation

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL, then validate existing implementation**

- [ ] T013 [P] [US1] Unit test for DashboardServer initialization in tests/unit/test_server.py
- [ ] T014 [P] [US1] Unit test for refresh_data() method in tests/unit/test_server.py
- [ ] T015 [P] [US1] Unit test for get_latest_dashboards() file discovery in tests/unit/test_server.py
- [ ] T016 [P] [US1] Integration test for server startup and initial refresh in tests/integration/test_server_lifecycle.py
- [ ] T017 [P] [US1] Integration test for HTTP file serving in tests/integration/test_http_serving.py
- [ ] T018 [P] [US1] Integration test for cache-control headers in tests/integration/test_http_serving.py
- [ ] T019 [US1] Contract test for sprint-tad-ts-report.py output format in tests/contract/test_sprint_report.py
- [ ] T020 [US1] Contract test for generated HTML structure in tests/contract/test_html_generation.py

### Validation & Enhancement for User Story 1

- [ ] T021 [US1] Validate dashboard_server.py correctly handles missing scripts (sprint-tad-ts-report.py, etc.)
- [ ] T022 [US1] Validate error handling for port conflicts (errno 10048)
- [ ] T023 [US1] Validate graceful shutdown on Ctrl+C
- [ ] T024 [US1] Add health check endpoint at /health in dashboard_server.py
- [ ] T025 [US1] Enhance logging with structured format (JSON logs option) in dashboard_server.py
- [ ] T026 [US1] Document refresh cycle behavior in README.md

**Checkpoint**: User Story 1 complete - dashboard displays compliance data with auto-refresh

---

## Phase 4: User Story 2 - Filter and Search PRs (Priority: P2)

**Goal**: Users can filter and search dashboard data by project, date, status

**Independent Test**: Apply filters, verify results update correctly

**Current Status**: ⚠️ PARTIAL - Basic dashboard exists, filtering may need enhancement in HTML generation

### Tests for User Story 2

- [ ] T027 [P] [US2] Contract test for filter parameters in sprint-tad-ts-report.py in tests/contract/test_filters.py
- [ ] T028 [P] [US2] Integration test for project filter in generated HTML in tests/integration/test_filtering.py
- [ ] T029 [P] [US2] Integration test for date range filter in tests/integration/test_filtering.py
- [ ] T030 [P] [US2] Integration test for compliance status filter in tests/integration/test_filtering.py
- [ ] T031 [US2] Integration test for search functionality in tests/integration/test_search.py

### Implementation for User Story 2

- [ ] T032 [P] [US2] Add command-line arguments to sprint-tad-ts-report.py for project filter
- [ ] T033 [P] [US2] Add command-line arguments to sprint-tad-ts-report.py for date range filter
- [ ] T034 [US2] Enhance generate-standalone-html.py to include client-side filtering (JavaScript)
- [ ] T035 [US2] Add search box HTML component in generate-standalone-html.py
- [ ] T036 [US2] Implement JavaScript filter logic in generated HTML template
- [ ] T037 [US2] Add "Clear Filters" button in dashboard HTML
- [ ] T038 [US2] Test filter persistence in browser session storage (optional enhancement)

**Checkpoint**: User Story 2 complete - dashboard has full filtering and search capabilities

---

## Phase 5: User Story 3 - View Document Details and Access Links (Priority: P3)

**Goal**: Users can click on compliance indicators to see document details and JIRA links

**Independent Test**: Click on TAD/TS status, verify modal/popup with details appears

**Current Status**: ⚠️ NEEDS IMPLEMENTATION - Requires enhancement to HTML generation

### Tests for User Story 3

- [ ] T039 [P] [US3] Contract test for document metadata in sprint-tad-ts-report.py output in tests/contract/test_document_metadata.py
- [ ] T040 [P] [US3] Integration test for document detail modal in generated HTML in tests/integration/test_document_details.py
- [ ] T041 [US3] Integration test for JIRA deep links in tests/integration/test_jira_links.py

### Implementation for User Story 3

- [ ] T042 [P] [US3] Enhance sprint-tad-ts-report.py to fetch document metadata (name, upload date, attachment ID)
- [ ] T043 [P] [US3] Enhance sprint-tad-ts-report.py to construct JIRA deep links for attachments
- [ ] T044 [US3] Add modal/popup HTML component in generate-standalone-html.py
- [ ] T045 [US3] Implement JavaScript click handlers for compliance indicators
- [ ] T046 [US3] Display document list with metadata in modal
- [ ] T047 [US3] Add "View in JIRA" link that opens in new tab
- [ ] T048 [US3] Handle missing document scenario (show "Not Found" message)

**Checkpoint**: User Story 3 complete - users can access detailed document information

---

## Phase 6: User Story 4 - Generate Compliance Reports (Priority: P3)

**Goal**: Users can generate and export compliance reports in CSV/PDF formats

**Independent Test**: Generate report, verify data accuracy and export functionality

**Current Status**: ⚠️ PARTIAL - Markdown reports exist, CSV/PDF export needs implementation

### Tests for User Story 4

- [ ] T049 [P] [US4] Unit test for report generation logic in tests/unit/test_reports.py
- [ ] T050 [P] [US4] Integration test for CSV export in tests/integration/test_csv_export.py
- [ ] T051 [US4] Integration test for date range report filtering in tests/integration/test_report_filters.py

### Implementation for User Story 4

- [ ] T052 [P] [US4] Create generate-csv-report.py script to convert data to CSV
- [ ] T053 [P] [US4] Add "Export CSV" button to dashboard HTML
- [ ] T054 [US4] Implement CSV download via JavaScript (Blob API)
- [ ] T055 [US4] Create generate-pdf-report.py using reportlab or weasyprint (optional)
- [ ] T056 [US4] Add trend chart generation using matplotlib or plotly
- [ ] T057 [US4] Enhance team_reports_*.md to include summary statistics
- [ ] T058 [US4] Add report configuration options (date range selector, project selector)

**Checkpoint**: User Story 4 complete - full reporting and export capabilities

---

## Phase 7: Polish & Production Readiness

**Purpose**: Cross-cutting enhancements, error handling, and deployment preparation

**Status**: Final touches for production deployment

- [ ] T059 [P] Add comprehensive error handling for JIRA API failures in sprint-tad-ts-report.py
- [ ] T060 [P] Add retry logic with exponential backoff for JIRA API calls
- [ ] T061 [P] Implement rate limit detection and graceful degradation
- [ ] T062 [P] Add performance logging (timing for each refresh step)
- [ ] T063 [P] Create deployment guide in docs/deployment.md
- [ ] T064 [P] Create troubleshooting guide in docs/troubleshooting.md
- [ ] T065 Create setup script (setup.sh or setup.ps1) for automated installation
- [ ] T066 Add security scan for credentials in logs (ensure no API token leakage)
- [ ] T067 Add metrics collection (optional - Prometheus format)
- [ ] T068 Create systemd service file for Linux deployment (optional)
- [ ] T069 Create Windows service wrapper (optional)
- [ ] T070 Final integration test: Full refresh cycle with real JIRA data

---

## Dependencies & Execution Order

### Critical Path (Must complete in order)

1. **Phase 1** (T001-T006): Setup → Creates config and documentation
2. **Phase 2** (T007-T012): Test Infrastructure → Enables all testing
3. **Phase 3** (T013-T026): User Story 1 → Core dashboard functionality
4. **Phase 4** (T027-T038): User Story 2 → Filtering capabilities
5. **Phase 5** (T039-T048): User Story 3 → Document details
6. **Phase 6** (T049-T058): User Story 4 → Reporting
7. **Phase 7** (T059-T070): Polish → Production ready

### Parallel Execution Opportunities

**Setup Phase** (can all run in parallel after T001):
- T002 (.env.example) || T003 (config.py) || T004 (README) || T005 (.gitignore) || T006 (JIRA docs)

**Test Infrastructure** (can run in parallel after T008):
- T009 (unit/) || T010 (integration/) || T011 (mocks/)

**US1 Tests** (can run in parallel after test infrastructure):
- T013 || T014 || T015 || T016 || T017 || T018 || T019 || T020

**US1 Validation** (can run in parallel after US1 tests):
- T021 || T022 || T023 || T025

**US2 Tests** (can run in parallel):
- T027 || T028 || T029 || T030

**US2 Implementation** (T032 and T033 parallel, others sequential):
- T032 || T033 → T034 → T035 → T036 → T037

**US3 Tests** (can run in parallel):
- T039 || T040

**US3 Implementation** (T042 and T043 parallel):
- T042 || T043 → T044 → T045 → T046 → T047

**US4 Tests** (can run in parallel):
- T049 || T050

**US4 Implementation** (T052 and T053 parallel):
- T052 || T053 → T054 → T055 || T056 → T057

**Polish Phase** (many parallel):
- T059 || T060 || T061 || T062 || T063 || T064 || T066 || T067 || T068 || T069

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**Goal**: Get working dashboard in production quickly

**Include**:
- Phase 1: Setup (T001-T006)
- Phase 2: Test Infrastructure (T007-T012) 
- Phase 3: User Story 1 validation (T013-T026)

**Estimated Effort**: 3-5 days

**Deliverable**: Tested, documented, production-ready dashboard server with auto-refresh

### Increment 2: Enhanced Usability

**Add**:
- Phase 4: User Story 2 (T027-T038) - Filtering and search

**Estimated Effort**: 2-3 days

**Deliverable**: Dashboard with full filtering capabilities

### Increment 3: Deep Insights

**Add**:
- Phase 5: User Story 3 (T039-T048) - Document details and links

**Estimated Effort**: 2-3 days

**Deliverable**: Dashboard with drill-down capability

### Increment 4: Executive Reporting

**Add**:
- Phase 6: User Story 4 (T049-T058) - Report generation and export

**Estimated Effort**: 3-4 days

**Deliverable**: Full reporting and export functionality

### Final: Production Hardening

**Add**:
- Phase 7: Polish (T059-T070)

**Estimated Effort**: 2-3 days

**Deliverable**: Production-hardened system with deployment automation

---

## Task Summary

| Phase | Total Tasks | Parallel Tasks | Estimated Days |
|-------|-------------|----------------|----------------|
| Phase 1: Setup | 6 | 5 | 1 |
| Phase 2: Test Infrastructure | 6 | 3 | 1 |
| Phase 3: US1 (MVP) | 14 | 10 | 3 |
| Phase 4: US2 | 12 | 6 | 2-3 |
| Phase 5: US3 | 10 | 4 | 2-3 |
| Phase 6: US4 | 10 | 4 | 3-4 |
| Phase 7: Polish | 12 | 10 | 2-3 |
| **TOTAL** | **70 tasks** | **42 parallel** | **14-18 days** |

**MVP Timeline**: 5 days (Phases 1-3)  
**Full Implementation**: 14-18 days (all phases)

---

## Notes

1. **Existing Implementation**: Core server (`dashboard_server.py`) is already complete - focus is on testing, documentation, and enhancements
2. **Supporting Scripts**: The 4 supporting scripts exist but may need enhancement for filtering/details functionality
3. **Test-First**: Write tests before validating/enhancing existing code
4. **Independent Stories**: Each user story can be deployed independently once Phase 1-2 complete
5. **Parallel Work**: 60% of tasks (42/70) can run in parallel with proper team coordination
