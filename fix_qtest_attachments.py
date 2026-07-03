#!/usr/bin/env python3
"""
Fix qtest-testcases sprint files to correctly count missing attachments for automated cases only.
"""
import json
import re
from pathlib import Path

def fix_qtest_file(file_path):
    """Fix a single qtest sprint file."""
    print(f"Processing: {file_path}")
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract JSON from window.qtestData_* = {...}
    match = re.search(r'window\.qtestData_[\d_]+ = (\{.*\});?$', content, re.DOTALL)
    if not match:
        print(f"  ERROR: Could not find JSON in {file_path}")
        return False
    
    json_str = match.group(1)
    
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"  ERROR: Failed to parse JSON: {e}")
        return False
    
    # Recalculate totals
    total_automated = 0
    total_with_attachments = 0
    total_without_attachments = 0
    
    for team_name, team_data in data['teams'].items():
        team_automated = 0
        team_with_attachments = 0
        team_without_attachments = 0
        
        if 'test_cases' in team_data and isinstance(team_data['test_cases'], list):
            for tc in team_data['test_cases']:
                if tc.get('automated', False):
                    team_automated += 1
                    if tc.get('has_attachment', False):
                        team_with_attachments += 1
                    else:
                        team_without_attachments += 1
        
        # Update team data
        team_data['automated'] = team_automated
        team_data['with_attachments'] = team_with_attachments
        team_data['without_attachments'] = team_without_attachments
        
        # Accumulate totals
        total_automated += team_automated
        total_with_attachments += team_with_attachments
        total_without_attachments += team_without_attachments
    
    # Update totals
    data['totals']['automated'] = total_automated
    data['totals']['with_attachments'] = total_with_attachments
    data['totals']['without_attachments'] = total_without_attachments
    
    # Find variable name
    var_match = re.search(r'window\.(qtestData_[\d_]+)', content)
    if not var_match:
        print(f"  ERROR: Could not find variable name in {file_path}")
        return False
    
    var_name = var_match.group(1)
    
    # Write back
    new_json = json.dumps(data, separators=(',', ': '))
    new_content = f"window.{var_name} = {new_json};"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✓ Fixed: automated={total_automated}, with_attachments={total_with_attachments}, without_attachments={total_without_attachments}")
    return True

def main():
    """Fix all qtest sprint files."""
    base_dir = Path(__file__).parent
    
    sprint_files = [
        base_dir / 'qtest-testcases-sprint-26.1.1.js',
        base_dir / 'qtest-testcases-sprint-26.1.2.js',
        base_dir / 'qtest-testcases-sprint-26.1.3.js',
        base_dir / 'qtest-testcases-sprint-26.1.4.js',
    ]
    
    fixed = 0
    for file_path in sprint_files:
        if file_path.exists():
            if fix_qtest_file(file_path):
                fixed += 1
        else:
            print(f"  SKIPPED: File not found - {file_path}")
    
    print(f"\nFixed {fixed} files successfully.")

if __name__ == '__main__':
    main()
