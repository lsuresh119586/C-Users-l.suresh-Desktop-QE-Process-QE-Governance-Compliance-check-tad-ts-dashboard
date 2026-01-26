# Polaris - ELM Metrics Dashboard: Specification

**Version:** 1.0  
**Created:** January 21, 2026  
**Status:** Draft  
**Methodology:** Specification-Driven Development (GitHub Spec Kit)

---

## 1. Overview & Business Context

### 1.1 Business Problem

The ELM (Enterprise Lifecycle Management) organization comprises 11 teams across 4 product areas, operating within the SAFE (Scaled Agile Framework) methodology. Currently, there is no centralized, real-time visibility into critical quality metrics across the organization. Stakeholders at multiple levels—from individual contributors to executive leadership—lack a unified view of:

- Sprint and release readiness
- Technical Architecture Document (TAD) completion
- Test Strategy (TS) completion
- Test coverage (unit and functional)
- Defect tracking aligned to SAFE-SDLC phases
- Team-level and product-level performance

This lack of visibility leads to:
- Delayed identification of quality gaps
- Inability to compare team performance
- Manual effort to compile release readiness reports
- Reactive rather than proactive quality management
- Limited transparency for stakeholders

**Polaris** (the North Star) will serve as the single source of truth for ELM's quality and engineering metrics, enabling data-driven decision-making and proactive quality management.

### 1.2 Target Users

**Primary Users:**

1. **QE Leadership** (3-5 users)
   - Need: Strategic oversight of quality across all teams and products
   - Goal: Identify trends, allocate resources, drive quality improvements

2. **Dev Leadership** (3-5 users)
   - Need: Team performance visibility, code quality metrics
   - Goal: Support teams, identify bottlenecks, ensure best practices

3. **Product Managers** (8-10 users)
   - Need: Feature readiness, test coverage for their features
   - Goal: Make informed release decisions, understand quality risks

4. **Individual Contributors** (Devs/QEs, 80-100 users)
   - Need: Personal metrics, team metrics, sprint-level visibility
   - Goal: Understand their contribution, align with team goals

5. **Executive Leadership** (2-4 users)
   - Need: High-level KPIs, trend analysis, organizational health
   - Goal: Strategic planning, resource allocation, compliance reporting

### 1.3 Success Criteria

**Quantitative Metrics:**
- **Adoption Rate**: 80%+ of target users access dashboard weekly within 3 months
- **Time Savings**: Reduce release readiness assessment time from 4 hours to 30 minutes (75% reduction)
- **Data Accuracy**: >99% match with source systems (Jira, QTest, Bitbucket)
- **Performance**: Dashboard loads in <3 seconds with full data
- **Uptime**: 99.5% availability during business hours (8am-6pm EST)

**Qualitative Metrics:**
- Increased TAD completion rate (baseline: 70% → target: 90%+)
- Increased TS completion rate (baseline: 65% → target: 85%+)
- Positive user feedback (Net Promoter Score >50)
- Reduction in quality-related release delays
- Improved cross-team visibility and collaboration

### 1.4 Hierarchical Data Model

**Organization Structure:**
```
Organization (ELM)
├── Product Area 1: Passport Client Automation
│   ├── Team 1: Passport Rangers
│   └── Team 2: Passport Navigators
├── Product Area 2: Tymetrix 360 (T360)
│   ├── Team 3: T360 Vanguards
│   └── Team 4: T360 Pioneers
├── Product Area 3: Data & Analytics (DnA)
│   ├── Team 5: DnA Explorers
│   └── Team 6: DnA Innovators
└── Product Area 4: Collaboration Portal
    ├── Team 7: Collab Guardians
    └── Team 8: Collab Builders
```

**Metric Aggregation Levels:**
1. **Product Level**: Aggregated metrics across all teams in a product
2. **Team Level**: Aggregated metrics for a specific team across all sprints
3. **Sprint Level**: Specific team + sprint combination metrics
4. **Story Level**: Individual story-level TAD/TS/test details

**Navigation Pattern:**
- User selects **Product** → Shows product-level aggregated metrics (all teams)
- User selects **Product + Team** → Shows team-level aggregated metrics (all sprints)
- User selects **Product + Team + Sprint** → Shows sprint-level specific metrics
- User can drill down from any level to see detailed breakdowns

### 1.5 Scope

**In Scope (Version 1.0):**
- Real-time metrics dashboard with drill-down navigation (Org → Product → Team → Sprint → Story)
- All metrics defined in Section 3.2
- Integration with existing Jira MCP Server, QTest MCP Proxy, Bitbucket
- Export to PDF, Excel, PowerPoint
- Role-based access control
- Historical data (6 months)
- Responsive web UI (desktop, tablet, mobile)

**Out of Scope (Future Versions):**
- SonarQube integration (code quality metrics)
- Predictive analytics / AI-driven insights
- Custom metric creation by users
- Real-time alerts / notifications
- Mobile native apps
- Slack/Teams integration
- Automated report distribution
- Custom dashboard layouts per user

---

## 2. User Stories

### 2.0 Core Navigation: Hierarchical Drill-Down

**Story 0: Navigate Through Product Hierarchy**

```
As any user
I want to navigate through the product hierarchy (Product → Team → Sprint)
So that I can view metrics at different aggregation levels

Given I am on the dashboard
When I see the navigation selectors at the top
Then I can:
  - Select a Product Area (Passport, T360, DnA, Collaboration Portal)
  - Optionally select a Team within that product
  - Optionally select a Sprint for that team

And the metrics displayed update based on my selection:
  - Product only selected → Product-level aggregated metrics (all teams)
  - Product + Team selected → Team-level aggregated metrics (all sprints)  
  - Product + Team + Sprint selected → Sprint-specific metrics

Acceptance Criteria:
- [ ] Product selector is always visible and required
- [ ] Team selector is enabled only after product selection
- [ ] Team selector shows only teams belonging to selected product
- [ ] Sprint selector is enabled only after team selection
- [ ] Team and Sprint selectors show "All Teams" / "All Sprints" when not selected
- [ ] Metrics auto-refresh when any selector changes
- [ ] Current aggregation level is clearly indicated (badge/label)
- [ ] URL reflects current selections for bookmarking/sharing
- [ ] Navigation state persists across page refreshes
```

### 2.1 QE Leadership: Organizational Overview

**Story 1: View Organization-Wide Quality Dashboard**

```
As a QE Leader
I want to view organization-wide quality metrics at a glance
So that I can assess overall quality posture and identify areas needing attention

Given I am logged into Polaris
When I navigate to the dashboard home page
Then I see aggregated metrics for all teams and products:
  - TAD completion rate (org-wide)
  - TS completion rate (org-wide)
  - Unit test coverage (org-wide average)
  - Functional test coverage (org-wide average)
  - Test automation rate (org-wide)
  - Current sprint velocity
  - Defects by SAFE-SDLC activity

Acceptance Criteria:
- [ ] Dashboard displays within 3 seconds of page load
- [ ] All metrics show current data (refreshed within last 5 minutes)
- [ ] Metrics display as cards with percentage values and visual indicators (green/yellow/red)
- [ ] Color coding follows thresholds: Green (>90%), Yellow (70-90%), Red (<70%)
- [ ] Each metric card shows absolute numbers and percentages (e.g., "17 / 17 (100.0%)")
- [ ] Compliance donut chart shows 4 segments: TAD Complete, TS Complete, Both Complete, N/A
- [ ] User can refresh data manually with a refresh button
```

**Story 2: Drill Down into Product Metrics**

```
As a QE Leader
I want to drill down from organization level to product level
So that I can compare product performance and identify product-specific issues

Given I am viewing the organization-wide dashboard
When I click on a product name or product card
Then I am navigated to the product-level view showing:
  - All metrics scoped to that product
  - Team comparison bar charts (TAD completion by team, TS completion by team)
  - Test case summary table (team-level breakdown)
  - Sprint progress for all teams in the product

Acceptance Criteria:
- [ ] Breadcrumb navigation shows "Organization > [Product Name]"
- [ ] Back button returns to organization view
- [ ] Team comparison bar charts display side-by-side bars for easy comparison
- [ ] Each team's bar shows percentage and absolute count
- [ ] User can filter by sprint within product view
- [ ] Product view loads within 2 seconds
```

**Story 3: Export Quality Report**

```
As a QE Leader
I want to export the current dashboard view to PDF, Excel, or PowerPoint
So that I can share quality metrics in executive meetings and presentations

Given I am viewing any dashboard level (org, product, team, or sprint)
When I click the "Export" button and select a format (PDF/Excel/PPT)
Then the system generates a report containing:
  - All visible metrics and charts
  - Export timestamp and data freshness indicator
  - Filters applied (if any)
  - Company branding and formatting

Acceptance Criteria:
- [ ] Export completes within 10 seconds for PDF
- [ ] Export completes within 15 seconds for Excel with all data tables
- [ ] Export completes within 20 seconds for PowerPoint with charts as images
- [ ] PDF maintains visual fidelity (charts render correctly)
- [ ] Excel includes raw data tables for further analysis
- [ ] PowerPoint includes 1 slide per metric category with charts
- [ ] Exported file name follows pattern: "Polaris_[Level]_[Date].[ext]"
- [ ] Download initiates automatically upon completion
```

