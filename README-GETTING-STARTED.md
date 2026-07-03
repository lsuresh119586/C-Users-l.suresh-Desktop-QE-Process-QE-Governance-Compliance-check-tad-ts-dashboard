# TAD-TS Dashboard - Getting Started Guide

## 📋 Overview

This repository contains the **Test Automation Decision (TAD) & Test Strategy (TS) Dashboard** for tracking QE compliance metrics on a **sprint-by-sprint basis**. It provides comprehensive reports on test strategy compliance, automation rates, quality metrics, and defect tracking for each sprint execution.

**Current Sprint:** 26.1.1 (PI 2026.1.1 Execution)  
**Tracking Model:** Sprint-based (not monthly rollups)

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** installed on your system
- Access to:
  - Jira (for story/defect data)
  - Bitbucket (for pull request test strategies)
  - qTest (for test case management)
- Git for version control

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/lsuresh119586/C-Users-l.suresh-Desktop-QE-Process-QE-Governance-Compliance-check-tad-ts-dashboard.git
   cd tad-ts-dashboard
   ```

2. **Install Python Dependencies**
   ```bash
   pip install requests python-dateutil
   ```

3. **Configure Credentials**
   - Update authentication tokens in `sprint-tad-ts-report.py`
   - Set your Jira, Bitbucket, and qTest credentials

4. **Run Your First Report**
   ```bash
   python sprint-tad-ts-report.py
   ```

---

## 📂 Key Files & Directories

### 🎯 Current Sprint Reports (Sprint 26.1.1)

| File | Description |
|------|-------------|
| `Sprint-26.1.1-Team-Discrepancy-Report.md` | **Primary Report** - Detailed compliance status with action items for each team |
| `Sprint-26.1.1-Email-Summary.md` | Concise email-ready summary for team communication |
| `Sprint-26.1.1-Team-Summary.md` | Test case distribution and automation metrics by team |
| `Sprint-26.1.1-TestCase-Breakdown.md` | Detailed breakdown of test cases by module and story |
| `tad-ts-report-sprint-26.1.1.json` | Raw JSON data for Sprint 26.1.1 |
| `tad-ts-report-2026-01.json` | Data snapshot for January 2026 (includes Sprint 26.1.1) |

### 🛠️ Core Scripts

| Script | Purpose |
|--------|---------|
| `sprint-tad-ts-report.py` | **Main Script** - Generates TAD-TS compliance reports for sprints |
| `dashboard_server.py` | Launches local web server to view HTML dashboards |
| `regenerate-all-reports.ps1` | PowerShell script to regenerate all reports at once |

### 📊 Dashboards

| Dashboard | Description |
|-----------|-------------|
| `tad-ts-dashboard.html` | Main interactive dashboard with trend analysis |
| `sprint-26.1.1-standalone.html` | Standalone sprint report (no external dependencies) |
| `sprint-26.1.1-management-dashboard.html` | Executive summary for management |
| `team-dashboard.html` | Team-specific compliance view |

### 📚 Documentation

| Document | Content |
|----------|---------|
| `QUICKSTART.md` | Quick reference guide |
| `HOSTING-GUIDE.md` | Instructions for hosting dashboard on GitHub Pages |
| `README-SHARING.md` | Guide for sharing reports with stakeholders |
| `README.md` | Original project documentation |

### 📦 Archive

The `archive/` folder contains:
- Historical sprint reports from previous sprints
- Debug and test scripts
- Analysis and investigation utilities
- Old team quality HTML reports (ts_quality_*.html)
- Deprecated documentation files

---

## 🎯 Understanding the Dashboard & Reports

### 📊 Dashboard Metrics Explained

The dashboard displays **8 key metrics** with detailed calculations:

#### 1. **Total Issues**
- **What it shows:** Total number of Stories and Bugs analyzed in the sprint
- **Calculation:** Count of all issues (excludes Sub-tasks, Epics, Features, Tasks)
- **Click action:** View list of all analyzed issues
- **Current Value:** 23 issues across 6 teams

#### 2. **TAD Compliance**
- **What it shows:** Issues with completed Technical Architecture Decision documentation
- **Calculation:** `(TAD Complete / TAD Applicable) × 100`
- **TAD Applicable:** Total issues minus TAD N/A cases
- **Detection Method:** 
  - **Primary:** Searches all Pull Request names for keywords: "TAD", "TECHNICAL ARCHITECTURE"
  - **Fallback:** Scans issue description for: "TECHNICAL ARCHITECTURE", "TAD DOCUMENT", "ADR", "ARCHITECTURE DECISION", "DESIGN DOCUMENT"
- **Click action:** View list of issues with TAD documentation
- **Current Value:** 21/21 (100%)

#### 3. **TS Compliance**
- **What it shows:** Issues with completed Test Strategy documentation
- **Calculation:** `(TS Complete / TS Applicable) × 100`
- **TS Applicable:** Total issues minus TS N/A cases
- **Detection Method:**
  - **Primary:** Searches all Pull Request names for keywords: "TS FOR", "TEST STRATEGY" (excludes "TS FILE")
  - **Fallback:** Scans issue description for: "TEST STRATEGY", "TS FOR", "TEST PLAN", "TESTING STRATEGY", "QA STRATEGY"
- **Click action:** View list of issues with Test Strategy
- **Current Value:** 19/21 (90.5%)

#### 4. **Both TAD & TS**
- **What it shows:** Issues with BOTH TAD and TS completed
- **Calculation:** `(Both Complete / Min(TAD Applicable, TS Applicable)) × 100`
- **Purpose:** Indicates fully documented stories ready for development
- **Click action:** View list of fully compliant issues
- **Current Value:** 19/21 (90.5%)

#### 5. **Pending TAD**
- **What it shows:** Number of issues missing TAD documentation
- **Calculation:** `TAD Applicable - TAD Complete`
- **Excludes:** Issues marked as TAD N/A (enabler stories, bugs with parent story TAD)
- **Click action:** View list of issues needing TAD
- **Color:** Red (critical action required)
- **Current Value:** 0 issues ✅

#### 6. **Pending TS**
- **What it shows:** Number of issues missing Test Strategy
- **Calculation:** `TS Applicable - TS Complete`
- **Excludes:** Issues marked as TS N/A (bugs linked to stories, minor changes)
- **Click action:** View list of issues needing TS
- **Color:** Orange (high priority)
- **Current Value:** 2 issues (Matrix team)

#### 7. **TAD Not Applicable (N/A)**
- **What it shows:** Issues where TAD is not required
- **Calculation:** Count of issues with `tadNA = true`
- **Common Reasons:**
  - Enabler stories (infrastructure, tooling)
  - Bugs that reference parent story's TAD
  - Minor configuration changes
- **Percentage:** `(TAD N/A / Total Issues) × 100`
- **Color:** Purple (informational)
- **Current Value:** 2 issues (8.7%)

#### 8. **TS Not Applicable (N/A)**
- **What it shows:** Issues where Test Strategy is not required
- **Calculation:** Count of issues with `tsNA = true`
- **Common Reasons:**
  - Bugs linked to story with existing TS
  - Minor fixes with no new test scenarios
  - Non-testable infrastructure changes
- **Percentage:** `(TS N/A / Total Issues) × 100`
- **Color:** Teal (informational)
- **Current Value:** 2 issues (8.7%)

---

### 📈 Dashboard Charts

#### 1. **Team Compliance Scores**
- **Type:** Horizontal bar chart
- **Data:** Average compliance score per team
- **Score Calculation:** `(TAD % + TS %) / 2`
- **Purpose:** Quick visual comparison of team performance

#### 2. **Overall Compliance Distribution**
- **Type:** Pie/Doughnut chart
- **Segments:**
  - Both Complete (green)
  - Only TAD (blue)
  - Only TS (orange)
  - Missing Both (red)
  - N/A (gray)
- **Purpose:** Sprint-wide compliance breakdown

#### 3. **Team Performance Breakdown**
- **Type:** Grouped bar chart
- **Data:** TAD % vs TS % for each team
- **Purpose:** Identify teams with TAD/TS gaps
- **Y-axis:** 0-100% scale

---

### 📋 Test Case Summary Table

Displays qTest test case metrics by team:

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Cases** | All test cases assigned to team | Direct count from qTest module |
| **Automated Cases** | Test cases with automation completed | Count where `Automation Status = "Automated"` |
| **Cases with Attachments** | Test cases with execution evidence | Count with attachments in qTest |
| **Cases without Attachments** | Test cases missing evidence | `Total Cases - Cases with Attachments` |
| **Automation %** | Percentage automated | `(Automated Cases / Total Cases) × 100` |
| **Attachment %** | Percentage with evidence | `(Cases with Attachments / Total Cases) × 100` |

---

### 🐛 Defect Tracking from qTest

The system tracks defects by team and Safe-SDLC activity from qTest Project 114345:

#### Defect Classification

Defects are categorized by **Safe-SDLC Activity** to understand where issues are discovered:

| Activity Type | Description | Phase | Example |
|---------------|-------------|-------|---------|
| **QE Feature Testing** | Defects found during feature testing by QE team | Pre-Production | Functional bugs, UI issues, integration failures |
| **Production** | Defects discovered in production environment | Post-Deployment | Production escapes, live environment issues |
| **UAT (User Acceptance Testing)** | Defects found by business users during UAT | Pre-Production | Business logic issues, workflow problems |
| **Regression** | Defects found during regression testing | Pre-Production | Previously working features broken by new changes |

#### Defect Metrics Calculation

| Metric | Description | Calculation | Sprint 26.1.1 Value |
|--------|-------------|-------------|---------------------|
| **Total Defects** | All defects logged in sprint | Sum across all teams and activities | 10 defects |
| **QE Defects** | Defects caught by QE team testing | Count where activity = "QE Feature Testing" | 10 (100%) |
| **Production Escapes** | Defects found in production | Count where activity = "Production" | 0 ✅ |
| **UAT Defects** | Defects found during UAT | Count where activity = "UAT" | 0 |
| **Regression Defects** | Defects from regression testing | Count where activity = "Regression" | 0 |
| **QE Catch Rate** | Percentage of defects caught by QE | `(QE Defects / Total Defects) × 100` | 100% ✅ |

#### Defect Source & Extraction Process

**Data Source:**
- **System:** Jira (integrated with qTest Project 114345)
- **Project:** ELM (GET project)
- **Sprint Module ID:** 68209713 (Sprint 26.1.1)
- **Script:** `sprint-tad-ts-report.py` → `get_defect_analysis()` function

**Extraction Method - Step by Step:**

**Step 1: Build JQL Query**
```python
# For sprint-specific defects
jql = 'project = GET AND sprint = "26.1.1" AND type = Bug ORDER BY team ASC'

