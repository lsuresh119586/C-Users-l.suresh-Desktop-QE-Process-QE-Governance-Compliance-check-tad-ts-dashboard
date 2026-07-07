#!/usr/bin/env python3
"""Check if GET-65633 has customfield_13392 populated"""

import requests

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

session = requests.Session()
session.headers.update({
    "Accept": "application/json",
    "Authorization": f"Bearer {JIRA_API_TOKEN}"
})

issue_key = "GET-65633"
response = session.get(f"{JIRA_URL}/rest/api/2/issue/{issue_key}", params={
    "fields": "key,summary,customfield_13392,project"
})

if response.ok:
    data = response.json()
    team_field = data['fields'].get('customfield_13392')
    
    print("=" * 80)
    print(f"Issue: {data['key']}")
    print(f"Project: {data['fields'].get('project', {}).get('key', 'Unknown')}")
    print(f"Summary: {data['fields'].get('summary', 'N/A')}")
    print("=" * 80)
    
    if team_field:
        if isinstance(team_field, dict):
            team_value = team_field.get('value', 'Unknown')
            print(f"\n✅ Team Field IS POPULATED")
            print(f"   customfield_13392 = {team_field}")
            print(f"   Team Value: {team_value}")
        else:
            print(f"\n✅ Team Field IS POPULATED")
            print(f"   customfield_13392 = {team_field}")
    else:
        print(f"\n❌ Team Field is NOT POPULATED")
        print(f"   customfield_13392 = NULL/Empty")
    
    print("=" * 80)
else:
    print(f"Error: {response.status_code}")
    print(response.text[:200])
