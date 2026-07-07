# -*- coding: utf-8 -*-
import requests
import sys
import os

if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
BITBUCKET_URL = os.environ.get("BITBUCKET_URL", "https://bitbucket.example.com")

# Try to access the specific PR
pr_url = "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/tymetrix360core/pull-requests/5361/overview"
api_url = "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/rest/"  # api/1.0/projects/TYM/repos/tymetrix360core/pull-requests/5361"

print(f"Attempting to access: {pr_url}\n")
print(f"API URL: {api_url}\n")

# Method 1: Using JIRA session with Bearer token
print("=" * 60)
print("Method 1: Bearer Token from JIRA")
print("=" * 60)
session1 = requests.Session()
session1.headers.update({
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {JIRA_API_TOKEN}'
})
response1 = session1.get(api_url, timeout=10)
print(f"Status Code: {response1.status_code}")
if response1.ok:
    pr_data = response1.json()
    print(f"✅ SUCCESS!")
    print(f"PR Title: {pr_data.get('title', 'N/A')}")
    print(f"PR Description: {pr_data.get('description', 'N/A')[:500]}")
else:
    print(f"❌ Failed: {response1.text[:200]}")

# Method 2: Try basic auth with empty username
print("\n" + "=" * 60)
print("Method 2: Basic Auth (empty user)")
print("=" * 60)
session2 = requests.Session()
session2.headers.update({'Content-Type': 'application/json'})
response2 = session2.get(api_url, auth=('', JIRA_API_TOKEN), timeout=10)
print(f"Status Code: {response2.status_code}")
if response2.ok:
    pr_data = response2.json()
    print(f"✅ SUCCESS!")
    print(f"PR Title: {pr_data.get('title', 'N/A')}")
    print(f"PR Description: {pr_data.get('description', 'N/A')[:500]}")
else:
    print(f"❌ Failed: {response2.text[:200]}")

# Method 3: Try accessing the web page directly (might get HTML)
print("\n" + "=" * 60)
print("Method 3: Direct Web Page Access")
print("=" * 60)
session3 = requests.Session()
session3.headers.update({
    'Authorization': f'Bearer {JIRA_API_TOKEN}',
    'User-Agent': 'Mozilla/5.0'
})
response3 = session3.get(pr_url, timeout=10)
print(f"Status Code: {response3.status_code}")
if response3.ok:
    print(f"✅ Got response (length: {len(response3.text)} chars)")
    print(f"Content preview: {response3.text[:500]}")
else:
    print(f"❌ Failed: {response3.text[:200]}")

print("\n" + "=" * 60)
print("Summary")
print("=" * 60)
if any(r.ok for r in [response1, response2, response3]):
    print("✅ At least one method worked!")
else:
    print("❌ All methods failed - Bitbucket requires separate authentication")
    print("\nPossible solutions:")
    print("1. Generate a Bitbucket Personal Access Token")
    print("2. Document test strategies inline in JIRA")
    print("3. Use SSO/session cookies from browser")
