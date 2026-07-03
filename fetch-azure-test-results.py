#!/usr/bin/env python3
"""
Fetch Test Results from Azure DevOps
Retrieves test run results from Azure DevOps pipelines
"""

import requests
import json
import sys
from datetime import datetime
from collections import defaultdict
import base64

# Azure DevOps Configuration
AZURE_ORG = "GRC-ELM"
AZURE_PROJECT = "T360"
AZURE_PAT = os.environ.get("AZURE_DEVOPS_PAT", "")

def get_headers():
    """Get API headers with authentication"""
    # Azure DevOps uses Basic Auth with PAT as password
    auth_string = f":{AZURE_PAT}"
    encoded = base64.b64encode(auth_string.encode()).decode()
    
    return {
        'Authorization': f'Basic {encoded}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

def get_build_details(build_id):
    """Get build information"""
    url = f"https://dev.azure.com/{AZURE_ORG}/{AZURE_PROJECT}/_apis/build/builds/{build_id}?api-version=7.1"
    
    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching build details: {e}")
        return None

def get_test_runs_for_build(build_id):
    """Get all test runs associated with a build"""
    url = f"https://dev.azure.com/{AZURE_ORG}/{AZURE_PROJECT}/_apis/test/runs?buildIds={build_id}&api-version=7.1"
    
    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching test runs: {e}")
        return []

def get_test_results(run_id):
    """Get test results for a specific test run"""
    url = f"https://dev.azure.com/{AZURE_ORG}/{AZURE_PROJECT}/_apis/test/runs/{run_id}/results?api-version=7.1"
    
    try:
        response = requests.get(url, headers=get_headers())
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching test results for run {run_id}: {e}")
        return []

def analyze_test_results(build_id):
    """Analyze test results from Azure DevOps build"""
    
    print(f"\n{'='*80}")
    print(f"Fetching Test Results from Azure DevOps")
    print(f"Organization: {AZURE_ORG}")
    print(f"Project: {AZURE_PROJECT}")
    print(f"Build ID: {build_id}")
    print(f"{'='*80}\n")
    
    # Get build details
    build = get_build_details(build_id)
    if not build:
        print("Error: Could not fetch build details")
        return None
    
    print(f"Build: {build.get('buildNumber')} - {build.get('status')}")
    print(f"Branch: {build.get('sourceBranch', 'N/A')}")
    print(f"Started: {build.get('startTime', 'N/A')}")
    print(f"Completed: {build.get('finishTime', 'N/A')}\n")
    
    # Get test runs
    test_runs = get_test_runs_for_build(build_id)
    if not test_runs:
        print("No test runs found for this build")
        return None
    
    print(f"Found {len(test_runs)} test run(s)\n")
    
    all_results = []
    totals = {
        'total': 0,
        'passed': 0,
        'failed': 0,
        'not_executed': 0,
        'skipped': 0
    }
    
    for run in test_runs:
        run_id = run.get('id')
        run_name = run.get('name', 'Unknown')
        
        print(f"Processing: {run_name} (Run ID: {run_id})")
        print(f"  State: {run.get('state')}")
        print(f"  Total Tests: {run.get('totalTests', 0)}")
        print(f"  Passed: {run.get('passedTests', 0)}")
        print(f"  Failed: {run.get('unanalyzedTests', 0)}")
        
        # Get detailed results
        results = get_test_results(run_id)
        print(f"  Retrieved {len(results)} detailed test results\n")
        
        for result in results:
            outcome = result.get('outcome', 'Unknown')
            totals['total'] += 1
            
            if outcome == 'Passed':
                totals['passed'] += 1
            elif outcome == 'Failed':
                totals['failed'] += 1
            elif outcome == 'NotExecuted':
                totals['not_executed'] += 1
            else:
                totals['skipped'] += 1
            
            all_results.append({
                'test_name': result.get('testCaseTitle', 'Unknown'),
                'outcome': outcome,
                'duration': result.get('durationInMs', 0),
                'error_message': result.get('errorMessage', ''),
                'run_name': run_name,
                'automated_test_name': result.get('automatedTestName', ''),
                'owner': result.get('owner', {}).get('displayName', 'Unknown')
            })
    
    result_data = {
        'build_id': build_id,
        'build_number': build.get('buildNumber'),
        'build_status': build.get('status'),
        'branch': build.get('sourceBranch'),
        'generated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'totals': totals,
        'test_runs': [{
            'id': run.get('id'),
            'name': run.get('name'),
            'state': run.get('state'),
            'total_tests': run.get('totalTests', 0),
            'passed_tests': run.get('passedTests', 0)
        } for run in test_runs],
        'test_results': all_results
    }
    
    return result_data

def print_summary(data):
    """Print a summary of test results"""
    if not data:
        return
    
    print(f"\n{'='*80}")
    print(f"TEST RESULTS SUMMARY - Build {data['build_number']}")
    print(f"Generated: {data['generated']}")
    print(f"{'='*80}\n")
    
    totals = data['totals']
    print(f"Total Tests: {totals['total']}")
    print(f"  ✓ Passed: {totals['passed']} ({totals['passed']/totals['total']*100:.1f}%)")
    print(f"  ✗ Failed: {totals['failed']} ({totals['failed']/totals['total']*100:.1f}%)")
    print(f"  ○ Not Executed: {totals['not_executed']}")
    print(f"  ⊘ Skipped: {totals['skipped']}")
    
    if totals['failed'] > 0:
        print(f"\nFailed Tests:")
        failed = [r for r in data['test_results'] if r['outcome'] == 'Failed']
        for test in failed[:10]:  # Show first 10 failures
            print(f"  - {test['test_name']}")
            if test['error_message']:
                error_preview = test['error_message'][:100]
                print(f"    Error: {error_preview}...")

def save_to_json(data, filename):
    """Save test results to JSON file"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nData saved to: {filename}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch-azure-test-results.py <build_id>")
        print("Example: python fetch-azure-test-results.py 860815")
        sys.exit(1)
    
    build_id = sys.argv[1]
    
    # Fetch and analyze test results
    data = analyze_test_results(build_id)
    
    if data:
        # Print summary
        print_summary(data)
        
        # Save to JSON
        filename = f"azure-test-results-build-{build_id}.json"
        save_to_json(data, filename)
        
        # Also save as JS for dashboard
        js_filename = f"azure-test-results-build-{build_id}.js"
        with open(js_filename, 'w') as f:
            f.write(f'window.azureTestResults_{build_id} = ')
            f.write(json.dumps(data, indent=2))
            f.write(';')
        print(f"JS file saved to: {js_filename}")