### 2.2 Dev Leadership: Team Performance

**Story 4: View Team-Level Metrics**

```
As a Dev Lead
I want to view metrics specific to my team(s)
So that I can track team performance, identify blockers, and support my engineers

Given I am logged into Polaris
When I navigate to a specific team view
Then I see team-specific metrics:
  - TAD completion for current sprint
  - TS completion for current sprint
  - Unit test coverage (current sprint average)
  - Sprint velocity and completion rate
  - Defects by activity assigned to team
  - Individual contributor breakdown (story-level drill-down available)

Acceptance Criteria:
- [ ] Team selector dropdown lists all teams I have access to
- [ ] Default view shows current sprint data
- [ ] User can select historical sprints from dropdown
- [ ] Team progress bars show percentage complete with color coding
- [ ] Clicking on a team member name drills down to their stories
- [ ] Test case summary table shows automation percentage per test type
```

**Story 5: Historical Trend Analysis**

```
As a Dev Lead
I want to view historical trends for my team's metrics
So that I can identify improvement areas and celebrate successes

Given I am viewing team-level metrics
When I select "Historical View" and choose a date range (up to 6 months)
Then I see line charts showing trends over time for:
  - TAD completion rate trend
  - TS completion rate trend
  - Unit test coverage trend
  - Sprint velocity trend
  - Defect density trend

Acceptance Criteria:
- [ ] Date range selector allows selection of 1 month, 3 months, or 6 months
- [ ] Line charts display sprint-by-sprint data points
- [ ] Hovering over data points shows exact values and sprint name
- [ ] Charts display trend lines (moving average)
- [ ] User can export historical data to Excel
- [ ] Historical view loads within 4 seconds
```

### 2.3 Product Manager: Feature Readiness

**Story 6: Assess Release Readiness**

```
As a Product Manager
I want to assess readiness for an upcoming release
So that I can make informed go/no-go decisions

Given I am viewing release-level metrics
When I select a specific release from the release dropdown
Then I see release readiness dashboard showing:
  - Release Readiness Score (composite metric 0-100)
  - Stories in release with TAD/TS status
  - Test coverage for release features
  - Outstanding defects by severity
  - Risk indicators (red flags for missing TADs, low coverage, P0/P1 defects)

Acceptance Criteria:
- [ ] Release selector shows all active and upcoming releases
- [ ] Release Readiness Score formula is transparent (documented in UI tooltip)
- [ ] Score components are color-coded (Green: 90-100, Yellow: 70-89, Red: <70)
- [ ] User can drill down into each score component
- [ ] "Stories at Risk" section highlights issues requiring attention
- [ ] Defect table is sortable by severity, status, and assignee
```

### 2.4 Individual Contributor: Personal Metrics

**Story 7: View My Sprint Contributions**

```
As a Developer or QE
I want to view my personal metrics for the current sprint
So that I can track my progress and ensure I'm meeting quality standards

Given I am logged into Polaris
When I navigate to "My Dashboard"
Then I see my personal metrics:
  - My stories in current sprint
  - TAD status for each story (Complete, Incomplete, N/A, Link to TAD)
  - TS status for each story (Complete, Incomplete, N/A, Link to TS)
  - Unit test coverage for my code (if dev)
  - Test case status for my stories (if QE)
  - My contribution to team metrics (percentage)

Acceptance Criteria:
- [ ] "My Dashboard" is the default landing page for ICs
- [ ] Story list shows Jira issue key, title, status, TAD status, TS status
- [ ] Clicking on story opens Jira issue in new tab
- [ ] Clicking on TAD/TS link opens Bitbucket PR with document
- [ ] Stories with missing TADs or TS are highlighted in yellow/red
- [ ] Personal metrics update within 5 minutes of changes in source systems
```

### 2.5 Executive Leadership: Strategic KPIs

**Story 8: View High-Level KPIs**

```
As an Executive
I want to view high-level quality KPIs across the organization
So that I can understand quality trends and make strategic decisions

Given I am logged into Polaris with executive role
When I navigate to the "Executive Dashboard"
Then I see high-level KPIs:
  - Overall Quality Score (composite metric)
  - TAD/TS Compliance Trend (6-month chart)
  - Test Automation Rate Trend
  - Velocity Trend by Product
  - Defect Escape Rate (defects found in prod vs test)
  - SAFE PI Health (per Program Increment)

Acceptance Criteria:
- [ ] Executive Dashboard loads within 3 seconds
- [ ] All metrics show trends (up/down arrows with percentages)
- [ ] Charts are high-level (no drill-down clutter)
- [ ] One-click export to PowerPoint for board presentations
- [ ] Metrics are aggregated across all products unless filtered
- [ ] Tooltips provide context for each metric calculation
```

---

## 3. Feature Specifications

### 3.1 Dashboard Layout

**Homepage Layout (Organization View):**

```
+------------------------------------------------------------------+
| [Polaris Logo]  [Sprint Selector ▼]  [Product Filter ▼]  [Export] |
+------------------------------------------------------------------+
| Breadcrumb: Organization                                          |
+------------------------------------------------------------------+
|                                                                   |
| +-------------------------+  +-------------------------+          |
| | TAD Completion          |  | TS Completion           |          |
| | 85%                     |  | 78%                     |          |
| | 170 / 200               |  | 156 / 200               |          |
| | [Green Progress Bar]    |  | [Yellow Progress Bar]   |          |
| +-------------------------+  +-------------------------+          |
|                                                                   |
| +-------------------------+  +-------------------------+          |
| | Unit Test Coverage      |  | Functional Test Cov.    |          |
| | 82%                     |  | 75%                     |          |
| | Avg across all teams    |  | Avg across all teams    |          |
| +-------------------------+  +-------------------------+          |
|                                                                   |
| +----------------------------------------------------------+     |
| | Compliance Donut Chart                                    |     |
| | [Visual: TAD Complete | TS Complete | Both | N/A]         |     |
| +----------------------------------------------------------+     |
|                                                                   |
| +----------------------------------------------------------+     |
| | Team Comparison (Bar Chart)                              |     |
| | [Side-by-side bars for TAD and TS completion by team]     |     |
| +----------------------------------------------------------+     |
|                                                                   |
| +----------------------------------------------------------+     |
| | Test Case Summary Table                                   |     |
| | Team | Total Cases | Automated | Auto % | Pass Rate      |     |
| +----------------------------------------------------------+     |
|                                                                   |
| +----------------------------------------------------------+     |
| | Defects by SAFE-SDLC Activity Table                       |     |
| | Activity | P0 | P1 | P2 | P3 | Total                      |     |
| +----------------------------------------------------------+     |
|                                                                   |
+------------------------------------------------------------------+
| Last Updated: [Timestamp]  |  Data Freshness: [5 mins]          |
+------------------------------------------------------------------+
```

**Navigation Hierarchy:**
1. **Organization View** → Shows all products aggregated
2. **Product View** → Shows all teams within selected product
3. **Team View** → Shows all sprints and team members
4. **Sprint View** → Shows all stories in selected sprint
5. **Story View** → Shows individual story details with links to Jira, TAD, TS

**Breadcrumb Navigation:**
- Always visible at top of page
- Clickable segments to navigate back up hierarchy
- Format: `Organization > T360 > Chubb Team > Sprint 26.1.2 > ELM-12345`

**Filter Panel (Left Sidebar or Collapsible):**
- Sprint selector (dropdown)
- Product filter (multi-select)
- Team filter (multi-select)
- Status filter (All, In Progress, Completed)
- Date range selector (for historical view)
- "Apply Filters" button
- "Reset Filters" button

### 3.2 Metrics Definitions

#### 3.2.1 TAD Document Completion Rate

- **Definition**: Percentage of stories with linked Technical Architecture Documents
- **Calculation**: `(Stories with TAD / Total Stories excluding "TAD N/A") × 100`
- **Data Source**: Jira Development section → Bitbucket PR links → Parse PR description for TAD markdown
- **Refresh Frequency**: Real-time (cache 5 minutes)
- **Handling N/A**: Stories with custom field `TAD Required = No` or label `TAD-NA` are excluded from denominator
- **Visualization**: 
  - Percentage value + count (e.g., "17 / 17 (100.0%)")
  - Progress bar (Green: >90%, Yellow: 70-90%, Red: <70%)
  - Donut chart segment in compliance chart
- **Drill-Down**: Click to see list of stories with/without TAD, link to Bitbucket PR
- **Export**: Include in all report formats with list of incomplete stories

#### 3.2.2 Test Strategy Completion Rate

