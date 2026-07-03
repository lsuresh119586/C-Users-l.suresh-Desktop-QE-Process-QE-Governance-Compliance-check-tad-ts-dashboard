import json

with open('tad-ts-report-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find GET-56987
story = None
for s in data['stories']:
    if s['key'] == 'GET-56987':
        story = s
        break

if story:
    print("="*80)
    print("ACTUAL JIRA CONTENT FOR GET-56987")
    print("="*80)
    
    print(f"\nStory Key: {story['key']}")
    print(f"Summary: {story['summary']}")
    print(f"Team: {story['team']}")
    print(f"Status: {story['status']}")
    
    description = story.get('description', '')
    print(f"\nDescription Length: {len(description)} characters")
    print("\nDescription Content:")
    print("-"*80)
    print(description[:1000] if description else "[EMPTY]")
    if len(description) > 1000:
        print(f"\n... [showing first 1000 of {len(description)} total characters]")
    print("-"*80)
    
    comments = story.get('comments', [])
    print(f"\nComments Count: {len(comments)}")
    
    if comments:
        print("\nComments Content:")
        print("-"*80)
        for i, comment in enumerate(comments, 1):
            author = comment.get('author', {}).get('displayName', 'Unknown')
            body = comment.get('body', '')
            created = comment.get('created', '')
            
            print(f"\nComment {i} by {author} on {created[:10]}")
            print(f"Length: {len(body)} characters")
            print(body[:500])
            if len(body) > 500:
                print(f"... [showing first 500 of {len(body)} total characters]")
            print("-"*40)
    else:
        print("[NO COMMENTS IN JIRA]")
    print("-"*80)
    
    # Check for PR references
    pr_links = story.get('pr_links', [])
    print(f"\nPull Request Links: {len(pr_links)}")
    for pr in pr_links:
        print(f"  - {pr.get('url', 'N/A')}")
    
    print("\n" + "="*80)
    print("SUMMARY OF ACTUAL CONTENT SOURCES")
    print("="*80)
    print(f"""
1. JIRA DESCRIPTION:
   Length: {len(description)} characters
   Contains TS?: {'Yes' if description and len(description) > 100 else 'No/Minimal'}

2. JIRA COMMENTS:
   Count: {len(comments)}
   Total Length: {sum(len(c.get('body', '')) for c in comments)} characters
   Contains TS?: {'Yes' if any(len(c.get('body', '')) > 200 for c in comments) else 'No/Minimal'}

3. BITBUCKET PR #5361:
   Description: 87 characters (brief bullets)
   Contains TS?: No - only "• Positive Scenarios • Negative Scenarios..."

4. YOUR COMPREHENSIVE EXAMPLE:
   Length: 16,015 characters
   Location: NOT in JIRA or Bitbucket
   Status: This is a PROPOSED/IDEAL example, not actual content

THE ANALYSIS TOOL SEES: {len(description) + sum(len(c.get('body', '')) for c in comments) + 87} total characters
YOUR EXAMPLE CONTAINS: 16,015 characters

These are NOT the same input!
""")

else:
    print("Story GET-56987 not found in data")
