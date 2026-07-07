# -*- coding: utf-8 -*-
import requests
import re
import sys
import os

if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
BITBUCKET_URL = os.environ.get("BITBUCKET_URL", "https://bitbucket.example.com")

# Get JIRA session
session = requests.Session()
session.headers.update({
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {JIRA_API_TOKEN}'
})

# Test Bitbucket PR fetch with JIRA session
pr_url = "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/unifiedui/pull-requests/836"

match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
project_key = match.group(1)
repo_slug = match.group(2)
pr_id = match.group(3)

api_url = f"{BITBUCKET_URL}/rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{pr_id}"
print(f"Fetching: {api_url}")

response = session.get(api_url, timeout=10)
print(f"\nStatus: {response.status_code}")

if response.ok:
    pr_data = response.json()
    print(f"\nPR Title: {pr_data.get('title', 'N/A')}")
    print(f"Description length: {len(pr_data.get('description', ''))} chars")
    print(f"\nDescription:\n{pr_data.get('description', 'No description')[:1000]}")
else:
    print(f"\nError: {response.text[:500]}")
