import requests
import re

BITBUCKET_URL = "https://bitbucket.wolterskluwer.io"
BITBUCKET_TOKEN = os.environ.get("JIRA_API_TOKEN", "")

pr_url = "https://bitbucket.wolterskluwer.io/projects/TYM/repos/unifiedui/pull-requests/836/overview"

# Parse URL
match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
if match:
    project_key = match.group(1)
    repo_slug = match.group(2)
    pr_id = match.group(3)
    
    print(f"Project: {project_key}")
    print(f"Repo: {repo_slug}")
    print(f"PR ID: {pr_id}")
    
    # Bitbucket REST API endpoint
    api_url = f"{BITBUCKET_URL}/rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{pr_id}"
    
    print(f"\nAPI URL: {api_url}")
    
    # Try using the same session approach as JIRA
    session = requests.Session()
    retry_strategy = requests.adapters.Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    # Try Bearer token auth
    session.headers.update({
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {BITBUCKET_TOKEN}'
    })
    
    response = session.get(api_url, timeout=10)
    print(f"\nStatus Code (Bearer): {response.status_code}")
    
    if not response.ok:
        # Try basic auth with token as password
        session2 = requests.Session()
        session2.headers.update({'Content-Type': 'application/json'})
        response = session2.get(api_url, auth=('', BITBUCKET_TOKEN), timeout=10)
        print(f"Status Code (Basic with empty user): {response.status_code}")
    
    if response.ok:
        pr_data = response.json()
        print(f"\nPR Title: {pr_data.get('title', 'N/A')}")
        print(f"PR Description length: {len(pr_data.get('description', ''))} chars")
        print(f"\nPR Description:\n{pr_data.get('description', 'No description')[:500]}")
    else:
        print(f"\nError: {response.text[:500]}")
