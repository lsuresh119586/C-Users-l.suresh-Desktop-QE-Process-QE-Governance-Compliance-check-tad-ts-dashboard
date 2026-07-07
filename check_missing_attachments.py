import json

with open('qtest-testcases-sprint-26.1.1.json', 'r') as f:
    data = json.load(f)

print(f"\n{'='*80}")
print("Test Cases WITHOUT Attachments (Automated only):")
print(f"{'='*80}\n")

for team_name, team_data in sorted(data['teams'].items()):
    without_attachments = [tc for tc in team_data['test_cases'] if tc['automated'] and not tc['has_attachment']]
    
    if without_attachments:
        print(f"{team_name} ({len(without_attachments)} missing):")
        for tc in without_attachments:
            # Construct qTest URL
            qtest_url = f"os.environ.get("QTEST_URL","https://qtestnet.example.com")+"/"  # p/114345/portal/project#tab=testdesign&object=2&id={tc['qtest_id']}"
            print(f"  - {tc['id']}: {tc['name']}")
            print(f"    URL: {qtest_url}")
        print()

print(f"\nTotal automated test cases without attachments: {data['totals']['without_attachments']}")