- **Definition**: Percentage of stories with linked Test Strategy documents
- **Calculation**: `(Stories with TS / Total Stories excluding "TS N/A") × 100`
- **Data Source**: Jira Development section → Bitbucket PR links → Parse PR description for TS markdown
- **Refresh Frequency**: Real-time (cache 5 minutes)
- **Handling N/A**: Stories with custom field `TS Required = No` or label `TS-NA` are excluded from denominator
- **Visualization**: 
  - Percentage value + count (e.g., "15 / 17 (88.2%)")
  - Progress bar with color coding
  - Donut chart segment in compliance chart
- **Drill-Down**: Click to see list of stories with/without TS, link to Bitbucket PR
- **Export**: Include in all report formats with list of incomplete stories

#### 3.2.3 Both TAD & TS Complete Rate

- **Definition**: Percentage of stories with BOTH TAD and TS documents
- **Calculation**: `(Stories with TAD AND TS / Total Stories excluding N/A) × 100`
- **Data Source**: Intersection of TAD and TS completion data
- **Visualization**: Donut chart segment (largest segment ideally)
- **Drill-Down**: List of stories with both, list of stories missing one or both

#### 3.2.4 Unit Test Coverage Percentage

- **Definition**: Percentage of code covered by unit tests
- **Calculation**: `(Lines covered by unit tests / Total lines of code) × 100`
- **Data Source**: 
  - **Future (v2)**: SonarQube API
  - **MVP (v1)**: Manual entry or Jira custom field `Unit Test Coverage %`
- **Refresh Frequency**: Daily (batch job) or on-demand
- **Aggregation**: Team-level average, Product-level average, Org-level average
- **Visualization**: Percentage value with trend arrow (up/down from last sprint)
- **Thresholds**: Green (>80%), Yellow (60-80%), Red (<60%)

#### 3.2.5 Functional Test Coverage Percentage

- **Definition**: Percentage of functional requirements covered by test cases
- **Calculation**: `(Requirements with linked test cases / Total requirements) × 100`
- **Data Source**: 
  - Jira stories → QTest test cases linked via custom field or MCP mapping
  - QTest API: Count test cases per requirement
- **Refresh Frequency**: Real-time (cache 30 minutes)
- **Visualization**: Percentage with breakdown by test type (manual, automated)
- **Drill-Down**: List of requirements without test cases

#### 3.2.6 Test Case Automation Rate

- **Definition**: Percentage of test cases that are automated
- **Calculation**: `(Automated test cases / Total test cases) × 100`
- **Data Source**: QTest MCP Proxy → Test case automation status field
- **Refresh Frequency**: Real-time (cache 30 minutes)
- **Aggregation**: By team, by product, by sprint
- **Visualization**: 
  - Percentage with absolute counts
  - Breakdown table: Manual, Automated, Not Applicable
- **Drill-Down**: List of manual test cases eligible for automation

#### 3.2.7 QTest Results Attachment Rate

- **Definition**: Percentage of test executions with results attached in QTest
- **Calculation**: `(Test executions with results / Total test executions) × 100`
- **Data Source**: QTest MCP Proxy → Test execution attachments
- **Refresh Frequency**: Real-time (cache 30 minutes)
- **Visualization**: Percentage value
- **Purpose**: Ensure traceability and evidence of testing

#### 3.2.8 Sprint Velocity / Completion Rate

- **Definition**: Percentage of story points completed in sprint vs committed
- **Calculation**: `(Completed story points / Committed story points) × 100`
- **Data Source**: Jira sprint reports → Story points custom field
- **Refresh Frequency**: Real-time (cache 10 minutes)
- **Visualization**: 
  - Percentage with absolute points (e.g., "85 / 100 pts (85%)")
  - Trend chart over last 6 sprints
- **Drill-Down**: List of completed vs incomplete stories

#### 3.2.9 Defects by SAFE-SDLC Activity

- **Definition**: Count of defects categorized by the SAFE-SDLC phase where they were introduced
- **Data Source**: Jira defect issues → Custom field `SDLC Activity` (values: Requirements, Design, Development, Testing, Deployment, Production)
- **Refresh Frequency**: Real-time (cache 10 minutes)
- **Visualization**: 
  - Table with columns: Activity | P0 | P1 | P2 | P3 | Total
  - Sortable by activity, severity, or total
  - Color-coded cells (Red for P0, Orange for P1)
- **Drill-Down**: Click activity to see list of defects in that phase
- **Export**: Include in all report formats

#### 3.2.10 Release Readiness Score (Composite)

- **Definition**: Composite metric indicating readiness for release (0-100 scale)
- **Calculation**: Weighted average of:
  - TAD Completion (25%)
  - TS Completion (25%)
  - Unit Test Coverage (15%)
  - Functional Test Coverage (15%)
  - Open P0/P1 Defects (20%, inverse: fewer defects = higher score)
- **Formula**: 
  ```
  Score = (TAD% × 0.25) + (TS% × 0.25) + (UnitCov% × 0.15) + (FuncCov% × 0.15) + (DefectScore × 0.20)
  
  DefectScore = 100 - (P0_count × 20 + P1_count × 10), capped at 0
  ```
- **Refresh Frequency**: Real-time (cache 5 minutes)
- **Visualization**: 
  - Large score number with color coding (Green: 90-100, Yellow: 70-89, Red: <70)
  - Breakdown of score components with individual percentages
  - Tooltip explaining formula
- **Drill-Down**: Click to see detailed breakdown and stories at risk

### 3.3 Visualizations

#### 3.3.1 Compliance Donut Chart

- **Purpose**: Show distribution of TAD/TS compliance at a glance
- **Segments**:
  1. **Both Complete** (Green): Stories with both TAD and TS
  2. **TAD Only** (Blue): Stories with TAD but no TS
  3. **TS Only** (Orange): Stories with TS but no TAD
  4. **Neither** (Red): Stories missing both TAD and TS
  5. **N/A** (Gray): Stories marked as not requiring TAD/TS
- **Interactivity**: 
  - Hover shows segment label and count
  - Click segment to filter dashboard to those stories
- **Placement**: Prominent on homepage, product, and team views
- **Library**: Chart.js or Recharts (React)

#### 3.3.2 Team Comparison Bar Chart

- **Purpose**: Compare TAD and TS completion across teams
- **Layout**: 
  - X-axis: Team names
  - Y-axis: Percentage (0-100%)
  - Two bars per team (side-by-side): TAD (blue), TS (orange)
- **Interactivity**: 
  - Hover shows exact percentage and count
  - Click bar to drill down to team view
- **Sorting**: Default alphabetical by team name, optional sort by metric value
- **Placement**: Product and organization views

#### 3.3.3 Test Case Summary Table

- **Purpose**: Provide detailed test case metrics by team
- **Columns**:
  - Team Name
  - Total Test Cases
  - Automated Test Cases
  - Automation % (color-coded)
  - Pass Rate (latest run)
  - QTest Results Attached %
- **Features**:
  - Sortable by any column
  - Searchable (filter by team name)
  - Pagination if >20 teams
  - Export to Excel button
- **Placement**: All views (filtered by context)

#### 3.3.4 Defects by Activity Table

- **Purpose**: Track defects by SAFE-SDLC phase
- **Columns**:
  - SDLC Activity (Requirements, Design, Development, Testing, Deployment, Production)
  - P0 count
  - P1 count
  - P2 count
  - P3 count
  - Total count
- **Features**:
  - Sortable by any column
  - Color-coded cells (Red for P0, Orange for P1)
  - Click cell to see list of defects
  - Total row at bottom
- **Placement**: All views (filtered by context)

#### 3.3.5 Team Progress Bars

- **Purpose**: Visual representation of team metrics
- **Metrics**: TAD %, TS %, Unit Coverage %, Sprint Velocity %
- **Design**: 
  - Horizontal bar with percentage filled
  - Color-coded segments (Green/Yellow/Red)
  - Percentage label on right side
  - Absolute count below bar
- **Placement**: Team view, individual contributor view

#### 3.3.6 Historical Trend Line Charts

- **Purpose**: Show metric trends over time (up to 6 months)
- **Metrics**: TAD completion, TS completion, Unit coverage, Sprint velocity, Defect density
- **Design**:
  - X-axis: Sprint names (chronological)
  - Y-axis: Percentage or count
  - Line with data points
  - Shaded area for moving average
  - Legend
- **Interactivity**:
  - Hover to see exact values
  - Click data point to drill down to that sprint
  - Toggle metrics on/off
- **Placement**: Historical view mode (all levels)

### 3.4 Drill-Down Navigation

**Navigation Flow:**
```
Organization View
    ↓ (Click Product)
Product View (e.g., T360)
    ↓ (Click Team)
Team View (e.g., Chubb Team)
    ↓ (Click Sprint)
Sprint View (e.g., Sprint 26.1.2)
    ↓ (Click Story)
Story View (e.g., ELM-12345)
```

