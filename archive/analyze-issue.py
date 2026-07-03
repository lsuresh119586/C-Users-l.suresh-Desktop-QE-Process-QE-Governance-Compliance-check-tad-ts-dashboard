import requests
import json

JIRA_URL = 'https://jira.wolterskluwer.io/jira'
JIRA_API_TOKEN = '***REMOVED***'

session = requests.Session()
session.headers.update({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {JIRA_API_TOKEN}'
})

# Get issue details with description field
issue_key = 'ELM-35169'
url = f'{JIRA_URL}/rest/api/2/issue/{issue_key}'
params = {
    'fields': 'summary,description,status,issuetype,customfield_13392,assignee'
}

response = session.get(url, params=params)
if response.ok:
    data = response.json()
    fields = data['fields']
    
    print(f'Issue: {issue_key}')
    print(f'Type: {fields.get("issuetype", {}).get("name", "Unknown")}')
    print(f'Status: {fields.get("status", {}).get("name", "Unknown")}')
    print(f'Summary: {fields.get("summary", "")}')
    
    team_field = fields.get('customfield_13392')
    if team_field:
        team = team_field.get('value', 'Unknown') if isinstance(team_field, dict) else str(team_field)
        print(f'Team: {team}')
    
    print(f'\nDescription:')
    print('=' * 80)
    desc = fields.get('description', '')
    if desc:
        print(desc[:2000])  # First 2000 chars
    else:
        print('(No description)')
    print('=' * 80)
    
    # Check for TS links in description
    if desc:
        desc_upper = desc.upper()
        if 'TEST STRATEGY' in desc_upper or 'TS FOR' in desc_upper:
            print('\n✅ Found Test Strategy keywords in description!')
        if 'HTTPS://' in desc_upper or 'HTTP://' in desc_upper:
            print('✅ Found URL links in description!')
    
    # Now check Development tab for PRs
    print('\n\nChecking Development tab for Pull Requests...')
    print('=' * 80)
    
    dev_status_url = f'{JIRA_URL}/rest/dev-status/1.0/issue/detail'
    issue_id = data['id']
    
    total_prs = 0
    for app_type in ['stash', 'github', 'gitlab']:
        dev_params = {
            'issueId': issue_id,
            'applicationType': app_type,
            'dataType': 'pullrequest'
        }
        
        dev_response = session.get(dev_status_url, params=dev_params, timeout=10)
        
        if dev_response.ok:
            dev_data = dev_response.json()
            details = dev_data.get('detail', [])
            
            if details:
                for detail in details:
                    prs = detail.get('pullRequests', [])
                    total_prs += len(prs)
                    if prs:
                        print(f'\n{app_type.upper()} - Found {len(prs)} PRs:')
                        for pr in prs:
                            pr_name = pr.get('name', '')
                            pr_status = pr.get('status', '')
                            print(f'  - {pr_name} [{pr_status}]')
    
    if total_prs == 0:
        print('❌ No Pull Requests found in Development tab')
    else:
        print(f'\n✅ Total PRs found: {total_prs}')
    
else:
    print(f'Error: {response.status_code}')
    print(response.text[:500])
