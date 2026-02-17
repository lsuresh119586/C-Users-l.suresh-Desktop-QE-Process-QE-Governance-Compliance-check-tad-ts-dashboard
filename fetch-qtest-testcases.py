#!/usr/bin/env python3
"""
Fetch Test Case Data from qTest
Retrieves test cases from a qTest module and generates statistics including attachment counts
"""

import requests
import json
import sys
from datetime import datetime
from collections import defaultdict

# qTest Configuration
QTEST_URL = "https://wk.qtestnet.com/api/v3"
PROJECT_ID = 114345

# You can get your qTest API token from: https://wk.qtestnet.com/user/api-token
# Set this as an environment variable: QTEST_API_TOKEN
# Or replace 'YOUR_TOKEN_HERE' with your actual token
QTEST_API_TOKEN = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d"

def get_headers():
    """Get API headers with authentication"""
    return {
        'Authorization': f'Bearer {QTEST_API_TOKEN}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

def get_module_structure(module_id):
    """Get the structure of a module including sub-modules (teams)"""
    url = f"{QTEST_URL}/projects/{PROJECT_ID}/modules/{module_id}?expand=descendants"
    
    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching module structure: {e}")
        return None

def get_test_cases(parent_id, page=1, page_size=100):
    """Get test cases from a specific module/sub-module"""
    url = f"{QTEST_URL}/projects/{PROJECT_ID}/test-cases"
    params = {
        'parentId': parent_id,
        'page': page,
        'size': page_size
    }
    
    try:
        response = requests.get(url, headers=get_headers(), params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching test cases for module {parent_id}: {e}")
        return []

def get_test_case_attachments(test_case_id):
    """Get attachments for a specific test case with error handling"""
    url = f"{QTEST_URL}/projects/{PROJECT_ID}/test-cases/{test_case_id}/attachments"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []
    except requests.exceptions.Timeout:
        print(f"  Warning: Timeout fetching attachments for test {test_case_id}")
        return []
    except requests.exceptions.ConnectionError as e:
        print(f"  Warning: Connection error for test {test_case_id}: {e}")
        return []
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            # Test case not found - not an error, just no attachments
            return []
        print(f"  Warning: HTTP error for test {test_case_id}: {e}")
        return []
    except Exception as e:
        print(f"  Warning: Failed to fetch attachments for test {test_case_id}: {e}")
        return []

def get_all_test_cases_from_module(module_id, team_name, indent=2):
    """Recursively get all test cases from a module and ALL its descendants"""
    all_test_cases = []
    prefix = "  " * indent
    
    # Get test cases directly under this module
    page = 1
    while True:
        test_cases = get_test_cases(module_id, page=page)
        if not test_cases:
            break
        
        for tc in test_cases:
            tc['team'] = team_name
        
        all_test_cases.extend(test_cases)
        
        if len(test_cases) < 100:
            break
        page += 1
    
    if all_test_cases:
        print(f"{prefix}Found {len(all_test_cases)} test cases")
    
    return all_test_cases

def process_module_recursive(module, team_name, indent=1):
    """Recursively process a module and all its children"""
    all_test_cases = []
    prefix = "  " * indent
    
    module_id = module.get('id')
    module_name = module.get('name')
    
    print(f"{prefix}Processing: {module_name}")
    
    # Get test cases from this module
    test_cases = get_all_test_cases_from_module(module_id, team_name, indent + 1)
    all_test_cases.extend(test_cases)
    
    # Process children recursively
    children = module.get('children', [])
    if children:
        print(f"{prefix}  Found {len(children)} sub-modules")
        for child in children:
            child_test_cases = process_module_recursive(child, team_name, indent + 1)
            all_test_cases.extend(child_test_cases)
    
    return all_test_cases

def analyze_test_cases(test_cases, check_attachments=True):
    """Analyze test cases and count statistics with optimized attachment checking"""
    
    team_stats = defaultdict(lambda: {
        'total': 0,
        'automated': 0,
        'with_attachments': 0,
        'without_attachments': 0,
        'test_cases': []
    })
    
    total_cases = len(test_cases)
    print(f"\nAnalyzing {total_cases} test cases...")
    
    # First pass: identify automated test cases
    automated_test_ids = []
    automated_by_id = {}
    
    for tc in test_cases:
        tc_id = tc.get('id')
        is_automated = False
        
        # Check if automated (Automation field = 711 means "Yes")
        for prop in tc.get('properties', []):
            if prop.get('field_name') == 'Automation' and prop.get('field_value') == '711':
                is_automated = True
                break
        
        if is_automated and tc_id:
            automated_test_ids.append(tc_id)
            automated_by_id[tc_id] = tc
    
    print(f"Found {len(automated_test_ids)} automated test cases")
    
    # Batch check attachments for ALL automated tests at once (optimized)
    attachments_cache = {}
    if check_attachments and automated_test_ids:
        print(f"Checking attachments for {len(automated_test_ids)} automated tests...")
        
        for idx, tc_id in enumerate(automated_test_ids):
            if (idx + 1) % 5 == 0:
                print(f"  Progress: {idx + 1}/{len(automated_test_ids)}")
            
            try:
                attachments = get_test_case_attachments(tc_id)
                attachments_cache[tc_id] = len(attachments) > 0 if attachments else False
            except Exception as e:
                print(f"  Warning: Failed to fetch attachments for test {tc_id}: {e}")
                attachments_cache[tc_id] = False
    
    # Second pass: compile statistics
    for tc in test_cases:
        team = tc.get('team', 'Unknown')
        tc_id = tc.get('id')
        tc_pid = tc.get('pid', 'Unknown')
        
        # Count total
        team_stats[team]['total'] += 1
        
        # Check if automated
        is_automated = False
        for prop in tc.get('properties', []):
            if prop.get('field_name') == 'Automation' and prop.get('field_value') == '711':
                is_automated = True
                break
        
        if is_automated:
            team_stats[team]['automated'] += 1
            
            # Get attachment status from cache
            has_attachment = attachments_cache.get(tc_id, False)
            
            if has_attachment:
                team_stats[team]['with_attachments'] += 1
            else:
                team_stats[team]['without_attachments'] += 1
        else:
            has_attachment = False
        
        team_stats[team]['test_cases'].append({
            'id': tc_pid,
            'qtest_id': tc_id,
            'name': tc.get('name', 'Unknown'),
            'automated': is_automated,
            'has_attachment': has_attachment
        })
    
    return dict(team_stats)

def get_sprint_test_cases(module_id, sprint_name, check_attachments=True):
    """Get test cases for a sprint organized by team"""
    
    print(f"\n{'='*80}")
    print(f"Fetching Test Cases for {sprint_name}")
    print(f"Module ID: {module_id}")
    print(f"{'='*80}\n")
    
    # Get module structure to find teams
    module = get_module_structure(module_id)
    if not module:
        print("Error: Could not fetch module structure")
        return None
    
    all_test_cases = []
    
    # Check if module has children (team sub-modules)
    children = module.get('children', [])
    if children:
        print(f"Found {len(children)} team modules\n")
        
        for child in children:
            child_name = child.get('name')
            print(f"Processing team: {child_name}")
            
            # Process this team module and all its descendants recursively
            team_test_cases = process_module_recursive(child, child_name, indent=1)
            all_test_cases.extend(team_test_cases)
            
            print(f"  Team {child_name} total: {len(team_test_cases)} test cases\n")
    else:
        # No children, get test cases directly
        print("No team modules found, getting test cases from parent module")
        test_cases = get_all_test_cases_from_module(module_id, "All Teams")
        all_test_cases.extend(test_cases)
    
    if not all_test_cases:
        print("\nNo test cases found!")
        return None
    
    print(f"\nTotal test cases retrieved: {len(all_test_cases)}")
    
    # Analyze test cases
    team_stats = analyze_test_cases(all_test_cases, check_attachments)
    
    # Calculate totals
    totals = {
        'total': sum(team['total'] for team in team_stats.values()),
        'automated': sum(team['automated'] for team in team_stats.values()),
        'with_attachments': sum(team['with_attachments'] for team in team_stats.values()),
        'without_attachments': sum(team['without_attachments'] for team in team_stats.values())
    }
    
    result = {
        'sprint_name': sprint_name,
        'module_id': module_id,
        'generated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'totals': totals,
        'teams': team_stats
    }
    
    return result

def print_report(data):
    """Print a formatted report"""
    if not data:
        return
    
    print(f"\n{'='*80}")
    print(f"TEST CASE SUMMARY - {data['sprint_name']}")
    print(f"Generated: {data['generated']}")
    print(f"{'='*80}\n")
    
    # Print team breakdown
    print(f"{'Team':<20} {'Total':<8} {'Automated':<12} {'With Attach':<12} {'Without Attach':<15}")
    print("-" * 80)
    
    teams = data['teams']
    for team_name in sorted(teams.keys()):
        team = teams[team_name]
        print(f"{team_name:<20} {team['total']:<8} {team['automated']:<12} "
              f"{team['with_attachments']:<12} {team['without_attachments']:<15}")
    
    print("-" * 80)
    totals = data['totals']
    print(f"{'TOTAL':<20} {totals['total']:<8} {totals['automated']:<12} "
          f"{totals['with_attachments']:<12} {totals['without_attachments']:<15}")
    
    print(f"\nAutomation Coverage: {totals['automated']}/{totals['total']} "
          f"({totals['automated']/totals['total']*100:.1f}%)")
    print(f"Attachment Coverage: {totals['with_attachments']}/{totals['total']} "
          f"({totals['with_attachments']/totals['total']*100:.1f}%)")

def save_to_json(data, filename):
    """Save data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nData saved to: {filename}")

def main():
    """Main function"""
    
    if QTEST_API_TOKEN == "YOUR_TOKEN_HERE":
        print("ERROR: Please set your qTest API token!")
        print("Get your token from: https://wk.qtestnet.com/user/api-token")
        print("Update QTEST_API_TOKEN in the script or set QTEST_API_TOKEN environment variable")
        sys.exit(1)
    
    # Sprint configurations
    sprints = {
        '26.1.1': 68209713,
        '26.1.2': 68209714,
        '26.1.3': 68209719,
        '26.1.4': 68289134,
        '26.1.5': 0,  # TODO: Update with correct module ID
        '26.1.6': 0,  # TODO: Update with correct module ID
    }
    
    # Expected team distributions per sprint (for validation)
    expected_distributions = {
        '26.1.1': {'Chargers': 3, 'Chubb': 17},
        '26.1.2': {'Chargers': 5, 'Chubb': 15},
        '26.1.3': {'Chargers': 4, 'Chubb': 16},
        '26.1.4': {'Chargers': 4, 'Chubb': 16},
        '26.1.5': {'Chargers': 4, 'Chubb': 16},
        '26.1.6': {'Chargers': 4, 'Chubb': 16},
    }
    
    # Get sprint selection
    if len(sys.argv) > 1:
        sprint = sys.argv[1]
    else:
        print("Usage: python fetch-qtest-testcases.py <sprint>")
        print(f"Available sprints: {', '.join(sprints.keys())}")
        print("\nExample: python fetch-qtest-testcases.py 26.1.2")
        sprint = input("\nEnter sprint name (or press Enter for 26.1.2): ").strip()
        if not sprint:
            sprint = '26.1.2'
    
    if sprint not in sprints:
        print(f"Error: Unknown sprint '{sprint}'")
        print(f"Available sprints: {', '.join(sprints.keys())}")
        sys.exit(1)
    
    module_id = sprints[sprint]
    
    # Ask about attachment checking
    check_attachments = True
    if len(sys.argv) <= 2:
        response = input("\nCheck attachments? (y/n, default=y): ").strip().lower()
        if response == 'n':
            check_attachments = False
    
    # Fetch data
    data = get_sprint_test_cases(module_id, f"Sprint {sprint}", check_attachments)
    
    if data:
        # Print report
        print_report(data)
        
        # Validate team distribution if expected data exists
        if sprint in expected_distributions:
            print(f"\n{'='*80}")
            print("TEAM DISTRIBUTION VALIDATION")
            print(f"{'='*80}\n")
            
            expected = expected_distributions[sprint]
            actual = data['teams']
            
            all_match = True
            for team_name, expected_count in expected.items():
                actual_count = actual.get(team_name, {}).get('total', 0)
                match = "✓" if actual_count == expected_count else "✗"
                print(f"{match} {team_name}: Expected {expected_count}, Got {actual_count}")
                if actual_count != expected_count:
                    all_match = False
            
            # Check for unexpected teams
            for team_name in actual.keys():
                if team_name not in expected:
                    print(f"⚠ {team_name}: Unexpected team found with {actual[team_name]['total']} tests")
                    all_match = False
            
            if all_match:
                print(f"\n✓ Team distribution matches expected values!")
            else:
                print(f"\n✗ Team distribution DOES NOT match expected values!")
        
        # Save to JSON
        filename = f"qtest-testcases-sprint-{sprint}.json"
        save_to_json(data, filename)
        
        print("\n" + "="*80)
        print("NEXT STEPS:")
        print("="*80)
        print("1. Review the JSON file to verify the data")
        print("2. Update tad-ts-dashboard.html with this data")
        print("3. Or use this data to generate reports")

if __name__ == "__main__":
    main()
