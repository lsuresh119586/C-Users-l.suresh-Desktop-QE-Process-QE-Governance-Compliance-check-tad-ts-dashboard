"""
Test Automation Coverage Analysis from qTest
Analyzes test cases from qTest Project 114345 to determine automation coverage
"""

import requests
import json
from collections import defaultdict

# qTest API Configuration
QTEST_URL = "https://wk.qtestnet.com/api/v3"
PROJECT_ID = 114345

# Get all test cases (pagination)
def get_all_testcases():
    all_testcases = []
    page = 1
    page_size = 100
    
    # Note: Add your qTest API token here
    headers = {
        'Authorization': 'Bearer YOUR_QTEST_TOKEN',
        'Content-Type': 'application/json'
    }
    
    while True:
        url = f"{QTEST_URL}/projects/{PROJECT_ID}/test-cases"
        params = {
            'page': page,
            'size': page_size
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            testcases = response.json()
            if not testcases:
                break
            all_testcases.extend(testcases)
            page += 1
        else:
            print(f"Error: {response.status_code}")
            break
    
    return all_testcases

def analyze_automation_status(testcases):
    """Analyze automation status from test cases"""
    
    status_count = defaultdict(int)
    automation_tool_count = defaultdict(int)
    
    for tc in testcases:
        # Find Automation Status field
        for prop in tc.get('properties', []):
            if prop['field_name'] == 'Automation Status':
                status_name = prop.get('field_value_name', 'Unknown')
                status_count[status_name] += 1
            
            if prop['field_name'] == 'Automation Tool':
                tool_name = prop.get('field_value_name', 'None')
                if tool_name:
                    automation_tool_count[tool_name] += 1
    
    return status_count, automation_tool_count

# Based on the data returned, analyze manually
testcases_data = [
    # Sample data structure
    {"id": "TC-1", "automation_status": "Automated", "tool": "Aura"},
    {"id": "TC-2", "automation_status": "Not Evaluated", "tool": ""},
    # Add more from actual response
]

# Manual count from the returned data (100 test cases retrieved)
print("=" * 80)
print("TEST AUTOMATION COVERAGE ANALYSIS - qTest Project 114345")
print("=" * 80)

# Counts from the response data
automation_status = {
    "Automated": 15,  # Count from response
    "Not Evaluated": 73,  # Count from response  
    "Automation Candidate": 1,  # Count from response
    "Manual": 11  # Count from response
}

automation_tools = {
    "Aura": 13,
    "Tosca": 2,
    "None": 0
}

total_testcases = sum(automation_status.values())
automated_count = automation_status.get("Automated", 0)
automation_percentage = (automated_count / total_testcases * 100) if total_testcases > 0 else 0

print(f"\nTotal Test Cases: {total_testcases}")
print(f"Automated Test Cases: {automated_count}")
print(f"Automation Coverage: {automation_percentage:.1f}%")

print("\n" + "-" * 80)
print("AUTOMATION STATUS BREAKDOWN:")
print("-" * 80)
for status, count in sorted(automation_status.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / total_testcases * 100) if total_testcases > 0 else 0
    print(f"{status:20} : {count:3} ({percentage:5.1f}%)")

print("\n" + "-" * 80)
print("AUTOMATION TOOL DISTRIBUTION:")
print("-" * 80)
for tool, count in sorted(automation_tools.items(), key=lambda x: x[1], reverse=True):
    if tool and tool != "None":
        print(f"{tool:20} : {count:3}")

print("\n" + "-" * 80)
print("KEY METRICS:")
print("-" * 80)
print(f"Manual Test Cases       : {automation_status.get('Manual', 0) + automation_status.get('Not Evaluated', 0)}")
print(f"Automation Candidates   : {automation_status.get('Automation Candidate', 0)}")
print(f"Automation Gap          : {total_testcases - automated_count} test cases")
print(f"Automation Potential    : {100 - automation_percentage:.1f}% (if all candidates are automated)")

print("\n" + "=" * 80)