**Breadcrumb Example:**
```
Organization > T360 > Chubb Team > Sprint 26.1.2 > ELM-12345
```

**Back Navigation:**
- Breadcrumb links are clickable to jump up levels
- Browser back button supported
- "Back" button in top navigation bar

**Context Preservation:**
- Filters applied at higher level persist when drilling down
- Date range selection persists
- Sprint selection persists

**Story-Level Drill-Down (Terminal View):**
- Displays story details:
  - Jira issue key, title, status, assignee
  - TAD status with link to Bitbucket PR (if exists)
  - TS status with link to Bitbucket PR (if exists)
  - Unit test coverage (if available)
  - Linked test cases from QTest
  - Test execution results
  - Open defects linked to story
- Actions:
  - "View in Jira" button (opens Jira in new tab)
  - "View TAD" button (opens Bitbucket PR in new tab)
  - "View TS" button (opens Bitbucket PR in new tab)
  - "View Test Cases" button (opens QTest in new tab)

### 3.5 Filters and Controls

**Sprint Selector:**
- Dropdown showing:
  - Current sprint (default, highlighted)
  - Last 3 sprints
  - Next sprint (if planned)
  - "All Sprints" option
- Format: "Sprint 26.1.2 (Nov 18 - Dec 1, 2025)"
- Placement: Top navigation bar

**Product Filter:**
- Multi-select dropdown with checkboxes
- Options: T360, Passport, Collaboration Portal, DnA, All Products
- Default: All Products selected
- Shows count of selected products

**Team Filter:**
- Multi-select dropdown with checkboxes
- Options: All teams within selected product(s)
- Default: All Teams selected
- Dynamically updates based on product filter
- Shows count of selected teams

**Status Filter:**
- Single-select dropdown
- Options: All, In Progress, Completed, Blocked
- Default: All
- Applies to stories in sprint/team views

**Date Range Selector (Historical View):**
- Appears only when "Historical View" mode is activated
- Presets: Last Month, Last 3 Months, Last 6 Months, Custom Range
- Custom range: Date picker (start date, end date)
- Default: Last 3 Months

**Filter Application:**
- "Apply Filters" button (or auto-apply on selection)
- "Reset Filters" button (clears all filters, returns to defaults)
- Active filters displayed as pills/tags (removable individually)

**Manual Refresh Button:**
- Icon button (circular arrow) in top navigation
- Tooltip: "Refresh data (last updated: [timestamp])"
- Shows loading spinner during refresh
- Updates "Last Updated" timestamp on completion

### 3.6 Export Functionality

**Export Button:**
- Placement: Top navigation bar (right side)
- Dropdown with options:
  - Export to PDF
  - Export to Excel
  - Export to PowerPoint
  - Schedule Report (future feature, grayed out)

**PDF Export:**
- **Content**:
  - Cover page with Polaris logo, export date, user who exported, filters applied
  - Snapshot of current view (all visible charts and tables)
  - Maintains color coding and formatting
  - One page per major section
- **Format**: Landscape orientation, standard corporate template
- **File Name**: `Polaris_[Level]_[Date]_[Time].pdf` (e.g., `Polaris_T360_2026-01-21_10-30.pdf`)
- **Generation Time**: <10 seconds
- **Technology**: Server-side rendering (Puppeteer or similar)

**Excel Export:**
- **Content**:
  - Sheet 1: Summary Dashboard (metrics as table)
  - Sheet 2: TAD Completion Details (list of stories with status)
  - Sheet 3: TS Completion Details (list of stories with status)
  - Sheet 4: Test Case Summary (team-level data)
  - Sheet 5: Defects by Activity (raw data)
  - Sheet 6: Historical Trends (time-series data)
- **Format**: .xlsx with formatted tables, column headers, filters enabled
- **File Name**: `Polaris_Data_[Level]_[Date].xlsx`
- **Generation Time**: <15 seconds
- **Technology**: ExcelJS or similar library

**PowerPoint Export:**
- **Content**:
  - Slide 1: Title slide (Polaris logo, date, filters applied)
  - Slide 2: Executive Summary (key metrics)
  - Slide 3: Compliance Chart (donut chart as image)
  - Slide 4: Team Comparison (bar charts)
  - Slide 5: Test Coverage (summary table as formatted table)
  - Slide 6: Defects Overview (table)
  - Slide 7: Recommendations / Action Items (if applicable)
- **Format**: .pptx with corporate template, high-resolution images
- **File Name**: `Polaris_Presentation_[Level]_[Date].pptx`
- **Generation Time**: <20 seconds
- **Technology**: PptxGenJS or similar library

**Export Constraints:**
- Exports respect current filters and drill-down level
- Data freshness indicator included in all exports
- User name and timestamp embedded in metadata
- Maximum data size: 10,000 rows per export (Excel), paginated if needed

---

## 4. Data Requirements

### 4.1 Data Sources

#### 4.1.1 Jira (via Jira MCP Server)

**Available MCP Tools:**
- `get_my_issues`: Fetch issues assigned to authenticated user
- `search_issues`: JQL-based issue search
- `get_issue_details`: Detailed issue information
- `get_tad_document`: Extract TAD document from linked PRs
- `get_test_strategy`: Extract TS document from linked PRs
- `get_test_coverage_analysis`: Analyze test coverage from PRs
- `validate_release_quality`: Validate release readiness

**Data Points Needed:**
- Issue keys, titles, statuses, assignees
- Custom fields: `TAD Required`, `TS Required`, `Unit Test Coverage %`, `Story Points`, `SDLC Activity`
- Development section: Linked PRs, commits
- Sprint/Release assignment
- Components (for team/product mapping)
- Labels: `TAD-NA`, `TS-NA`
- Defect issues: Severity (P0/P1/P2/P3), linked stories

**Query Patterns:**
- Fetch all stories in sprint: `project = ELM AND sprint = "Sprint 26.1.2"`
- Fetch all defects: `project = ELM AND type = Defect AND status != Closed`
- Fetch stories by team: `project = ELM AND component = "Chubb Team" AND sprint = "Sprint 26.1.2"`

**Refresh Strategy:**
- Real-time queries for current sprint data (cache 5 minutes)
- Batch sync every 30 minutes for historical data
- Webhook integration for immediate updates (future enhancement)

#### 4.1.2 QTest (via QTest MCP Proxy)

**Available MCP Tools (Expected):**
- `get_test_cases`: Fetch test cases by project/module
- `get_test_execution_results`: Fetch execution results
- `get_automation_status`: Get automation status per test case
- `link_test_case_to_jira`: Map test cases to Jira stories

**Data Points Needed:**
- Test case ID, name, type (manual/automated)
- Automation status (Yes/No/N/A)
- Execution results (Pass/Fail/Blocked)
- Attachments (QTest results)
- Linked Jira issue key

**Refresh Strategy:**
- Real-time queries for test execution results (cache 30 minutes)
- Batch sync every 1 hour for test case metadata
- On-demand refresh for specific test cases

#### 4.1.3 Bitbucket (Direct API Integration)

**API Endpoints Needed:**
- `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests`: List PRs
- `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{id}`: PR details
- `/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{id}/activities`: PR description, comments

**Data Points Needed:**
- PR ID, title, description
- Linked Jira issue keys (from PR title or description)
- TAD markdown file (parse from PR description or file changes)
- TS markdown file (parse from PR description or file changes)
- PR status (open, merged, declined)

**Parsing Logic:**
- Search PR description for markdown links: `[TAD](path/to/TAD.md)`
- Search file changes for files matching pattern: `**/TAD.md`, `**/TS.md`
- Extract file content via Bitbucket API

**Refresh Strategy:**
- Real-time queries when fetching story details (cache 10 minutes)
- Batch sync every 1 hour for PR metadata

#### 4.1.4 SonarQube (Future, Out of Scope for v1.0)

**API Endpoints (Planned for v2.0):**
- `/api/measures/component`: Code coverage, quality metrics
- `/api/issues/search`: Code quality issues

**Data Points:**
- Line coverage, branch coverage
- Code smells, bugs, vulnerabilities
- Technical debt

### 4.2 Data Aggregation Rules

#### 4.2.1 Sprint-Spanning Stories

**Scenario**: A story starts in Sprint 26.1.1 but completes in Sprint 26.1.2

**Rule**:
- Story is included in metrics for the sprint where it is **completed**
- If story is **in progress**, it appears in current sprint metrics but marked as "In Progress"
- Historical metrics for Sprint 26.1.1 do **not** include incomplete stories

**Implementation**:
- Query Jira for sprint assignment: `sprint in (26.1.1, 26.1.2) AND status = Done`
- Use `resolutiondate` field to determine completion sprint

#### 4.2.2 Team vs Product Metrics

**Team Metrics** (e.g., Chubb Team):
- Aggregate all stories where `component = "Chubb Team"`
- Calculate TAD %, TS %, etc. based on team's stories only

