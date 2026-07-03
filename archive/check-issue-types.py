#!/usr/bin/env python3
"""Check what issue types exist in the current sprint data"""

import json

# Read the report data
with open('tad-ts-report-2026-01.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Collect issue types from all teams
issue_types = set()
issue_type_counts = {}

for team_name, team_data in data['teams'].items():
    for issue in team_data['issues']:
        itype = issue.get('type', 'Unknown')
        issue_types.add(itype)
        issue_type_counts[itype] = issue_type_counts.get(itype, 0) + 1

print("="*80)
print("ISSUE TYPES IN SPRINT 26.1.1 (GET Project)")
print("="*80)
print(f"{'Issue Type':<30} {'Count':<10}")
print("-"*80)

for itype in sorted(issue_types):
    print(f"{itype:<30} {issue_type_counts[itype]:<10}")

print("="*80)
print(f"Total unique issue types: {len(issue_types)}")
print("="*80)
