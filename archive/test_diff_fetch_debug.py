"""Test if diff fetch is actually working for GET-56987"""
import requests
import re

BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")

pr_url = "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/tymetrix360core/pull-requests/5361/overview"

match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
project_key = match.group(1)
repo_slug = match.group(2)
pr_id = match.group(3)

api_url = f"os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/rest/"  # api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{pr_id}"

session = requests.Session()
session.headers['Authorization'] = f'Bearer {BITBUCKET_TOKEN}'

print("Testing diff fetch for GET-56987...")
print(f"API URL: {api_url}")

# Get changes
changes_url = f"{api_url}/changes"
print(f"\nFetching changes from: {changes_url}")

changes_response = session.get(changes_url, timeout=30)
print(f"Status: {changes_response.status_code}")

if changes_response.ok:
    changes_data = changes_response.json()
    changed_files = changes_data.get('values', [])
    
    print(f"\nFound {len(changed_files)} changed files:")
    
    for file_change in changed_files:
        path = file_change.get('path', {}).get('toString', '')
        change_type = file_change.get('type', '')
        
        print(f"\n  File: {path}")
        print(f"  Type: {change_type}")
        
        # Check if test-related
        is_test_file = any(indicator in path.lower() for indicator in ['test', 'tad', '.feature', '.md', 'strategy', 'scenario'])
        
        if is_test_file:
            print(f"  ✅ This looks like a test strategy file!")
            
            # Try to fetch diff
            diff_url = f"{api_url}/diff/{path}"
            print(f"  Fetching diff from: {diff_url[:80]}...")
            
            try:
                diff_response = session.get(diff_url, params={'withComments': 'false'}, timeout=30)
                print(f"  Diff status: {diff_response.status_code}")
                
                if diff_response.ok:
                    diff_data = diff_response.json()
                    diffs = diff_data.get('diffs', [])
                    
                    total_lines = 0
                    for diff in diffs:
                        for hunk in diff.get('hunks', []):
                            for segment in hunk.get('segments', []):
                                if segment.get('type') in ['ADDED', 'CONTEXT']:
                                    total_lines += len(segment.get('lines', []))
                    
                    print(f"  ✅ Fetched {total_lines} lines of diff content")
                    
                    # Show sample
                    if diffs:
                        for diff in diffs[:1]:
                            for hunk in diff.get('hunks', [])[:1]:
                                for segment in hunk.get('segments', [])[:1]:
                                    lines = segment.get('lines', [])
                                    print(f"\n  Sample content (first 5 lines):")
                                    for line in lines[:5]:
                                        print(f"    {line.get('line', '')[:70]}")
                else:
                    print(f"  ❌ Failed to fetch diff: {diff_response.text[:200]}")
            except Exception as e:
                print(f"  ❌ Error fetching diff: {e}")
        else:
            print(f"  ⏭️  Not a test file, skipping")
else:
    print(f"❌ Failed: {changes_response.text[:500]}")
