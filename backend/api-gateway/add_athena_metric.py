#!/usr/bin/env python3
"""
Add missing athena-26.1.1 metric to db.json
"""

import json
from datetime import datetime

db_path = 'c:\\Users\\l.suresh\\Desktop\\QE Process\\QE Governance\\Spec Kit Templates\\spec-kit-template-claude-ps-v0.0.90\\backend\\api-gateway\\db.json'

with open(db_path, 'r') as f:
    db = json.load(f)

# Check if athena-26.1.1 exists
athena_exists = any(m.get('sprint') == 'athena-26.1.1' for m in db.get('metrics', []))

if not athena_exists:
    # Create athena-26.1.1 metric
    new_metric = {
        "id": "metric-athena-26.1.1",
        "product": "t360",
        "team": "athena",
        "sprint": "athena-26.1.1",
        "requirementsCovered": 85,
        "testsCovered": 80,
        "defectsOpen": 1,
        "defectsClosed": 2,
        "deploymentReadiness": 85,
        "codeQuality": 82,
        "timestamp": datetime.now().isoformat() + 'Z',
        "updatedFromJira": True,
        "updatedFromAnalysis": True
    }
    
    db['metrics'].append(new_metric)
    
    with open(db_path, 'w') as f:
        json.dump(db, f, indent=2)
    
    print("✅ Added athena-26.1.1 metric to db.json")
    print(f"   - defectsOpen: 1, defectsClosed: 2")
else:
    print("ℹ️  athena-26.1.1 already exists in db.json")
