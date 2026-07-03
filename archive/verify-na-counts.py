#!/usr/bin/env python3
"""Verify TAD/TS N/A counts match with total issues"""

import json

# Load the data
with open('tad-ts-report-data.json', 'r') as f:
    data = json.load(f)

print('='*80)
print('TAD/TS N/A VERIFICATION')
print('='*80)
print()

# Summary
s = data['summary']
print('SUMMARY:')
print(f'  Total Issues: {s["total"]}')
print()

# TAD breakdown
print('TAD:')
print(f'  Complete: {s["tadComplete"]} (has TAD)')
print(f'  N/A: {s["tadNA"]} (not applicable)')
print(f'  Missing: {s["missingTad"]} (truly missing)')
tad_sum = s["tadComplete"] + s["tadNA"] + s["missingTad"]
print(f'  Sum: {s["tadComplete"]} + {s["tadNA"]} + {s["missingTad"]} = {tad_sum}')
print(f'  Match: {"✓" if tad_sum == s["total"] else "✗ ERROR"}')
print()

# TS breakdown
print('TS:')
print(f'  Complete: {s["tsComplete"]} (has TS)')
print(f'  N/A: {s["tsNA"]} (not applicable)')
print(f'  Missing: {s["missingTs"]} (truly missing)')
ts_sum = s["tsComplete"] + s["tsNA"] + s["missingTs"]
print(f'  Sum: {s["tsComplete"]} + {s["tsNA"]} + {s["missingTs"]} = {ts_sum}')
print(f'  Match: {"✓" if ts_sum == s["total"] else "✗ ERROR"}')
print()

# List N/A issues
print('='*80)
print('ISSUES MARKED AS N/A:')
print('='*80)
print()

tad_na_issues = []
ts_na_issues = []
for team_name, team in data['teams'].items():
    for issue in team['issues']:
        if issue.get('tadNA'):
            tad_na_issues.append((issue['key'], issue['summary'], team_name, issue.get('tadNAComment', '')))
        if issue.get('tsNA'):
            ts_na_issues.append((issue['key'], issue['summary'], team_name, issue.get('tsNAComment', '')))

print(f'TAD N/A Issues ({len(tad_na_issues)}):')
for key, summary, team, comment in tad_na_issues:
    print(f'  {key} ({team})')
    print(f'    Summary: {summary[:70]}')
    print(f'    Reason: {comment[:70]}')
    print()

print(f'TS N/A Issues ({len(ts_na_issues)}):')
for key, summary, team, comment in ts_na_issues:
    print(f'  {key} ({team})')
    print(f'    Summary: {summary[:70]}')
    print(f'    Reason: {comment[:70]}')
    print()

# Conclusion
print('='*80)
print('CONCLUSION:')
print('='*80)
if tad_sum == s["total"] and ts_sum == s["total"]:
    print('✓ All counts match correctly!')
    print(f'✓ TAD N/A count: {s["tadNA"]} matches actual issues: {len(tad_na_issues)}')
    print(f'✓ TS N/A count: {s["tsNA"]} matches actual issues: {len(ts_na_issues)}')
else:
    print('✗ ERROR: Counts do not match!')
print()
