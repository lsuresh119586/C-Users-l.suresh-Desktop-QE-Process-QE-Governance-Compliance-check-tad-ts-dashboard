# Feature Specification: Jira TAD & Test Strategy Compliance + Tests Covered Dashboard + Requirements Covered

**Feature Branch**: `001-jira-tad-dashboard`  
**Last Updated**: 2026-02-12 - Added Requirements Covered Metrics by Sprint  
**Enhanced**: 2026-02-06 - Added Tests Covered Dashboard  
**Created**: 2026-01-21  
**Status**: Complete ✅  
**Input**: User description: "Create a dashboard to monitor Jira PR merges and validate presence of TAD (Technical Architecture Document) and Test Strategy documents"

## 🎉 NEW: Requirements Covered Metrics (Updated February 12, 2026)

### Requirements Covered Dashboard - Overview
Real-time visualization of requirements covered metrics by sprint and team across all product lines. Provides comprehensive view of test requirement coverage, test execution status, and deployment readiness indicators.

### Features Implemented
- ✅ Requirements covered % by sprint and team
- ✅ Tests covered metrics visualization
- ✅ Defects tracking (open/closed)
- ✅ Deployment readiness indicators
- ✅ Code quality metrics
- ✅ Team performance ranking
- ✅ Sprint progression tracking
- ✅ Real-time metric updates from JIRA data

### Updated Metrics Summary (as of 2026-02-12)

#### Overall Statistics
- **Total Sprints Monitored**: 38
- **Average Requirements Covered**: 89.05%
- **Average Tests Covered**: 83.11%
- **Average Deployment Readiness**: 89.34%
- **Average Code Quality**: 84.34%

#### Product Performance

##### Passport Product
- **Team A**: 86.5% average requirements covered (2 sprints)
  - Sprint 25.1.1: 85% requirements, 80% tests
  - Sprint 25.1.2: 88% requirements, 82% tests

##### T360 Product
- **Mavericks** (🥇 Top Performer): 92% average requirements covered (6 sprints)
  - Sprint 26.1.1-6 progression: 87% → 95% requirements covered
  
- **Chargers** (🥈): 91.33% average requirements covered (6 sprints)
  - Consistent improvement trend across sprints
  
- **Nexus** (🥉): 90.5% average requirements covered (6 sprints)
  - Strong performance with steady progression
  
- **Chubb**: 88% average requirements covered (6 sprints)
  - Solid performance with steady improvement
  
- **Vanguards**: 86.83% average requirements covered (6 sprints)
  - Good performance with room for improvement
  
- **Matrix**: 86.5% average requirements covered (6 sprints)
  - Consistent performance baseline

#### Team Performance Ranking (by Requirements Covered)
1. 🥇 **Mavericks**: 92% average (6 sprints, T360)
2. 🥈 **Chargers**: 91.33% average (6 sprints, T360)
3. 🥉 **Nexus**: 90.5% average (6 sprints, T360)
4. **Chubb**: 88% average (6 sprints, T360)
5. **Vanguards**: 86.83% average (6 sprints, T360)
6. **Team A**: 86.5% average (2 sprints, Passport)
7. **Matrix**: 86.5% average (6 sprints, T360)

---

## 🎉 Tests Covered Feature

### Tests Covered Dashboard - Overview
The Tests Covered dashboard provides real-time visualization of test automation metrics by sprint and team. Users can monitor automation coverage percentages, view test counts (total, automated, manual), and analyze team-level test metrics.

### Features Implemented
- ✅ Sprint-based test metrics view
- ✅ Automation coverage % visualization with progress bars
- ✅ Team breakdown table with individual coverage %
- ✅ Real-time sprint switching
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Navigation from main dashboard
- ✅ Back button to return to main dashboard
- ✅ Sample data for 3 sprints with 5 teams each

### Sample Data Provided
- **Sprints**: 26.1.1, 26.1.2, 26.1.3
- **Teams per Sprint**: 5 (Chubb, Matrix, Mavericks, Nexus, Vanguards)
- **Test Cases**: 345+ per sprint
- **Average Coverage**: 83.2% automation

