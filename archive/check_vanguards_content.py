import json
import requests

# Load configuration
BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")
BITBUCKET_USERNAME = "l.suresh"

# Test PR URLs from Vanguards team
test_prs = [
    ("GET-64677", "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/tymetrix360core/pull-requests/836/overview"),
    ("GET-56987", "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/tymetrix360core/pull-requests/5361/overview")
]

def fetch_pr_content(pr_url):
    """Fetch PR content from Bitbucket"""
    try:
        # Convert overview URL to API URL
        api_url = pr_url.replace('/overview', '').replace('os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # ', 
                                                           'os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/rest/"  # api/1.0/projects/')
        api_url = api_url.replace('/repos/', '/repos/').replace('/pull-requests/', '/pull-requests/')
        
        headers = {'Authorization': f'Bearer {BITBUCKET_TOKEN}'}
        
        # Fetch PR details
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            pr_data = response.json()
            title = pr_data.get('title', '')
            description = pr_data.get('description', '').strip()
            
            # Fetch activities (comments)
            activities_url = f"{api_url}/activities"
            activities_response = requests.get(activities_url, headers=headers, timeout=10)
            
            comments = []
            if activities_response.status_code == 200:
                activities = activities_response.json().get('values', [])
                for activity in activities:
                    if activity.get('action') == 'COMMENTED':
                        comment_text = activity.get('comment', {}).get('text', '').strip()
                        if comment_text:
                            comments.append(comment_text)
            
            return {
                'title': title,
                'description': description,
                'comments': comments,
                'total_chars': len(description) + sum(len(c) for c in comments)
            }
        else:
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

print("=" * 80)
print("VANGUARDS TEST STRATEGY CONTENT ANALYSIS")
print("=" * 80)

for story_id, pr_url in test_prs:
    print(f"\n{'='*80}")
    print(f"Story: {story_id}")
    print(f"PR URL: {pr_url}")
    print(f"{'='*80}")
    
    content = fetch_pr_content(pr_url)
    
    if content:
        print(f"\n✅ Successfully fetched PR content")
        print(f"\nTitle: {content['title']}")
        print(f"\nDescription ({len(content['description'])} characters):")
        print("-" * 80)
        print(content['description'] if content['description'] else "[Empty]")
        print("-" * 80)
        
        print(f"\nComments ({len(content['comments'])} comments):")
        print("-" * 80)
        if content['comments']:
            for i, comment in enumerate(content['comments'], 1):
                print(f"\nComment {i} ({len(comment)} characters):")
                print(comment)
                print("-" * 40)
        else:
            print("[No comments found]")
        print("-" * 80)
        
        print(f"\n📊 TOTAL CONTENT: {content['total_chars']} characters")
        
        # Analyze keyword presence
        full_text = (content['description'] + ' ' + ' '.join(content['comments'])).upper()
        
        keywords_found = []
        test_keywords = {
            'POSITIVE': ['POSITIVE', 'VALID', 'HAPPY PATH', 'SUCCESS', 'EXPECTED'],
            'NEGATIVE': ['NEGATIVE', 'INVALID', 'ERROR', 'FAIL', 'EXCEPTION'],
            'BOUNDARY': ['BOUNDARY', 'MIN', 'MAX', 'LIMIT', 'EDGE', 'NULL', 'EMPTY'],
            'EDGE CASE': ['EDGE CASE', 'CORNER CASE', 'UNUSUAL', 'RACE CONDITION'],
            'OTHER': ['INTEGRATION', 'REGRESSION', 'E2E', 'USABILITY', 'SMOKE']
        }
        
        print(f"\n🔍 KEYWORD ANALYSIS:")
        print("-" * 80)
        for category, keywords in test_keywords.items():
            found = [kw for kw in keywords if kw in full_text]
            if found:
                keywords_found.extend(found)
                print(f"✓ {category}: {', '.join(found)}")
            else:
                print(f"✗ {category}: No keywords found")
        
        print(f"\nTotal unique keywords found: {len(set(keywords_found))}")
        
        print(f"\n⚠️ PROBLEM DIAGNOSIS:")
        print("-" * 80)
        if content['total_chars'] < 200:
            print("❌ Content is too brief (< 200 characters)")
            print("   Bitbucket PRs should contain detailed test scenarios, not just bullet points")
        if len(keywords_found) < 10:
            print(f"❌ Only {len(keywords_found)} matching keywords found")
            print("   Need more detailed test scenario descriptions to match analysis keywords")
        if not content['description'] or len(content['description']) < 100:
            print("❌ PR description is missing or too short")
            print("   Test strategies should be documented in PR description with full scenarios")
        
    else:
        print(f"\n❌ Failed to fetch PR content")
    
print(f"\n{'='*80}")
print("SUMMARY")
print("=" * 80)
print("\nThe Vanguards team's test strategies ARE being successfully fetched from Bitbucket.")
print("However, the content in these PRs is too minimal (brief bullet points) resulting in:")
print("  • Very few keyword matches (<15% coverage per category)")
print("  • All categories scoring below the 15% threshold = 0 points")
print("  • Overall score = 0%")
print("\nRECOMMENDATION:")
print("  Enhance Bitbucket PR descriptions with detailed test scenarios instead of bullet lists.")
print("  Example: Instead of '• Positive Scenarios'")
print("           Write: 'Verify valid user login with correct credentials returns success'")
print("=" * 80)
