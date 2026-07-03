"""
Debug script: Show actual content fetched for Chargers/Mavericks stories
"""

import requests
import json
import re
import sys
import os

# Set console encoding
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Configure
JIRA_URL = "https://jira.wolterskluwer.io"
JIRA_PAT = os.environ.get("JIRA_API_TOKEN", "")

session = requests.Session()
session.headers.update({
    'Authorization': f'Bearer {JIRA_PAT}',
    'Content-Type': 'application/json'
})

# Stories to check
stories_to_debug = [
    'GET-60431',  # Mavericks - 0%
    'GET-62132',  # Mavericks - 0%
]

print("="*80)
print("DEBUG: Fetching actual content for 0% stories")
print("="*80)

for story_key in stories_to_debug:
    print(f"\n{'='*80}")
    print(f"Story: {story_key}")
    print(f"{'='*80}")
    
    # Fetch JIRA issue
    issue_url = f"{JIRA_URL}/rest/api/2/issue/{story_key}"
    params = {'expand': 'renderedFields'}
    
    try:
        response = session.get(issue_url, params=params, timeout=30)
        
        if response.ok:
            issue_data = response.json()
            
            # Check description
            description = issue_data.get('fields', {}).get('description', '') or ''
            print(f"JIRA Description: {len(description)} chars")
            
            # Check comments
            comment_data = issue_data.get('fields', {}).get('comment', {}).get('comments', [])
            print(f"JIRA Comments: {len(comment_data)}")
            
            # Check for Bitbucket PR links in comments
            bitbucket_prs = []
            for comment in comment_data:
                body = comment.get('body', '')
                links = re.findall(r'https://bitbucket\.wolterskluwer\.io/projects/[^/\s\]|]+/repos/[^/\s\]|]+/pull-requests/\d+', body)
                bitbucket_prs.extend(links)
            
            print(f"Bitbucket PRs found: {len(bitbucket_prs)}")
            
            if bitbucket_prs:
                print("\nPR URLs:")
                for pr_url in bitbucket_prs:
                    pr_num = pr_url.split('/')[-1]
                    print(f"  PR #{pr_num}: {pr_url}")
                    
                    # Now fetch this PR's content
                    print(f"\n  Fetching PR #{pr_num} content...")
                    
                    # Parse URL
                    match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
                    if match:
                        project = match.group(1)
                        repo = match.group(2)
                        pr_id = match.group(3)
                        
                        api_url = f"https://bitbucket.wolterskluwer.io/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{pr_id}"
                        
                        bb_session = requests.Session()
                        bb_session.headers['Authorization'] = 'Bearer ***REMOVED***'
                        
                        pr_resp = bb_session.get(api_url, timeout=10)
                        if pr_resp.ok:
                            pr_data = pr_resp.json()
                            pr_desc = pr_data.get('description', '').strip()
                            
                            print(f"    PR Description: {len(pr_desc)} chars")
                            if pr_desc:
                                print(f"    Content preview:")
                                print(f"    {pr_desc[:300]}")
                            
                            # Check for diff/changes
                            changes_url = f"{api_url}/changes"
                            changes_resp = bb_session.get(changes_url, timeout=30)
                            if changes_resp.ok:
                                changes_data = changes_resp.json()
                                files = changes_data.get('values', [])
                                print(f"    Changed files: {len(files)}")
                                for f in files[:5]:
                                    path = f.get('path', {}).get('toString', '')
                                    file_type = f.get('type', '')
                                    print(f"      [{file_type}] {path}")
                        else:
                            print(f"    Failed: {pr_resp.status_code}")
            
            else:
                print("\nNo Bitbucket PR links found in JIRA")
                print("Test strategy may be in JIRA comments/description directly")
        else:
            print(f"Failed to fetch: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

print(f"\n{'='*80}")
print("If content shows but 0 keywords match:")
print("  - Content may be in different language/format")
print("  - Keywords may need expansion")
print("  - Test strategy may be too brief/generic")
print("="*80)
