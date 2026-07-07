#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Strategy Quality Analysis Tool
Analyzes test strategies for all stories against comprehensive testing metrics
"""

import requests
import json
import sys
import os

# Set console encoding for Windows
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import re
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

JIRA_URL = os.environ.get("JIRA_URL", "https://jira.example.com/jira")
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
BITBUCKET_URL = os.environ.get("BITBUCKET_URL", "https://bitbucket.example.com")
BITBUCKET_TOKEN = os.environ.get("BITBUCKET_TOKEN", "")
BITBUCKET_USERNAME = "l.suresh"  # Required for Personal Access Token
BITBUCKET_ENABLED = True  # Set to True to attempt Bitbucket PR fetching

# Testing categories and their weight (6 core categories only)
TESTING_CATEGORIES = {
    "Positive Testing": {
        "weight": 25,
        "criteria": [
            "Valid flows covered",
            "Acceptance criteria validated",
            "Happy path scenarios complete",
            "Expected inputs validated",
            "User journeys fully tested"
        ]
    },
    "Negative Testing": {
        "weight": 25,
        "criteria": [
            "Invalid inputs handled",
            "Error messages covered",
            "Unauthorized access tested",
            "Missing data scenarios",
            "Improper flows handled"
        ]
    },
    "Boundary Value Testing": {
        "weight": 15,
        "criteria": [
            "Min/Max boundaries tested",
            "Min-1 and Max+1 tested",
            "Null/empty scenarios included",
            "Field length limits validated",
            "Special character scenarios"
        ]
    },
    "Edge Case Testing": {
        "weight": 15,
        "criteria": [
            "Unusual inputs covered",
            "Race conditions addressed",
            "Timing issues tested",
            "Concurrent user scenarios",
            "Overflow/underflow scenarios"
        ]
    },
    "Browser Compatibility": {
        "weight": 10,
        "criteria": [
            "Chrome latest 2 versions",
            "Firefox latest 2 versions"
        ]
    },
    "Other Testing": {
        "weight": 10,
        "criteria": [
            "E2E integration testing",
            "Usability testing",
            "Data integrity",
            "Regression testing",
            "Localization (if applicable)"
        ]
    }
}

def get_session():
    """Create authenticated JIRA session with retry logic"""
    session = requests.Session()
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    session.headers.update({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JIRA_API_TOKEN}"
    })
    return session

def get_story_issues_from_data():
    """Load story issues from the latest report data"""
    try:
        with open('tad-ts-report-data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        stories = []
        for team_name, team_data in data.get('teams', {}).items():
            for issue in team_data.get('issues', []):
                if issue['type'] == 'Story':
                    issue['team'] = team_name
                    stories.append(issue)
        
        return stories, data
    except FileNotFoundError:
        print("❌ Error: tad-ts-report-data.json not found")
        print("   Please run: python sprint-tad-ts-report.py first")
        return [], None

def get_issue_full_details(session, issue_key):
    """Get full issue details including description, comments, and PRs"""
    url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}"
    
    try:
        response = session.get(url, params={'fields': '*all'}, timeout=15)
        if response.ok:
            return response.json()
    except Exception as e:
        print(f"⚠️  Error fetching {issue_key}: {str(e)[:100]}")
    
    return None

def fetch_bitbucket_pr_content(pr_url, jira_session=None):
    """Fetch test strategy content from Bitbucket PR using Personal Access Token - includes DIFF content"""
    if not BITBUCKET_ENABLED:
        return None
        
    try:
        # Parse Bitbucket URL to extract project, repo, and PR number
        # Format: os.environ.get("BITBUCKET_URL","https://bitbucket.example.com")+"/projects/"  # TYM/repos/unifiedui/pull-requests/836/overview
        match = re.search(r'/projects/([^/]+)/repos/([^/]+)/pull-requests/(\d+)', pr_url)
        if not match:
            return None
        
        project_key = match.group(1)
        repo_slug = match.group(2)
        pr_id = match.group(3)
        
        # Bitbucket REST API endpoint
        api_url = f"{BITBUCKET_URL}/rest/api/1.0/projects/{project_key}/repos/{repo_slug}/pull-requests/{pr_id}"
        
        # Try multiple authentication methods for Bitbucket
        session = requests.Session()
        session.headers.update({'Content-Type': 'application/json'})
        
        # Method 1: Bearer token
        session.headers['Authorization'] = f'Bearer {BITBUCKET_TOKEN}'
        response = session.get(api_url, timeout=10)
        
        # Method 2: Basic auth with username + token (Personal Access Token)
        if not response.ok:
            del session.headers['Authorization']
            response = session.get(api_url, auth=(BITBUCKET_USERNAME, BITBUCKET_TOKEN), timeout=10)
        
        # Method 3: HTTP Access Token format
        if not response.ok:
            response = session.get(api_url, auth=('x-token-auth', BITBUCKET_TOKEN), timeout=10)
        
        response = session.get(api_url, timeout=10)
        if response.ok:
            pr_data = response.json()
            
            # Extract relevant content
            content = []
            
            # PR Title
            title = pr_data.get('title', '')
            if title:
                content.append(f"PR Title: {title}")
            
            # PR Description
            description = pr_data.get('description', '')
            if description:
                content.append(f"\n{description}")
            
            # Try to get PR comments/activities with test strategy info
            activities_url = f"{api_url}/activities"
            activities_response = session.get(activities_url, timeout=10)
            if activities_response.ok:
                activities = activities_response.json().get('values', [])
                for activity in activities[:10]:  # First 10 activities
                    if activity.get('action') == 'COMMENTED':
                        comment_text = activity.get('comment', {}).get('text', '')
                        if comment_text and any(kw in comment_text.upper() for kw in ['TEST', 'SCENARIO', 'STRATEGY', 'COVERAGE']):
                            content.append(f"\n{comment_text}")
            
            # NEW: Fetch DIFF content (code changes) - this is where test strategy files might be
            changes_url = f"{api_url}/changes"
            changes_response = session.get(changes_url, timeout=30)
            if changes_response.ok:
                changes_data = changes_response.json()
                changed_files = changes_data.get('values', [])
                
                # Look for test strategy files in the diff
                for file_change in changed_files:
                    path = file_change.get('path', {}).get('toString', '')
                    
                    # Check if this is a test strategy/documentation file
                    if any(indicator in path.lower() for indicator in ['test', 'tad', '.feature', '.md', 'strategy', 'scenario']):
                        # Fetch the file content from diff
                        if file_change.get('type') in ['ADD', 'MODIFY']:
                            # Get the diff hunks (actual content changes)
                            diff_url = f"{api_url}/diff/{path}"
                            diff_response = session.get(diff_url, params={'withComments': 'false'}, timeout=30)
                            
                            if diff_response.ok:
                                diff_data = diff_response.json()
                                
                                # Extract content from diff hunks
                                diff_content = []
                                for diff in diff_data.get('diffs', []):
                                    for hunk in diff.get('hunks', []):
                                        for segment in hunk.get('segments', []):
                                            # Get added/context lines (ignore deleted)
                                            if segment.get('type') in ['ADDED', 'CONTEXT']:
                                                for line in segment.get('lines', []):
                                                    diff_content.append(line.get('line', ''))
                                
                                if diff_content:
                                    content.append(f"\n\n--- Diff Content from {path} ---\n")
                                    content.append('\n'.join(diff_content[:500]))  # Limit to 500 lines to avoid huge content
                                    if len(diff_content) > 500:
                                        content.append(f"\n... [{len(diff_content)-500} more lines]")
            
            return '\n'.join(content) if content else None
        
        return None
    except Exception as e:
        print(f"  Warning: Could not fetch Bitbucket PR: {str(e)[:50]}")
        return None

def extract_ts_content(session, issue_key, issue_data):
    """Extract test strategy content from various sources"""
    ts_content = {
        'source': None,
        'content': '',
        'urls': [],
        'pr_links': [],
        'description': '',
        'comments': [],
        'acceptance_criteria': ''
    }
    
    if not issue_data:
        return ts_content
    
    fields = issue_data.get('fields', {})
    issue_id = issue_data.get('id')
    
    # 1. Get description
    description = fields.get('description', '')
    ts_content['description'] = description or ''
    
    # Extract acceptance criteria from description
    if description:
        # Look for common AC patterns
        ac_patterns = [
            r'(?i)acceptance criteria[:\s]+(.*?)(?=\n\n|\Z)',
            r'(?i)ac[:\s]+(.*?)(?=\n\n|\Z)',
            r'(?i)definition of done[:\s]+(.*?)(?=\n\n|\Z)',
            r'(?i)success criteria[:\s]+(.*?)(?=\n\n|\Z)'
        ]
        
        for pattern in ac_patterns:
            match = re.search(pattern, description, re.DOTALL)
            if match:
                ts_content['acceptance_criteria'] = match.group(1).strip()
                break
    
    # 2. Extract URLs from description
    if description:
        urls = re.findall(r'https?://[^\s\]\)]+', description)
        ts_content['urls'].extend(urls)
        
        # Check if description mentions TS
        desc_upper = description.upper()
        if any(kw in desc_upper for kw in ['TEST STRATEGY', 'TS FOR', 'TEST PLAN', 'QA STRATEGY']):
            ts_content['source'] = 'Description'
            ts_content['content'] = description
    
    # 3. Get comments
    try:
        comment_url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}/comment"
        comment_response = session.get(comment_url, timeout=10)
        if comment_response.ok:
            comments = comment_response.json().get('comments', [])
            ts_content['comments'] = [c.get('body', '') for c in comments]
            
            # First check if comments have Bitbucket PR links (processed later)
            has_bitbucket_link = False
            for comment in ts_content['comments']:
                if comment and 'bitbucket.example.com' in comment.lower():
                    has_bitbucket_link = True
                    break
            
            # Only use comment content if it's not just a link
            if not has_bitbucket_link:
                for comment in ts_content['comments']:
                    if comment:
                        comment_upper = comment.upper()
                        if any(kw in comment_upper for kw in ['TEST STRATEGY', 'TEST PLAN', 'SCENARIO']):
                            if not ts_content['content']:
                                ts_content['source'] = 'Comment'
                                ts_content['content'] += comment + '\n\n'
    except:
        pass
    
    # 4. Get PRs
    try:
        dev_status_url = f"{JIRA_URL}/rest/dev-status/1.0/issue/detail"
        for app_type in ['stash', 'github', 'gitlab']:
            dev_params = {
                'issueId': issue_id,
                'applicationType': app_type,
                'dataType': 'pullrequest'
            }
            
            dev_response = session.get(dev_status_url, params=dev_params, timeout=10)
            if dev_response.ok:
                dev_data = dev_response.json()
                details = dev_data.get('detail', [])
                
                for detail in details:
                    prs = detail.get('pullRequests', [])
                    for pr in prs:
                        pr_name = pr.get('name', '').upper()
                        pr_url = pr.get('url', '')
                        
                        if 'TS' in pr_name or 'TEST STRATEGY' in pr_name:
                            ts_content['pr_links'].append(pr_url)
                            if not ts_content['source']:
                                ts_content['source'] = 'Pull Request'
    except:
        pass
    
    # 5. Extract Bitbucket PR links from comments and mark as external if can't fetch
    bitbucket_pr_links = []
    for comment in ts_content['comments']:
        # Handle both plain URLs and JIRA markdown format [text|url]
        bitbucket_links = re.findall(r'https://bitbucket\.example\.com/projects/[^/\s\]|]+/repos/[^/\s\]|]+/pull-requests/\d+', comment)
        for link in bitbucket_links:
            pr_num = link.split('/')[-1]
            bitbucket_pr_links.append(link)
            print(f"    Found Bitbucket PR #{pr_num} (External Link)")
            pr_content = fetch_bitbucket_pr_content(link, session)
            if pr_content:
                ts_content['content'] += f"\n\n--- Bitbucket PR Content ---\n{pr_content}"
                if not ts_content['source']:
                    ts_content['source'] = 'Bitbucket PR'
            else:
                # Mark that we found a PR link but couldn't fetch it
                if not ts_content['source']:
                    ts_content['source'] = 'External Bitbucket PR (Link Only)'
                ts_content['content'] += f"\n\n[External Test Strategy in Bitbucket PR #{pr_num}] - {link}"
    
    # 5a. Also fetch content from PRs found via dev-status API
    for pr_link in ts_content.get('pr_links', []):
        if pr_link not in bitbucket_pr_links:
            pr_num = pr_link.split('/')[-1]
            bitbucket_pr_links.append(pr_link)
            print(f"    Found Bitbucket PR #{pr_num} (Dev Status API)")
            pr_content = fetch_bitbucket_pr_content(pr_link, session)
            if pr_content:
                ts_content['content'] += f"\n\n--- Bitbucket PR Content ---\n{pr_content}"
                if not ts_content['source']:
                    ts_content['source'] = 'Bitbucket PR'

    
    # 6. Also check description for Bitbucket links
    if ts_content['description']:
        bitbucket_links = re.findall(r'https://bitbucket\.example\.com/projects/[^/\s\]|]+/repos/[^/\s\]|]+/pull-requests/\d+', ts_content['description'])
        for link in bitbucket_links:
            if link not in bitbucket_pr_links:
                pr_num = link.split('/')[-1]
                bitbucket_pr_links.append(link)
                print(f"    Found Bitbucket PR #{pr_num} (External Link)")
                pr_content = fetch_bitbucket_pr_content(link, session)
                if pr_content:
                    ts_content['content'] += f"\n\n--- Bitbucket PR Content ---\n{pr_content}"
                    if not ts_content['source']:
                        ts_content['source'] = 'Bitbucket PR'
                else:
                    if not ts_content['source']:
                        ts_content['source'] = 'External Bitbucket PR (Link Only)'
                    ts_content['content'] += f"\n\n[External Test Strategy in Bitbucket PR #{pr_num}] - {link}"
    
    return ts_content

def is_category_applicable(story_summary, story_description, category):
    """Determine if a testing category is applicable to the story"""
    combined_text = (story_summary + ' ' + story_description).upper()
    
    # Backend/Batch/API stories - Browser testing not applicable
    backend_indicators = [
        'JAMS', 'BATCH', 'JOB', 'SCHEDULER', 'CRON', 'BACKEND', 'API',
        'STORED PROCEDURE', 'DATABASE', 'ETL', 'DATA PIPELINE', 'MIGRATION',
        'SCRIPT', 'SERVICE', 'DAEMON', 'WORKER', 'QUEUE'
    ]
    
    if category == "Browser Compatibility":
        # Check if it's a backend/batch story
        if any(indicator in combined_text for indicator in backend_indicators):
            return False
    
    return True

def analyze_ts_content_keywords(ts_content, story_summary="", story_description=""):
    """Analyze TS content using enhanced keyword detection"""
    
    # Combine all content
    full_content = ' '.join([
        ts_content['content'],
        ts_content['description'],
        ' '.join(ts_content['comments'][:5])  # First 5 comments
    ]).upper()
    
    if not full_content.strip():
        return None
    
    scores = {}
    
    # Enhanced keywords for each category (6 core categories only)
    category_keywords = {
        "Positive Testing": [
            "VALID", "HAPPY PATH", "SUCCESS", "EXPECTED", "NORMAL FLOW",
            "ACCEPTANCE CRITERIA", "USER JOURNEY", "VALID INPUT", "POSITIVE",
            "SUCCESSFUL", "CORRECT", "PROPER", "NOMINAL", "STANDARD"
        ],
        "Negative Testing": [
            "INVALID", "ERROR", "FAIL", "EXCEPTION", "NEGATIVE",
            "UNAUTHORIZED", "FORBIDDEN", "BAD REQUEST", "VALIDATION",
            "INCORRECT", "WRONG", "MISSING", "REJECT", "DECLINE"
        ],
        "Boundary Value Testing": [
            "BOUNDARY", "MIN", "MAX", "LIMIT", "EDGE", "NULL", "EMPTY",
            "MINIMUM", "MAXIMUM", "RANGE", "THRESHOLD", "ZERO",
            "BLANK", "LENGTH", "SIZE"
        ],
        "Edge Case Testing": [
            "EDGE CASE", "CORNER CASE", "UNUSUAL", "RACE CONDITION",
            "CONCURREN", "OVERFLOW", "UNDERFLOW", "TIMING",
            "SPECIAL", "EXTREME", "RARE", "UNEXPECTED"
        ],
        "Browser Compatibility": [
            "BROWSER", "CHROME", "FIREFOX", "SAFARI", "EDGE",
            "CROSS-BROWSER", "COMPATIBILITY", "IE", "INTERNET EXPLORER"
        ],
        "Other Testing": [
            "INTEGRATION", "E2E", "END TO END", "USABILITY", "REGRESSION",
            "DATA INTEGRITY", "CONSISTENCY", "LOCALIZATION",
            "SMOKE", "SANITY", "EXPLORATORY"
        ]
    }
    
    for category, keywords in category_keywords.items():
        # Check if category is applicable
        if not is_category_applicable(story_summary, story_description, category):
            scores[category] = {
                "score": "N/A",
                "coverage": 0,
                "matches": 0,
                "total_keywords": 0,
                "priority": "N/A",
                "keywords_found": [],
                "applicable": False
            }
            continue
        
        matches = sum(1 for kw in keywords if kw in full_content)
        
        # Calculate score based on keyword matches
        max_keywords = len(keywords)
        coverage_pct = (matches / max_keywords) * 100
        
        # Adjusted scoring logic - more forgiving for keyword-based detection
        # 50-100%: Good (half or more criteria covered)
        # 30-49%: Fair (some criteria covered)  
        # 15-29%: Poor (minimal coverage)
        # 0-14%: Critical Gap (not covered)
        
        if coverage_pct >= 50:
            score = "Good"
            priority = "Low"
        elif coverage_pct >= 30:
            score = "Fair"
            priority = "Medium"
        elif coverage_pct >= 15:
            score = "Poor"
            priority = "High"
        else:
            score = "Critical Gap"
            priority = "Critical"
        
        scores[category] = {
            "score": score,
            "coverage": coverage_pct,
            "matches": matches,
            "total_keywords": max_keywords,
            "priority": priority,
            "keywords_found": [kw for kw in keywords if kw in full_content],
            "applicable": True
        }
    
    return scores

def calculate_overall_score(category_scores):
    """Calculate weighted overall score (excluding N/A categories)"""
    if not category_scores:
        return 0, "N/A"
    
    total_weighted_score = 0
    total_weight = 0
    
    score_values = {
        "Good": 100,
        "Fair": 60,
        "Poor": 30,
        "Critical Gap": 0,
        "N/A": None  # Not applicable - exclude from scoring
    }
    
    for category, analysis in category_scores.items():
        # Skip N/A categories
        if analysis['score'] == 'N/A' or not analysis.get('applicable', True):
            continue
            
        weight = TESTING_CATEGORIES[category]['weight']
        score_value = score_values.get(analysis['score'], 0)
        
        total_weighted_score += (score_value * weight)
        total_weight += weight
    
    overall_pct = (total_weighted_score / total_weight) if total_weight > 0 else 0
    
    if overall_pct >= 90:
        rating = "Excellent"
    elif overall_pct >= 80:
        rating = "Very Good"
    elif overall_pct >= 50:
        rating = "Good"
    elif overall_pct >= 30:
        rating = "Fair"
    elif overall_pct >= 15:
        rating = "Poor"
    else:
        rating = "Critical"
    
    return overall_pct, rating

def generate_analysis_report(stories_analysis, report_data):
    """Generate comprehensive analysis report"""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = f"ts_quality_analysis_{timestamp}.md"
    
    # Summary statistics
    total_stories = len(stories_analysis)
    stories_with_ts = sum(1 for s in stories_analysis if s['ts_found'])
    stories_analyzed = sum(1 for s in stories_analysis if s['category_scores'])
    
    # Calculate ratings distribution
    rating_counts = {}
    for story in stories_analysis:
        if story['overall_rating'] != 'N/A':
            rating_counts[story['overall_rating']] = rating_counts.get(story['overall_rating'], 0) + 1
    
    # Generate markdown report
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"# Test Strategy Quality Analysis Report\n\n")
        f.write(f"**Sprint:** {report_data.get('dateRange', 'N/A')}  \n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Stories:** {total_stories}  \n")
        f.write(f"**Stories with TS:** {stories_with_ts}  \n")
        f.write(f"**Stories Analyzed:** {stories_analyzed}  \n\n")
        
        f.write(f"---\n\n")
        
        # Overall ratings summary
        f.write(f"## 📊 Overall Quality Ratings\n\n")
        f.write(f"| Rating | Count | Percentage |\n")
        f.write(f"|--------|-------|------------|\n")
        for rating in ["Excellent", "Very Good", "Good", "Fair", "Poor", "Critical", "N/A"]:
            count = rating_counts.get(rating, 0)
            pct = (count / stories_analyzed * 100) if stories_analyzed > 0 else 0
            f.write(f"| {rating} | {count} | {pct:.1f}% |\n")
        f.write(f"\n")
        
        # Team-wise summary
        f.write(f"## 👥 Team-wise Summary\n\n")
        teams = {}
        for story in stories_analysis:
            team = story['team']
            if team not in teams:
                teams[team] = {
                    'total': 0,
                    'with_ts': 0,
                    'ratings': {}
                }
            teams[team]['total'] += 1
            if story['ts_found']:
                teams[team]['with_ts'] += 1
            if story['overall_rating'] != 'N/A':
                rating = story['overall_rating']
                teams[team]['ratings'][rating] = teams[team]['ratings'].get(rating, 0) + 1
        
        f.write(f"| Team | Stories | With TS | Avg Score | Excellent | Very Good | Good | Fair | Poor | Critical |\n")
        f.write(f"|------|---------|---------|-----------|-----------|-----------|------|------|------|----------|\n")
        
        for team_name in sorted(teams.keys()):
            team_data = teams[team_name]
            total = team_data['total']
            with_ts = team_data['with_ts']
            
            # Calculate average score - exclude N/A stories (no TS)
            team_stories = [s for s in stories_analysis 
                          if s['team'] == team_name 
                          and s['overall_rating'] != 'N/A']
            avg_score = sum(s['overall_score'] for s in team_stories) / len(team_stories) if team_stories else 0
            
            f.write(f"| {team_name} | {total} | {with_ts} | {avg_score:.1f}% | ")
            f.write(f"{team_data['ratings'].get('Excellent', 0)} | ")
            f.write(f"{team_data['ratings'].get('Very Good', 0)} | ")
            f.write(f"{team_data['ratings'].get('Good', 0)} | ")
            f.write(f"{team_data['ratings'].get('Fair', 0)} | ")
            f.write(f"{team_data['ratings'].get('Poor', 0)} | ")
            f.write(f"{team_data['ratings'].get('Critical', 0)} |\n")
        
        f.write(f"\n---\n\n")
        
        # Detailed analysis for each story
        f.write(f"## 📝 Detailed Story Analysis\n\n")
        
        for story in stories_analysis:
            f.write(f"### {story['key']}: {story['summary'][:80]}\n\n")
            f.write(f"**Team:** {story['team']}  \n")
            f.write(f"**Status:** {story['status']}  \n")
            f.write(f"**TS Found:** {'✅ Yes' if story['ts_found'] else '❌ No'}  \n")
            
            if story['ts_content']['source']:
                f.write(f"**TS Source:** {story['ts_content']['source']}  \n")
            
            f.write(f"**Overall Score:** {story['overall_score']:.1f}% ({story['overall_rating']})  \n\n")
            
            if not story['ts_found']:
                f.write(f"⚠️ **No test strategy found**  \n")
                f.write(f"**Recommendation:** Create comprehensive test strategy covering all 8 testing categories.  \n\n")
                f.write(f"---\n\n")
                continue
            
            if not story['category_scores']:
                f.write(f"⚠️ **No TS content available for analysis**  \n")
                f.write(f"**Recommendation:** Ensure test strategy is accessible via PR, description, or comments.  \n\n")
                f.write(f"---\n\n")
                continue
            
            # Category breakdown
            f.write(f"#### Testing Category Coverage\n\n")
            f.write(f"| Category | Score | Coverage | Priority | Keywords Found |\n")
            f.write(f"|----------|-------|----------|----------|----------------|\n")
            
            for category, analysis in story['category_scores'].items():
                if analysis['score'] == 'N/A':
                    f.write(f"| {category} | N/A | Not Applicable | N/A | - |\n")
                    continue
                    
                keywords_preview = ', '.join(analysis['keywords_found'][:3])
                if len(analysis['keywords_found']) > 3:
                    keywords_preview += '...'
                
                f.write(f"| {category} | {analysis['score']} | ")
                f.write(f"{analysis['coverage']:.0f}% ({analysis['matches']}/{analysis['total_keywords']}) | ")
                f.write(f"{analysis['priority']} | {keywords_preview} |\n")
            
            f.write(f"\n")
            
            # Missing scenarios (excluding N/A categories)
            critical_gaps = [cat for cat, analysis in story['category_scores'].items() 
                           if analysis['priority'] in ['Critical', 'High'] and analysis['score'] != 'N/A']
            
            if critical_gaps:
                f.write(f"#### ⚠️ Critical & High Priority Gaps\n\n")
                for category in critical_gaps:
                    analysis = story['category_scores'][category]
                    f.write(f"**{category}** ({analysis['score']}):\n")
                    
                    criteria = TESTING_CATEGORIES[category]['criteria']
                    f.write(f"- **Missing Criteria:**\n")
                    for criterion in criteria:
                        f.write(f"  - {criterion}\n")
                    
                    f.write(f"- **Suggested BDD Scenarios:**\n")
                    f.write(f"```gherkin\n")
                    f.write(f"Feature: {story['summary'][:60]}\n\n")
                    
                    # Generate sample scenarios based on category
                    if category == "Negative Testing":
                        f.write(f"  Scenario: Negative Testing – Invalid Input Handling\n")
                        f.write(f"    Given user is on the page with required inputs\n")
                        f.write(f"    When user enters invalid data (null, empty, special chars)\n")
                        f.write(f"    Then system should display appropriate error message\n")
                        f.write(f"    And prevent submission with invalid data\n\n")
                    elif category == "Security Testing":
                        f.write(f"  Scenario: Security Testing – Unauthorized Access\n")
                        f.write(f"    Given user without proper permissions\n")
                        f.write(f"    When user attempts to access restricted resource\n")
                        f.write(f"    Then system should deny access with 403 error\n")
                        f.write(f"    And log the unauthorized access attempt\n\n")
                    elif category == "Boundary Value Testing":
                        f.write(f"  Scenario: Boundary Testing – Min/Max Values\n")
                        f.write(f"    Given input field with defined limits\n")
                        f.write(f"    When user enters min-1, min, max, max+1 values\n")
                        f.write(f"    Then system should accept valid boundaries\n")
                        f.write(f"    And reject values outside boundaries\n\n")
                    else:
                        f.write(f"  Scenario: {category} – Coverage Enhancement\n")
                        f.write(f"    Given [specific context for this category]\n")
                        f.write(f"    When [action relevant to category]\n")
                        f.write(f"    Then [expected result with validation]\n\n")
                    
                    f.write(f"```\n\n")
            
            # Recommendations
            f.write(f"#### 💡 Recommendations\n\n")
            
            if story['overall_score'] >= 90:
                f.write(f"⭐ **Excellent test strategy!** Minimal enhancements needed.  \n")
            elif story['overall_score'] >= 80:
                f.write(f"✅ **Very good coverage!** Minor enhancements only.  \n")
            elif story['overall_score'] >= 50:
                f.write(f"👍 **Good coverage.** Focus on addressing high-priority gaps.  \n")
            elif story['overall_score'] >= 30:
                f.write(f"⚠️ **Fair coverage.** Significant improvements needed in multiple categories.  \n")
            else:
                f.write(f"🚨 **Critical gaps identified.** Comprehensive test strategy revision required.  \n")
            
            f.write(f"\n**Specific Actions:**\n")
            
            for category, analysis in story['category_scores'].items():
                if analysis['priority'] in ['Critical', 'High']:
                    f.write(f"- 🔴 **{category}:** Add {len(TESTING_CATEGORIES[category]['criteria'])} scenarios\n")
                elif analysis['priority'] == 'Medium':
                    f.write(f"- 🟡 **{category}:** Enhance existing scenarios\n")
            
            f.write(f"\n**Effort Estimate:** ")
            if story['overall_score'] >= 80:
                f.write(f"Low (1-2 days)\n")
            elif story['overall_score'] >= 60:
                f.write(f"Medium (3-5 days)\n")
            else:
                f.write(f"High (5-10 days)\n")
            
            f.write(f"\n---\n\n")
        
        # Executive summary
        f.write(f"## 📋 Executive Summary\n\n")
        
        critical_count = rating_counts.get('Critical', 0) + rating_counts.get('Poor', 0)
        
        f.write(f"### Overall Assessment\n\n")
        f.write(f"- **Total Stories Analyzed:** {stories_analyzed}\n")
        f.write(f"- **Stories with Excellent TS:** {rating_counts.get('Excellent', 0)}\n")
        f.write(f"- **Stories Needing Improvement:** {critical_count}\n")
        f.write(f"- **Average Quality Score:** ")
        
        if stories_analyzed > 0:
            avg_all = sum(s['overall_score'] for s in stories_analysis if s['overall_score'] > 0) / stories_analyzed
            f.write(f"{avg_all:.1f}%\n\n")
        else:
            f.write(f"N/A\n\n")
        
        f.write(f"### Key Findings\n\n")
        
        # Find most common gaps
        category_gap_counts = {}
        for story in stories_analysis:
            if story['category_scores']:
                for category, analysis in story['category_scores'].items():
                    if analysis['priority'] in ['Critical', 'High']:
                        category_gap_counts[category] = category_gap_counts.get(category, 0) + 1
        
        if category_gap_counts:
            sorted_gaps = sorted(category_gap_counts.items(), key=lambda x: x[1], reverse=True)
            f.write(f"**Most Common Gaps:**\n")
            for category, count in sorted_gaps[:3]:
                f.write(f"1. **{category}:** {count} stories need improvement\n")
        
        f.write(f"\n### Recommendations\n\n")
        f.write(f"1. **Immediate Action:** Address {critical_count} critical/poor stories\n")
        f.write(f"2. **Process Improvement:** Implement TS template covering all 8 categories\n")
        f.write(f"3. **Training:** Conduct workshops on comprehensive test strategy creation\n")
        f.write(f"4. **Review Process:** Add TS quality gate before story completion\n")
        f.write(f"5. **Automation:** Identify scenarios suitable for automation\n\n")
    
    return report_file

def main():
    """Main execution"""
    
    print(f"\n{'='*80}")
    print(f"TEST STRATEGY QUALITY ANALYSIS")
    print(f"{'='*80}\n")
    
    # Load story issues
    print("📂 Loading story issues from report data...")
    stories, report_data = get_story_issues_from_data()
    
    if not stories:
        print("❌ No stories found. Please run sprint-tad-ts-report.py first.")
        return
    
    print(f"✅ Found {len(stories)} stories to analyze\n")
    
    # Filter to only stories with TS
    stories_with_ts = [s for s in stories if s.get('tsFound', False)]
    print(f"📊 {len(stories_with_ts)} stories have test strategies\n")
    
    # Analyze each story
    session = get_session()
    stories_analysis = []
    
    for idx, story in enumerate(stories, 1):
        print(f"  [{idx}/{len(stories)}] Analyzing {story['key']}...", end="\r")
        
        # Get full issue details
        issue_data = get_issue_full_details(session, story['key'])
        
        # Extract TS content
        ts_content = extract_ts_content(session, story['key'], issue_data)
        
        # Get story description for applicability check
        story_description = issue_data.get('fields', {}).get('description', '') or ''
        
        # Analyze TS content with applicability check
        category_scores = analyze_ts_content_keywords(
            ts_content, 
            story['summary'], 
            story_description
        ) if story.get('tsFound') else None
        
        # Calculate overall score
        overall_score, overall_rating = calculate_overall_score(category_scores) if category_scores else (0, 'N/A')
        
        stories_analysis.append({
            'key': story['key'],
            'summary': story['summary'],
            'team': story['team'],
            'status': story['status'],
            'ts_found': story.get('tsFound', False),
            'ts_content': ts_content,
            'category_scores': category_scores,
            'overall_score': overall_score,
            'overall_rating': overall_rating
        })
    
    print()  # New line after progress
    
    # Generate report
    print("\n📝 Generating comprehensive analysis report...")
    report_file = generate_analysis_report(stories_analysis, report_data)
    
    print(f"\n{'='*80}")
    print(f"✅ Analysis Complete!")
    print(f"{'='*80}")
    print(f"📄 Report: {report_file}")
    print(f"📊 Stories Analyzed: {len(stories)}")
    print(f"💡 Open the report for detailed findings and recommendations")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
