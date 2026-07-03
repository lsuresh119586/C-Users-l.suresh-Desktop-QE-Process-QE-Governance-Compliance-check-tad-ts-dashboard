#!/usr/bin/env python3
"""
List all unique teams from the generated reports
"""

import json
import os
from collections import defaultdict

def list_all_teams():
    """Extract all unique team names from all month reports"""
    all_teams = set()
    team_stats = defaultdict(lambda: {'total_issues': 0, 'months': []})
    
    # Check all month files
    months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
              '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12']
    
    print("\n" + "="*80)
    print("TEAM LIST EXTRACTOR")
    print("="*80 + "\n")
    
    for month in months:
        filename = f"tad-ts-report-{month}.json"
        if os.path.exists(filename):
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    teams = data.get('teams', {})
                    
                    for team_name, team_data in teams.items():
                        all_teams.add(team_name)
                        team_stats[team_name]['total_issues'] += team_data.get('total', 0)
                        team_stats[team_name]['months'].append(month)
                        
                print(f"✓ Processed {filename}: {len(teams)} teams found")
            except Exception as e:
                print(f"✗ Error reading {filename}: {e}")
        else:
            print(f"⊘ {filename} not found")
    
    print("\n" + "="*80)
    print(f"FOUND {len(all_teams)} UNIQUE TEAMS")
    print("="*80 + "\n")
    
    # Sort teams by total issues (descending)
    sorted_teams = sorted(team_stats.items(), key=lambda x: x[1]['total_issues'], reverse=True)
    
    print(f"{'Team Name':<50} {'Total Issues':<15} {'Active Months'}")
    print("-"*80)
    
    for team_name, stats in sorted_teams:
        months_str = f"{len(stats['months'])} months"
        print(f"{team_name:<50} {stats['total_issues']:<15} {months_str}")
    
    print("\n" + "="*80)
    print("COMPLETE TEAM LIST (Alphabetical)")
    print("="*80 + "\n")
    
    for idx, team in enumerate(sorted(all_teams), 1):
        print(f"{idx:2}. {team}")
    
    print("\n" + "="*80)
    print("\nTo update team names:")
    print("  1. Update in Jira: Edit the customfield_13392 for issues")
    print("  2. Add team mapping in script: Modify sprint-tad-ts-report.py")
    print("="*80 + "\n")

if __name__ == "__main__":
    list_all_teams()
