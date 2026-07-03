#!/usr/bin/env python3
"""
Generate standalone HTML report from Test Strategy Quality Analysis
"""

import re
from datetime import datetime

def markdown_to_html(md_file):
    """Convert markdown report to standalone HTML"""
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract report metadata
    sprint_match = re.search(r'\*\*Sprint:\*\* (.+?)  ', content)
    generated_match = re.search(r'\*\*Generated:\*\* (.+?)  ', content)
    
    sprint = sprint_match.group(1) if sprint_match else 'N/A'
    generated = generated_match.group(1) if generated_match else datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Convert markdown to HTML
    html_content = content
    
    # Headers
    html_content = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html_content, flags=re.MULTILINE)
    html_content = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html_content, flags=re.MULTILINE)
    html_content = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html_content, flags=re.MULTILINE)
    
    # Bold text
    html_content = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html_content)
    
    # Code blocks
    html_content = re.sub(r'```gherkin\n(.+?)\n```', r'<pre class="gherkin"><code>\1</code></pre>', html_content, flags=re.DOTALL)
    html_content = re.sub(r'```(.+?)```', r'<pre><code>\1</code></pre>', html_content, flags=re.DOTALL)
    
    # Tables
    def convert_table(match):
        table_text = match.group(0)
        lines = table_text.strip().split('\n')
        
        if len(lines) < 3:
            return match.group(0)
        
        html = '<table class="data-table">\n'
        
        # Header
        headers = [h.strip() for h in lines[0].split('|')[1:-1]]
        html += '<thead><tr>\n'
        for header in headers:
            html += f'<th>{header}</th>\n'
        html += '</tr></thead>\n<tbody>\n'
        
        # Rows (skip separator line)
        for line in lines[2:]:
            cells = [c.strip() for c in line.split('|')[1:-1]]
            html += '<tr>\n'
            for cell in cells:
                html += f'<td>{cell}</td>\n'
            html += '</tr>\n'
        
        html += '</tbody>\n</table>\n'
        return html
    
    html_content = re.sub(r'^\|.+\|$\n^\|[-: ]+\|$\n(?:^\|.+\|$\n?)+', convert_table, html_content, flags=re.MULTILINE)
    
    # Lists
    html_content = re.sub(r'^- (.+)$', r'<li>\1</li>', html_content, flags=re.MULTILINE)
    html_content = re.sub(r'(<li>.+</li>\n)+', r'<ul>\n\g<0></ul>\n', html_content)
    
    # Horizontal rules
    html_content = re.sub(r'^---$', r'<hr>', html_content, flags=re.MULTILINE)
    
    # Paragraphs
    html_content = re.sub(r'\n\n', '</p>\n<p>', html_content)
    html_content = '<p>' + html_content + '</p>'
    
    # Generate full HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Strategy Quality Analysis - {sprint}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
        }}
        
        h1 {{
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 20px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        h2 {{
            color: #764ba2;
            font-size: 1.8em;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }}
        
        h3 {{
            color: #667eea;
            font-size: 1.3em;
            margin: 30px 0 15px 0;
            padding: 10px;
            background: #f8f9ff;
            border-left: 4px solid #667eea;
        }}
        
        .metadata {{
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 10px;
        }}
        
        .metadata strong {{
            color: #667eea;
        }}
        
        table.data-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }}
        
        table.data-table thead {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        
        table.data-table th {{
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
        }}
        
        table.data-table td {{
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        table.data-table tbody tr:hover {{
            background: #f8f9ff;
            transition: background 0.3s;
        }}
        
        table.data-table tbody tr:last-child td {{
            border-bottom: none;
        }}
        
        pre {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }}
        
        pre.gherkin {{
            background: #1e1e1e;
            border-left: 4px solid #4CAF50;
        }}
        
        pre code {{
            font-family: 'Courier New', Consolas, Monaco, monospace;
            font-size: 0.9em;
            line-height: 1.5;
        }}
        
        ul {{
            margin: 15px 0 15px 30px;
        }}
        
        li {{
            margin: 8px 0;
            line-height: 1.6;
        }}
        
        hr {{
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 40px 0;
        }}
        
        p {{
            margin: 10px 0;
            line-height: 1.8;
        }}
        
        .critical-gap {{
            color: #d32f2f;
            font-weight: bold;
        }}
        
        .high-priority {{
            color: #f57c00;
            font-weight: bold;
        }}
        
        .medium-priority {{
            color: #fbc02d;
            font-weight: bold;
        }}
        
        .low-priority {{
            color: #388e3c;
            font-weight: bold;
        }}
        
        .summary-box {{
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-left: 5px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }}
        
        .recommendation-box {{
            background: #fff3e0;
            border-left: 5px solid #ff9800;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }}
        
        .print-button {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s;
            z-index: 1000;
        }}
        
        .print-button:hover {{
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            
            .container {{
                box-shadow: none;
                padding: 20px;
            }}
            
            .print-button {{
                display: none;
            }}
            
            h2 {{
                page-break-before: always;
            }}
            
            h2:first-of-type {{
                page-break-before: avoid;
            }}
            
            table, pre {{
                page-break-inside: avoid;
            }}
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 20px;
            }}
            
            h1 {{
                font-size: 1.8em;
            }}
            
            h2 {{
                font-size: 1.4em;
            }}
            
            table.data-table {{
                font-size: 0.8em;
            }}
            
            table.data-table th, table.data-table td {{
                padding: 8px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Test Strategy Quality Analysis Report</h1>
        
        <div class="metadata">
            <p><strong>Sprint:</strong> {sprint}</p>
            <p><strong>Generated:</strong> {generated}</p>
            <p><strong>Analysis Type:</strong> Comprehensive 8-Category Testing Assessment</p>
        </div>
        
        {html_content}
    </div>
    
    <button class="print-button" onclick="window.print()">📄 Export to PDF</button>
    
    <script>
        // Add color coding to priority levels
        document.addEventListener('DOMContentLoaded', function() {{
            document.querySelectorAll('td, li, p').forEach(function(el) {{
                let text = el.textContent;
                if (text.includes('Critical Gap')) {{
                    el.classList.add('critical-gap');
                }} else if (text.includes('High Priority')) {{
                    el.classList.add('high-priority');
                }} else if (text.includes('Medium Priority')) {{
                    el.classList.add('medium-priority');
                }} else if (text.includes('Low Priority')) {{
                    el.classList.add('low-priority');
                }}
            }});
            
            // Add summary boxes
            document.querySelectorAll('h2').forEach(function(h2) {{
                if (h2.textContent.includes('Executive Summary')) {{
                    let nextElement = h2.nextElementSibling;
                    while (nextElement && nextElement.tagName !== 'H2') {{
                        nextElement.classList.add('summary-box');
                        nextElement = nextElement.nextElementSibling;
                    }}
                }}
                
                if (h2.textContent.includes('Recommendations')) {{
                    let nextElement = h2.nextElementSibling;
                    while (nextElement && nextElement.tagName !== 'H2') {{
                        nextElement.classList.add('recommendation-box');
                        nextElement = nextElement.nextElementSibling;
                    }}
                }}
            }});
        }});
    </script>
</body>
</html>"""
    
    return html

def main():
    import os
    import glob
    
    # Find the latest TS quality analysis report
    reports = glob.glob('ts_quality_analysis_*.md')
    
    if not reports:
        print("❌ No TS quality analysis reports found")
        print("   Run: python analyze-ts-quality.py first")
        return
    
    # Get the latest report
    latest_report = max(reports, key=os.path.getctime)
    
    print(f"\n{'='*80}")
    print(f"GENERATING HTML REPORT")
    print(f"{'='*80}\n")
    print(f"📄 Source: {latest_report}")
    
    # Generate HTML
    html = markdown_to_html(latest_report)
    
    # Save HTML file
    html_file = latest_report.replace('.md', '.html')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    file_size = os.path.getsize(html_file) / 1024
    
    print(f"\n{'='*80}")
    print(f"✅ HTML Report Generated!")
    print(f"{'='*80}")
    print(f"📊 File: {html_file}")
    print(f"💾 Size: {file_size:.1f} KB")
    print(f"\n📤 Share Options:")
    print(f"   1. Email as attachment (< 1 MB)")
    print(f"   2. Upload to SharePoint/OneDrive")
    print(f"   3. Share via Teams/Slack")
    print(f"   4. Export to PDF (open in browser and print)")
    print(f"\n🌐 To view: Open {html_file} in your browser")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
