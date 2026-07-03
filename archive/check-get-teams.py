#!/usr/bin/env python3
"""Check teams in GET project Sprint 26.1.1"""

import json

# Read the GET project report
with open('tad-ts-report-2026-01.json', 'r') as f:
    data = json.load(f)

teams = data['teams']

print("=" * 80)
print("TEAMS IN GET PROJECT - SPRINT 26.1.1 (Jan 2026)")
print("=" * 80)
print()

# Sort by issue count descending
sorted_teams = sorted(teams.items(), key=lambda x: x[1]['total'], reverse=True)

print(f"{'#':<4} {'Team Name':<35} {'Issues':<8} {'TAD %':<10} {'TS %':<10}")
print("-" * 80)

for i, (team_name, team_data) in enumerate(sorted_teams, 1):
    print(f"{i:<4} {team_name:<35} {team_data['total']:<8} {team_data['tadPct']:<10.1f} {team_data['tsPct']:<10.1f}")

print()
print("=" * 80)
print(f"Total Teams: {len(teams)}")
print(f"Total Issues: {data['summary']['total']}")
print("=" * 80)
print()

# Check for the 6 newly added teams
new_teams = ["T360 Vanguards", "Nexus", "T360 Mavericks", "Matrix", "T360 ICD Chubb", "T360 Chargers"]
print("NEWLY ADDED TEAMS IN TEAM_MAPPING:")
print("-" * 80)
for team in new_teams:
    if team in teams:
        print(f"✅ {team:<35} {teams[team]['total']:3} issues found")
    else:
        print(f"❌ {team:<35} 0 issues found")
print("=" * 80)
