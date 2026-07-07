#!/usr/bin/env python3
"""
Fetch stories and bugs for specific teams in a sprint
"""

import requests
import json
from datetime import datetime

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
PROJECT_KEY = "ELM"

# Teams to filter
TARGET_TEAMS = [
    "T360 Vanguards",
    "Nexus",
    "T360 Mavericks",
    "Matrix",
    "T360 ICD Chubb",
    "T360 Chargers"
]

def get_session():
    """Create authenticated JIRA session"""
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JIRA_API_TOKEN}"
    })
    return session

def fetch_team_issues(session, from_date=None, to_date=None):
    """Fetch issues for target teams"""
    
    # Build JQL query for current sprint or date range
    if from_date and to_date:
        jql = f'project = {PROJECT_KEY} AND updated >= "{from_date}" AND updated <= "{to_date}" AND issuetype in (Bug, Story) ORDER BY team, updated DESC'
    else:
        jql = f'project = {PROJECT_KEY} AND sprint in openSprints() AND issuetype in (Bug, Story) ORDER BY team, updated DESC'
    
    url = f"{JIRA_URL}/rest/api/2/search"
    
    all_issues = []
    start_at = 0
    max_results = 100
    
    print(f"\n🔍 Fetching issues from Jira...")
    
    while True:
        payload = {
            "jql": jql,
            "startAt": start_at,
            "maxResults": max_results,
            "fields": ["summary", "status", "assignee", "issuetype", "priority", "sprint", "customfield_13392", "created", "updated"]
        }
        
        response = session.post(url, json=payload)
        
        if not response.ok:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            break
        
        data = response.json()
        issues = data.get('issues', [])
        all_issues.extend(issues)
        
        if len(issues) < max_results:
            break
        
        start_at += max_results
        print(f"   Fetched {len(all_issues)} issues so far...")
    
    print(f"✅ Total issues fetched: {len(all_issues)}\n")
    return all_issues

def filter_and_display_issues(issues):
    """Filter issues by target teams and display"""
    
    team_issues = {team: [] for team in TARGET_TEAMS}
    other_teams = {}
    
    for issue in issues:
        fields = issue['fields']
        
        # Extract team
        team = 'Unknown Team'
        if fields.get('customfield_13392'):
            team_field = fields['customfield_13392']
            if isinstance(team_field, dict):
                team = team_field.get('value', 'Unknown Team')
            else:
                team = str(team_field)
        
        # Get issue details
        issue_data = {
            'key': issue['key'],
            'summary': fields.get('summary', 'No summary'),
            'type': fields.get('issuetype', {}).get('name', 'Unknown'),
            'status': fields.get('status', {}).get('name', 'Unknown'),
            'assignee': fields.get('assignee', {}).get('displayName', 'Unassigned') if fields.get('assignee') else 'Unassigned',
            'created': fields.get('created', ''),
            'updated': fields.get('updated', '')
        }
        
        # Categorize by team
        if team in TARGET_TEAMS:
            team_issues[team].append(issue_data)
        else:
            if team not in other_teams:
                other_teams[team] = []
            other_teams[team].append(issue_data)
    
    # Display results
    print("="*100)
    print("STORIES AND BUGS BY TEAM - SPRINT 26.1.1")
    print("="*100 + "\n")
    
    total_count = 0
    
    for team in TARGET_TEAMS:
        issues_list = team_issues[team]
        count = len(issues_list)
        total_count += count
        
        print(f"\n{'='*100}")
        print(f"🎯 TEAM: {team} ({count} issues)")
        print("="*100)
        
        if count == 0:
            print("   No issues found for this team in the current sprint.")
        else:
            # Group by type
            stories = [i for i in issues_list if i['type'] == 'Story']
            bugs = [i for i in issues_list if i['type'] == 'Bug']
            
            if stories:
                print(f"\n📖 STORIES ({len(stories)}):")
                print("-"*100)
                for issue in stories:
                    print(f"   {issue['key']:<15} {issue['status']:<15} {issue['assignee']:<25}")
                    print(f"   └─ {issue['summary'][:80]}")
                    print()
            
            if bugs:
                print(f"\n🐛 BUGS ({len(bugs)}):")
                print("-"*100)
                for issue in bugs:
                    print(f"   {issue['key']:<15} {issue['status']:<15} {issue['assignee']:<25}")
                    print(f"   └─ {issue['summary'][:80]}")
                    print()
    
    print("\n" + "="*100)
    print(f"SUMMARY: {total_count} issues found across target teams")
    print("="*100)
    
    # Show other teams summary
    if other_teams:
        print(f"\n\nℹ️  Other teams in this sprint:")
        for team, issues_list in sorted(other_teams.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
            print(f"   • {team}: {len(issues_list)} issues")
    
    print("\n")

def main():
    """Main execution"""
    import sys
    
    session = get_session()
    
    # Check for date range arguments
    from_date = None
    to_date = None
    
    if len(sys.argv) >= 3:
        from_date = sys.argv[1]
        to_date = sys.argv[2]
        print(f"\n📅 Sprint 26.1.1 Date Range: {from_date} to {to_date}")
    elif len(sys.argv) == 2:
        # Single date or sprint name
        from_date = sys.argv[1]
        print(f"\n📅 Sprint 26.1.1 From: {from_date}")
    else:
        print(f"\n📅 Sprint 26.1.1 (Current/Open Sprints)")
    
    # Fetch issues
    issues = fetch_team_issues(session, from_date, to_date)
    
    if not issues:
        print("❌ No issues found")
        print("\nUsage:")
        print("  python team-issues.py                           # Check current sprint")
        print("  python team-issues.py 2026-01-01 2026-01-31    # Check date range")
        return
    
    # Filter and display
    filter_and_display_issues(issues)

if __name__ == "__main__":
    main()
