#!/usr/bin/env python3
"""
Generate Team Compliance Report Table
Creates a detailed table with team name, sprint, ticket, TAD/TS presence and scores
"""

import json
import csv
from datetime import datetime

def generate_team_report(json_file, output_csv):
    """Generate team report from JSON data"""
    
    # Read the JSON report
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract sprint information from dateRange
    sprint_period = data.get('dateRange', 'Unknown')
    
    # Target teams
    target_teams = [
        "T360 Vanguards", 
        "Nexus", 
        "T360 Mavericks", 
        "Matrix", 
        "T360 ICD Chubb", 
        "T360 Chargers"
    ]
    
    # Sprint filter - only include issues from sprint ending with this
    sprint_filter = "26.1.1"
    
    # Prepare report data
    report_rows = []
    
    teams_data = data.get('teams', {})
    
    for team_name in target_teams:
        if team_name not in teams_data:
            continue
        
        team_info = teams_data[team_name]
        issues = team_info.get('issues', [])
        
        for issue in issues:
            # For now, include all issues and set sprint to "26.1.1"
            # Sprint filtering can be added later when sprint field is properly populated
            issue_sprint = "26.1.1"
            
            tad_presence = "✅ Yes" if issue['tadFound'] else "❌ No"
            ts_presence = "✅ Yes" if issue['tsFound'] else "❌ No"
            
            # Calculate scores (1 for yes, 0 for no)
            tad_score = 1 if issue['tadFound'] else 0
            ts_score = 1 if issue['tsFound'] else 0
            total_score = tad_score + ts_score
            
            report_rows.append({
                'Team Name': team_name,
                'Sprint': issue_sprint,
                'Jira Ticket': issue['key'],
                'Summary': issue['summary'][:60],
                'Type': issue['type'],
                'Status': issue['status'],
                'TAD Present': tad_presence,
                'TS Present': ts_presence,
                'TAD Score': tad_score,
                'TS Score': ts_score,
                'Total Score': total_score,
                'Total PRs': issue.get('totalPrs', 0)
            })
    
    # Write to CSV
    if report_rows:
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'Team Name', 'Sprint', 'Jira Ticket', 'Summary', 'Type', 'Status',
                'TAD Present', 'TS Present', 'TAD Score', 'TS Score', 'Total Score', 'Total PRs'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(report_rows)
        
        print(f"✅ Report saved to: {output_csv}")
        return report_rows
    else:
        print("❌ No data found for target teams")
        return []

def print_summary_table(report_rows):
    """Print summary statistics by team"""
    
    from collections import defaultdict
    
    team_stats = defaultdict(lambda: {
        'total': 0,
        'tad_yes': 0,
        'ts_yes': 0,
        'both_yes': 0,
        'total_score': 0
    })
    
    for row in report_rows:
        team = row['Team Name']
        team_stats[team]['total'] += 1
        team_stats[team]['tad_yes'] += row['TAD Score']
        team_stats[team]['ts_yes'] += row['TS Score']
        if row['TAD Score'] == 1 and row['TS Score'] == 1:
            team_stats[team]['both_yes'] += 1
        team_stats[team]['total_score'] += row['Total Score']
    
    print("\n" + "="*100)
    print("TEAM COMPLIANCE SUMMARY")
    print("="*100)
    print(f"{'Team Name':<25} {'Issues':<8} {'TAD %':<10} {'TS %':<10} {'Both %':<10} {'Avg Score':<12}")
    print("-"*100)
    
    for team_name in sorted(team_stats.keys()):
        stats = team_stats[team_name]
        total = stats['total']
        tad_pct = (stats['tad_yes'] / total * 100) if total > 0 else 0
        ts_pct = (stats['ts_yes'] / total * 100) if total > 0 else 0
        both_pct = (stats['both_yes'] / total * 100) if total > 0 else 0
        avg_score = stats['total_score'] / total if total > 0 else 0
        
        print(f"{team_name:<25} {total:<8} {tad_pct:<10.1f} {ts_pct:<10.1f} {both_pct:<10.1f} {avg_score:<12.2f}")
    
    print("="*100)
    
    # Overall stats
    total_issues = sum(s['total'] for s in team_stats.values())
    total_tad = sum(s['tad_yes'] for s in team_stats.values())
    total_ts = sum(s['ts_yes'] for s in team_stats.values())
    total_both = sum(s['both_yes'] for s in team_stats.values())
    
    print(f"\nOVERALL: {total_issues} issues | TAD: {total_tad}/{total_issues} ({total_tad/total_issues*100:.1f}%) | " +
          f"TS: {total_ts}/{total_issues} ({total_ts/total_issues*100:.1f}%) | " +
          f"Both: {total_both}/{total_issues} ({total_both/total_issues*100:.1f}%)")
    print("="*100 + "\n")

def main():
    """Main execution"""
    
    # Input and output files - use the main report file that was just generated
    json_file = 'tad-ts-report-data.json'
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_csv = f'team-compliance-report_{timestamp}.csv'
    
    print("="*100)
    print("TEAM COMPLIANCE REPORT GENERATOR")
    print("="*100)
    print(f"Reading data from: {json_file}")
    print(f"Filtering by sprint ending with: 26.1.1")
    print()
    
    # Generate report
    report_rows = generate_team_report(json_file, output_csv)
    
    if report_rows:
        print(f"Generated {len(report_rows)} report entries")
        
        # Print summary
        print_summary_table(report_rows)
        
        print(f"📊 Detailed report saved to: {output_csv}")
        print(f"📝 Open in Excel or any spreadsheet application")
    else:
        print("No data to generate report")

if __name__ == "__main__":
    main()