### User Stories - Tests Covered

#### Story T1: View Test Metrics by Sprint (Priority: P1)
As a QE Lead, I need to see test automation coverage metrics by sprint so I can track automation progress and identify improvement areas.

**Acceptance Scenarios**:
1. **Given** I'm on the dashboard, **When** I click "Tests Covered" card, **Then** Tests Covered dashboard opens
2. **Given** Tests Covered dashboard is open, **When** I view the page, **Then** I see automation coverage %, total tests, automated tests, and manual tests
3. **Given** multiple sprints are available, **When** I select a sprint from dropdown, **Then** metrics update for that sprint

#### Story T2: View Team Test Breakdown (Priority: P1)
As a QE Manager, I need to see which teams have high/low automation coverage so I can allocate resources for improvement.

**Acceptance Scenarios**:
1. **Given** I'm viewing Tests Covered dashboard, **When** I scroll down, **Then** I see team breakdown table
2. **Given** team breakdown is visible, **When** I view the table, **Then** each team shows total tests, automated, manual, and coverage %
3. **Given** coverage percentages are displayed, **When** I view the table, **Then** progress bars show visual representation of coverage

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View PR Merge Compliance Status (Priority: P1)

As a COP (Center of Practice) member, I need to see a real-time overview of all merged PRs and their TAD/Test Strategy compliance status so I can quickly identify non-compliant merges and take corrective action.

**Why this priority**: This is the core value proposition - visibility into compliance is the primary need. Without this view, the dashboard has no purpose.

**Independent Test**: Can be fully tested by creating sample merged PRs with and without TAD/Test Strategy attachments in Jira, then verifying the dashboard correctly displays their compliance status. Delivers immediate value as a read-only monitoring tool.

**Acceptance Scenarios**:

1. **Given** I am logged into the dashboard, **When** I view the main compliance page, **Then** I see a list of all merged PRs from the last 30 days with columns: PR ID, Title, Merge Date, TAD Status (✓/✗), Test Strategy Status (✓/✗), Overall Compliance (Pass/Fail)
2. **Given** a PR has both TAD and Test Strategy attached, **When** I view the dashboard, **Then** that PR shows green checkmarks (✓) for both document types and overall status "Pass"
3. **Given** a PR is missing either TAD or Test Strategy, **When** I view the dashboard, **Then** that PR shows red X (✗) for missing documents and overall status "Fail"
4. **Given** the dashboard is displaying data, **When** new PRs are merged in Jira, **Then** the dashboard auto-refreshes within 5 minutes to show the new entries

---

### User Story 2 - Filter and Search PRs (Priority: P2)

As a COP member, I need to filter and search through PRs by project, date range, compliance status, and team so I can focus on specific problem areas and generate targeted reports.

**Why this priority**: Enables actionable insights from the data. Once you can see compliance status (P1), you need to drill down into specific issues.

**Independent Test**: Can be tested independently by populating the dashboard with diverse PR data, then verifying all filter combinations work correctly and return expected results. Adds value for analysis workflows.

**Acceptance Scenarios**:

1. **Given** I am on the compliance dashboard, **When** I select a Jira project filter (e.g., "PROJECT-A"), **Then** only PRs from that project are displayed
2. **Given** I want to see recent non-compliant PRs, **When** I apply filters for "Status: Fail" and "Date Range: Last 7 days", **Then** only failed PRs from the last week are shown
3. **Given** I need to find a specific PR, **When** I enter a PR ID or title in the search box, **Then** matching PRs are instantly filtered
4. **Given** I have applied multiple filters, **When** I click "Clear Filters", **Then** all filters are reset and full dataset is displayed

---

### User Story 3 - View Document Details and Access Links (Priority: P3)

As a COP member, I need to view which specific documents are attached to a PR and access them directly so I can verify quality and completeness of the documentation, not just presence.

**Why this priority**: Enhances the basic compliance check with actionable details. Users may need to verify the actual content of documents.

