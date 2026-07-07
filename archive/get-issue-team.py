#!/usr/bin/env python3
"""
Fetch team information for a specific Jira issue
"""

import requests
import sys

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

def get_issue_team(issue_key):
    """Get team information for a specific issue"""
    
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JIRA_API_TOKEN}"
    })
    
    url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}"
    params = {
        'fields': 'summary,customfield_13392,issuetype,status,assignee,description'
    }
    
    try:
        response = session.get(url, params=params)
        
        if not response.ok:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return
        
        data = response.json()
        fields = data['fields']
        
        print("\n" + "="*80)
        print(f"JIRA ISSUE: {issue_key}")
        print("="*80)
        print(f"Summary: {fields['summary']}")
        print(f"Type: {fields['issuetype']['name']}")
        print(f"Status: {fields['status']['name']}")
        
        assignee = fields.get('assignee')
        if assignee:
            print(f"Assignee: {assignee.get('displayName', 'Unknown')}")
        else:
            print(f"Assignee: Unassigned")
        
        # Extract team
        team_field = fields.get('customfield_13392')
        if team_field:
            if isinstance(team_field, dict):
                team = team_field.get('value', 'Unknown Team')
            else:
                team = str(team_field)
        else:
            team = 'Unknown Team'
        
        print(f"\n🎯 Team (customfield_13392): {team}")
        print("="*80 + "\n")
        
        # Show raw field value for debugging
        print("Raw customfield_13392 value:")
        print(team_field)
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        issue_key = sys.argv[1]
    else:
        issue_key = "GET-10568"
    
    get_issue_team(issue_key)
