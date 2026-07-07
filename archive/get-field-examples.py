#!/usr/bin/env python3
"""Get sample Jira IDs with and without customfield_13392"""

import requests

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

session = requests.Session()
session.headers.update({
    "Accept": "application/json",
    "Authorization": f"Bearer {JIRA_API_TOKEN}"
})

# Get issue WITH team field
print("=" * 80)
print("SAMPLE ISSUES - customfield_13392 (Team Field)")
print("=" * 80)

jql_with = 'project = ELM AND updated >= "2026-01-01" AND updated <= "2026-01-31" AND customfield_13392 is not EMPTY ORDER BY key DESC'
response = session.get(f"{JIRA_URL}/rest/api/2/search", params={
    "jql": jql_with,
    "maxResults": 3,
    "fields": "key,summary,customfield_13392"
})

if response.ok:
    data = response.json()
    issues_with = data.get('issues', [])
    if issues_with:
        print("\n✅ Issues WITH Team Field (customfield_13392 populated):")
        print("-" * 80)
        for issue in issues_with:
            team_field = issue['fields'].get('customfield_13392')
            team_name = team_field.get('value') if isinstance(team_field, dict) else str(team_field)
            summary = issue['fields'].get('summary', '')[:60]
            print(f"  {issue['key']:<12} Team: {team_name:<25} | {summary}")
    else:
        print("\n⚠️  No issues found with team field")
else:
    print(f"Error fetching issues with team: {response.status_code}")

# Get issues WITHOUT team field
jql_without = 'project = ELM AND updated >= "2026-01-01" AND updated <= "2026-01-31" AND customfield_13392 is EMPTY ORDER BY key DESC'
response = session.get(f"{JIRA_URL}/rest/api/2/search", params={
    "jql": jql_without,
    "maxResults": 5,
    "fields": "key,summary,customfield_13392,issuetype"
})

if response.ok:
    data = response.json()
    issues_without = data.get('issues', [])
    if issues_without:
        print("\n❌ Issues WITHOUT Team Field (customfield_13392 is NULL/empty):")
        print("-" * 80)
        for issue in issues_without:
            issue_type = issue['fields'].get('issuetype', {}).get('name', 'Unknown')
            summary = issue['fields'].get('summary', '')[:60]
            print(f"  {issue['key']:<12} Type: {issue_type:<10} | {summary}")
    else:
        print("\n⚠️  No issues found without team field")
else:
    print(f"Error fetching issues without team: {response.status_code}")

print("\n" + "=" * 80)
print("You can check any issue directly at:")
print("os.environ.get("JIRA_URL","https://jira.example.com")+"/  # jira/browse/<ISSUE-KEY>")
print("=" * 80)
