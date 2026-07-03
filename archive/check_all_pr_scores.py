import re

content = open('ts_quality_analysis_20260112_152419.md', encoding='utf-8').read()

# Find all stories with Pull Request source
matches = re.findall(
    r'### (GET-\d+):.*?\n\n\*\*Team:\*\* (.*?)\n.*?\n\*\*TS Source:\*\* Pull Request.*?\n\*\*Overall Score:\*\* ([\d.]+)%',
    content,
    re.DOTALL
)

print("="*70)
print("ALL STORIES WITH PULL REQUEST SOURCE (BITBUCKET)")
print("="*70)
print(f"\n{'Story':<15} {'Team':<25} {'Score':>10} {'Rating'}")
print("-"*70)

for story, team, score in matches:
    score_val = float(score)
    if score_val >= 70:
        rating = "Excellent"
    elif score_val >= 50:
        rating = "Good"
    elif score_val >= 30:
        rating = "Fair"
    elif score_val >= 15:
        rating = "Poor"
    else:
        rating = "Critical"
    
    print(f"{story:<15} {team:<25} {score:>9}% {rating}")

print("-"*70)
print(f"Total: {len(matches)} stories with Bitbucket PRs")

# Check if diff content was actually fetched
diff_indicators = [
    '--- Diff Content from',
    '.feature',
    'Scenario:',
    'Given ',
    'When ',
    'Then '
]

print("\n" + "="*70)
print("VERIFYING DIFF CONTENT WAS FETCHED")
print("="*70)

for story, team, score in matches:
    # Find the story section
    story_pattern = f"### {story}:.*?(?=###|$)"
    story_match = re.search(story_pattern, content, re.DOTALL)
    
    if story_match:
        story_content = story_match.group(0)
        
        # Check for Gherkin/diff indicators
        has_gherkin = any(
            indicator in story_content
            for indicator in ['Scenario:', 'Given ', 'When ', 'Then ']
        )
        
        has_diff_marker = '--- Diff Content from' in story_content
        
        status = "✅" if (has_gherkin or has_diff_marker) else "❌"
        
        print(f"{status} {story:<15} {team:<25} - Diff: {has_diff_marker}, Gherkin: {has_gherkin}")

print("\n" + "="*70)
print("SUMMARY BY TEAM")
print("="*70)

team_stats = {}
for story, team, score in matches:
    if team not in team_stats:
        team_stats[team] = {'count': 0, 'total_score': 0, 'scores': []}
    team_stats[team]['count'] += 1
    team_stats[team]['total_score'] += float(score)
    team_stats[team]['scores'].append(float(score))

print(f"\n{'Team':<25} {'Stories':>10} {'Avg Score':>12} {'Score Range'}")
print("-"*70)

for team in sorted(team_stats.keys()):
    stats = team_stats[team]
    avg = stats['total_score'] / stats['count']
    min_score = min(stats['scores'])
    max_score = max(stats['scores'])
    
    print(f"{team:<25} {stats['count']:>10} {avg:>11.1f}% {min_score:.1f}% - {max_score:.1f}%")

print("\n" + "="*70)