**Independent Test**: Can be tested by clicking on PR entries in the dashboard and verifying document metadata and links are correctly displayed and functional. Adds convenience but dashboard is still valuable without this.

**Acceptance Scenarios**:

1. **Given** I am viewing a compliant PR, **When** I click on the TAD status indicator, **Then** a popup/modal shows the document name, upload date, and a direct link to view it in Jira
2. **Given** I am viewing a compliant PR, **When** I click on the Test Strategy status indicator, **Then** I can see the document details and access link
3. **Given** a PR has multiple versions of a document, **When** I view document details, **Then** all versions are listed with timestamps and the most recent is marked
4. **Given** I am viewing a non-compliant PR, **When** I click on the failed status indicator, **Then** I see a message indicating which document is missing

---

### User Story 4 - Generate Compliance Reports (Priority: P3)

As a COP lead, I need to generate and export compliance reports (weekly, monthly, quarterly) so I can share metrics with leadership and track compliance trends over time.

**Why this priority**: Important for governance and leadership visibility, but the real-time dashboard serves the immediate operational need first.

**Independent Test**: Can be tested by generating reports with various date ranges and formats, verifying the exported data matches dashboard data. Adds value for reporting workflows.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I click "Generate Report" and select date range and Jira projects, **Then** a summary report is generated showing: Total PRs, Compliant PRs, Non-Compliant PRs, Compliance Rate (%)
2. **Given** I have generated a report, **When** I click "Export to CSV", **Then** a CSV file downloads containing all PR details with compliance status
3. **Given** I need trend analysis, **When** I generate a monthly report, **Then** I see a chart showing compliance rate trend over the selected months
4. **Given** leadership needs executive summary, **When** I generate a report, **Then** I can export it as PDF with charts and summary statistics

---

### Edge Cases

- What happens when a PR has documents attached but they don't match the expected naming pattern (e.g., "technical_design.pdf" instead of "TAD.pdf")?
- How does the system handle PRs that were merged before the monitoring period started?
- What happens if Jira API is temporarily unavailable or rate-limited?
- How does the system distinguish between different document attachment methods (direct attachment vs. linked documents vs. embedded URLs in description)?
- What happens when a PR is associated with multiple Jira issues?
- How does the system handle permissions - what if the user can't access certain Jira projects?
- What happens when documents are added to a PR after it was merged (retroactive compliance)?

## Requirements *(mandatory)*

### Functional Requirements

#### Core Dashboard & Server

- **FR-001**: System MUST run as a local HTTP server on configurable port (default: 8080)
- **FR-002**: System MUST be accessible via localhost and network IP for team sharing
- **FR-003**: System MUST serve multiple dashboard types: Main Dashboard, Team Dashboard, Sprint Reports, Test Quality Analysis
- **FR-004**: System MUST generate standalone HTML dashboards that work without backend dependencies
- **FR-005**: System MUST implement cache-control headers (no-store, no-cache, must-revalidate) to ensure fresh content
- **FR-006**: System MUST provide graceful shutdown on keyboard interrupt (Ctrl+C)
- **FR-007**: System MUST display server startup information including: localhost URL, network URL, auto-refresh interval, available dashboards

#### JIRA Integration & Data Collection

- **FR-008**: System MUST connect to Jira via REST API using configured credentials
- **FR-009**: System MUST fetch sprint data including all issues with TAD and Test Strategy status
- **FR-010**: System MUST identify TAD documents by checking Jira issue attachments and custom fields
- **FR-011**: System MUST identify Test Strategy documents by checking Jira issue attachments and custom fields
- **FR-012**: System MUST determine compliance status for each issue: Pass (both documents present) or Fail (one or both missing)
- **FR-013**: System MUST handle JIRA API errors gracefully and log error details with timestamps

#### Auto-Refresh & Report Generation

- **FR-014**: System MUST auto-refresh dashboard data at configurable intervals (default: 30 minutes)
- **FR-015**: System MUST run refresh in background thread without blocking server operation
- **FR-016**: System MUST execute refresh workflow in this order:
  1. Generate sprint TAD/TS report (sprint-tad-ts-report.py)
  2. Analyze test strategy quality (analyze-ts-quality.py)
  3. Generate standalone HTML dashboards (generate-standalone-html.py)
  4. Cleanup old file versions (cleanup_old_files.py)
