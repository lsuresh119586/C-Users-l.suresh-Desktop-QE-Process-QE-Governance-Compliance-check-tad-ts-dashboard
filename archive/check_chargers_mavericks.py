"""
Check Chargers and Mavericks PRs to see why they score 0%
"""

import requests
import json
import re

BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")

# Load the data to find PR URLs
with open('tad-ts-report-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find Chargers and Mavericks stories
teams = data['teams']

chargers = teams.get('T360 Chargers', {}).get('issues', [])
mavericks = teams.get('T360 Mavericks', {}).get('issues', [])

print("="*80)
print("CHECKING CHARGERS AND MAVERICKS PRs")
print("="*80)

stories_to_check = []
for story in chargers:
    if story.get('tsFound'):
        stories_to_check.append(('T360 Chargers', story['key'], story['summary']))

for story in mavericks:
    if story.get('tsFound'):
        stories_to_check.append(('T360 Mavericks', story['key'], story['summary']))

print(f"\nFound {len(stories_to_check)} stories with TS:")
for team, key, summary in stories_to_check:
    print(f"  {key} ({team}): {summary[:60]}...")

# Now fetch the actual analysis and look for Bitbucket PR links
print("\n" + "="*80)
print("SEARCHING FOR BITBUCKET PRs IN JIRA COMMENTS")
print("="*80)

# We need to check the terminal output from the previous analysis run
# The PRs were printed as "Found Bitbucket PR #XXX"

# Let's manually check a few known PRs based on the pattern
print("\nLet me fetch content from Bitbucket directly for these stories...")

# We need to find the PR URLs - let's search the analysis output
analysis_file = 'ts_quality_analysis_20260112_152419.md'

with open(analysis_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find sections for these stories
for team, key, summary in stories_to_check:
    print(f"\n{'='*80}")
    print(f"Story: {key} ({team})")
    print(f"{'='*80}")
    
    # Find this story's section
    pattern = f"### {key}:.*?(?=###|$)"
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        story_section = match.group(0)
        
        # Extract score
        score_match = re.search(r'\*\*Overall Score:\*\* ([\d.]+)%', story_section)
        if score_match:
            score = score_match.group(1)
            print(f"Current Score: {score}%")
        
        # Check for PR source
        source_match = re.search(r'\*\*TS Source:\*\* (.*?)\n', story_section)
        if source_match:
            source = source_match.group(1)
            print(f"TS Source: {source}")
        
        # Look for keywords found
        keywords_section = story_section.find('Keywords Found')
        if keywords_section > 0:
            # Extract the table
            table_match = re.search(r'\| Category.*?\n\|.*?\n((?:\|.*?\n)+)', story_section)
            if table_match:
                print("\nKeyword Coverage:")
                for line in table_match.group(1).split('\n')[:6]:
                    if line.strip():
                        print(f"  {line}")
        
        # Check if there's any content indication
        if 'Bitbucket' in story_section:
            print("\n✅ Bitbucket mentioned in analysis")
        else:
            print("\n❌ No Bitbucket reference found")
        
        # Look for specific PR links in the content
        pr_links = re.findall(r'https://bitbucket\.example\.com/projects/[^/\s\]|]+/repos/[^/\s\]|]+/pull-requests/(\d+)', story_section)
        if pr_links:
            print(f"\nFound PR links: #{', #'.join(pr_links)}")
            
            for pr_num in pr_links:
                print(f"\n  Testing PR #{pr_num}...")
                # Try to fetch this PR
                # Need to figure out the repo - let's try common ones
                for repo in ['tymetrix360core', 'unifiedui', 'tymetrix360']:
                    test_url = f"os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/rest/"  # api/1.0/projects/TYM/repos/{repo}/pull-requests/{pr_num}"
                    
                    session = requests.Session()
                    session.headers['Authorization'] = f'Bearer {BITBUCKET_TOKEN}'
                    
                    try:
                        response = session.get(test_url, timeout=5)
                        if response.status_code == 200:
                            pr_data = response.json()
                            print(f"    ✅ Found in {repo}")
                            print(f"    Title: {pr_data.get('title', 'N/A')[:60]}")
                            
                            desc = pr_data.get('description', '').strip()
                            print(f"    Description: {len(desc)} chars")
                            if desc:
                                print(f"    Preview: {desc[:200]}")
                            
                            # Check for changes
                            changes_url = f"{test_url}/changes"
                            changes_resp = session.get(changes_url, timeout=10)
                            if changes_resp.ok:
                                changes_data = changes_resp.json()
                                files = changes_data.get('values', [])
                                print(f"    Changed files: {len(files)}")
                                for f in files[:3]:
                                    path = f.get('path', {}).get('toString', '')
                                    print(f"      - {path}")
                            
                            break
                    except:
                        pass
        else:
            print("\n⚠️  No PR links found in analysis")
            print("   Checking if PR was mentioned in terminal output...")

print("\n" + "="*80)
print("CONCLUSION")
print("="*80)
print("""
If stories show 0% despite having test strategy in Bitbucket, possible reasons:
1. PR link not detected in JIRA comments/description
2. Test strategy in PR description but very brief (< 15% keyword coverage)
3. Test strategy in diff but not in .feature/.md files (e.g., in code comments)
4. Keywords not matching the expected patterns

Please share the PR URLs for these stories so I can check directly.
""")
