#!/usr/bin/env python3
import json
import sys

for sprint in ['26.1.1', '26.1.2', '26.1.3']:
    try:
        json_file = f'qtest-testcases-sprint-{sprint}.json'
        js_file = f'qtest-testcases-sprint-{sprint}.js'
        
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        with open(js_file, 'w') as f:
            var_name = f'qtestData_{sprint.replace(".", "_")}'
            f.write(f'window.{var_name} = ')
            json.dump(data, f)
            f.write(';')
        
        print(f'✓ Generated {js_file}')
    except Exception as e:
        print(f'✗ Error for {sprint}: {e}')