- **FR-017**: System MUST log each refresh step with status (success/failure) and timestamp
- **FR-018**: System MUST display next refresh time after successful refresh
- **FR-019**: System MUST perform initial refresh on server startup before serving requests

#### Dashboard Files & Reporting

- **FR-020**: System MUST generate/serve these dashboard files:
  - tad-ts-dashboard.html (Main Dashboard)
  - team-dashboard.html (Team Dashboard)
  - sprint-{name}-standalone.html (Sprint-specific reports)
  - ts_quality_analysis_{timestamp}.html (Test quality HTML)
  - ts_quality_analysis_{timestamp}.md (Test quality Markdown)
  - team_reports_{timestamp}.md (Detailed team reports)
- **FR-021**: System MUST automatically discover and list latest versions of timestamped files
- **FR-022**: System MUST sort dashboard files by timestamp (newest first) when multiple versions exist
- **FR-023**: System MUST generate compliance reports showing sprint-level TAD/TS metrics
- **FR-024**: System MUST analyze test strategy quality with scoring and recommendations

#### File Management

- **FR-025**: System MUST cleanup old versions of timestamped dashboard files automatically
- **FR-026**: System MUST preserve latest version of each dashboard type during cleanup
- **FR-027**: System MUST check for required Python scripts before starting (sprint-tad-ts-report.py, analyze-ts-quality.py)
- **FR-028**: System MUST log file operations (generation, cleanup) with timestamps

### Non-Functional Requirements

- **NFR-001**: Server MUST start within 5 seconds including initial JIRA data refresh
- **NFR-002**: System MUST handle Jira API rate limits gracefully with proper error messages
- **NFR-003**: Dashboard HTML files MUST be viewable in modern desktop browsers (Chrome, Firefox, Edge, Safari)
- **NFR-004**: Auto-refresh background thread MUST NOT block server HTTP request handling
- **NFR-005**: System MUST use daemon threads for background tasks to allow clean shutdown
- **NFR-006**: API credentials MUST be stored securely (environment variables, config files, or secrets management)
- **NFR-007**: Server MUST be deployable on any machine with Python 3.x and required dependencies
- **NFR-008**: System MUST provide clear error messages when port is already in use (errno 10048 on Windows)
- **NFR-009**: Dashboard files MUST work standalone without requiring active server after generation
- **NFR-010**: Network URL MUST be auto-detected and displayed for easy team sharing
- **NFR-011**: System MUST log all operations with timestamps in format YYYY-MM-DD HH:MM:SS
- **NFR-012**: Refresh interval MUST be configurable via code constant (default: 30 minutes)
- **NFR-013**: Server port MUST be configurable via code constant (default: 8080)

### Key Entities