**Product Metrics** (e.g., T360):
- Aggregate all teams within product: `component IN ("Chubb", "Chargers", "Matrix", "Mavericks", "Vanguards", "Nexus")`
- Calculate averages: `Product TAD % = SUM(Team TAD counts) / SUM(Team story counts)`

**Organization Metrics**:
- Aggregate all products
- Weighted averages if needed (e.g., larger teams have more weight)

#### 4.2.3 Incomplete Data Handling

**Missing TAD/TS Documents**:
- If PR is linked but no TAD/TS found: Mark as "Incomplete"
- If no PR linked and story is "Done": Mark as "Missing"
- If story is "In Progress": Mark as "Pending"
- If story has label `TAD-NA` or custom field `TAD Required = No`: Exclude from denominator

**Missing Test Coverage Data**:
- If SonarQube data unavailable: Display "N/A" or use manual entry from Jira custom field
- If QTest link missing: Mark test coverage as "Not Linked"

**Missing QTest Results**:
- If test cases exist but no execution results: Mark as "Not Executed"
- If no test cases linked: Mark as "No Test Cases"

**Graceful Degradation**:
- If Jira MCP server is down: Display cached data with warning "Data may be stale (last updated: [timestamp])"
- If QTest MCP proxy is down: Display partial metrics with note "Test data unavailable"
- If Bitbucket API is down: TAD/TS metrics show "Unable to fetch documents"

#### 4.2.4 Historical Data Aggregation

**Data Retention**:
- Store metrics snapshots daily (end of day batch job)
- Retain 6 months of historical data in database
- Archive older data to object storage (future)

**Snapshot Schema**:
- Date, Sprint, Team, Product
- TAD completion %, TS completion %, Unit coverage %, Functional coverage %, Sprint velocity %, Defect counts
- Calculated metrics: Release Readiness Score

**Trend Calculation**:
- Line charts use daily or sprint-level snapshots
- Moving averages calculated client-side or server-side (3-sprint moving average)

### 4.3 Data Freshness

**Real-Time Data** (cache 5 minutes):
- Current sprint stories
- TAD/TS status
- Defect counts
- Release Readiness Score

**Near Real-Time** (cache 30 minutes):
- QTest test execution results
- Test case automation status

**Batch Sync** (hourly):
- Historical snapshots
- Test case metadata
- Bitbucket PR metadata

**Daily Batch** (midnight):
- Metrics snapshot for historical trends
- Cleanup of old cache entries

**Manual Refresh**:
- User can click "Refresh" to bypass cache
- Triggers fresh queries to all data sources
- Updates "Last Updated" timestamp

**Cache Invalidation**:
- Cache expires based on TTL (Time To Live)
- Webhook-triggered invalidation (future enhancement)
- Manual refresh clears cache for current view

---

## 5. Integration Requirements

### 5.1 Jira MCP Server Integration

**Existing MCP Server Location**: `jira-mcp-server` (already built and operational)

**Integration Approach**:
- Backend service calls Jira MCP Server via REST API or MCP protocol
- Authentication: Use existing MCP server credentials
- Error Handling: Retry logic with exponential backoff, fallback to cached data

**Tools to Use**:

1. **`search_issues`**:
   - **Purpose**: Fetch all stories for a sprint, team, or product
   - **Parameters**: JQL query, fields to return
   - **Example**: `search_issues(jql="sprint='Sprint 26.1.2' AND component='Chubb Team'", fields=["key", "summary", "status", "assignee", "customfield_10001"])`
   - **Response**: Array of issue objects
   - **Frequency**: Every 5 minutes (cached)

2. **`get_issue_details`**:
   - **Purpose**: Fetch detailed information for a specific story
   - **Parameters**: Issue key
   - **Example**: `get_issue_details(issue_key="ELM-12345")`
   - **Response**: Full issue object with all fields, linked PRs, comments
   - **Frequency**: On-demand (when user clicks story)

3. **`get_tad_document`**:
   - **Purpose**: Extract TAD document content from linked PRs
   - **Parameters**: Issue key
   - **Example**: `get_tad_document(issue_key="ELM-12345")`
   - **Response**: TAD markdown content, PR link, status (Complete/Incomplete/Missing)
   - **Frequency**: On-demand or batch (hourly for metrics calculation)

4. **`get_test_strategy`**:
   - **Purpose**: Extract TS document content from linked PRs
   - **Parameters**: Issue key
   - **Example**: `get_test_strategy(issue_key="ELM-12345")`
   - **Response**: TS markdown content, PR link, status
   - **Frequency**: Same as TAD

5. **`validate_release_quality`**:
   - **Purpose**: Validate release readiness based on TAD, TS, test coverage
   - **Parameters**: Release version or sprint
   - **Example**: `validate_release_quality(release="26.1.2")`
   - **Response**: Release Readiness Score, breakdown of components, risks
   - **Frequency**: Real-time (cache 5 minutes)

**Custom Field Mapping**:
- Map Jira custom fields to Polaris data model:
  - `customfield_10001` → `TAD Required` (Yes/No)
  - `customfield_10002` → `TS Required` (Yes/No)
  - `customfield_10003` → `Unit Test Coverage %` (Number)
  - `customfield_10004` → `Story Points` (Number)
  - `customfield_10005` → `SDLC Activity` (Select List)

**Error Scenarios**:
- MCP server unavailable: Display cached data with warning
- Invalid JQL query: Return empty result set, log error
- Issue not found: Display "Issue not found" message
- Rate limiting: Implement exponential backoff, queue requests

### 5.2 QTest MCP Proxy Integration

**Existing MCP Proxy Location**: `qtest-mcp-proxy` (already built and operational)

**Integration Approach**:
- Backend service calls QTest MCP Proxy via REST API
- Authentication: Use existing proxy credentials
- Error Handling: Graceful degradation if QTest is unavailable

**Expected Tools (to be confirmed)**:

1. **`get_test_cases`**:
   - **Purpose**: Fetch test cases for a project or linked to Jira stories
   - **Parameters**: Project ID, Jira issue keys (optional)
   - **Example**: `get_test_cases(project_id="ELM", jira_keys=["ELM-12345", "ELM-12346"])`
   - **Response**: Array of test case objects (ID, name, type, automation status)
   - **Frequency**: Hourly batch sync

2. **`get_automation_status`**:
   - **Purpose**: Get automation status for test cases
   - **Parameters**: Test case IDs
   - **Example**: `get_automation_status(test_case_ids=["TC-001", "TC-002"])`
   - **Response**: Automation status (Manual/Automated/N/A) per test case
   - **Frequency**: Hourly batch sync

3. **`get_test_execution_results`**:
   - **Purpose**: Fetch latest test execution results
   - **Parameters**: Test case IDs or test cycle ID
   - **Example**: `get_test_execution_results(test_cycle_id="Sprint-26.1.2")`
   - **Response**: Execution results (Pass/Fail/Blocked), timestamp, attachments
   - **Frequency**: Real-time (cache 30 minutes)

4. **`link_test_case_to_jira`** (if available):
   - **Purpose**: Establish or retrieve mapping between QTest test cases and Jira stories
   - **Parameters**: Test case ID, Jira issue key
   - **Example**: `link_test_case_to_jira(test_case_id="TC-001", jira_key="ELM-12345")`
   - **Response**: Success/failure status

**Data Mapping**:
- QTest Project → Polaris Product
- Test Case → Linked to Jira Story
- Test Cycle → Sprint
- Automation Status → Binary (Automated: Yes/No)

**Calculation Logic**:
- **Test Automation Rate**: `COUNT(test_cases WHERE automation_status = 'Automated') / COUNT(test_cases) × 100`
- **Functional Test Coverage**: `COUNT(DISTINCT jira_keys with linked test cases) / COUNT(jira_keys) × 100`
- **Pass Rate**: `COUNT(executions WHERE result = 'Pass') / COUNT(executions) × 100`

**Error Scenarios**:
- QTest proxy unavailable: Display "Test data unavailable", hide test metrics
- Test case not found: Mark as "No Test Cases"
- Execution data missing: Mark as "Not Executed"

### 5.3 Bitbucket Integration

**Integration Approach**:
- Direct API integration (no MCP proxy)
- Use Bitbucket REST API v1.0 or v2.0
- Authentication: Personal Access Token or OAuth2
- Rate Limiting: Respect Bitbucket rate limits (60 requests/minute), implement retry logic

**API Calls Needed**:

1. **List PRs for Repository**:
   - **Endpoint**: `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests`
   - **Parameters**: State (MERGED, OPEN, DECLINED), limit, start
   - **Purpose**: Fetch all PRs to map to Jira stories
   - **Frequency**: Hourly batch sync

2. **Get PR Details**:
   - **Endpoint**: `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{id}`
   - **Parameters**: PR ID
   - **Purpose**: Fetch PR title, description, linked Jira keys
   - **Frequency**: On-demand (when user clicks TAD/TS link)

