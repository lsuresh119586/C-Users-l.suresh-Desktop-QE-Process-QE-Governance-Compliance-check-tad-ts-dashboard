#!/usr/bin/env python3
"""
Update db.json with correct defect counts for sprint 26.1.1
Distribution: vanguards=5, athena=3, nexus=2, chubb=2, chargers=2, matrix=2, mavericks=1
Total: 17 defects
"""

import json
from datetime import datetime

# Define defect distribution for sprint 26.1.1
DEFECT_DISTRIBUTION = {
    'vanguards': {'open': 2, 'closed': 3, 'total': 5},
    'athena': {'open': 1, 'closed': 2, 'total': 3},
    'nexus': {'open': 1, 'closed': 1, 'total': 2},
    'chubb': {'open': 1, 'closed': 1, 'total': 2},
    'chargers': {'open': 1, 'closed': 1, 'total': 2},
    'matrix': {'open': 1, 'closed': 1, 'total': 2},
    'mavericks': {'open': 0, 'closed': 1, 'total': 1},
}

# Read db.json
db_path = 'c:\\Users\\l.suresh\\Desktop\\QE Process\\QE Governance\\Spec Kit Templates\\spec-kit-template-claude-ps-v0.0.90\\backend\\api-gateway\\db.json'

with open(db_path, 'r') as f:
    db = json.load(f)

# Update metrics for sprint 26.1.1
updated_count = 0
for metric in db.get('metrics', []):
    sprint = metric.get('sprint', '')
    team = metric.get('team', '')
    
    # Check if this is a 26.1.1 sprint metric
    if '-26.1.1' in sprint:
        # Extract team name from sprint id
        team_name = sprint.split('-')[0]
        
        if team_name in DEFECT_DISTRIBUTION:
            defect_data = DEFECT_DISTRIBUTION[team_name]
            metric['defectsOpen'] = defect_data['open']
            metric['defectsClosed'] = defect_data['closed']
            metric['timestamp'] = datetime.now().isoformat() + 'Z'
            updated_count += 1
            print(f"✅ Updated {sprint}: {defect_data['open']} open + {defect_data['closed']} closed = {defect_data['total']} total")

# Write updated db.json
with open(db_path, 'w') as f:
    json.dump(db, f, indent=2)

# Verify total
total_defects = sum(DEFECT_DISTRIBUTION[team]['total'] for team in DEFECT_DISTRIBUTION)
print(f"\n✅ Updated {updated_count} metrics in db.json")
print(f"✅ TOTAL DEFECTS FOR 26.1.1: {total_defects}")
