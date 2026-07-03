"""
Fetch and analyze the DIFF content from Bitbucket PR #5361
Check if test strategy is in the code changes, not just PR description
"""

import requests
import json
import re

BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")
BITBUCKET_USERNAME = "l.suresh"

# PR #5361 for GET-56987
pr_url = "https://bitbucket.wolterskluwer.io/projects/TYM/repos/tymetrix360core/pull-requests/5361"

# Convert to API URL
api_url = pr_url.replace(
    'https://bitbucket.wolterskluwer.io/projects/',
    'https://bitbucket.wolterskluwer.io/rest/api/1.0/projects/'
).replace('/repos/', '/repos/').replace('/pull-requests/', '/pull-requests/')

headers = {'Authorization': f'Bearer {BITBUCKET_TOKEN}'}

print("="*80)
print("FETCHING DIFF CONTENT FROM BITBUCKET PR #5361")
print("="*80)

try:
    # 1. Get PR basic info
    print("\n1. Fetching PR details...")
    response = requests.get(api_url, headers=headers, timeout=10)
    
    if response.status_code == 200:
        pr_data = response.json()
        title = pr_data.get('title', '')
        description = pr_data.get('description', '').strip()
        
        print(f"   PR Title: {title}")
        print(f"   PR Description: {len(description)} chars")
        
        # 2. Get changed files (diff)
        print("\n2. Fetching changed files (DIFF tab content)...")
        changes_url = f"{api_url}/changes"
        changes_response = requests.get(changes_url, headers=headers, timeout=30)
        
        if changes_response.status_code == 200:
            changes_data = changes_response.json()
            values = changes_data.get('values', [])
            
            print(f"   Found {len(values)} changed files")
            
            all_diff_content = ""
            file_summaries = []
            
            for change in values:
                path = change.get('path', {})
                file_path = path.get('toString', 'Unknown')
                change_type = change.get('type', 'UNKNOWN')
                
                # Get the diff for this file
                diff_url = f"{api_url}/diff/{file_path}"
                diff_response = requests.get(diff_url, headers=headers, timeout=30)
                
                if diff_response.status_code == 200:
                    diff_data = diff_response.json()
                    diffs = diff_data.get('diffs', [])
                    
                    file_content = ""
                    for diff in diffs:
                        hunks = diff.get('hunks', [])
                        for hunk in hunks:
                            segments = hunk.get('segments', [])
                            for segment in segments:
                                lines = segment.get('lines', [])
                                for line in lines:
                                    file_content += line.get('line', '') + "\n"
                    
                    all_diff_content += file_content
                    
                    file_summaries.append({
                        'path': file_path,
                        'type': change_type,
                        'size': len(file_content)
                    })
                    
                    print(f"   ✓ {file_path} ({change_type}) - {len(file_content)} chars")
                else:
                    print(f"   ✗ Failed to get diff for {file_path}: {diff_response.status_code}")
            
            print(f"\n3. Total diff content: {len(all_diff_content)} characters")
            
            # 4. Analyze the diff content for test strategy keywords
            print("\n" + "="*80)
            print("ANALYZING DIFF CONTENT FOR TEST STRATEGY")
            print("="*80)
            
            diff_upper = all_diff_content.upper()
            
            # Check for test strategy indicators
            test_strategy_indicators = [
                'FEATURE:', 'SCENARIO:', 'GIVEN', 'WHEN', 'THEN', 'AND',
                'TEST STRATEGY', 'POSITIVE', 'NEGATIVE', 'BOUNDARY',
                'EDGE CASE', 'BROWSER', 'ACCESSIBILITY', 'PERFORMANCE',
                'GHERKIN', 'BDD', 'ACCEPTANCE CRITERIA'
            ]
            
            found_indicators = []
            for indicator in test_strategy_indicators:
                count = diff_upper.count(indicator)
                if count > 0:
                    found_indicators.append(f"{indicator} ({count})")
            
            print(f"\nTest Strategy Keywords Found: {len(found_indicators)}")
            if found_indicators:
                for ind in found_indicators[:20]:  # Show first 20
                    print(f"  • {ind}")
                if len(found_indicators) > 20:
                    print(f"  ... and {len(found_indicators) - 20} more")
            else:
                print("  [None found]")
            
            # Check for comprehensive test content
            print("\n" + "="*80)
            print("CHECKING FOR COMPREHENSIVE TEST STRATEGY IN DIFF")
            print("="*80)
            
            # Look for specific patterns that indicate test strategy documentation
            patterns = {
                'Gherkin Features': r'Feature:\s+.+',
                'Gherkin Scenarios': r'Scenario:\s+.+',
                'Given-When-Then': r'(Given|When|Then)\s+.+',
                'Test Comments': r'(//|#)\s*Test\s+Strategy',
                'Positive Tests': r'(positive|happy\s+path|valid)',
                'Negative Tests': r'(negative|invalid|error)',
                'Boundary Tests': r'(boundary|min|max|limit)',
                'Edge Cases': r'(edge\s+case|corner\s+case|unusual)'
            }
            
            pattern_matches = {}
            for name, pattern in patterns.items():
                matches = re.findall(pattern, all_diff_content, re.IGNORECASE)
                pattern_matches[name] = len(matches)
                if len(matches) > 0:
                    print(f"\n{name}: {len(matches)} matches")
                    # Show first 3 examples
                    for match in matches[:3]:
                        print(f"  Example: {str(match)[:80]}")
            
            # Extract sample of diff content
            print("\n" + "="*80)
            print("SAMPLE OF DIFF CONTENT (First 2000 characters)")
            print("="*80)
            print(all_diff_content[:2000])
            if len(all_diff_content) > 2000:
                print(f"\n... [showing first 2000 of {len(all_diff_content)} total characters]")
            
            # Compare with PR description
            print("\n" + "="*80)
            print("COMPARISON: PR DESCRIPTION vs DIFF CONTENT")
            print("="*80)
            print(f"""
PR Description (Overview Tab):
  Length: {len(description)} characters
  Content: "{description[:200]}"

Diff Content (Diff Tab):
  Length: {len(all_diff_content)} characters
  Files Changed: {len(file_summaries)}
  Test Keywords Found: {len(found_indicators)}
  Gherkin Patterns: {sum(pattern_matches.values())} total matches

TOTAL CONTENT AVAILABLE:
  PR Description: {len(description)} chars
  Diff Content: {len(all_diff_content)} chars
  Combined: {len(description) + len(all_diff_content)} chars
""")
            
            # Save analysis results
            print("\n" + "="*80)
            print("CONCLUSION")
            print("="*80)
            
            if len(all_diff_content) > 5000 and sum(pattern_matches.values()) > 20:
                print("""
✅ COMPREHENSIVE TEST STRATEGY FOUND IN DIFF!
   The test strategy is documented in the code changes, not just PR description.
   The analysis tool should include diff content for accurate scoring.
""")
            elif len(all_diff_content) > 1000:
                print("""
⚠️ CODE CHANGES FOUND IN DIFF
   Diff contains {len(all_diff_content)} characters of code changes.
   However, limited test strategy documentation detected.
   May contain implementation code but not test scenarios.
""")
            else:
                print("""
❌ MINIMAL CONTENT IN DIFF
   Diff contains minimal changes.
   Test strategy likely not in diff either.
""")
            
        else:
            print(f"   ✗ Failed to fetch changes: {changes_response.status_code}")
            print(f"   Response: {changes_response.text[:500]}")
            
    else:
        print(f"✗ Failed to fetch PR: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
