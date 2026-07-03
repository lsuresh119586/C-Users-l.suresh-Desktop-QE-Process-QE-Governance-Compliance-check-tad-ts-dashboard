import json
import sys
import importlib.util

# Load the analyze module
spec = importlib.util.spec_from_file_location("analyze_ts_quality", "analyze-ts-quality.py")
analyze_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyze_module)

get_session = analyze_module.get_session
get_issue_full_details = analyze_module.get_issue_full_details
extract_ts_content = analyze_module.extract_ts_content

session = get_session()
issue_keys = ['GET-64677', 'GET-64675', 'GET-64681', 'GET-64679']

for key in issue_keys:
    print(f'\n===== {key} =====')
    issue_data = get_issue_full_details(session, key)
    ts_content = extract_ts_content(session, key, issue_data)
    
    print(f'Source: {ts_content["source"]}')
    print(f'Content length: {len(ts_content["content"])} chars')
    print(f'Description length: {len(ts_content["description"])} chars')
    print(f'Comments: {len(ts_content["comments"])} items')
    
    if ts_content['content']:
        print(f'\nContent preview (first 500 chars):')
        print(ts_content['content'][:500])
    else:
        print('\nNo content found!')