- **Dashboard Server**: HTTP server hosting dashboard files. Key attributes: Port Number, Server Status (running/stopped), Network IP Address, Refresh Interval, Running State (boolean)
- **Sprint Issue**: Represents a Jira issue within a sprint. Key attributes: Issue Key, Title, Sprint Name, TAD Status (Present/Missing), Test Strategy Status (Present/Missing), Overall Compliance (Pass/Fail), Assignee, Team
- **Dashboard File**: Generated HTML or Markdown report. Key attributes: Filename, File Type (main/team/sprint/quality), Generation Timestamp, File Path, Is Latest Version (boolean)
- **Refresh Job**: Background task that regenerates dashboards. Key attributes: Start Time, End Time, Status (success/failure), Error Message (if failed), Scripts Executed (list), Next Refresh Time
- **Test Strategy Quality Analysis**: Assessment of test strategy completeness. Key attributes: Issue Key, Quality Score, Missing Elements (list), Recommendations (list), Analysis Timestamp
- **Team Report**: Aggregated compliance metrics per team. Key attributes: Team Name, Total Issues, TAD Compliant Count, TS Compliant Count, Compliance Rate (%), Report Timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: COP members can identify all non-compliant PRs within 30 seconds of opening the dashboard
- **SC-002**: Dashboard displays compliance status for all merged PRs from the last 30 days within 3 seconds
- **SC-003**: 95% of COP team members report that the dashboard improves their ability to track compliance vs. manual Jira searches
- **SC-004**: Reduce time spent manually checking PR compliance from 2 hours/week to 15 minutes/week per COP member
- **SC-005**: System successfully generates accurate weekly compliance reports with 100% data accuracy compared to manual audits
- **SC-006**: Dashboard maintains real-time sync with Jira data with maximum 5-minute staleness
- **SC-007**: Zero false negatives (PRs marked compliant when they're not) in compliance status detection
- **SC-008**: Leadership receives monthly compliance trend reports showing improvement in documentation adherence

## Assumptions

- **ASSUM-001**: All teams use Jira for sprint and issue tracking
- **ASSUM-002**: TAD and Test Strategy documents are attached directly to Jira issues or tracked via custom fields
- **ASSUM-003**: COP has access to Jira API with read permissions for all monitored projects/sprints
- **ASSUM-004**: There is a consistent naming convention or field structure for identifying TAD and Test Strategy in Jira
- **ASSUM-005**: Python 3.x is installed on the machine running the dashboard server
- **ASSUM-006**: Required Python scripts exist in the same directory: sprint-tad-ts-report.py, analyze-ts-quality.py, generate-standalone-html.py, cleanup_old_files.py
- **ASSUM-007**: Users have modern web browsers (no JavaScript required for standalone HTML dashboards)
- **ASSUM-008**: Server will run in an internal environment with network access to Jira
- **ASSUM-009**: Port 8080 is available (or user can configure alternative port)
- **ASSUM-010**: Machine running server has sufficient permissions to create/modify files in dashboard directory

## Out of Scope

- **OOS-001**: Real-time notifications/alerts for non-compliant issues (email/Slack notifications)
- **OOS-002**: Integration with GitHub/GitLab/Bitbucket for direct repository analysis
- **OOS-003**: Automated enforcement that blocks issue transitions without required documentation
- **OOS-004**: Advanced document content validation beyond presence checking
- **OOS-005**: User authentication and role-based access control in dashboard server (assumes local/trusted network)
- **OOS-006**: Historical trend analysis across multiple sprints with predictive analytics
- **OOS-007**: Mobile-responsive dashboard layouts
- **OOS-008**: Database persistence (all data regenerated from JIRA on each refresh)
- **OOS-009**: WebSocket-based real-time updates (uses periodic polling refresh instead)
- **OOS-010**: HTTPS/SSL certificate management (local HTTP only)
- **OOS-011**: Multi-user concurrent editing or collaboration features
- **OOS-012**: Customizable dashboard layouts or widgets via UI

## Technical Implementation Details

### Architecture

- **Python-based**: Core implementation using Python 3.x standard library
- **HTTP Server**: Uses Python's `http.server` and `socketserver` modules
- **Multi-threading**: Background refresh runs in daemon thread using `threading` module
- **Subprocess Execution**: Dashboard generation scripts executed via `subprocess.run()`
- **File-based**: Dashboards stored as static HTML/Markdown files on filesystem
- **Standalone Dashboards**: Generated HTML files work independently after creation

### Dependencies

- **Python Standard Library**: http.server, socketserver, threading, time, subprocess, datetime, pathlib
- **External Scripts** (required in same directory):
  - sprint-tad-ts-report.py (generates sprint compliance data)
  - analyze-ts-quality.py (analyzes test strategy quality)
  - generate-standalone-html.py (creates standalone HTML dashboards)
  - cleanup_old_files.py (removes old file versions)

### Configuration

- **PORT**: HTTP server port (default: 8080, configurable via constant)
- **REFRESH_INTERVAL_MINUTES**: Auto-refresh frequency (default: 30 minutes, configurable via constant)
- **DASHBOARD_DIR**: Directory containing dashboard files (default: script parent directory)
