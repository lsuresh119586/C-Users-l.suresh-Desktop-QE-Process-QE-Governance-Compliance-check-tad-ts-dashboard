# Team Management Guide

## Current Teams (as of last run)

### Active Teams by Issue Count:
1. **PP Genesis** - 761 issues
2. **PP Spartacles** - 656 issues
3. **Unknown Team** - 560 issues
4. **PP Pioneers** - 365 issues
5. **Guardians** - 344 issues
6. **Nike** - 270 issues
7. **PP Supernovas** - 268 issues
8. **Titans** - 249 issues
9. **IDT** - 225 issues
10. **PP Platform Maintenance** - 198 issues
11. **QA Perf Testing** - 158 issues
12. **PP Pinnacles** - 138 issues
13. **Oasis Allstars** - 112 issues
14. **PP Spartans** - 110 issues
15. **PP Script Senseis** - 77 issues
16. **Minerva** - 36 issues
17. **PP MSM** - 26 issues
18. **SRE Team** - 17 issues
19. **Avengers** - 17 issues
20. **Passport Modernization** - 14 issues
21. **Athena** - 3 issues
22. **Connectors** - 1 issue

---

## How to Update/Add New Teams

### Option 1: Update in Jira (Recommended)
The team names come from Jira's `customfield_13392`. To add or change teams:

1. Go to Jira: https://jira.wolterskluwer.io/jira
2. Open any ELM issue
3. Find the field that shows team names (customfield_13392)
4. Update the team value in Jira
5. Re-run the report script to pick up changes

### Option 2: Add Team Name Mapping in Script
If you want to rename teams in the report WITHOUT changing Jira:

1. Open `sprint-tad-ts-report.py`
2. Find the `TEAM_MAPPING` dictionary (around line 20)
3. Add your mappings:

```python
TEAM_MAPPING = {
    "PP Genesis": "Passport Genesis Team",
    "PP Spartacles": "Passport Spartacles",
    "Unknown Team": "Unassigned",
    # Add more mappings as needed
}
```

4. Save and re-run the report

---

## To Check Current Teams

Run this command to see all teams in your reports:
```bash
python list-teams.py
```

This will show:
- All unique team names
- Number of issues per team
- Number of months each team appears in

---

## How Teams are Retrieved

**Source**: Jira REST API  
**Field**: `customfield_13392`  
**Endpoint**: `https://jira.wolterskluwer.io/jira/rest/api/2/search`  

The script requests this field for every issue:
```python
"fields": ["summary", "description", "status", "assignee", "issuetype", "priority", "sprint", "customfield_13392"]
```

If the field is empty/null in Jira → Team = "Unknown Team"

---

## Team Mapping Examples

### Example 1: Rename Teams
```python
TEAM_MAPPING = {
    "PP Genesis": "Genesis Squad",
    "PP Spartacles": "Spartacles Team",
    "QA Perf Testing": "Performance QA",
}
```

### Example 2: Consolidate Teams
```python
TEAM_MAPPING = {
    "PP Genesis": "Passport Core",
    "PP Spartacles": "Passport Core",
    "PP Pioneers": "Passport Core",
    # All map to same name
}
```

### Example 3: Clean Up Naming
```python
TEAM_MAPPING = {
    "Unknown Team": "Unassigned",
    "SRE Team": "Site Reliability Engineering",
    "IDT": "Infrastructure Development Team",
}
```

---

## After Making Changes

1. Save `sprint-tad-ts-report.py`
2. Regenerate reports:
   ```bash
   python sprint-tad-ts-report.py 2025-01-01 2025-01-31
   ```
3. Or regenerate all months:
   ```bash
   .\regenerate-all-reports.ps1
   ```
4. Refresh your dashboard to see updated team names

---

## Notes

- Team mappings only affect the display name in reports
- Original Jira data remains unchanged
- Mappings are case-sensitive
- If no mapping exists, the original Jira team name is used
- "Unknown Team" appears when customfield_13392 is empty in Jira