# For current sprint (dynamic)
jql = 'project = GET AND sprint in openSprints() AND type = Bug ORDER BY team ASC'
```
- **Filters Applied:**
  - Project = GET (ELM project key)
  - Issue Type = Bug (excludes Stories, Sub-tasks, Epics)
  - Sprint = Specific sprint number or openSprints()
  - Sorted by team for easier processing

**Step 2: Fetch All Bugs via Jira API**
```python
# API Endpoint
url = "https://jira.wolterskluwer.io/jira/rest/api/2/search"

# Pagination (100 bugs per request)
payload = {
    "jql": jql,
    "startAt": 0,
    "maxResults": 100,
    "fields": ["key", "summary", "customfield_13392", "customfield_14391"]
}
```
- **Pagination:** Loops until all bugs fetched (handles large datasets)
- **Fields Retrieved:**
  - `key` - Bug ID (e.g., GET-64544)
  - `summary` - Bug description
  - `customfield_13392` - Team assignment
  - `customfield_14391` - Safe-SDLC Activity

**Step 3: Extract Team Assignment**
```python
team = fields.get('customfield_13392')
if isinstance(team, dict):
    team = team.get('value', 'Unknown')
team = map_team_name(team)  # Standardize team names
```
- **Team Field:** customfield_13392 (custom Jira field)
- **Mapping:** Standardizes team names (e.g., "T360 Vanguards" → "T360 Vanguards")
- **Default:** "Unknown" if team not set

**Step 4: Extract Safe-SDLC Activity**
```python
safe_sdlc = fields.get('customfield_14391')
if isinstance(safe_sdlc, dict):
    activity = safe_sdlc.get('value', 'Not Set')
