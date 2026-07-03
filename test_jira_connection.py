import requests
import os
from pathlib import Path

# Load env
env_path = Path(__file__).parent / '.env'
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ[key.strip()] = value.strip()

session = requests.Session()
session.headers.update({
    'Authorization': f'Bearer {os.environ["JIRA_API_TOKEN"]}',
    'Content-Type': 'application/json'
})

try:
    r = session.post(
        'https://jira.wolterskluwer.io/jira/rest/api/2/search',
        json={'jql': 'project=GET AND sprint="T360 Vanguards-26.1.1"', 'maxResults': 1},
        timeout=60
    )
    print(f'Status: {r.status_code}')
    if r.ok:
        print(f'Total issues in sprint: {r.json()["total"]}')
    else:
        print(f'Error: {r.text[:500]}')
except Exception as e:
    print(f'Exception: {type(e).__name__}: {e}')
