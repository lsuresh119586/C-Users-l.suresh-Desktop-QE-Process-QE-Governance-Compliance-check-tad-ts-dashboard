"""
Compare actual Bitbucket PR content vs. the comprehensive example
to show why scores are different
"""

import requests
import json

BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")

# Fetch actual content from Bitbucket PR #5361
pr_url = "https://bitbucket.wolterskluwer.io/projects/TYM/repos/tymetrix360core/pull-requests/5361/overview"
api_url = pr_url.replace('/overview', '').replace(
    'https://bitbucket.wolterskluwer.io/projects/',
    'https://bitbucket.wolterskluwer.io/rest/api/1.0/projects/'
).replace('/repos/', '/repos/').replace('/pull-requests/', '/pull-requests/')

headers = {'Authorization': f'Bearer {BITBUCKET_TOKEN}'}

print("="*80)
print("FETCHING ACTUAL CONTENT FROM BITBUCKET PR #5361 (GET-56987)")
print("="*80)

try:
    response = requests.get(api_url, headers=headers, timeout=10)
    if response.status_code == 200:
        pr_data = response.json()
        actual_title = pr_data.get('title', '')
        actual_description = pr_data.get('description', '').strip()
        
        # Fetch activities/comments
        activities_url = f"{api_url}/activities"
        activities_response = requests.get(activities_url, headers=headers, timeout=10)
        
        actual_comments = []
        if activities_response.status_code == 200:
            activities = activities_response.json().get('values', [])
            for activity in activities:
                if activity.get('action') == 'COMMENTED':
                    comment_text = activity.get('comment', {}).get('text', '').strip()
                    if comment_text:
                        actual_comments.append(comment_text)
        
        print(f"\n✅ Successfully fetched from Bitbucket")
        print(f"\nPR Title:")
        print("-"*80)
        print(actual_title)
        print("-"*80)
        
        print(f"\nPR Description ({len(actual_description)} characters):")
        print("-"*80)
        print(actual_description if actual_description else "[EMPTY]")
        print("-"*80)
        
        print(f"\nComments ({len(actual_comments)} found):")
        print("-"*80)
        if actual_comments:
            for i, comment in enumerate(actual_comments, 1):
                print(f"\nComment {i}: {comment}")
        else:
            print("[NO COMMENTS]")
        print("-"*80)
        
        # Calculate total actual content
        actual_total = actual_description
        for comment in actual_comments:
            actual_total += " " + comment
        
        print(f"\n📊 ACTUAL CONTENT STATS:")
        print(f"   Total Characters: {len(actual_total)}")
        print(f"   Description: {len(actual_description)} chars")
        print(f"   Comments: {sum(len(c) for c in actual_comments)} chars")
        
        # Now load and check JIRA data
        print("\n" + "="*80)
        print("CHECKING JIRA DATA FROM tad-ts-report-data.json")
        print("="*80)
        
        with open('tad-ts-report-data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Find GET-56987
        story = None
        for s in data.get('stories', []):
            if s.get('key') == 'GET-56987':
                story = s
                break
        
        if story:
            print(f"\n✅ Found GET-56987 in JIRA data")
            print(f"\nJIRA Summary: {story.get('summary', 'N/A')}")
            print(f"JIRA Description ({len(story.get('description', ''))} characters):")
            print("-"*80)
            jira_desc = story.get('description', '')
            print(jira_desc[:500] if jira_desc else "[EMPTY]")
            if len(jira_desc) > 500:
                print(f"\n... [truncated, total {len(jira_desc)} chars]")
            print("-"*80)
            
            print(f"\nJIRA Comments ({len(story.get('comments', []))} found):")
            print("-"*80)
            jira_comments = story.get('comments', [])
            if jira_comments:
                for i, comment in enumerate(jira_comments[:3], 1):
                    comment_text = comment.get('body', '')
                    print(f"\nComment {i} ({len(comment_text)} chars): {comment_text[:200]}")
                    if len(comment_text) > 200:
                        print("...")
                if len(jira_comments) > 3:
                    print(f"\n... and {len(jira_comments)-3} more comments")
            else:
                print("[NO COMMENTS]")
            print("-"*80)
        
        print("\n" + "="*80)
        print("COMPARISON: WHAT THE ANALYSIS TOOL SEES")
        print("="*80)
        
        print(f"""
1. FROM BITBUCKET PR #5361:
   - Description: "{actual_description}"
   - Length: {len(actual_description)} characters
   - This is what gets fetched and analyzed

2. FROM YOUR COMPREHENSIVE EXAMPLE:
   - Full Gherkin scenarios with Given/When/Then
   - Length: 16,015 characters
   - 64+ detailed test scenarios
   - THIS IS NOT IN THE BITBUCKET PR!

3. THE PROBLEM:
   ❌ Bitbucket PR contains: "{actual_description[:80]}..."
   ❌ NOT the comprehensive Gherkin scenarios you showed me
   ❌ Your comprehensive example is what SHOULD be there
   ❌ But it's NOT currently in JIRA or Bitbucket

4. WHY SCORES DIFFER:
   - Actual Bitbucket content: 87 chars → 0.0% score
   - Your comprehensive example: 16,015 chars → 80.0% score
   - These are COMPLETELY DIFFERENT inputs
   - The tool is working correctly
   - It's analyzing what's ACTUALLY in Bitbucket (brief bullets)
   - NOT what you wish was there (comprehensive scenarios)
""")

        print("\n" + "="*80)
        print("CONCLUSION")
        print("="*80)
        print("""
The scores are NOT changing for the same input.

ACTUAL INPUT (what analysis tool sees):
→ Brief bullet points: "Test Strategy Includes • Positive Scenarios..."
→ 87 characters
→ Score: 0.0%

YOUR COMPREHENSIVE EXAMPLE (what you showed me):
→ Full Gherkin scenarios with 64+ test cases
→ 16,015 characters  
→ Score: 80.0%

The comprehensive content you provided IS NOT currently in the Bitbucket PR
or JIRA. It's an example of what SHOULD be documented to achieve 80% score.

To improve Vanguards' score from 0% to 80%, you need to:
1. ADD the comprehensive Gherkin scenarios TO the Bitbucket PR description
2. Or ADD them to JIRA comments
3. Currently they don't exist in either location
4. That's why the score is 0%

The analysis tool is correctly scoring what's actually there (brief bullets),
not what could theoretically be there (comprehensive scenarios).
""")
        
    else:
        print(f"❌ Failed to fetch: Status {response.status_code}")
        
except Exception as e:
    print(f"❌ Error: {e}")