3. **Get PR File Changes**:
   - **Endpoint**: `GET /rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{id}/changes`
   - **Parameters**: PR ID
   - **Purpose**: Identify if TAD.md or TS.md files are in PR
   - **Frequency**: On-demand or batch

4. **Get File Content**:
   - **Endpoint**: `GET /rest/api/1.0/projects/{project}/repos/{repo}/raw/{path}?at={commit}`
   - **Parameters**: File path, commit SHA
   - **Purpose**: Fetch TAD.md or TS.md file content for parsing
   - **Frequency**: On-demand

**TAD/TS Extraction Logic**:

1. **From PR Description**:
   - Parse PR description for markdown links: `[TAD](path/to/TAD.md)` or `[Test Strategy](path/to/TS.md)`
   - Extract file path from link
   - Fetch file content via API

2. **From File Changes**:
   - List all changed files in PR
   - Search for files matching patterns:
     - TAD: `**/TAD.md`, `**/technical-design.md`, `**/architecture.md`
     - TS: `**/TS.md`, `**/test-strategy.md`, `**/testing-plan.md`
   - Fetch file content if found

3. **Validation**:
   - Check if file content is not empty (>100 characters)
   - Validate markdown structure (has headers, sections)
   - Mark as "Complete" if valid, "Incomplete" if invalid or empty

**PR to Jira Story Mapping**:
- Extract Jira issue keys from PR title: Pattern `ELM-\d+`
- Extract from PR description: Search for "Jira: ELM-12345" or similar patterns
- Store mapping: `{pr_id: "12345", jira_key: "ELM-12345", tad_status: "Complete", ts_status: "Incomplete"}`

**Error Scenarios**:
- Bitbucket API unavailable: Display "Unable to fetch TAD/TS documents", use cached status
- PR not found: Mark as "No PR Linked"
- File not found in PR: Mark as "TAD/TS Missing"
- Invalid markdown: Mark as "Incomplete"

---

## 6. Non-Functional Requirements

### 6.1 Performance

**Target Metrics**:
- **Dashboard Initial Load**: <3 seconds from page load to first meaningful paint
- **Metric Refresh**: <1 second to update single metric after filter change
- **Drill-Down Navigation**: <2 seconds to load next level (e.g., Product → Team)
- **Export Generation**: 
  - PDF: <10 seconds
  - Excel: <15 seconds
  - PowerPoint: <20 seconds
- **API Response Time**: <500ms for 95th percentile requests
- **Database Query Time**: <300ms for complex aggregations
- **Concurrent Users**: Support 100+ users without degradation

**Optimization Strategies**:
- Redis caching for frequently accessed data (5-30 minute TTL)
- Database indexing on frequently queried fields (sprint, team, product, status)
- Pagination for large datasets (>100 rows)
- Lazy loading for drill-down views (load data only when needed)
- CDN for static assets (JavaScript, CSS, images)
- Gzip compression for API responses
- Connection pooling for database and API clients
- Debouncing for filter changes (wait 300ms after user stops typing)

**Performance Monitoring**:
- Application Performance Monitoring (APM) tool (e.g., New Relic, Datadog)
- Track response times, error rates, throughput
- Set up alerts for performance degradation (e.g., response time >2 seconds)

### 6.2 Scalability

**Current Scale**:
- 11 teams, 4 products
- ~100 users (20 active at any time)
- ~200 stories per sprint
- ~1,000 test cases
- ~50 defects per sprint

**Future Scale (2 years)**:
- 20 teams, 6 products
- ~200 users (40 active at any time)
- ~400 stories per sprint
- ~2,500 test cases
- ~100 defects per sprint

**Scalability Design**:
- Horizontal scaling of backend API (Docker containers, load balancer)
- Database partitioning by product or date range (if needed)
- Read replicas for database (if needed)
- Asynchronous processing for batch jobs (queue-based)
- Stateless API design (no session state in API servers)

**Data Volume**:
- 6 months historical data: ~12,000 stories, ~60,000 test cases, ~3,000 defects
- Metrics snapshots: ~180 snapshots (daily for 6 months) per team = ~2,000 rows
- Database size estimate: <1 GB for 6 months of data

### 6.3 Security

**Authentication**:
- **Method**: Jira SSO (Single Sign-On) or LDAP integration
- **Flow**: User redirects to Jira login → authenticates → redirects back with JWT token
- **Session**: JWT token stored in HTTP-only cookie, expires after 8 hours
- **Token Refresh**: Automatic refresh before expiration

**Authorization (Role-Based Access Control)**:
- **Roles**:
  - **Executive**: Access to all products, teams, and metrics
  - **QE Leadership**: Access to all products, teams, and metrics
  - **Dev Leadership**: Access to assigned products and teams
  - **Product Manager**: Access to assigned product(s)
  - **Individual Contributor**: Access to own team and personal dashboard
- **Role Mapping**: Fetched from Jira groups or LDAP groups
- **Enforcement**: Backend API validates role on every request

**Data Protection**:
- **In Transit**: HTTPS only (TLS 1.2+), enforce strict transport security
- **At Rest**: Database encryption (PostgreSQL encryption at rest)
- **Sensitive Data**: No PII stored; only Jira usernames and metrics
- **Secrets Management**: Environment variables, no hardcoded secrets, use secret management tool (e.g., Vault)

**Input Validation**:
- Sanitize all user inputs (filters, search queries)
- Use parameterized queries to prevent SQL injection
- Validate JQL queries before passing to Jira MCP
- Rate limiting on API endpoints (100 requests/minute per user)

**API Security**:
- CORS (Cross-Origin Resource Sharing) configured for frontend domain only
- CSRF protection for state-changing requests
- JWT token validation on all protected endpoints

**Audit Logging**:
- Log all user actions: Login, export, filter changes, drill-downs
- Log format: `[Timestamp] [User] [Action] [Resource] [IP Address]`
- Store logs in centralized logging system (e.g., ELK stack)
- Retain logs for 90 days

**Compliance**:
- GDPR: No personal data stored; only username and role
- SOC 2: Audit logging, encryption, access control
- Data retention: 6 months for metrics, 90 days for logs

### 6.4 Usability

**Intuitive Navigation**:
- No training required for basic usage
- Progressive disclosure: Show high-level metrics first, details on demand
- Clear visual hierarchy: Larger fonts for key metrics, smaller for details
- Consistent navigation patterns (breadcrumbs, back button, drill-down clicks)

**Accessibility (WCAG 2.1 AA Compliance)**:
- Keyboard navigation: All interactive elements accessible via Tab/Enter
- Screen reader support: Semantic HTML, ARIA labels for charts
- Color contrast: Minimum 4.5:1 for text, 3:1 for large text
- Focus indicators: Visible focus states for all interactive elements
- Alternative text: Alt text for all images and charts

**Responsive Design**:
- **Desktop** (1920x1080): Full dashboard with all metrics visible
- **Tablet** (1024x768): Stacked layout, collapsible filters
- **Mobile** (375x667): Card-based layout, one metric per card, swipe navigation
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

**Clear Error Messages**:
- User-friendly language (no technical jargon)
- Actionable guidance (e.g., "Please select a sprint" instead of "Error: sprint_id is null")
- Toast notifications for transient errors (e.g., "Failed to load data. Retrying...")
- Modal dialogs for critical errors (e.g., "Session expired. Please log in again.")

**Loading States**:
- Skeleton loaders for metrics cards (animated placeholders)
- Spinners for charts and tables
- Progress bars for exports (e.g., "Generating PDF... 60%")

**Help & Documentation**:
- Inline tooltips for metrics (hover to see definition and calculation)
- "?" icon next to complex metrics linking to documentation
- Help page with FAQs, metric definitions, and user guide

### 6.5 Reliability

**Uptime Target**: 99.5% during business hours (8am-6pm EST, Monday-Friday)
- **Acceptable Downtime**: ~2 hours/month during business hours
- **Maintenance Window**: Saturday 2am-6am EST (no uptime guarantee)

**Graceful Degradation**:
- If Jira MCP unavailable: Display cached data with warning "Data may be stale (last updated: [timestamp])"
- If QTest MCP unavailable: Hide test metrics, display "Test data temporarily unavailable"
- If Bitbucket unavailable: Display cached TAD/TS status, disable "View TAD/TS" links
- If database unavailable: Display error page with retry option

**Error Handling**:
- All API errors logged with stack traces
- User-facing errors are sanitized (no stack traces exposed)
- Retry logic with exponential backoff for transient errors
- Circuit breaker pattern for external APIs (stop calling if repeatedly failing)

**Monitoring & Alerting**:
- Health check endpoint: `GET /api/health` (returns 200 if all dependencies healthy)
- Uptime monitoring: Ping health endpoint every 1 minute
- Alerts for:
  - API response time >2 seconds for 5 consecutive minutes
  - Error rate >5% for 5 consecutive minutes
  - External API (Jira/QTest/Bitbucket) unavailable for >5 minutes
  - Database connection pool exhausted

