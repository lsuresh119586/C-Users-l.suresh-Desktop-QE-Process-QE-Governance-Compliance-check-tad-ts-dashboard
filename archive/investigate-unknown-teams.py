#!/usr/bin/env python3
"""
Investigate "Unknown Team" issues to see their actual team field values
"""

import requests
import json

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
PROJECT_KEY = "ELM"

def get_session():
    """Create authenticated JIRA session"""
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JIRA_API_TOKEN}"
    })
    return session

def investigate_unknown_teams(from_date, to_date):
    """Fetch and analyze unknown team issues"""
    
    session = get_session()
    
    jql = f'project = {PROJECT_KEY} AND updated >= "{from_date}" AND updated <= "{to_date}" AND issuetype in (Bug, Story) ORDER BY updated DESC'
    
    url = f"{JIRA_URL}/rest/api/2/search"
    
    print(f"\n🔍 Fetching issues from {from_date} to {to_date}...")
    
    all_issues = []
    start_at = 0
    max_results = 100
    
    while True:
        payload = {
            "jql": jql,
            "startAt": start_at,
            "maxResults": max_results,
            "fields": ["summary", "customfield_13392", "issuetype", "status", "assignee"]
        }
        
        response = session.post(url, json=payload)
        
        if not response.ok:
            print(f"❌ Error: {response.status_code}")
            return
        
        data = response.json()
        issues = data.get('issues', [])
        all_issues.extend(issues)
        
        if len(issues) < max_results:
            break
        
        start_at += max_results
    
    print(f"✅ Found {len(all_issues)} total issues\n")
    
    # Analyze unknown teams
    unknown_team_issues = []
    
    for issue in all_issues:
        key = issue['key']
        fields = issue['fields']
        
        team_field = fields.get('customfield_13392')
        
        # Check if it's "Unknown Team" (NULL or empty)
        team = None
        if team_field:
            if isinstance(team_field, dict):
                team = team_field.get('value')
            else:
                team = str(team_field)
        
        if not team or team == 'Unknown Team':
            unknown_team_issues.append({
                'key': key,
                'summary': fields.get('summary', 'No summary'),
                'type': fields.get('issuetype', {}).get('name', 'Unknown'),
                'status': fields.get('status', {}).get('name', 'Unknown'),
                'assignee': fields.get('assignee', {}).get('displayName', 'Unassigned') if fields.get('assignee') else 'Unassigned',
                'team_field_raw': team_field
            })
    
    print("="*100)
    print(f"UNKNOWN TEAM ISSUES ({len(unknown_team_issues)} issues)")
    print("="*100 + "\n")
    
    if not unknown_team_issues:
        print("✅ No issues with unknown team found!")
        return
    
    # Display each issue with its raw team field
    for idx, issue in enumerate(unknown_team_issues, 1):
        print(f"\n{idx}. {issue['key']} - {issue['type']} - {issue['status']}")
        print(f"   Assignee: {issue['assignee']}")
        print(f"   Summary: {issue['summary'][:80]}")
        print(f"   Raw customfield_13392: {issue['team_field_raw']}")
    
    print("\n" + "="*100)
    print(f"ANALYSIS")
    print("="*100)
    
    # Count NULL vs empty
    null_count = sum(1 for i in unknown_team_issues if i['team_field_raw'] is None)
    empty_count = len(unknown_team_issues) - null_count
    
    print(f"\n   • NULL/Missing team field: {null_count} issues")
    print(f"   • Empty/Invalid team field: {empty_count} issues")
    
    print(f"\n💡 These issues need to have customfield_13392 (Team) set in Jira")
    print(f"   to appear under a specific team in the dashboard.\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) >= 3:
        from_date = sys.argv[1]
        to_date = sys.argv[2]
    else:
        from_date = "2026-01-01"
        to_date = "2026-01-31"
    
    investigate_unknown_teams(from_date, to_date)