else:
    activity = safe_sdlc or "Not Set"
```
- **Activity Field:** customfield_14391 (custom Jira field)
- **Values:** "QE Feature Testing", "Production", "UAT", "Regression", "Not Set"
- **Data Type:** Can be string or dictionary (code handles both)

**Step 5: Build Activity-Team Matrix**
```python
# Create nested structure: activity → team → defect list
activity_data[activity][team].append({
    'key': key,
    'summary': summary
})
```
- **Structure:** 2-level dictionary
  - Level 1: Activity type (QE Feature Testing, Production, etc.)
  - Level 2: Team name (T360 Vanguards, Matrix, etc.)
  - Level 3: List of defect objects (key + summary)

**Step 6: Calculate Counts & Totals**
```python
# Count defects per team per activity
team_matrix[team][activity] = len(defects)

# Sort activities by total count (descending)
activity_counts = {act: sum(len(d) for d in teams.values()) 
                   for act, teams in activity_data.items()}

# Sort teams by total defects (descending)
team_matrix[team]['TOTAL'] = sum(team_matrix[team].values())
```
- **Team Matrix:** Row = Team, Column = Activity, Cell = Defect count
- **Sorting:** Activities by total count, Teams by total defects
- **Totals:** Row totals (per team), Column totals (per activity)

**Step 7: Manual Exclusions (Pre-existing Bugs)**

Pre-existing bugs are manually identified and documented but NOT excluded from API query:
- **Chubb:** GET-22095 - Noted as "pre-existing bug for fixing"
- **Mavericks:** GET-61996 - Noted as "pre-existing regression bug"
- **Nexus:** GET-3928 - Noted as "pre-existing UAT bug"

**Note:** These appear in the raw data but are annotated in reports as not counting toward sprint defect discovery metrics.

**Output Structure:**
```json
{
  "total_defects": 10,
  "activities": {
    "QE Feature Testing": 10,
    "Production": 0,
    "UAT": 0,
    "Regression": 0
  },
  "team_matrix": {
    "T360 Vanguards": {"QE Feature Testing": 4, "TOTAL": 4},
    "Athena": {"QE Feature Testing": 3, "TOTAL": 3},
    "T360 Chargers": {"QE Feature Testing": 2, "TOTAL": 2},
    "Matrix": {"QE Feature Testing": 1, "TOTAL": 1}
  },
  "team_defect_details": {
    "T360 Vanguards": {
      "QE Feature Testing": [
        {"key": "GET-12345", "summary": "Bug description"},
        {"key": "GET-12346", "summary": "Another bug"}
      ]
    }
  }
}
```

**Data Flow:**
```
Jira API → JSON Response → Python Processing → Activity-Team Matrix → 
JSON Output → Dashboard Visualization
```

#### Pre-existing Bug Exclusion

Pre-existing bugs taken for **fixing** (not newly discovered) are excluded from defect counts:

- **Chubb:** GET-22095 (pre-existing bug for fixing) - Not counted
- **Mavericks:** GET-61996 (pre-existing regression bug) - Not counted  
- **Nexus:** GET-3928 (pre-existing UAT bug) - Not counted

**Rationale:** These bugs existed before the sprint; sprint focus is fixing them, not discovering them.

#### Sprint 26.1.1 Defect Breakdown

| Team | QE Defects | Production | UAT | Regression | Total | Notes |
|------|------------|------------|-----|------------|-------|-------|
| **T360 Vanguards** | 4 | 0 | 0 | 0 | 4 | 🏆 Highest defect discovery |
| **Athena** | 3 | 0 | 0 | 0 | 3 | Contributing team data |
| **T360 Chargers** | 2 | 0 | 0 | 0 | 2 | Feature testing active |
| **Matrix** | 1 | 0 | 0 | 0 | 1 | Single QE defect |
| **T360 ICD Chubb** | 0 | 0 | 0 | 0 | 0 | Clean sprint execution |
| **Nexus** | 0 | 0 | 0 | 0 | 0 | No new defects found |
| **T360 Mavericks** | 0 | 0 | 0 | 0 | 0 | Clean execution |
| **TOTAL** | **10** | **0** | **0** | **0** | **10** | **100% QE catch rate** |

#### Quality Excellence Indicators

✅ **100% QE Catch Rate** - All 10 defects caught during QE testing phase  
✅ **0 Production Escapes** - No defects reached production environment  
✅ **0 UAT Defects** - No issues found by business users  
✅ **0 Regression Issues** - No previously working features broken  

**Best Practice:** Vanguards team found 4 defects (40% of total) - excellent test coverage and diligence!

---

### 🏆 Team Rankings Table

Teams are ranked using a composite scoring system:

#### Average Score Calculation
```
Average Score = (TAD % + TS %) / 100
```
- **Range:** 0.0 to 2.0
- **Perfect Score:** 2.0 (100% TAD + 100% TS)

#### Rating System
- **⭐⭐⭐ Excellent:** Avg Score ≥ 1.8 (90%+ on both)
- **⭐⭐ Good:** Avg Score ≥ 1.5 (75%+ on both)
- **⭐ Needs Improvement:** Avg Score < 1.5

#### Displayed Columns
1. **Rank** - Position based on average score
2. **Team** - Team name
3. **Issues** - Total issues analyzed
4. **TAD %** - TAD compliance percentage
5. **TS %** - TS compliance percentage
6. **Both %** - Issues with both complete
7. **Avg Score** - Composite score (0-2.0 scale)
8. **Rating** - Star rating visualization

---

### 💡 Insights & Recommendations

The dashboard generates **dynamic insights** based on sprint data:

#### Success Insights (Green ✅)
- **Top Performers:** Teams with Avg Score ≥ 1.8, showing TAD/TS percentages
- **Outstanding Compliance:** When both TAD and TS ≥ 90%
- **Perfect Sprint:** All applicable issues have complete documentation
- **Balanced Excellence:** TAD and TS within 5% of each other, both above 90%

#### Warning Insights (Yellow ⚠️)
- **Moderate Compliance:** Overall compliance 40-60%
- **Missing TAD:** Lists count and requests architecture documentation
- **Missing TS:** Lists count and requests test strategy development
- **Documentation Gap:** TAD vs TS difference > 15%, recommends focus area

#### Info Insights (Blue ℹ️)
- **Not Applicable:** Shows count of TAD N/A and TS N/A items
- **Teams Needing Support:** Lists teams with Avg Score < 1.5
- **Documentation Gap Analysis:** Recommends whether to focus on TAD or TS

---

### 🎯 Priority Levels (Reports)

Used in Team Discrepancy Reports to categorize action items:

- 🔴 **CRITICAL** - Blocks sprint sign-off, 0% compliance, production risks
- 🟡 **HIGH** - Impacts quality metrics, <75% compliance, missing key docs
- 🟢 **LOW** - Minor improvements, >90% compliance, formatting issues
- ✅ **COMPLETE** - No action required, 100% compliance achieved

---

### 🔍 Two-Stage TAD/TS Detection

#### Stage 1: Pull Request Names (Primary)
1. Script fetches all PRs from Jira Development tab via Bitbucket API
2. Searches PR titles for specific keywords
3. **TAD Keywords:** "TAD", "TECHNICAL ARCHITECTURE"
4. **TS Keywords:** "TS FOR", "TEST STRATEGY" (excludes "TS FILE" to avoid false positives)
5. Match = TAD/TS marked as **Found**

#### Stage 2: Issue Description (Fallback)
1. Triggered only if Stage 1 finds no match
2. Scans full issue description field
3. **TAD Keywords:** "TECHNICAL ARCHITECTURE", "TAD DOCUMENT", "ADR", "ARCHITECTURE DECISION", "DESIGN DOCUMENT", "TECHNICAL DESIGN"
4. **TS Keywords:** "TEST STRATEGY", "TS FOR", "TEST PLAN", "TESTING STRATEGY", "QA STRATEGY"
5. Extracts up to 5 URLs from description as evidence
6. Match = TAD/TS marked as **Found (Description)**

#### Not Applicable (N/A) Logic
- Issues can be manually marked as TAD N/A or TS N/A
- Excluded from compliance percentage calculations
- Tracked separately in N/A metrics
- Common for: enabler stories, bugs with parent story docs, minor fixes

---

## 💼 Common Use Cases

### 1. Generate Sprint Report

```bash
# Edit sprint-tad-ts-report.py to set sprint details
python sprint-tad-ts-report.py
```

The script will:
- Fetch data from Jira, Bitbucket, and qTest
- Generate JSON data files
- Create markdown reports
- Generate HTML dashboards

### 2. View Dashboard Locally

```bash
python dashboard_server.py
```

Access at: `http://localhost:8000`

