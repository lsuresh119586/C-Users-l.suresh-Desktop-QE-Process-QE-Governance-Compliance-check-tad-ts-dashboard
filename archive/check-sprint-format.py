import json

data = json.load(open('tad-ts-report-2026-01.json'))
teams = data['teams']

# Get first team
sample_team = list(teams.keys())[0]
print(f"Sample team: {sample_team}")

# Get first issue
if teams[sample_team]['issues']:
    sample_issue = teams[sample_team]['issues'][0]
    print(f"\nSample issue: {sample_issue['key']}")
    print(f"Sprint value: {sample_issue.get('sprint', 'N/A')}")
    print(f"Sprint type: {type(sample_issue.get('sprint', ''))}")
    
    # Show first 3 issues with sprint info
    print("\nFirst 3 issues with sprint info:")
    for i, issue in enumerate(teams[sample_team]['issues'][:3]):
        print(f"{i+1}. {issue['key']}: {issue.get('sprint', 'No Sprint')}")