**Backup & Recovery**:
- Database backups: Daily full backup, hourly incremental (retained for 30 days)
- Recovery Time Objective (RTO): <4 hours
- Recovery Point Objective (RPO): <1 hour (last backup)

---

## 7. Testing Requirements

### 7.1 Testability

**Design for Testability**:
- All metrics calculations are pure functions (no side effects)
- API endpoints follow RESTful conventions (predictable, stateless)
- Data sources are abstracted via service layer (mockable)
- UI components are modular and isolated (testable in isolation)

**Test Data Management**:
- Test database seeded with sample data (10 teams, 4 products, 100 stories)
- Jira MCP mock server for integration tests
- QTest MCP mock proxy for integration tests
- Bitbucket API mock for integration tests

**Test Identifiers**:
- All UI elements have `data-testid` attributes for E2E tests
- Example: `<div data-testid="tad-metric">85%</div>`
- Convention: `[component]-[element]` (e.g., `metrics-card-title`, `donut-chart-segment-1`)

### 7.2 Unit Testing

**Coverage Goal**: >80% for all business logic

**Frontend (React + Jest + React Testing Library)**:
- **Components**: Test rendering, props, user interactions, conditional logic
- **Services**: Test API calls (mocked), data transformations
- **Utilities**: Test calculation functions, formatters, validators
- **Example**:
  ```typescript
  describe('MetricsCard', () => {
    it('renders metric title and value', () => {
      render(<MetricsCard title="TAD Complete" value="17" percentage="100.0%" />);
      expect(screen.getByText('TAD Complete')).toBeInTheDocument();
      expect(screen.getByText('17')).toBeInTheDocument();
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });
  ```

**Backend (Node.js + Jest)**:
- **Controllers**: Test request handling, response formatting, error handling
- **Services**: Test business logic, metrics calculations, data aggregation
- **Integrations**: Test API clients (mocked external APIs)
- **Example**:
  ```typescript
  describe('MetricsAggregationService', () => {
    it('calculates TAD completion rate correctly', () => {
      const stories = [
        { id: '1', hasTAD: true, tadNA: false },
        { id: '2', hasTAD: false, tadNA: false },
      ];
      expect(service.calculateTADCompletionRate(stories)).toBe(50);
    });
  });
  ```

**Python (Pytest, if applicable)**:
- **Data Processing**: Test ETL functions, data transformations
- **Calculations**: Test complex aggregations, trend analysis

### 7.3 Integration Testing

**API Integration Tests**:
- Test API endpoints with real database (test database)
- Mock external services (Jira MCP, QTest MCP, Bitbucket API)
- Validate request/response contracts
- Example: `GET /api/metrics/sprint/:id` returns correct JSON structure

**Database Integration Tests**:
- Test database queries with real PostgreSQL instance
- Test migrations (schema changes)
- Test constraints, indexes, relationships

**MCP Integration Tests**:
- Test Jira MCP client with mock server
- Validate query parameters, response parsing, error handling
- Test QTest MCP client with mock proxy

**External API Integration Tests** (Bitbucket):
- Test Bitbucket API client with mock responses
- Test TAD/TS extraction logic with sample PR data
- Test rate limiting and retry logic

### 7.4 End-to-End Testing with Playwright MCP

**Coverage Goal**: All user stories from Section 2

**Test Scenarios** (aligned with user stories):

1. **View Organization-Wide Dashboard** (Story 1):
   ```typescript
   test('displays organization-wide metrics on dashboard load', async ({ page }) => {
     await page.goto('http://localhost:3000');
     await expect(page.locator('[data-testid="tad-metric"]')).toContainText('%');
     await expect(page.locator('[data-testid="ts-metric"]')).toContainText('%');
     await expect(page.locator('[data-testid="donut-chart"]')).toBeVisible();
   });
   ```

2. **Drill Down into Product** (Story 2):
   ```typescript
   test('navigates to product view when product card is clicked', async ({ page }) => {
     await page.goto('http://localhost:3000');
     await page.locator('[data-testid="product-card-T360"]').click();
     await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Organization > T360');
     await expect(page.locator('[data-testid="team-comparison-chart"]')).toBeVisible();
   });
   ```

3. **Export to PDF** (Story 3):
   ```typescript
   test('exports dashboard to PDF', async ({ page }) => {
     await page.goto('http://localhost:3000');
     const [download] = await Promise.all([
       page.waitForEvent('download'),
       page.locator('[data-testid="export-button"]').click(),
       page.locator('[data-testid="export-pdf"]').click(),
     ]);
     expect(download.suggestedFilename()).toMatch(/Polaris_.*\.pdf/);
   });
   ```

4. **Filter by Sprint** (User interaction):
   ```typescript
   test('filters metrics by selected sprint', async ({ page }) => {
     await page.goto('http://localhost:3000');
     await page.locator('[data-testid="sprint-selector"]').selectOption('Sprint 26.1.1');
     await expect(page.locator('[data-testid="tad-metric"]')).toContainText('%'); // Updated value
   });
   ```

5. **View Personal Dashboard** (Story 7):
   ```typescript
   test('displays personal metrics for logged-in user', async ({ page }) => {
     // Login as test user
     await page.goto('http://localhost:3000/login');
     await page.fill('[data-testid="username"]', 'testuser');
     await page.fill('[data-testid="password"]', 'password');
     await page.click('[data-testid="login-button"]');
     
     // Navigate to My Dashboard
     await page.goto('http://localhost:3000/my-dashboard');
     await expect(page.locator('[data-testid="my-stories-list"]')).toBeVisible();
     await expect(page.locator('[data-testid="story-tad-status"]').first()).toContainText(/Complete|Incomplete|N\/A/);
   });
   ```

**Playwright MCP Tools Usage**:
- `browser_snapshot`: Capture screenshots of dashboard states for visual regression
- `verify_element_visible`: Assert that metrics cards, charts, tables are visible
- `verify_text_content`: Assert that metric values match expected data
- `click_element`: Interact with filters, drill-down links, export buttons
- `wait_for_element`: Wait for dynamic content (charts, tables) to load

**Test Data Setup**:
- Seed test database with predictable data (e.g., 10 teams, 50 stories, 25 with TAD, 20 with TS)
- Mock Jira MCP to return consistent test data
- Mock QTest MCP to return consistent test case data
- Use `beforeEach` to reset database state

**Assertion Strategy**:
- Assert on data-testid attributes (not CSS selectors, which can change)
- Assert on visible text content (user-facing values)
- Assert on chart presence (not exact chart rendering, unless visual regression)
- Assert on navigation state (breadcrumbs, URL changes)

**Test Execution**:
- Run E2E tests in CI/CD pipeline (GitHub Actions or Azure DevOps)
- Run on every pull request and before deployment
- Parallel execution for faster feedback (split tests across 4 workers)
- Generate HTML report with screenshots for failures

**Success Criteria for E2E Tests**:
- All user stories have at least one E2E test
- Tests run in <10 minutes (total suite)
- Test pass rate >95% (flaky tests refactored or removed)
- Tests catch regressions (e.g., broken drill-down, incorrect calculations)

---

## 8. Out of Scope (for Version 1.0)

**Future Enhancements (v2.0 and beyond)**:

1. **SonarQube Integration**:
   - Direct code quality metrics (code coverage, code smells, technical debt)
   - Automated code quality gates

2. **Predictive Analytics / AI Insights**:
   - Predict sprint completion based on historical trends
   - Identify teams at risk of missing release deadlines
   - Recommend actions to improve quality metrics

3. **Real-Time Alerts & Notifications**:
   - Email/Slack alerts when metrics fall below thresholds
   - Webhook integration for real-time updates

4. **Custom Metric Creation**:
   - Allow users to define custom metrics and formulas
   - Build custom dashboards with drag-and-drop widgets

5. **Automated Report Distribution**:
   - Schedule weekly/monthly reports to stakeholders
   - Email reports as PDF attachments

6. **Mobile Native Apps**:
   - iOS and Android apps for on-the-go access
   - Push notifications for alerts

7. **Advanced Visualizations**:
   - Heatmaps, sankey diagrams, network graphs
   - Drill-down into code-level metrics (class, method coverage)

8. **Team Collaboration Features**:
   - Comments on metrics
   - Shared saved filters and views
   - Metric goals and tracking

9. **Historical Data Beyond 6 Months**:
   - Archive and query historical data (1+ years)
   - Trend analysis across multiple PIs

10. **Integration with Other Tools**:
    - GitHub, GitLab integration
    - Jenkins, Azure DevOps pipeline metrics
    - ServiceNow for incident tracking

**Explicitly Out of Scope (Will NOT be implemented)**:
- Code editing or management within Polaris
- CI/CD pipeline execution
- Test case authoring (QTest handles this)
- Jira issue management (Jira handles this)