### 3. Regenerate All Reports

```powershell
# Windows PowerShell
.\regenerate-all-reports.ps1
```

### 4. Share Report via Email

Use `Sprint-26.1.1-Email-Summary.md` as email body and attach `Sprint-26.1.1-Team-Discrepancy-Report.md` for details.

---

## 📊 Sprint 26.1.1 Summary

### Overall Metrics
- **Total Test Cases:** 109
- **Automation Rate:** 91.7% (100 automated)
- **TAD-TS Compliance:** 90.5%
- **QE Defects Found:** 10
- **Production Escapes:** 0 ✅

### Team Standings

| Team | Automation | Status |
|------|------------|--------|
| Chubb | 100% (19/19) | ✅ Complete |
| Matrix | 100% (14/14) | ⚠️ TS Missing |
| Mavericks | 100% (21/21) | 🟢 Near Perfect |
| Vanguards | 100% (23/23) | ⚠️ Attachments |
| Nexus | 72.4% (21/29) | ⚠️ Automation Gap |
| Chargers | 66.7% (2/3) | ⚠️ 1 Case Manual |

---

## 🔗 Resources

### Team Links
- **Dashboard:** https://lsuresh119586.github.io/C-Users-l.suresh-Desktop-QE-Process-QE-Governance-Compliance-check-tad-ts-dashboard/tad-ts-dashboard.html
- **qTest Project:** https://wk.qtestnet.com/p/114345/portal/project
- **Sprint Module ID:** 68209713

