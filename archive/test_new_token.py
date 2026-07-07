# -*- coding: utf-8 -*-
import requests
import sys
import os

if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BITBUCKET_URL = os.environ.get("BITBUCKET_URL", "https://bitbucket.example.com")
BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")
USERNAME = "l.suresh"  # Try with your username

# Test PR access with new token
pr_url = "os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/tymetrix360core/pull-requests/5361"
api_url = f"{BITBUCKET_URL}/rest/api/1.0/projects/TYM/repos/tymetrix360core/pull-requests/5361"

print(f"Testing Bitbucket Token Access")
print("=" * 60)
print(f"API URL: {api_url}\n")

# Try Bearer token
print("Method 1: Bearer Token")
session1 = requests.Session()
session1.headers.update({
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {BITBUCKET_TOKEN}'
})
response = session1.get(api_url, timeout=10)
print(f"Status Code: {response.status_code}")

if not response.ok:
    print(f"❌ Bearer failed: {response.text[:100]}\n")
    
    # Try Basic Auth with token as password
    print("Method 2: Basic Auth (username=token, password=empty)")
    session2 = requests.Session()
    session2.headers.update({'Content-Type': 'application/json'})
    response = session2.get(api_url, auth=(BITBUCKET_TOKEN, ''), timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if not response.ok:
        print(f"❌ Basic auth (user=token) failed: {response.text[:100]}\n")
        
        # Try with username and token
        print(f"Method 3: Basic Auth (username={USERNAME}, password=token)")
        session3 = requests.Session()
        session3.headers.update({'Content-Type': 'application/json'})
        response = session3.get(api_url, auth=(USERNAME, BITBUCKET_TOKEN), timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if not response.ok:
            print(f"❌ Failed: {response.text[:100]}\n")
            
            # Try HTTP Access Token format  
            print("Method 4: Basic Auth (username=x-token-auth, password=token)")
            session4 = requests.Session()
            session4.headers.update({'Content-Type': 'application/json'})
            response = session4.get(api_url, auth=('x-token-auth', BITBUCKET_TOKEN), timeout=10)
            print(f"Status Code: {response.status_code}")

if response.ok:
    print("✅ SUCCESS! Token works!")
    pr_data = response.json()
    
    print(f"\nPR Title: {pr_data.get('title', 'N/A')}")
    print(f"PR State: {pr_data.get('state', 'N/A')}")
    print(f"PR Author: {pr_data.get('author', {}).get('user', {}).get('displayName', 'N/A')}")
    
    description = pr_data.get('description', '')
    print(f"\nDescription Length: {len(description)} chars")
    print(f"\nDescription Preview (first 1000 chars):")
    print("=" * 60)
    print(description[:1000])
    print("=" * 60)
    
    # Try to get activities/comments
    activities_url = f"{api_url}/activities"
    activities_response = session.get(activities_url, timeout=10)
    if activities_response.ok:
        activities = activities_response.json().get('values', [])
        print(f"\n✅ Found {len(activities)} activities/comments")
        
        comment_count = 0
        for activity in activities[:5]:
            if activity.get('action') == 'COMMENTED':
                comment_text = activity.get('comment', {}).get('text', '')
                if comment_text:
                    comment_count += 1
                    print(f"\nComment {comment_count}: {comment_text[:200]}...")
    
else:
    print(f"❌ FAILED!")
    print(f"Error: {response.text[:500]}")
