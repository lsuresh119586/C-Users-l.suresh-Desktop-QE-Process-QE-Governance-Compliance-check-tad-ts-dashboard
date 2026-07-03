#!/usr/bin/env python3
"""
Analyze QE Feature Testing defects by team for Sprint 26.1.1
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

JIRA_URL = "https://jira.wolterskluwer.io/jira"
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
PROJECT_KEY = "GET"

# Team name mapping
TEAM_MAPPING = {
    "T360 Vanguards": "T360 Vanguards",
    "Nexus": "Nexus",
    "T360 Mavericks": "T360 Mavericks",
    "Matrix": "Matrix",
    "T360 ICD Chubb": "T360 ICD Chubb",
    "T360 Chargers": "T360 Chargers",
}

def get_session():
    """Create authenticated JIRA session with retry logic"""
    session = requests.Session()
    
    # Configure retry strategy
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Set authentication headers
    session.headers.update({
        'Authorization': f'Bearer {JIRA_API_TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    return session

def get_sprint_issues(session, sprint_name):
    """Get all issues from a specific sprint"""
    jql = f'project = {PROJECT_KEY} AND sprint = "{sprint_name}" AND type = Bug ORDER BY team ASC'
    
    url = f"{JIRA_URL}/rest/api/2/search"
    
    all_issues = []
    start_at = 0
    max_results = 100
    
    while True:
        payload = {
            "jql": jql,
            "startAt": start_at,
            "maxResults": max_results,
            "fields": ["key", "summary", "issuetype", "customfield_13392", "customfield_14391"]
        }
        
        response = session.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        all_issues.extend(data['issues'])
        
        if len(all_issues) >= data['total']:
            break
            
        start_at += max_results
    
    return all_issues

def analyze_all_defects(issues):
    """Analyze all bugs by Safe-SDLC Activity and team"""
    activity_data = {}
    
    for issue in issues:
        fields = issue['fields']
        key = issue['key']
        
        # Get team
        team = fields.get('customfield_13392')
        if not team:
            team = "Unknown"
        elif isinstance(team, dict):
            team = team.get('value', 'Unknown')
        
        # Map team name
        team = TEAM_MAPPING.get(team, team)
        
        # Check Safe-SDLC Activity
        safe_sdlc = fields.get('customfield_14391')
        activity = "Not Set"
        
        if safe_sdlc:
            if isinstance(safe_sdlc, dict):
                activity = safe_sdlc.get('value', 'Not Set')
            elif isinstance(safe_sdlc, str):
                activity = safe_sdlc
        
        # Initialize activity if not exists
        if activity not in activity_data:
            activity_data[activity] = {}
        
        # Initialize team under activity if not exists
        if team not in activity_data[activity]:
            activity_data[activity][team] = []
        
        activity_data[activity][team].append({
            'key': key,
            'summary': fields.get('summary', 'No summary')
        })
    
    return activity_data

def main():
    print("=" * 80)
    print("DEFECTS ANALYSIS BY SAFE-SDLC ACTIVITY - SPRINT 26.1.1")
    print("=" * 80)
    print()
    
    session = get_session()
    
    print("🔍 Fetching bugs from Sprint 26.1.1...")
    issues = get_sprint_issues(session, "26.1.1")
    print(f"Found {len(issues)} bugs in total")
    print()
    
    print("📊 Analyzing Safe-SDLC Activity...")
    activity_data = analyze_all_defects(issues)
    print()
    
    # Print summary by activity
    print("=" * 150)
    print("DEFECTS SUMMARY - SPRINT 26.1.1")
    print("=" * 150)
    print()
    
    # Sort activities by defect count (descending)
    activity_counts = {}
    for activity, teams in activity_data.items():
        count = sum(len(defects) for defects in teams.values())
        activity_counts[activity] = count
    
    sorted_activities = sorted(activity_counts.items(), key=lambda x: x[1], reverse=True)
    activity_names = [act for act, _ in sorted_activities]
    
    # Collect all unique teams
    all_teams = set()
    for teams in activity_data.values():
        all_teams.update(teams.keys())
    
    # Create team data matrix
    team_data = {}
    for team in all_teams:
        team_data[team] = {}
        total = 0
        for activity in activity_names:
            count = len(activity_data.get(activity, {}).get(team, []))
            team_data[team][activity] = count
            total += count
        team_data[team]['TOTAL'] = total
    
    # Sort teams by total defects (descending)
    sorted_teams = sorted(team_data.items(), key=lambda x: x[1]['TOTAL'], reverse=True)
    
    # Print header
    header = f"{'Team':<25}"
    for activity in activity_names:
        # Abbreviate long activity names
        abbrev = activity[:20] if len(activity) <= 20 else activity[:17] + "..."
        header += f" {abbrev:>22}"
    header += f" {'Total':>10}"
    print(header)
    print("-" * 150)
    
    # Print team rows
    for team, data in sorted_teams:
        row = f"{team:<25}"
        for activity in activity_names:
            count = data[activity]
            row += f" {count:>22}"
        row += f" {data['TOTAL']:>10}"
        print(row)
    
    # Print totals
    print("-" * 150)
    total_row = f"{'TOTAL':<25}"
    for activity in activity_names:
        count = activity_counts[activity]
        total_row += f" {count:>22}"
    total_row += f" {len(issues):>10}"
    print(total_row)
    print()
    print("=" * 150)
    print()
    
    # Print detailed breakdown for each activity
    for activity, count in sorted_activities:
        teams = activity_data[activity]
        print()
        print("=" * 80)
        print(f"{activity.upper()} - {count} DEFECTS")
        print("=" * 80)
        print()
        
        # Sort teams by defect count
        sorted_teams = sorted(teams.items(), key=lambda x: len(x[1]), reverse=True)
        
        print(f"{'Team':<30} {'Defects':>10}")
        print("-" * 80)
        
        for team, defects in sorted_teams:
            print(f"{team:<30} {len(defects):>10}")
        
        print()
        
        # Print detailed list
        for team, defects in sorted_teams:
            print(f"{team} ({len(defects)} defects):")
            print("-" * 80)
            for defect in defects:
                print(f"  • {defect['key']}: {defect['summary']}")
            print()
    
    # Old code for "No defects found"
    if len(issues) == 0:
        print("✅ No bugs with Safe-SDLC Activity = 'QE Feature Testing' found in Sprint 26.1.1")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
