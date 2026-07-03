#!/usr/bin/env python3
"""Create standalone HTML for specific sprint"""

import json

# Read the current dashboard HTML
with open('sprint-26.1.1-management-dashboard.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Read the data JS file
with open('tad-ts-report-data.js', 'r', encoding='utf-8') as f:
    data_content = f.read()

# Remove the external script tag and embed data directly
html_content = html_content.replace(
    '<script src="tad-ts-report-data.js"></script>',
    f'<script>\n{data_content}\n</script>'
)

# Write standalone version
output_file = 'sprint-26.1.1-standalone.html'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"✅ Created standalone HTML: {output_file}")
print(f"   This file contains all data embedded - ready to share!")
print(f"   File size: {len(html_content) / 1024:.1f} KB")
print()
print("📤 Share this file with your team:")
print(f"   - Email as attachment")
print(f"   - Upload to SharePoint/OneDrive")
print(f"   - Share via Teams/Slack")
print(f"   - No additional files needed!")
