#!/usr/bin/env python3
"""
Debug script to check why TS is not being detected for specific GET issues
"""

import requests
import json
import re
import time

JIRA_URL = "https://jira.wolterskluwer.io/jira"
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

# Sample issues from the user's list
TEST_ISSUES = [
    "GET-64677",
    "GET-64675",
    "GET-67493",
    "GET-67386",
    "GET-67384",
    "GET-67382"
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

def check_issue_details(session, issue_key):
    """Get full details of an issue including description and PRs"""
    
    print(f"\n{'='*80}")
    print(f"Checking {issue_key}")
    print(f"{'='*80}")
    
    # Get issue details
    url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}"
    params = {"fields": "summary,description,status,issuetype,customfield_13392"}
    
    response = session.get(url, params=params)
    if not response.ok:
        print(f"❌ Error fetching issue: {response.status_code}")
        return
    
    issue_data = response.json()
    fields = issue_data['fields']
    issue_id = issue_data['id']
    
    print(f"Summary: {fields.get('summary', 'N/A')}")
    print(f"Type: {fields.get('issuetype', {}).get('name', 'N/A')}")
    print(f"Status: {fields.get('status', {}).get('name', 'N/A')}")
    
    # Check team
    team = 'Unknown'
    if fields.get('customfield_13392'):
        team_field = fields['customfield_13392']
        if isinstance(team_field, dict):
            team = team_field.get('value', 'Unknown')
    print(f"Team: {team}")
    
    # Check description
    description = fields.get('description', '')
    print(f"\n📝 Description length: {len(description) if description else 0} chars")
    
    if description:
        desc_upper = description.upper()
        
        # TS keywords
        ts_keywords = [
            'TEST STRATEGY',
            'TS FOR',
            'TEST PLAN',
            'TESTING STRATEGY',
            'QA STRATEGY'
        ]
        
        print("\n🔍 Checking description for TS keywords:")
        for keyword in ts_keywords:
            if keyword in desc_upper:
                print(f"  ✅ Found: '{keyword}'")
                # Show context
                idx = desc_upper.index(keyword)
                context_start = max(0, idx - 30)
                context_end = min(len(description), idx + len(keyword) + 30)
                context = description[context_start:context_end]
                print(f"     Context: ...{context}...")
        
        # Check for URLs
        urls = re.findall(r'https?://[^\s\]\)]+', description)
        if urls:
            print(f"\n🔗 Found {len(urls)} URLs in description:")
            for url in urls[:5]:
                print(f"  • {url}")
    else:
        print("  ⚠️  Description is empty or None")
    
    # Check PRs
    time.sleep(0.3)
    dev_status_url = f"{JIRA_URL}/rest/dev-status/1.0/issue/detail"
    
    total_prs = 0
    ts_found_in_pr = False
    
    for app_type in ['stash', 'github', 'gitlab']:
        dev_params = {
            'issueId': issue_id,
            'applicationType': app_type,
            'dataType': 'pullrequest'
        }
        
        try:
            dev_response = session.get(dev_status_url, params=dev_params, timeout=10)
            
            if dev_response.ok:
                dev_data = dev_response.json()
                details = dev_data.get('detail', [])
                
                for detail in details:
                    prs = detail.get('pullRequests', [])
                    total_prs += len(prs)
                    
                    if prs and not ts_found_in_pr:
                        print(f"\n🔀 Found {len(prs)} PRs in {app_type}:")
                    
                    for pr in prs:
                        pr_name = pr.get('name', '')
                        pr_name_upper = pr_name.upper()
                        pr_status = pr.get('status', 'Unknown')
                        pr_url = pr.get('url', '')
                        
                        print(f"\n  PR: {pr_name}")
                        print(f"  Status: {pr_status}")
                        print(f"  URL: {pr_url}")
                        
                        # Check for TS keywords
                        if ('TS FOR' in pr_name_upper or 'TEST STRATEGY' in pr_name_upper) and 'TS FILE' not in pr_name_upper:
                            print(f"  ✅ TS DETECTED in PR name!")
                            ts_found_in_pr = True
                        else:
                            print(f"  ❌ TS NOT detected in this PR")
                            
                            # Show what keywords were checked
                            print(f"     Checked for: 'TS FOR', 'TEST STRATEGY' (excluding 'TS FILE')")
                            if 'TS' in pr_name_upper:
                                print(f"     Note: 'TS' found but not in expected format")
        
        except Exception as e:
            print(f"  ⚠️  Error checking {app_type}: {str(e)[:50]}")
    
    if total_prs == 0:
        print(f"\n⚠️  No PRs found for this issue")
    
    print(f"\n{'='*80}\n")

def main():
    session = get_session()
    
    print(f"\n{'='*80}")
    print(f"TS DETECTION DEBUG TOOL")
    print(f"{'='*80}")
    print(f"Checking {len(TEST_ISSUES)} sample issues to see why TS is not detected")
    print(f"{'='*80}\n")
    
    for issue_key in TEST_ISSUES:
        check_issue_details(session, issue_key)
    
    print("\n💡 Summary:")
    print("If TS is not being detected, common reasons are:")
    print("  1. TS keywords are in a different format (e.g., 'Test-Strategy', 'TS:', etc.)")
    print("  2. TS is in attachments, not PRs or description")
    print("  3. TS is in comments, not description")
    print("  4. PR naming doesn't follow the expected pattern")
    print("  5. TS links are in a field other than description")

if __name__ == "__main__":
    main()
