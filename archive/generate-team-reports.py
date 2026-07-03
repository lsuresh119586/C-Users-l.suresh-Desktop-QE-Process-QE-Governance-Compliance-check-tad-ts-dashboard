#!/usr/bin/env python3
"""
Generate individual team reports from Test Strategy Quality Analysis
Creates 6 separate HTML reports, one for each team
"""

import json
import re
from datetime import datetime

def generate_team_html(team_name, team_stories, sprint, generated, testing_categories):
    """Generate HTML report for a specific team"""
    
    # Calculate team statistics
    total_stories = len(team_stories)
    stories_with_ts = sum(1 for s in team_stories if s['ts_found'])
    stories_analyzed = sum(1 for s in team_stories if s['category_scores'])
    
    # Rating distribution
    rating_counts = {}
    for story in team_stories:
        if story['overall_rating'] != 'N/A':
            rating_counts[story['overall_rating']] = rating_counts.get(story['overall_rating'], 0) + 1
    
    # Average score
    avg_score = 0
    if stories_analyzed > 0:
        avg_score = sum(s['overall_score'] for s in team_stories if s['overall_score'] > 0) / stories_analyzed
    
    # Generate story details HTML
    stories_html = ""
    for idx, story in enumerate(team_stories, 1):
        stories_html += f"""
        <div class="story-card">
            <h3>{idx}. {story['key']}: {story['summary'][:100]}</h3>
            
            <div class="story-metadata">
                <span class="badge">Status: {story['status']}</span>
                <span class="badge {'ts-found' if story['ts_found'] else 'ts-missing'}">
                    {'✅ TS Found' if story['ts_found'] else '❌ No TS'}
                </span>
                {f"<span class='badge'>Source: {story['ts_content']['source']}</span>" if story['ts_content'].get('source') else ''}
            </div>
            
            <div class="score-display">
                <div class="score-circle" data-score="{story['overall_score']:.0f}">
                    <div class="score-text">{story['overall_score']:.1f}%</div>
                    <div class="score-label">{story['overall_rating']}</div>
                </div>
            </div>
"""
        
        if not story['ts_found']:
            stories_html += """
            <div class="alert alert-danger">
                <strong>⚠️ No test strategy found</strong>
                <p>Recommendation: Create comprehensive test strategy covering all 8 testing categories.</p>
            </div>
"""
        elif not story['category_scores']:
            stories_html += """
            <div class="alert alert-warning">
                <strong>⚠️ No TS content available for analysis</strong>
                <p>Recommendation: Ensure test strategy is accessible via PR, description, or comments.</p>
            </div>
"""
        else:
            # Category breakdown table
            stories_html += """
            <div class="category-table-container">
                <h4>Testing Category Coverage</h4>
                <table class="category-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Score</th>
                            <th>Coverage</th>
                            <th>Priority</th>
                            <th>Keywords Found</th>
                        </tr>
                    </thead>
                    <tbody>
"""
            
            for category, analysis in story['category_scores'].items():
                priority_class = f"priority-{analysis['priority'].lower().replace(' ', '-')}"
                keywords_preview = ', '.join(analysis['keywords_found'][:3])
                if len(analysis['keywords_found']) > 3:
                    keywords_preview += '...'
                
                stories_html += f"""
                        <tr>
                            <td><strong>{category}</strong></td>
                            <td><span class="score-badge {analysis['score'].lower().replace(' ', '-')}">{analysis['score']}</span></td>
                            <td>{analysis['coverage']:.0f}% ({analysis['matches']}/{analysis['total_keywords']})</td>
                            <td><span class="{priority_class}">{analysis['priority']}</span></td>
                            <td class="keywords">{keywords_preview}</td>
                        </tr>
"""
            
            stories_html += """
                    </tbody>
                </table>
            </div>
"""
            
            # Critical gaps
            critical_gaps = [cat for cat, analysis in story['category_scores'].items() 
                           if analysis['priority'] in ['Critical', 'High']]
            
            if critical_gaps:
                stories_html += f"""
            <div class="gaps-section">
                <h4>⚠️ Critical & High Priority Gaps ({len(critical_gaps)} categories)</h4>
                <div class="gaps-list">
"""
                
                for category in critical_gaps[:5]:  # Show top 5 gaps
                    analysis = story['category_scores'][category]
                    stories_html += f"""
                    <div class="gap-item">
                        <strong>{category}</strong> ({analysis['score']})
                        <ul>
"""
                    # Show missing criteria
                    for criterion in testing_categories[category]['criteria']:
                        stories_html += f"<li>{criterion}</li>\n"
                    
                    stories_html += """
                        </ul>
                        
                        <div class="bdd-scenarios">
                            <strong>📝 Suggested BDD Scenarios:</strong>
                            <pre class="gherkin">"""
                    
                    # Generate BDD scenarios based on category
                    feature_name = story['summary'][:60]
                    
                    if category == "Positive Testing":
                        stories_html += f"""Feature: {feature_name}

  Scenario: Valid Input - Happy Path Flow
    Given user has valid credentials and permissions
    When user enters all required valid inputs
    Then system should accept the data
    And successfully complete the operation
    And display success confirmation message

  Scenario: All Acceptance Criteria Validated
    Given system is in ready state
    When user completes the workflow as per acceptance criteria
    Then all expected results should be achieved
    And data should be persisted correctly"""
                    
                    elif category == "Negative Testing":
                        stories_html += f"""Feature: {feature_name}

  Scenario: Invalid Input Handling
    Given user is on the input form
    When user enters invalid data (null, empty, special chars, wrong format)
    Then system should display appropriate error message
    And prevent submission with invalid data
    And highlight the problematic fields

  Scenario: Unauthorized Access Prevention
    Given user without proper permissions
    When user attempts to access restricted resource
    Then system should deny access with 403 error
    And log the unauthorized access attempt
    And redirect to appropriate error page"""
                    
                    elif category == "Boundary Value Testing":
                        stories_html += f"""Feature: {feature_name}

  Scenario: Minimum Boundary Values
    Given input field with minimum limit
    When user enters min-1, min, min+1 values
    Then system should reject min-1
    And accept min and min+1 values
    And display appropriate messages

  Scenario: Maximum Boundary Values
    Given input field with maximum limit
    When user enters max-1, max, max+1 values
    Then system should accept max-1 and max
    And reject max+1 value
    And display field limit error

  Scenario: Null and Empty Values
    Given required and optional input fields
    When user submits with null/empty values
    Then system should validate required fields
    And allow empty optional fields"""
                    
                    elif category == "Edge Case Testing":
                        stories_html += f"""Feature: {feature_name}

  Scenario: Concurrent User Operations
    Given multiple users accessing same resource
    When users perform simultaneous updates
    Then system should handle race conditions
    And maintain data consistency
    And prevent data corruption

  Scenario: Unusual Input Combinations
    Given system accepts multiple input types
    When user provides unusual but valid combinations
    Then system should process correctly
    And handle edge cases gracefully"""
                    
                    elif category == "Browser Compatibility":
                        stories_html += f"""Feature: {feature_name}

  Scenario: Chrome Browser Compatibility
    Given Chrome latest version and previous version
    When user accesses the application
    Then all features should work correctly
    And UI should render properly
    And no console errors

  Scenario: Firefox Browser Compatibility
    Given Firefox latest version and previous version
    When user accesses the application
    Then all features should work correctly
    And UI should render properly
    And no console errors"""
                    
                    elif category == "Other Testing":
                        stories_html += f"""Feature: {feature_name}

  Scenario: End-to-End Integration Testing
    Given system integrated with external services
    When user performs cross-module workflow
    Then all system components should work together
    And data should flow correctly across systems

  Scenario: Usability Testing
    Given new user accessing the system
    When user navigates through the interface
    Then UI should be intuitive and user-friendly
    And help/guidance should be available

  Scenario: Data Integrity
    Given data operations across the system
    When user creates/updates/deletes records
    Then data consistency should be maintained
    And referential integrity preserved

  Scenario: Regression Testing
    Given existing functionality
    When new changes are deployed
    Then existing features should not break
    And all previous test cases should pass"""
                    
                    stories_html += """
                            </pre>
                        </div>
                    </div>
"""
                
                stories_html += """
                </div>
            </div>
"""
            
            # Recommendations
            stories_html += """
            <div class="recommendations">
                <h4>💡 Recommendations</h4>
"""
            
            if story['overall_score'] >= 80:
                stories_html += "<p class='rec-excellent'>✅ Excellent test strategy! Minor enhancements only.</p>"
            elif story['overall_score'] >= 60:
                stories_html += "<p class='rec-good'>👍 Good coverage. Focus on addressing high-priority gaps.</p>"
            elif story['overall_score'] >= 40:
                stories_html += "<p class='rec-fair'>⚠️ Fair coverage. Significant improvements needed in multiple categories.</p>"
            else:
                stories_html += "<p class='rec-critical'>🚨 Critical gaps identified. Comprehensive test strategy revision required.</p>"
            
            stories_html += f"""
                <p><strong>Effort Estimate:</strong> {'Low (1-2 days)' if story['overall_score'] >= 80 else 'Medium (3-5 days)' if story['overall_score'] >= 60 else 'High (5-10 days)'}</p>
            </div>
"""
        
        stories_html += """
        </div>
"""
    
    # Generate full HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Strategy Quality - {team_name}</title>
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
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        h1 {{
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .team-name {{
            font-size: 1.5em;
            color: #764ba2;
            font-weight: 600;
        }}
        
        .metadata {{
            background: #f8f9ff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }}
        
        .metadata-item {{
            text-align: center;
        }}
        
        .metadata-label {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 5px;
        }}
        
        .metadata-value {{
            color: #667eea;
            font-size: 1.5em;
            font-weight: 700;
        }}
        
        .summary-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .stat-card {{
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #667eea30;
        }}
        
        .stat-card h3 {{
            color: #667eea;
            font-size: 2em;
            margin-bottom: 5px;
        }}
        
        .stat-card p {{
            color: #666;
            font-size: 0.9em;
        }}
        
        .story-card {{
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }}
        
        .story-card:hover {{
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
            border-color: #667eea;
        }}
        
        .story-card h3 {{
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
        }}
        
        .story-metadata {{
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }}
        
        .badge {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            background: #f0f0f0;
            color: #666;
        }}
        
        .badge.ts-found {{
            background: #e8f5e9;
            color: #2e7d32;
        }}
        
        .badge.ts-missing {{
            background: #ffebee;
            color: #c62828;
        }}
        
        .score-display {{
            text-align: center;
            margin: 20px 0;
        }}
        
        .score-circle {{
            display: inline-block;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: conic-gradient(
                #667eea 0deg,
                #667eea calc(var(--score) * 3.6deg),
                #e0e0e0 calc(var(--score) * 3.6deg)
            );
            padding: 10px;
        }}
        
        .score-circle::before {{
            content: '';
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: white;
        }}
        
        .score-text {{
            position: relative;
            top: -125px;
            font-size: 2em;
            font-weight: 700;
            color: #667eea;
        }}
        
        .score-label {{
            position: relative;
            top: -120px;
            font-size: 0.9em;
            color: #666;
            font-weight: 600;
        }}
        
        .category-table-container {{
            margin: 20px 0;
        }}
        
        .category-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}
        
        .category-table th {{
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        
        .category-table td {{
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        .category-table tbody tr:hover {{
            background: #f8f9ff;
        }}
        
        .score-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-weight: 600;
            font-size: 0.85em;
        }}
        
        .score-badge.good {{
            background: #e8f5e9;
            color: #2e7d32;
        }}
        
        .score-badge.fair {{
            background: #fff3e0;
            color: #f57c00;
        }}
        
        .score-badge.poor {{
            background: #ffebee;
            color: #c62828;
        }}
        
        .score-badge.critical-gap {{
            background: #d32f2f;
            color: white;
        }}
        
        .priority-critical {{
            color: #d32f2f;
            font-weight: 700;
        }}
        
        .priority-high {{
            color: #f57c00;
            font-weight: 700;
        }}
        
        .priority-medium {{
            color: #fbc02d;
            font-weight: 600;
        }}
        
        .priority-low {{
            color: #388e3c;
            font-weight: 600;
        }}
        
        .keywords {{
            color: #666;
            font-size: 0.9em;
        }}
        
        .alert {{
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        
        .alert-danger {{
            background: #ffebee;
            border-left: 4px solid #d32f2f;
            color: #c62828;
        }}
        
        .alert-warning {{
            background: #fff3e0;
            border-left: 4px solid #f57c00;
            color: #e65100;
        }}
        
        .gaps-section {{
            background: #fff3e0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        
        .gaps-section h4 {{
            color: #e65100;
            margin-bottom: 15px;
        }}
        
        .gap-item {{
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 10px;
        }}
        
        .gap-item ul {{
            margin-top: 10px;
            margin-left: 20px;
        }}
        
        .gap-item li {{
            color: #666;
            margin: 5px 0;
        }}
        
        .bdd-scenarios {{
            margin-top: 15px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 3px solid #667eea;
        }}
        
        .bdd-scenarios strong {{
            color: #667eea;
            display: block;
            margin-bottom: 10px;
        }}
        
        .bdd-scenarios pre.gherkin {{
            background: #2d2d2d;
            color: #a9dc76;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Courier New', Consolas, Monaco, monospace;
            font-size: 0.85em;
            line-height: 1.6;
            margin: 0;
        }}
        
        .recommendations {{
            background: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        
        .recommendations h4 {{
            color: #2e7d32;
            margin-bottom: 10px;
        }}
        
        .rec-excellent {{ color: #2e7d32; }}
        .rec-good {{ color: #388e3c; }}
        .rec-fair {{ color: #f57c00; }}
        .rec-critical {{ color: #d32f2f; }}
        
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
            }}
            
            .print-button {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Test Strategy Quality Analysis</h1>
            <div class="team-name">{team_name}</div>
        </div>
        
        <div class="metadata">
            <div class="metadata-item">
                <div class="metadata-label">Sprint</div>
                <div class="metadata-value">{sprint}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Generated</div>
                <div class="metadata-value">{generated.split()[0]}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Total Stories</div>
                <div class="metadata-value">{total_stories}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">With TS</div>
                <div class="metadata-value">{stories_with_ts}</div>
            </div>
        </div>
        
        <div class="summary-stats">
            <div class="stat-card">
                <h3>{avg_score:.1f}%</h3>
                <p>Average Quality Score</p>
            </div>
            <div class="stat-card">
                <h3>{rating_counts.get('Excellent', 0)}</h3>
                <p>Excellent Stories</p>
            </div>
            <div class="stat-card">
                <h3>{rating_counts.get('Good', 0)}</h3>
                <p>Good Stories</p>
            </div>
            <div class="stat-card">
                <h3>{rating_counts.get('Critical', 0) + rating_counts.get('Poor', 0)}</h3>
                <p>Need Improvement</p>
            </div>
        </div>
        
        <h2 style="color: #764ba2; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-bottom: 30px;">
            📝 Story Details ({total_stories} stories)
        </h2>
        
        {stories_html}
    </div>
    
    <button class="print-button" onclick="window.print()">📄 Export to PDF</button>
    
    <script>
        // Set score circle gradients
        document.querySelectorAll('.score-circle').forEach(circle => {{
            const score = circle.getAttribute('data-score');
            circle.style.setProperty('--score', score);
        }});
    </script>
</body>
</html>"""
    
    return html

def main():
    import glob
    import os
    
    # Find the latest markdown report
    reports = glob.glob('ts_quality_analysis_*.md')
    
    if not reports:
        print("❌ No TS quality analysis reports found")
        print("   Run: python analyze-ts-quality.py first")
        return
    
    latest_report = max(reports, key=os.path.getctime)
    
    # Load data from JSON
    with open('tad-ts-report-data.json', 'r', encoding='utf-8') as f:
        report_data = json.load(f)
    
    sprint = report_data.get('dateRange', 'N/A')
    generated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Import functions from analyze-ts-quality.py
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    import importlib.util
    spec = importlib.util.spec_from_file_location("analyze_ts_quality", "analyze-ts-quality.py")
    ats = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ats)
    
    print(f"\n{'='*80}")
    print(f"GENERATING TEAM REPORTS")
    print(f"{'='*80}\n")
    
    # Load stories and analyze
    stories, report_data = ats.get_story_issues_from_data()
    
    if not stories:
        print("❌ No stories found")
        return
    
    # Group by team
    teams = {}
    for story in stories:
        team = story['team']
        if team not in teams:
            teams[team] = []
        teams[team].append(story)
    
    print(f"📊 Found {len(teams)} teams\n")
    
    session = ats.get_session()
    
    # Analyze each team
    for team_name in sorted(teams.keys()):
        print(f"  Processing {team_name}...", end=" ")
        team_stories = teams[team_name]
        
        # Analyze each story in the team
        team_analysis = []
        for story in team_stories:
            # Get full details and analyze
            issue_data = ats.get_issue_full_details(session, story['key'])
            ts_content = ats.extract_ts_content(session, story['key'], issue_data)
            category_scores = ats.analyze_ts_content_keywords(ts_content) if story.get('tsFound') else None
            overall_score, overall_rating = ats.calculate_overall_score(category_scores) if category_scores else (0, 'N/A')
            
            team_analysis.append({
                'key': story['key'],
                'summary': story['summary'],
                'team': team_name,
                'status': story['status'],
                'ts_found': story.get('tsFound', False),
                'ts_content': ts_content,
                'category_scores': category_scores,
                'overall_score': overall_score,
                'overall_rating': overall_rating
            })
        
        # Generate HTML
        html = generate_team_html(team_name, team_analysis, sprint, generated, ats.TESTING_CATEGORIES)
        
        # Save file
        filename = f"ts_quality_{team_name.replace(' ', '_')}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        
        file_size = os.path.getsize(filename) / 1024
        print(f"✅ {file_size:.1f} KB")
    
    print(f"\n{'='*80}")
    print(f"✅ Team Reports Generated!")
    print(f"{'='*80}")
    print(f"📊 Generated {len(teams)} team reports:")
    for team_name in sorted(teams.keys()):
        filename = f"ts_quality_{team_name.replace(' ', '_')}.html"
        print(f"   - {filename}")
    print(f"\n📤 Each report can be shared individually with teams")
    print(f"🌐 Open any HTML file in your browser")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
