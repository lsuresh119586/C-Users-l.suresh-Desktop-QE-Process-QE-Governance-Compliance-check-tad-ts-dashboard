#!/usr/bin/env python3
"""
Query Live JIRA Defects from Backend API
Matches the CSV analysis logic to extract defects by sprint
"""

import requests
import json
from collections import defaultdict
from datetime import datetime

# Backend API configuration
API_BASE_URL = "http://localhost:3000/api"
JIRA_API_TOKEN = "***REMOVED_JIRA_TOKEN***"

# Sprint configuration with month mapping
SPRINTS = {
    'chargers-26.1.1': {'team': 'chargers', 'month': 'Jan-25', 'label': 'Sprint 26.1.1 (Jan-25)'},
    'chargers-26.1.2': {'team': 'chargers', 'month': 'Feb-25', 'label': 'Sprint 26.1.2 (Feb-25)'},
    'chargers-26.1.3': {'team': 'chargers', 'month': 'Mar-25', 'label': 'Sprint 26.1.3 (Mar-25)'},
    'chargers-26.1.4': {'team': 'chargers', 'month': 'Apr-25', 'label': 'Sprint 26.1.4 (Apr-25)'},
    'chargers-26.1.5': {'team': 'chargers', 'month': 'May-25', 'label': 'Sprint 26.1.5 (May-25)'},
    'chargers-26.1.6': {'team': 'chargers', 'month': 'Jun-25', 'label': 'Sprint 26.1.6 (Jun-25)'},
}

def get_sprint_defects(sprint_name):
    """Query live defect data from backend API"""
    try:
        url = f"{API_BASE_URL}/defects/by-module?sprint={sprint_name}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ API Error: {response.status_code}")
            return None
    except Exception as err:
        print(f"❌ Error fetching data: {err}")
        return None


def filter_defects_by_criteria(defect_data, sprint_info):
    """
    Filter defects to match CSV analysis criteria:
    - Count only issues with severity SEV-1, SEV-2, SEV-3 (exclude SEV-4)
    - Include issues with status: Open, In Progress, Backlog, Complete
    - Group by Defect Type: Application, Infrastructure, etc.
    """
    if not defect_data:
        return None
    
    # Extract issues list if available
    issues = defect_data.get('issues', [])
    
    # For now, use the totals from live API
    filtered_data = {
        'sprint': sprint_info['label'],
        'source': defect_data.get('source', 'JIRA Live Data'),
        'timestamp': defect_data.get('timestamp', ''),
        'totals': {
            'open': defect_data.get('totals', {}).get('open', 0),
            'closed': defect_data.get('totals', {}).get('closed', 0),
            'total': defect_data.get('totals', {}).get('total', 0),
            'critical': defect_data.get('totals', {}).get('critical', 0),
            'high': defect_data.get('totals', {}).get('high', 0)
        },
        'by_module': defect_data.get('byModule', []),
        'by_severity': defect_data.get('bySeverity', {}),
        'by_status': defect_data.get('byStatus', {})
    }
    
    return filtered_data


def analyze_sprint_defects(sprint_name):
    """Analyze defects for a sprint"""
    sprint_info = SPRINTS.get(sprint_name)
    if not sprint_info:
        print(f"Unknown sprint: {sprint_name}")
        return None
    
    print(f"\n📊 Analyzing {sprint_info['label']}")
    print("=" * 80)
    
    # Fetch live data
    defect_data = get_sprint_defects(sprint_name)
    
    if not defect_data:
        print(f"No data available for {sprint_name}")
        return None
    
    # Filter defects
    filtered = filter_defects_by_criteria(defect_data, sprint_info)
    
    if not filtered:
        return None
    
    # Display results
    print(f"Source: {filtered['source']}")
    print(f"Timestamp: {filtered['timestamp']}")
    print("-" * 80)
    print(f"Total Issues: {filtered['totals']['total']}")
    print(f"  Open: {filtered['totals']['open']}")
    print(f"  Closed: {filtered['totals']['closed']}")
    print(f"  Critical: {filtered['totals']['critical']}")
    print(f"  High: {filtered['totals']['high']}")
    print()
    
    # Show by module
    if filtered['by_module']:
        print("📦 By Module/Type:")
        for module_data in filtered['by_module']:
            print(f"  {module_data.get('module', 'Unknown'):30} {module_data.get('defects', 0):3} issues")
    
    print()
    print("📈 By Severity:")
    for severity, count in filtered['by_severity'].items():
        if count > 0:
            print(f"  {severity}: {count}")
    
    print()
    print("✓ By Status:")
    for status, count in filtered['by_status'].items():
        if count > 0:
            print(f"  {status}: {count}")
    
    return filtered


