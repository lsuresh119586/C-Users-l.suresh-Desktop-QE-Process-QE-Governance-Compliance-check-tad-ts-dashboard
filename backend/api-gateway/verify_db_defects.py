#!/usr/bin/env python3
"""
Verify defect totals in db.json for sprint 26.1.1
"""

import json

db_path = 'c:\\Users\\l.suresh\\Desktop\\QE Process\\QE Governance\\Spec Kit Templates\\spec-kit-template-claude-ps-v0.0.90\\backend\\api-gateway\\db.json'

with open(db_path, 'r') as f:
    db = json.load(f)

# Get all 26.1.1 metrics
sprint_metrics = [m for m in db.get('metrics', []) if '-26.1.1' in m.get('sprint', '')]

print("=" * 60)
print("SPRINT 26.1.1 DEFECT DISTRIBUTION IN db.json")
print("=" * 60)

total_open = 0
total_closed = 0
total_defects = 0

for metric in sorted(sprint_metrics, key=lambda m: m.get('team', '')):
    team = metric.get('team', '')
    open_count = metric.get('defectsOpen', 0)
    closed_count = metric.get('defectsClosed', 0)
    total = open_count + closed_count
    
    print(f"✅ {team:12} | Open: {open_count} | Closed: {closed_count} | Total: {total}")
    
    total_open += open_count
    total_closed += closed_count
    total_defects += total

print("-" * 60)
print(f"   {'TOTAL':12} | Open: {total_open} | Closed: {total_closed} | Total: {total_defects}")
print("=" * 60)

if total_defects == 17:
    print("✅ SUCCESS: Database has correct total of 17 defects!")
else:
    print(f"❌ ERROR: Expected 17 defects, got {total_defects}")
