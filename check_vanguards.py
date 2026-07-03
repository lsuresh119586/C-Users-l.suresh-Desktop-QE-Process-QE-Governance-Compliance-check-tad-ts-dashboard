import json

with open('qtest-testcases-sprint-26.1.1.json', 'r') as f:
    data = json.load(f)

vanguards = data['teams']['Vanguards']

print(f"\nVanguards Summary:")
print(f"Total: {vanguards['total']}")
print(f"Automated: {vanguards['automated']}")
print(f"With Attachments: {vanguards['with_attachments']}")
print(f"Without Attachments: {vanguards['without_attachments']}")

print(f"\n{'='*80}")
print("Vanguards Test Cases WITHOUT Attachments (Automated only):")
print(f"{'='*80}")

without_attachments = [tc for tc in vanguards['test_cases'] if tc['automated'] and not tc['has_attachment']]

for tc in without_attachments:
    print(f"  {tc['id']}: {tc['name']}")

print(f"\nTotal automated test cases without attachments: {len(without_attachments)}")
