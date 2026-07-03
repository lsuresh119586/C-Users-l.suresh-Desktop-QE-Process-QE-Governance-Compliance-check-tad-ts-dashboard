"""
Check the specific PRs provided by user to see why they score 0%
"""

import requests
import json
import re

BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")

prs_to_check = [
    ("Chargers/Mavericks", "https://bitbucket.wolterskluwer.io/projects/TYM/repos/unifiedui/pull-requests/830/overview"),
    ("Chargers/Mavericks", "https://bitbucket.wolterskluwer.io/projects/DEP/repos/aiconsole/pull-requests/149/overview")
]

session = requests.Session()
session.headers['Authorization'] = f'Bearer {BITBUCKET_TOKEN}'

for team, pr_url in prs_to_check:
    print("="*80)
    print(f"Checking: {pr_url}")
    print("="*80)
    
    # Parse URL
    match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
    if not match:
        print("Invalid URL format")
        continue
    
    project = match.group(1)
    repo = match.group(2)
    pr_id = match.group(3)
    
    api_url = f"https://bitbucket.wolterskluwer.io/rest/api/1.0/projects/{project}/repos/{repo}/pull-requests/{pr_id}"
    
    print(f"\nProject: {project}")
    print(f"Repo: {repo}")
    print(f"PR: #{pr_id}")
    
    # Fetch PR details
    print(f"\n1. Fetching PR details...")
    response = session.get(api_url, timeout=10)
    
    if not response.ok:
        print(f"   FAILED: Status {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        continue
    
    pr_data = response.json()
    
    title = pr_data.get('title', '')
    description = pr_data.get('description', '').strip()
    
    print(f"   Title: {title}")
    print(f"   Description: {len(description)} chars")
    
    if description:
        print(f"\n   Description content:")
        print(f"   {'-'*76}")
        desc_lines = description.split('\n')
        for line in desc_lines[:20]:
            print(f"   {line[:76]}")
        if len(desc_lines) > 20:
            remaining = len(desc_lines) - 20
            print(f"   ... [{remaining} more lines]")
        print(f"   {'-'*76}")
    
    # Fetch changes (diff)
    print(f"\n2. Fetching changes (diff)...")
    changes_url = f"{api_url}/changes"
    changes_resp = session.get(changes_url, timeout=30)
    
    if not changes_resp.ok:
        print(f"   FAILED: Status {changes_resp.status_code}")
        continue
    
    changes_data = changes_resp.json()
    files = changes_data.get('values', [])
    
    print(f"   Changed files: {len(files)}")
    
    test_files = []
    for f in files:
        path = f.get('path', {}).get('toString', '')
        file_type = f.get('type', '')
        
        is_test = any(indicator in path.lower() for indicator in ['test', 'tad', '.feature', '.md', 'strategy', 'scenario', 'spec'])
        
        if is_test:
            test_files.append((path, file_type))
            print(f"   [TEST] [{file_type}] {path}")
        else:
            print(f"     [{file_type}] {path}")
    
    # If test files found, fetch their content
    if test_files:
        print(f"\n3. Fetching test file content...")
        
        for path, file_type in test_files:
            print(f"\n   File: {path}")
            
            # Fetch diff for this file
            diff_url = f"{api_url}/diff/{path}"
            diff_resp = session.get(diff_url, params={'withComments': 'false'}, timeout=30)
            
            if diff_resp.ok:
                diff_data = diff_resp.json()
                
                # Extract lines
                all_lines = []
                for diff in diff_data.get('diffs', []):
                    for hunk in diff.get('hunks', []):
                        for segment in hunk.get('segments', []):
                            if segment.get('type') in ['ADDED', 'CONTEXT']:
                                for line in segment.get('lines', []):
                                    all_lines.append(line.get('line', ''))
                
                print(f"   Lines extracted: {len(all_lines)}")
                
                if all_lines:
                    full_content = '\n'.join(all_lines)
                    
                    print(f"\n   First 30 lines:")
                    print(f"   {'-'*76}")
                    for line in all_lines[:30]:
                        print(f"   {line[:76]}")
                    print(f"   {'-'*76}")
                    
                    # Analyze keywords
                    print(f"\n   Keyword Analysis:")
                    content_upper = full_content.upper()
                    
                    test_keywords = {
                        'Positive': ['VALID', 'HAPPY PATH', 'SUCCESS', 'EXPECTED', 'POSITIVE', 'ACCEPTANCE CRITERIA'],
                        'Negative': ['INVALID', 'ERROR', 'FAIL', 'EXCEPTION', 'NEGATIVE', 'UNAUTHORIZED'],
                        'Boundary': ['BOUNDARY', 'MIN', 'MAX', 'LIMIT', 'EDGE', 'NULL', 'EMPTY'],
                        'Edge Case': ['EDGE CASE', 'CORNER CASE', 'UNUSUAL', 'RACE CONDITION'],
                        'Browser': ['BROWSER', 'CHROME', 'FIREFOX', 'SAFARI', 'EDGE', 'CROSS-BROWSER'],
                        'Other': ['INTEGRATION', 'REGRESSION', 'E2E', 'USABILITY', 'SMOKE'],
                        'Gherkin': ['FEATURE:', 'SCENARIO:', 'GIVEN', 'WHEN', 'THEN', 'AND']
                    }
                    
                    found_any = False
                    for category, keywords in test_keywords.items():
                        found = [kw for kw in keywords if kw in content_upper]
                        if found:
                            print(f"     {category:15} [YES] {', '.join(found[:5])}")
                            found_any = True
                        else:
                            print(f"     {category:15} [NO] No keywords found")
                    
                    if not found_any:
                        print(f"\n   [WARNING] NO KEYWORDS MATCHED!")
                        print(f"   This content may be:")
                        print(f"     - In a different language")
                        print(f"     - Using different terminology")
                        print(f"     - Too brief/generic")
                        print(f"     - Not in Gherkin format")
            else:
                print(f"   Failed to fetch diff: {diff_resp.status_code}")
    else:
        print(f"\n3. No test strategy files found in diff")
        print(f"   Test strategy might be in PR description only")
        
        if description:
            print(f"\n   Analyzing PR description for keywords...")
            content_upper = description.upper()
            
            test_keywords = {
                'Positive': ['VALID', 'HAPPY PATH', 'SUCCESS', 'EXPECTED', 'POSITIVE', 'ACCEPTANCE'],
                'Negative': ['INVALID', 'ERROR', 'FAIL', 'EXCEPTION', 'NEGATIVE'],
                'Boundary': ['BOUNDARY', 'MIN', 'MAX', 'LIMIT', 'NULL', 'EMPTY'],
                'Gherkin': ['FEATURE', 'SCENARIO', 'GIVEN', 'WHEN', 'THEN']
            }
            
            for category, keywords in test_keywords.items():
                found = [kw for kw in keywords if kw in content_upper]
                if found:
                    print(f"     {category:15} [YES] {', '.join(found)}")
                else:
                    print(f"     {category:15} [NO]")
    
    print("\n")

print("="*80)
print("SUMMARY")
print("="*80)
print("""
If these PRs show test strategy content but still score 0%:

1. Check if the code is looking for these specific repos (DEP/aiconsole)
2. The analysis may only be checking TYM project PRs
3. Need to expand PR detection to include other projects

If no test strategy content is visible:
1. Content may be in PR comments/activities
2. Content may be in linked JIRA tickets
3. Test strategy format may be non-standard
""")