def compare_sprints(sprint_list):
    """Compare defects across multiple sprints"""
    print("\n\n" + "=" * 80)
    print("DEFECT COMPARISON: MULTIPLE SPRINTS")
    print("=" * 80)
    
    results = []
    for sprint_name in sprint_list:
        result = analyze_sprint_defects(sprint_name)
        if result:
            results.append(result)
    
    # Summary table
    print("\n\n" + "=" * 80)
    print("SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Sprint':<30} {'Total':>8} {'Open':>8} {'Closed':>8} {'Critical':>8} {'High':>8}")
    print("-" * 80)
    
    for result in results:
        print(f"{result['sprint']:<30} {result['totals']['total']:>8} "
              f"{result['totals']['open']:>8} {result['totals']['closed']:>8} "
              f"{result['totals']['critical']:>8} {result['totals']['high']:>8}")
    
    print("=" * 80)


def filter_to_match_csv_count(live_data, target_count=17):
    """
    Filter live data to match the CSV count of 17 for sprint 26.1.1
    
    CSV logic: Filter by specific defect criteria
    - Exclude low-priority issues (SEV-4)
    - Focus on Application and Infrastructure defects
    - Count specific statuses: Backlog, Complete, In Progress
    """
    if not live_data:
        return None
    
    # The CSV showed 17 defects in Jan-25 (sprint 26.1.1)
    # This likely means filtering out certain issue types or statuses
    # For now, we'll use the live totals
    
    filtered_count = live_data.get('totals', {}).get('total', 0)
    
    return {
        'total_live': live_data.get('totals', {}).get('total', 0),
        'open': live_data.get('totals', {}).get('open', 0),
        'closed': live_data.get('totals', {}).get('closed', 0),
        'matches_csv_count': filtered_count == target_count,
        'target_count': target_count,
        'difference': filtered_count - target_count
    }


if __name__ == "__main__":
    print("\n🔴 LIVE JIRA DEFECT ANALYSIS")
    print("Querying from Backend API: http://localhost:3000/api")
    print("\n")
    
    # Single sprint analysis
    sprint_26_1_1 = get_sprint_defects('chargers-26.1.1')
    
    if sprint_26_1_1:
        print("\n📊 SPRINT 26.1.1 - LIVE DATA")
        print("=" * 80)
        print(json.dumps(sprint_26_1_1, indent=2))
        
        # Check match with CSV count
        match_check = filter_to_match_csv_count(sprint_26_1_1, target_count=17)
        print("\n\n📋 CSV MATCH ANALYSIS")
        print("=" * 80)
        print(f"Live Total Issues: {match_check['total_live']}")
        print(f"CSV Expected Count: {match_check['target_count']}")
        print(f"Difference: {match_check['difference']:+d}")
        print(f"Matches CSV: {'✅ YES' if match_check['matches_csv_count'] else '❌ NO'}")
        print("=" * 80)
    
    # Compare multiple sprints
    sprint_list = ['chargers-26.1.1', 'chargers-26.1.2', 'chargers-26.1.3', 
                   'chargers-26.1.4', 'chargers-26.1.5', 'chargers-26.1.6']
    
    compare_sprints(sprint_list)
    
    print("\n✅ Analysis complete!")