---

## 9. Acceptance Criteria (Overall)

**Specification Acceptance**:
- [ ] All user stories have clear acceptance criteria
- [ ] All metrics have defined calculations and data sources
- [ ] All integrations have defined API contracts
- [ ] Non-functional requirements are measurable
- [ ] Testing requirements are comprehensive
- [ ] Constitution principles are reflected in requirements
- [ ] No ambiguous terms (all "fast", "user-friendly" replaced with specific criteria)

**Spec Review Checklist**:
- [ ] Reviewed by QE Leadership (Stakeholder approval)
- [ ] Reviewed by Dev Leadership (Technical feasibility)
- [ ] Reviewed by Product Manager (Business alignment)
- [ ] Reviewed by Architecture (Integration & security review)
- [ ] All questions in `requirements-questionnaire.md` addressed
- [ ] All screenshots and examples referenced

**Traceability**:
- [ ] Every feature traces back to a user need or business goal
- [ ] Every metric traces back to a user story
- [ ] Every integration traces back to a data requirement
- [ ] Every NFR traces back to a quality standard

**Ready for Planning**:
- [ ] Specification is complete and unambiguous
- [ ] All stakeholders have signed off
- [ ] No "NEEDS CLARIFICATION" markers remain
- [ ] Technical constraints are documented
- [ ] Next step: Create implementation plan (`/speckit.plan`)

---

## Appendices

### Appendix A: Glossary

- **TAD**: Technical Architecture Document - Document describing technical design and architecture of a feature
- **TS**: Test Strategy - Document describing testing approach and test cases for a feature
- **SAFE**: Scaled Agile Framework - Agile methodology for large organizations
- **PI**: Program Increment - 3-month planning cycle in SAFE (typically 6 sprints)
- **Sprint**: 2-week development cycle (in this organization)
- **MCP**: Model Context Protocol - Protocol for AI-assisted tool integration
- **SDLC**: Software Development Life Cycle
- **JQL**: Jira Query Language - SQL-like language for querying Jira
- **QTest**: Test management tool used for test cases and execution
- **Bitbucket**: Git repository hosting service
- **SonarQube**: Code quality and security analysis tool
- **Donut Chart**: Circular chart showing proportional segments (also called pie chart)

### Appendix B: Metric Calculation Examples

**Example 1: TAD Completion Rate**

Scenario: Sprint 26.1.2 has 20 stories
- 15 stories have linked TADs (Complete)
- 3 stories have no TADs (Incomplete)
- 2 stories are marked "TAD N/A"

Calculation:
```
Total stories = 20
Exclude N/A = 20 - 2 = 18
Stories with TAD = 15
TAD Completion % = (15 / 18) × 100 = 83.3%
Display: "15 / 18 (83.3%)"
Color: Yellow (70-90% range)
```

**Example 2: Release Readiness Score**

Scenario: Release 26.1.2 metrics
- TAD Completion: 85%
- TS Completion: 78%
- Unit Test Coverage: 82%
- Functional Test Coverage: 75%
- P0 Defects: 1, P1 Defects: 3

Calculation:
```
TAD Component = 85% × 0.25 = 21.25
TS Component = 78% × 0.25 = 19.50
Unit Component = 82% × 0.15 = 12.30
Functional Component = 75% × 0.15 = 11.25
Defect Score = 100 - (1 × 20 + 3 × 10) = 100 - 50 = 50
Defect Component = 50 × 0.20 = 10.00

Release Readiness Score = 21.25 + 19.50 + 12.30 + 11.25 + 10.00 = 74.3
Display: "74.3" with Yellow color (70-89% range)
```

### Appendix C: Complete Data Model

#### Products
```json
[
  { "id": 1, "code": "PASSPORT", "name": "Passport", "displayName": "Passport" },
  { "id": 2, "code": "T360", "name": "T360", "displayName": "Tymetrix 360" },
  { "id": 3, "code": "DNA", "name": "DnA", "displayName": "Data & Analytics" },
  { "id": 4, "code": "COLLAB", "name": "Collaboration Portal", "displayName": "Collaboration Portal" }
]
```

#### Teams (11 teams across 4 products)
```json
[
  // T360 Teams (6 teams)
  { "id": 1, "name": "Chubb", "displayName": "T360 Chubb", "productId": 2 },
  { "id": 2, "name": "Chargers", "displayName": "T360 Chargers", "productId": 2 },
  { "id": 3, "name": "Matrix", "displayName": "T360 Matrix", "productId": 2 },
  { "id": 4, "name": "Mavericks", "displayName": "T360 Mavericks", "productId": 2 },
  { "id": 5, "name": "Vanguards", "displayName": "T360 Vanguards", "productId": 2 },
  { "id": 6, "name": "Nexus", "displayName": "T360 Nexus", "productId": 2 },
  
  // Passport Teams (2 teams)
  { "id": 7, "name": "Spartacles", "displayName": "Passport Spartacles", "productId": 1 },
  { "id": 8, "name": "Genesis", "displayName": "Passport Genesis", "productId": 1 },
  
  // Collaboration Portal Teams (1 team)
  { "id": 9, "name": "Pioneers", "displayName": "Collab Pioneers", "productId": 4 },
  
  // DnA Teams (2 teams)
  { "id": 10, "name": "Guardians", "displayName": "DnA Guardians", "productId": 3 },
  { "id": 11, "name": "Athena", "displayName": "DnA Athena", "productId": 3 }
]
```

#### Sprints
```json
[
  { "id": 1, "name": "26.1.1", "startDate": "2026-01-01", "endDate": "2026-01-14", "status": "active" },
  { "id": 2, "name": "26.1.0", "startDate": "2025-12-18", "endDate": "2025-12-31", "status": "completed" },
  { "id": 3, "name": "25.4.2", "startDate": "2025-12-04", "endDate": "2025-12-17", "status": "completed" },
  { "id": 4, "name": "25.4.1", "startDate": "2025-11-20", "endDate": "2025-12-03", "status": "completed" },
  { "id": 5, "name": "25.4.0", "startDate": "2025-11-06", "endDate": "2025-11-19", "status": "completed" }
]
```

#### Stories
```json
{
  "id": "string (Jira key, e.g., GET-12345)",
  "title": "string",
  "status": "string (To Do, In Progress, In Review, Done)",
  "assignee": "string",
  "teamId": "number",
  "sprintId": "number",
  "tadStatus": "string (Complete, Incomplete, N/A)",
  "tsStatus": "string (Complete, Incomplete, N/A)",
  "storyPoints": "number",
  "tadLink": "string (Bitbucket PR URL)",
  "tsLink": "string (Bitbucket PR URL)"
}
```

#### TestCases
```json
{
  "id": "number",
  "name": "string",
  "type": "string (Unit, Functional, Integration, E2E)",
  "automationStatus": "string (Automated, Manual)",
  "linkedStoryId": "string (Jira key)",
  "qtestId": "string",
  "lastRunStatus": "string (Passed, Failed, Blocked, Not Run)"
}
```

#### Defects
```json
{
  "id": "string (Jira key)",
  "severity": "string (P0/Critical, P1/High, P2/Medium, P3/Low)",
  "status": "string (Open, In Progress, Resolved, Closed, Reopened)",
  "sdlcActivity": "string (Requirements, Design, Development, Testing, Deployment, Production)",
  "linkedStoryId": "string (Jira key)",
  "reopened": "boolean"
}
```

#### MetricsSnapshots (Aggregated Metrics)
```json
{
  "id": "number",
  "timestamp": "ISO 8601 datetime",
  "teamId": "number",
  "sprintId": "number",
  "tadTsMetrics": {
    "totalStories": "number",
    "tadComplete": "number",
    "tadNa": "number",
    "tadMissing": "number",
    "tadPct": "number (0-100)",
    "tsComplete": "number",
    "tsNa": "number",
    "tsMissing": "number",
    "tsPct": "number (0-100)"
  },
  "qtestMetrics": {
    "uniqueTestCases": "number",
    "automatedTestCases": "number",
    "manualTestCases": "number",
    "automationPct": "number (0-100)",
    "totalTestRuns": "number"
  },
  "defectMetrics": {
    "totalDefects": "number",
    "reopenedDefects": "number",
    "reopenedPct": "number (0-100)",
    "bySeverity": {
      "Critical": "number",
      "High": "number",
      "Medium": "number",
      "Low": "number"
    },
    "bySdlc": {
      "Requirements": "number",
      "Design": "number",
      "Development": "number",
      "Testing": "number",
      "Deployment": "number",
      "Production": "number"
    }
  }
}
```

---

**End of Specification**

**Document Status**: Draft v1.0  
**Next Steps**: 
1. Stakeholder review and approval
2. Create implementation plan (`/speckit.plan`)
3. Break down into tasks (`/speckit.tasks`)
4. Execute implementation (`/speckit.implement`)