### Sprint Teams (PI 2026.1.1)
1. T360 Vanguards
2. T360 Mavericks
3. Matrix
4. T360 Chargers
5. Nexus
6. T360 ICD Chubb

---

## 🛠️ Troubleshooting

### Common Issues

**Issue:** Script fails with authentication error  
**Solution:** Update API tokens in `sprint-tad-ts-report.py`

**Issue:** No data returned from Jira  
**Solution:** Verify JQL query and sprint name in script

**Issue:** Dashboard shows "File not found"  
**Solution:** Ensure JSON data files exist in the same directory

**Issue:** Charts not displaying  
**Solution:** Check browser console for JavaScript errors

---

## 📝 Report Structure

### 1. Team Discrepancy Report
- Executive summary with overall metrics
- Team-wise compliance status (6 teams)
- Detailed discrepancies and action items
- Priority levels and next steps
- Appendix with detailed statistics

### 2. Email Summary
- High-level executive summary
- Team performance at a glance table
- Immediate action items by priority
- Quality metrics dashboard
- Resources and contact information

### 3. Test Case Breakdown
- Test cases by team and module
- Automation vs manual distribution
- Module-level details with story mapping

---

## 🤝 Support & Contact

**QE Governance Team**

For assistance with:
- Report generation or data issues
- qTest access or attachment uploads
- Test Strategy documentation
- Automation framework support
- Process clarifications

---

## 📅 Update Schedule

- **Sprint Reports:** Generated at sprint close (every 2-3 weeks)
- **Data Snapshots:** Created at end of each sprint
- **Dashboard Updates:** Updated per sprint cycle
- **Team Reviews:** Weekly during sprint execution
- **Compliance Reports:** Generated for each sprint in the PI (Program Increment)

---

## 🔄 Version History

- **v2.0 (Sprint 26.1.1 - Jan 2026)** - Enhanced sprint reports with detailed compliance tracking
- **v1.5 (Sprint 25.x - Dec 2025)** - Added team-specific sprint quality reports
- **v1.0 (Sprint 25.1.1 - Jan 2025)** - Initial sprint-based TAD-TS dashboard release

---

## 📜 License & Usage

This dashboard is for internal use by the QE team and stakeholders. Please maintain confidentiality of metrics and do not share externally without approval.

---

**Last Updated:** January 19, 2026  
**Current Sprint:** 26.1.1 (PI 2026.1.1 Execution)  
**Report Version:** 2.0
