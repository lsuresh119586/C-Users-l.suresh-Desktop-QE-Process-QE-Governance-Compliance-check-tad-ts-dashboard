# TAD/TS Dashboard - Complete Package

This folder contains all files required for the TAD/TS Compliance Dashboard.

## 📁 Folder Contents

### Python Scripts
- **sprint-tad-ts-report.py** - Main report generator (checks PRs and descriptions for TAD/TS)
- **generate-standalone-html.py** - Creates standalone HTML dashboard with embedded data
- **analyze-issue.py** - Analysis tool for individual JIRA issues

### PowerShell Scripts
- **regenerate-all-reports.ps1** - Automation script to regenerate all 12 months + standalone dashboard

### HTML Dashboards
- **tad-ts-dashboard.html** - Interactive dashboard with sprint selector and status filter
- **standalone-dashboard/tad-ts-dashboard-standalone.html** - Standalone version with embedded sprint data

### Data Files
- **tad-ts-report-sprint-26.1.1.js/.json** - Current sprint data
- **tad-ts-report-2026-01.js/.json** - Data snapshots by time period
- **tad-ts-report-data.js/.json** - Current sprint data

### Documentation
- **ANALYSIS-Description-Field-TAD-TS.md** - Analysis of description field checking feature
- **IMPLEMENTATION-Description-Check-Complete.md** - Implementation details
- **REGENERATION-STATUS.md** - Status of last regeneration

## 🚀 Quick Start

### Generate Report for a Sprint
```powershell
py sprint-tad-ts-report.py
```

### Regenerate All Reports
```powershell
.\regenerate-all-reports.ps1
```

### View Dashboard
1. Open **tad-ts-dashboard.html** in browser
2. Select sprint from dropdown
3. Apply status filter (All/Closed/New/Closed & New)

### Share Dashboard
Share the entire **standalone-dashboard** folder - it contains a single HTML file with all data embedded.

## 🔍 How It Works

### Two-Stage TAD/TS Detection

**Stage 1: PR Names (Primary)**
- Checks all pull requests in JIRA Development tab
- TAD Keywords: "TAD", "TECHNICAL ARCHITECTURE"
- TS Keywords: "TS FOR", "TEST STRATEGY" (excludes "TS FILE")

**Stage 2: Description Field (Fallback)**
- If Stage 1 fails, checks issue description
- TAD Keywords: TECHNICAL ARCHITECTURE, TAD DOCUMENT, ADR, ARCHITECTURE DECISION, DESIGN DOCUMENT, TECHNICAL DESIGN
- TS Keywords: TEST STRATEGY, TS FOR, TEST PLAN, TESTING STRATEGY, QA STRATEGY
- Extracts URLs from description (first 5)

### Filters
- **Issue Types**: Only Bug and Story (excludes Sub-task, Epic, Feature, Task)
- **Project**: ELM
- **Teams**: 13 teams tracked via customfield_13392

### Output
- JSON/JS files with team-wise breakdown
- Source tracking (PR vs Description)
- URL lists for description-based detections
- Auto-deletes CSV/MD files after generation

## 📊 Dashboard Features

### Main Dashboard (tad-ts-dashboard.html)
- Sprint selector (Sprint 26.1.1, Sprint 25.x, etc.)
- Status filter (All/Closed/New/Closed & New)
- Summary metrics (6 cards)
- Chart.js visualizations
- Team-wise breakdown with collapsible cards
- Shows source (PR/Description) for each detection

### Standalone Dashboard
- Sprint data embedded
- No external file dependencies (except Chart.js CDN)
- Ready to share via email/network drive

## 🔧 Configuration

### JIRA Connection
- URL: https://jira.wolterskluwer.io/jira
- Authentication: Bearer token (in script)
- Project: ELM
- API: REST v2 + Bitbucket dev-status

### Rate Limiting
- 0.3s delay between API calls
- 3 retries with backoff
- Handles connection resets gracefully

## 📈 Expected Results

### Accuracy Improvement
- 10-30% increase in TAD/TS detection vs PR-only checking
- Most benefit for teams documenting in descriptions (Titans, PP Teams, Minerva)

### Monthly Reports
- All 12 months of 2025 generated
- Each month: ~50-350 Bug/Story issues
- Team-wise compliance percentages
- Drill-down to individual issues

## 🎯 Next Steps

1. **Monthly Updates**: Run `py sprint-tad-ts-report.py YYYY-MM-01 YYYY-MM-END` for new months
2. **Share with Teams**: Distribute standalone dashboard folder
3. **Track Progress**: Use dashboard to monitor team compliance over time
4. **Adjust Keywords**: Update keywords in script based on team feedback

## 📞 Support

For questions or issues:
- Check documentation files in this folder
- Review script comments for technical details
- Refer to conversation summary for implementation history
