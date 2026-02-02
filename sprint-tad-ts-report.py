#!/usr/bin/env python3
"""
Sprint TAD/TS Compliance Report
Analyzes all cards in a JIRA sprint and checks for TAD and TS deliverables
"""

import requests
import json
import sys
from datetime import datetime
import csv
import time
import re
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os
from pathlib import Path

# Load environment variables from .env file
def load_env():
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env()

JIRA_URL = "https://jira.wolterskluwer.io/jira"
JIRA_API_TOKEN = os.environ.get("JIRA_API_TOKEN", "")
if not JIRA_API_TOKEN:
    print("ERROR: JIRA_API_TOKEN not set. Please set it in .env file or as environment variable.")
    sys.exit(1)
PROJECT_KEY = "GET"

# Team name mapping - Use this to rename or consolidate teams
# Format: "Jira Team Name": "Display Name"
TEAM_MAPPING = {
    "T360 Vanguards": "T360 Vanguards",
    "Nexus": "Nexus",
    "T360 Mavericks": "T360 Mavericks",
    "Matrix": "Matrix",
    "T360 ICD Chubb": "T360 ICD Chubb",
    "T360 Chargers": "T360 Chargers",
}

def map_team_name(original_team):
    """
    Map team name from Jira to display name
    
    Args:
        original_team: Team name from Jira customfield_13392
        
    Returns:
        Mapped team name or original if no mapping exists
    """
    return TEAM_MAPPING.get(original_team, original_team)

def get_session():
    """Create authenticated JIRA session with retry logic"""
    session = requests.Session()
    
    # Configure retry strategy
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

def get_sprint_issues_by_jql(session, from_date=None, to_date=None, sprint_name=None):
    """Get all issues in a date range or sprint using JQL"""
    
    if sprint_name:
        # Search by sprint name
        jql = f'project = {PROJECT_KEY} AND sprint = "{sprint_name}" ORDER BY updated DESC'
    elif from_date and to_date:
        # Search by date range
        jql = f'project = {PROJECT_KEY} AND updated >= "{from_date}" AND updated <= "{to_date}" ORDER BY updated DESC'
    elif from_date:
        # From date only
        jql = f'project = {PROJECT_KEY} AND updated >= "{from_date}" ORDER BY updated DESC'
    else:
        # Get current/recent sprint
        jql = f'project = {PROJECT_KEY} AND sprint in openSprints() ORDER BY updated DESC'
    
    url = f"{JIRA_URL}/rest/api/2/search"
    
    all_issues = []
    start_at = 0
    max_results = 100
    
    while True:
        payload = {
            "jql": jql,
            "startAt": start_at,
            "maxResults": max_results,
            "fields": ["*all"]
        }
        
        response = session.post(url, json=payload)
        
        if not response.ok:
            print(f"❌ Error fetching issues: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            break
        
        data = response.json()
        issues = data.get('issues', [])
        all_issues.extend(issues)
        
        if len(issues) < max_results:
            break
        
        start_at += max_results
    
    return all_issues

def get_issue_comments(session, issue_key):
    """Get all comments for an issue"""
    url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}/comment"
    
    try:
        response = session.get(url, timeout=10)
        if response.ok:
            data = response.json()
            comments = data.get('comments', [])
            return [comment.get('body', '') for comment in comments]
    except Exception as e:
        print(f"⚠️  Error fetching comments for {issue_key}: {str(e)[:50]}...")
    
    return []

def check_bug_linked_to_story(session, issue_key, issue_sprint, target_sprint=None):
    """Check if a bug is linked to a story in the same sprint
    
    Args:
        session: JIRA session
        issue_key: Bug issue key
        issue_sprint: Sprint name(s) of the bug (may be empty)
        target_sprint: The target sprint we're analyzing (e.g., "26.1.1")
        
    Returns:
        dict with linked_to_story (bool) and linked_issue_key (str)
    """
    result = {
        'linked_to_story': False,
        'linked_issue_key': None
    }
    
    url = f"{JIRA_URL}/rest/api/2/issue/{issue_key}"
    
    try:
        response = session.get(url, params={'fields': 'issuelinks,sprint,customfield_10004'}, timeout=10)
        if response.ok:
            data = response.json()
            issue_links = data.get('fields', {}).get('issuelinks', [])
            
            for link in issue_links:
                # Check both inward and outward issue
                linked_issue = link.get('inwardIssue') or link.get('outwardIssue')
                
                if linked_issue:
                    linked_type = linked_issue.get('fields', {}).get('issuetype', {}).get('name', '')
                    linked_key = linked_issue.get('key', '')
                    
                    # If linked to a Story, check if it's in the target sprint
                    if linked_type == 'Story':
                        # Get the linked issue's sprint information - use both sprint fields
                        linked_url = f"{JIRA_URL}/rest/api/2/issue/{linked_key}"
                        linked_response = session.get(linked_url, params={'fields': 'sprint,customfield_10004'}, timeout=10)
                        
                        if linked_response.ok:
                            linked_data = linked_response.json()
                            fields = linked_data.get('fields', {})
                            
                            if not fields:
                                continue
                            
                            # Try both sprint fields (sprint and customfield_10004)
                            linked_sprints = fields.get('sprint') or fields.get('customfield_10004')
                            
                            if not linked_sprints:
                                continue
                            
                            # Extract sprint names from linked issue
                            linked_sprint_names = []
                            if isinstance(linked_sprints, list):
                                for sprint in linked_sprints:
                                    if isinstance(sprint, dict) and 'name' in sprint:
                                        linked_sprint_names.append(sprint['name'])
                            elif isinstance(linked_sprints, dict) and 'name' in linked_sprints:
                                linked_sprint_names.append(linked_sprints['name'])
                            
                            # Check if linked story is in target sprint
                            # If bug has sprint info, check both match
                            # If bug has no sprint, just check if story is in target sprint
                            issue_sprint_list = issue_sprint.split(', ') if issue_sprint and issue_sprint != 'No Sprint' else []
                            
                            sprint_match = False
                            if issue_sprint_list:
                                # Bug has sprint info - check if they match
                                sprint_match = any(sprint in linked_sprint_names for sprint in issue_sprint_list)
                            elif target_sprint:
                                # Bug has no sprint - check if linked story is in target sprint
                                sprint_match = target_sprint in linked_sprint_names
                            
                            if sprint_match:
                                result['linked_to_story'] = True
                                result['linked_issue_key'] = linked_key
                                return result
    except Exception as e:
        print(f"⚠️  Error checking links for {issue_key}: {str(e)[:100]}...")
    
    return result

def check_comments_for_na(comments, deliverable_type):
    """Check if comments indicate TAD/TS is not applicable
    
    Args:
        comments: List of comment text strings
        deliverable_type: 'TAD' or 'TS'
        
    Returns:
        dict with na_found (bool) and na_comment (str)
    """
    result = {
        'na_found': False,
        'na_comment': None
    }
    
    if not comments:
        return result
    
    # Keywords that indicate not applicable
    na_keywords = [
        'NOT APPLICABLE',
        'N/A',
        'NA',
        'NOT REQUIRED',
        'NOT NEEDED',
        'DOES NOT APPLY',
        "DOESN'T APPLY",
        'NOT APPLY',
        'NO NEED',
        'NOT NECESSARY',
        'IS NOT APPLICABLE',
        'ARE NOT APPLICABLE',
        'NO TAD AND TS IS REQUIRED',
        'NO TAD AND TS REQUIRED',
        'NO TAD AND TS ARE REQUIRED',
        'TAD AND TS NOT REQUIRED',
        'TAD AND TS ARE NOT REQUIRED'
    ]
    
    # Just check for the deliverable type name
    deliverable_keywords = ['TAD'] if deliverable_type == 'TAD' else ['TS', 'TEST STRATEGY']
    
    # Check each comment
    for comment in comments:
        if not comment:
            continue
            
        comment_upper = comment.upper()
        
        # Check if this comment mentions the deliverable type and N/A keywords
        has_deliverable = any(keyword in comment_upper for keyword in deliverable_keywords)
        has_na_keyword = any(keyword in comment_upper for keyword in na_keywords)
        
        if has_deliverable and has_na_keyword:
            result['na_found'] = True
            result['na_comment'] = comment[:200]  # First 200 chars
            break
    
    return result

def check_deliverables(session, issue_key, issue_id, description=None):
    """Check if issue has TAD and TS PRs or documentation links in description"""
    dev_status_url = f"{JIRA_URL}/rest/dev-status/1.0/issue/detail"
    
    result = {
        "tad_found": False,
        "ts_found": False,
        "tad_pr": None,
        "ts_pr": None,
        "total_prs": 0,
        "tad_source": None,
        "ts_source": None,
        "tad_desc_links": [],
        "ts_desc_links": [],
        "tad_na": False,
        "tad_na_comment": None,
        "ts_na": False,
        "ts_na_comment": None
    }
    
    # Add small delay to avoid rate limiting
    time.sleep(0.3)
    
    # Check Bitbucket
    for app_type in ['stash', 'github', 'gitlab']:
        dev_params = {
            'issueId': issue_id,
            'applicationType': app_type,
            'dataType': 'pullrequest'
        }
        
        try:
            dev_response = session.get(dev_status_url, params=dev_params, timeout=10)
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            print(f"⚠️  Connection error for {issue_key}: {str(e)[:50]}...")
            continue
        
        if dev_response.ok:
            try:
                dev_data = dev_response.json()
                details = dev_data.get('detail', [])
                
                for detail in details:
                    prs = detail.get('pullRequests', [])
                    result['total_prs'] += len(prs)
                    
                    for pr in prs:
                        pr_name = pr.get('name', '').upper()
                        pr_status = pr.get('status', 'Unknown')
                        pr_url = pr.get('url', '')
                        
                        # Check for TAD
                        if 'TAD' in pr_name or 'TECHNICAL ARCHITECTURE' in pr_name:
                            result['tad_found'] = True
                            result['tad_pr'] = {
                                "name": pr.get('name', ''),
                                "status": pr_status,
                                "url": pr_url
                            }
                        
                        # Check for TS - Updated to recognize [TS] prefix pattern
                        if (('[TS]' in pr_name or 'TS FOR' in pr_name or 'TEST STRATEGY' in pr_name) 
                            and 'TS FILE' not in pr_name):
                            result['ts_found'] = True
                            result['ts_pr'] = {
                                "name": pr.get('name', ''),
                                "status": pr_status,
                                "url": pr_url
                            }
            except:
                pass
    
    # Store PR source if found
    if result['tad_found']:
        result['tad_source'] = 'PR'
    if result['ts_found']:
        result['ts_source'] = 'PR'
    
    # Also check description if provided
    if description:
        desc_result = check_description_for_links(description)
        
        # Combine PR results with description results
        if not result['tad_found'] and desc_result['tad_in_desc']:
            result['tad_found'] = True
            result['tad_source'] = 'Description'
            result['tad_desc_links'] = desc_result['tad_links']
        
        if not result['ts_found'] and desc_result['ts_in_desc']:
            result['ts_found'] = True
            result['ts_source'] = 'Description'
            result['ts_desc_links'] = desc_result['ts_links']
    
    return result

def check_comments_for_filtered_issues(session, issues_data, target_sprint=None):
    """Check comments for N/A status on filtered issues (Stories only)
    Also check if Bugs are linked to Stories in the same sprint
    
    Args:
        session: JIRA session
        issues_data: List of issue dictionaries to check
        target_sprint: The target sprint being analyzed (e.g., "26.1.1")
        
    Returns:
        Updated issues_data with N/A information
    """
    story_count = len([i for i in issues_data if i['type'] == 'Story'])
    bug_count = len([i for i in issues_data if i['type'] == 'Bug'])
    print(f"\n🔍 Checking N/A status: {story_count} Stories (comments) + {bug_count} Bugs (story links)...\n")
    
    for idx, issue in enumerate(issues_data, 1):
        # Check bugs for story links first
        if issue['type'] == 'Bug' and (not issue['tad_found'] or not issue['ts_found']):
            print(f"  [{idx}/{len(issues_data)}] Checking bug {issue['key']} for story links...", end="\r")
            link_result = check_bug_linked_to_story(session, issue['key'], issue['sprint'], target_sprint)
            
            if link_result['linked_to_story']:
                if not issue['tad_found']:
                    issue['tad_na'] = True
                    issue['tad_na_comment'] = f"Bug linked to story {link_result['linked_issue_key']} in same sprint"
                    issue['tad_source'] = 'Not Applicable (Linked to Story)'
                
                if not issue['ts_found']:
                    issue['ts_na'] = True
                    issue['ts_na_comment'] = f"Bug linked to story {link_result['linked_issue_key']} in same sprint"
                    issue['ts_source'] = 'Not Applicable (Linked to Story)'
                
                continue
        
        # Only check comments for Stories that are missing TAD/TS
        if issue['type'] != 'Story':
            continue
            
        if not issue['tad_found'] or not issue['ts_found']:
            print(f"  [{idx}/{len(issues_data)}] Checking comments for {issue['key']}...", end="\r")
            comments = get_issue_comments(session, issue['key'])
            
            if not issue['tad_found']:
                tad_na_result = check_comments_for_na(comments, 'TAD')
                issue['tad_na'] = tad_na_result['na_found']
                issue['tad_na_comment'] = tad_na_result['na_comment']
                if tad_na_result['na_found']:
                    issue['tad_source'] = 'Not Applicable (Comment)'
                    # If TAD is N/A for a Story, TS is also N/A
                    if not issue['ts_found']:
                        issue['ts_na'] = True
                        issue['ts_na_comment'] = 'Test Strategy N/A because TAD is N/A'
                        issue['ts_source'] = 'Not Applicable (TAD N/A)'
            
            # Only check TS comments if TS is not already marked as N/A from TAD
            if not issue['ts_found'] and not issue.get('ts_na', False):
                ts_na_result = check_comments_for_na(comments, 'TS')
                issue['ts_na'] = ts_na_result['na_found']
                issue['ts_na_comment'] = ts_na_result['na_comment']
                if ts_na_result['na_found']:
                    issue['ts_source'] = 'Not Applicable (Comment)'
    
    print()  # New line after progress
    return issues_data

def check_description_for_links(description):
    """
    Check if description contains TAD/TS documentation links
    
    Args:
        description: JIRA issue description text
        
    Returns:
        dict with tad_in_desc, ts_in_desc, tad_links, ts_links
    """
    result = {
        'tad_in_desc': False,
        'ts_in_desc': False,
        'tad_links': [],
        'ts_links': []
    }
    
    if not description:
        return result
    
    desc_upper = description.upper()
    
    # Keywords for TAD
    tad_keywords = [
        'TECHNICAL ARCHITECTURE',
        'TAD DOCUMENT',
        'ADR',  # Architecture Decision Record
        'ARCHITECTURE DECISION',
        'DESIGN DOCUMENT',
        'TECHNICAL DESIGN'
    ]
    
    # Keywords for TS
    ts_keywords = [
        'TEST STRATEGY',
        'TS FOR',
        'TEST PLAN',
        'TESTING STRATEGY',
        'QA STRATEGY'
    ]
    
    # Check for TAD keywords
    for keyword in tad_keywords:
        if keyword in desc_upper:
            result['tad_in_desc'] = True
            # Extract URLs from description
            urls = re.findall(r'https?://[^\s\]\)]+', description)
            result['tad_links'] = urls[:5]  # Limit to first 5 URLs
            break
    
    # Check for TS keywords  
    for keyword in ts_keywords:
        if keyword in desc_upper and 'TS FILE' not in desc_upper:
            result['ts_in_desc'] = True
            # Extract URLs
            urls = re.findall(r'https?://[^\s\]\)]+', description)
            result['ts_links'] = urls[:5]  # Limit to first 5 URLs
            break
    
    return result

def get_defect_analysis(session, sprint_name):
    """Get defect analysis by Safe-SDLC Activity and team
    
    Args:
        session: Authenticated JIRA session
        sprint_name: Sprint name (e.g., "26.1.1" or "Current Sprint")
        
    Returns:
        dict with defect data organized by activity and team
    """
    result = {
        'total_defects': 0,
        'activities': {},
        'team_matrix': {}
    }
    
    # Build JQL based on sprint name
    if 'current' in sprint_name.lower():
        # Use openSprints for current sprint
        jql = f'project = {PROJECT_KEY} AND sprint in openSprints() AND type = Bug ORDER BY team ASC'
    else:
        # Extract sprint number for JQL
        sprint_num = sprint_name.replace('Sprint ', '').strip() if 'Sprint' in sprint_name else sprint_name
        jql = f'project = {PROJECT_KEY} AND sprint = "{sprint_num}" AND type = Bug ORDER BY team ASC'
    
    url = f"{JIRA_URL}/rest/api/2/search"
    
    all_bugs = []
    start_at = 0
    max_results = 100
    
    while True:
        payload = {
            "jql": jql,
            "startAt": start_at,
            "maxResults": max_results,
            "fields": ["key", "summary", "customfield_13392", "customfield_14391"]
        }
        
        try:
            response = session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            all_bugs.extend(data['issues'])
            
            if len(all_bugs) >= data['total']:
                break
                
            start_at += max_results
        except Exception as e:
            print(f"⚠️  Error fetching defects: {str(e)[:100]}")
            break
    
    result['total_defects'] = len(all_bugs)
    
    if len(all_bugs) == 0:
        return result
    
    # Analyze bugs
    activity_data = {}
    all_teams = set()
    defect_details = {}  # Store actual defect information
    
    for bug in all_bugs:
        fields = bug['fields']
        key = bug['key']
        summary = fields.get('summary', 'No summary')
        
        # Get team
        team = fields.get('customfield_13392')
        if not team:
            team = "Unknown"
        elif isinstance(team, dict):
            team = team.get('value', 'Unknown')
        
        # Map team name
        team = map_team_name(team)
        all_teams.add(team)
        
        # Get Safe-SDLC Activity
        safe_sdlc = fields.get('customfield_14391')
        activity = "Not Set"
        
        if safe_sdlc:
            if isinstance(safe_sdlc, dict):
                activity = safe_sdlc.get('value', 'Not Set')
            elif isinstance(safe_sdlc, str):
                activity = safe_sdlc
        
        # Initialize structures
        if activity not in activity_data:
            activity_data[activity] = {}
        
        if team not in activity_data[activity]:
            activity_data[activity][team] = []
        
        # Store defect details
        activity_data[activity][team].append({
            'key': key,
            'summary': summary
        })
    
    # Build team matrix (teams as rows, activities as columns)
    team_matrix = {}
    team_defect_details = {}  # Store defects for each team-activity combination
    
    # Sort activities by total count
    activity_counts = {}
    for activity, teams in activity_data.items():
        activity_counts[activity] = sum(len(defects) for defects in teams.values())
    
    sorted_activities = sorted(activity_counts.items(), key=lambda x: x[1], reverse=True)
    activity_names = [act for act, _ in sorted_activities]
    
    # Build matrix
    for team in all_teams:
        team_matrix[team] = {}
        team_defect_details[team] = {}
        total = 0
        for activity in activity_names:
            defects = activity_data.get(activity, {}).get(team, [])
            count = len(defects)
            team_matrix[team][activity] = count
            team_defect_details[team][activity] = defects
            total += count
        team_matrix[team]['TOTAL'] = total
    
    # Sort teams by total defects
    sorted_teams = sorted(team_matrix.items(), key=lambda x: x[1]['TOTAL'], reverse=True)
    
    result['activities'] = {act: count for act, count in sorted_activities}
    result['team_matrix'] = {team: data for team, data in sorted_teams}
    result['team_defect_details'] = team_defect_details
    result['activity_names'] = activity_names
    
    return result

def generate_report(session, sprint_name, issues_data):
    """Generate consolidated report"""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    timestamp_display = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_file = f"sprint_tad_ts_report_{timestamp}.csv"
    md_report_file = f"sprint_tad_ts_report_{timestamp}.md"
    json_report_file = "tad-ts-report-data.json"  # Fixed name for dashboard
    js_report_file = "tad-ts-report-data.js"  # JavaScript version to bypass CORS
    
    # Extract month from sprint_name for month-specific files
    # sprint_name format: "2025-12-01 to 2025-12-31"
    month_match = sprint_name.split(' to ')[0][:7] if ' to ' in sprint_name else None
    if month_match:
        month_json_file = f"tad-ts-report-{month_match}.json"
        month_js_file = f"tad-ts-report-{month_match}.js"
    else:
        month_json_file = None
        month_js_file = None
    
    # Calculate statistics
    total = len(issues_data)
    tad_complete = sum(1 for i in issues_data if i['tad_found'])
    ts_complete = sum(1 for i in issues_data if i['ts_found'])
    both_complete = sum(1 for i in issues_data if i['tad_found'] and i['ts_found'])
    missing_tad = sum(1 for i in issues_data if not i['tad_found'])
    missing_ts = sum(1 for i in issues_data if not i['ts_found'])
    
    # Calculate N/A statistics
    tad_na = sum(1 for i in issues_data if i.get('tad_na', False))
    ts_na = sum(1 for i in issues_data if i.get('ts_na', False))
    tad_truly_missing = sum(1 for i in issues_data if not i['tad_found'] and not i.get('tad_na', False))
    ts_truly_missing = sum(1 for i in issues_data if not i['ts_found'] and not i.get('ts_na', False))
    
    # Calculate compliance percentages excluding N/A
    tad_applicable = total - tad_na
    ts_applicable = total - ts_na
    tad_compliance_pct = (tad_complete / tad_applicable * 100) if tad_applicable > 0 else 0
    ts_compliance_pct = (ts_complete / ts_applicable * 100) if ts_applicable > 0 else 0
    
    # Console output
    print(f"\n{'='*80}")
    print(f"SPRINT TAD/TS COMPLIANCE REPORT")
    print(f"{'='*80}")
    print(f"Sprint: {sprint_name}")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    print(f"📊 SUMMARY")
    print(f"-" * 80)
    print(f"Total Issues: {total}")
    print(f"TAD Complete: {tad_complete} ({tad_compliance_pct:.1f}% of {tad_applicable} applicable)")
    print(f"TS Complete: {ts_complete} ({ts_compliance_pct:.1f}% of {ts_applicable} applicable)")
    print(f"Both Complete: {both_complete} ({both_complete/total*100:.1f}%)")
    print(f"TAD N/A: {tad_na} ({tad_na/total*100:.1f}%)")
    print(f"TS N/A: {ts_na} ({ts_na/total*100:.1f}%)")
    print(f"Missing TAD: {missing_tad} (N/A: {tad_na}, Truly Missing: {tad_truly_missing})")
    print(f"Missing TS: {missing_ts} (N/A: {ts_na}, Truly Missing: {ts_truly_missing})")
    print(f"\n")
    
    # Detailed table
    print(f"📋 DETAILED BREAKDOWN")
    print(f"-" * 80)
    print(f"{'Issue':<15} {'Type':<15} {'Status':<15} {'TAD':<8} {'TS':<8} {'PRs':<5}")
    print(f"-" * 80)
    
    for issue in issues_data:
        tad_status = "✅" if issue['tad_found'] else "❌"
        ts_status = "✅" if issue['ts_found'] else "❌"
        
        print(f"{issue['key']:<15} {issue['type']:<15} {issue['status']:<15} "
              f"{tad_status:<8} {ts_status:<8} {issue['total_prs']:<5}")
    
    print(f"\n")
    
    # Issues missing TAD
    missing_tad_issues = [i for i in issues_data if not i['tad_found'] and not i.get('tad_na', False)]
    tad_na_issues = [i for i in issues_data if i.get('tad_na', False)]
    
    if tad_na_issues:
        print(f"ℹ️  TAD MARKED AS NOT APPLICABLE ({len(tad_na_issues)})")
        print(f"-" * 80)
        for issue in tad_na_issues:
            comment = issue.get('tad_na_comment', '')[:100]
            print(f"  • {issue['key']}: {issue['summary']}")
            if comment:
                print(f"    Comment: {comment}...")
        print()
    
    if missing_tad_issues:
        print(f"⚠️  ISSUES TRULY MISSING TAD ({len(missing_tad_issues)})")
        print(f"-" * 80)
        for issue in missing_tad_issues:
            print(f"  • {issue['key']}: {issue['summary']}")
        print()
    
    # Issues missing TS
    missing_ts_issues = [i for i in issues_data if not i['ts_found'] and not i.get('ts_na', False)]
    ts_na_issues = [i for i in issues_data if i.get('ts_na', False)]
    
    if ts_na_issues:
        print(f"ℹ️  TS MARKED AS NOT APPLICABLE ({len(ts_na_issues)})")
        print(f"-" * 80)
        for issue in ts_na_issues:
            comment = issue.get('ts_na_comment', '')[:100]
            print(f"  • {issue['key']}: {issue['summary']}")
            if comment:
                print(f"    Comment: {comment}...")
        print()
    
    if missing_ts_issues:
        print(f"⚠️  ISSUES TRULY MISSING TS ({len(missing_ts_issues)})")
        print(f"-" * 80)
        for issue in missing_ts_issues:
            print(f"  • {issue['key']}: {issue['summary']}")
        print()
    
    # Save CSV report
    with open(report_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Issue Key', 'Summary', 'Type', 'Status', 'Team', 'Assignee',
                        'TAD Found', 'TAD Source', 'TAD PR', 'TAD Status', 'TAD URL', 'TAD N/A', 'TAD N/A Comment',
                        'TS Found', 'TS Source', 'TS PR', 'TS Status', 'TS URL', 'TS N/A', 'TS N/A Comment',
                        'Total PRs', 'TAD Desc Links', 'TS Desc Links'])
        
        for issue in issues_data:
            tad_pr = issue.get('tad_pr', {}) or {}
            ts_pr = issue.get('ts_pr', {}) or {}
            
            writer.writerow([
                issue['key'],
                issue['summary'],
                issue['type'],
                issue['status'],
                issue['team'],
                issue['assignee'],
                'Yes' if issue['tad_found'] else 'No',
                issue.get('tad_source', ''),
                tad_pr.get('name', ''),
                tad_pr.get('status', ''),
                tad_pr.get('url', ''),
                'Yes' if issue.get('tad_na', False) else 'No',
                issue.get('tad_na_comment', ''),
                'Yes' if issue['ts_found'] else 'No',
                issue.get('ts_source', ''),
                ts_pr.get('name', ''),
                ts_pr.get('status', ''),
                ts_pr.get('url', ''),
                'Yes' if issue.get('ts_na', False) else 'No',
                issue.get('ts_na_comment', ''),
                issue['total_prs'],
                '; '.join(issue.get('tad_desc_links', [])[:2]),
                '; '.join(issue.get('ts_desc_links', [])[:2])
            ])
    
    # Save Markdown report
    with open(md_report_file, 'w', encoding='utf-8') as f:
        f.write(f"# Sprint TAD/TS Compliance Report\n\n")
        f.write(f"**Sprint:** {sprint_name}  \n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n\n")
        
        f.write(f"## Summary\n\n")
        f.write(f"| Metric | Count | Percentage |\n")
        f.write(f"|--------|-------|------------|\n")
        f.write(f"| Total Issues | {total} | 100% |\n")
        f.write(f"| TAD Complete | {tad_complete} | {tad_complete/total*100:.1f}% |\n")
        f.write(f"| TS Complete | {ts_complete} | {ts_complete/total*100:.1f}% |\n")
        f.write(f"| Both Complete | {both_complete} | {both_complete/total*100:.1f}% |\n")
        f.write(f"| Missing TAD | {missing_tad} | {missing_tad/total*100:.1f}% |\n")
        f.write(f"| Missing TS | {missing_ts} | {missing_ts/total*100:.1f}% |\n\n")
        
        # Group issues by team
        from collections import defaultdict
        teams = defaultdict(list)
        for issue in issues_data:
            teams[issue['team']].append(issue)
        
        # Summary by team
        f.write(f"## Summary by Team\n\n")
        f.write(f"| Team | Total | TAD | TS | Both | TAD N/A | TS N/A | TAD % | TS % |\n")
        f.write(f"|------|-------|-----|----|----|---------|--------|-------|------|\n")
        
        for team_name in sorted(teams.keys()):
            team_issues = teams[team_name]
            team_total = len(team_issues)
            team_tad = sum(1 for i in team_issues if i['tad_found'])
            team_ts = sum(1 for i in team_issues if i['ts_found'])
            team_both = sum(1 for i in team_issues if i['tad_found'] and i['ts_found'])
            team_tad_na = sum(1 for i in team_issues if i.get('tad_na', False))
            team_ts_na = sum(1 for i in team_issues if i.get('ts_na', False))
            team_tad_applicable = team_total - team_tad_na
            team_ts_applicable = team_total - team_ts_na
            team_tad_pct = (team_tad / team_tad_applicable * 100) if team_tad_applicable > 0 else 0
            team_ts_pct = (team_ts / team_ts_applicable * 100) if team_ts_applicable > 0 else 0
            
            f.write(f"| {team_name} | {team_total} | {team_tad} | {team_ts} | {team_both} | ")
            f.write(f"{team_tad_na} | {team_ts_na} | {team_tad_pct:.1f}% | {team_ts_pct:.1f}% |\n")
        
        f.write("\n")
        
        # Detailed breakdown by team
        for team_name in sorted(teams.keys()):
            team_issues = teams[team_name]
            f.write(f"## Team: {team_name} ({len(team_issues)} issues)\n\n")
            f.write(f"| Issue | Type | Status | TAD | TS | PRs | Summary |\n")
            f.write(f"|-------|------|--------|-----|----|----|----------|\n")
            
            for issue in team_issues:
                tad = "✅" if issue['tad_found'] else "❌"
                ts = "✅" if issue['ts_found'] else "❌"
                f.write(f"| {issue['key']} | {issue['type']} | {issue['status']} | ")
                f.write(f"{tad} | {ts} | {issue['total_prs']} | {issue['summary'][:50]} |\n")
            
            f.write("\n")
        
        if missing_tad_issues:
            f.write(f"\n## ⚠️ Issues Missing TAD\n\n")
            for issue in missing_tad_issues:
                f.write(f"- **{issue['key']}**: {issue['summary']}\n")
        
        if missing_ts_issues:
            f.write(f"\n## ⚠️ Issues Missing TS\n\n")
            for issue in missing_ts_issues:
                f.write(f"- **{issue['key']}**: {issue['summary']}\n")
    
    # Get defect analysis
    print(f"\n📊 Analyzing defects by Safe-SDLC Activity...")
    defect_analysis = get_defect_analysis(session, sprint_name)
    
    # Generate JSON for dashboard
    dashboard_data = {
        "dateRange": sprint_name,
        "generated": timestamp_display,
        "summary": {
            "total": total,
            "tadComplete": tad_complete,
            "tsComplete": ts_complete,
            "bothComplete": both_complete,
            "missingTad": tad_truly_missing,
            "missingTs": ts_truly_missing,
            "tadNA": tad_na,
            "tsNA": ts_na,
            "tadApplicable": tad_applicable,
            "tsApplicable": ts_applicable,
            "tadPct": tad_compliance_pct,
            "tsPct": ts_compliance_pct,
            "bothPct": (both_complete / total * 100) if total > 0 else 0,
            "missingTadPct": (tad_truly_missing / total * 100) if total > 0 else 0,
            "missingTsPct": (ts_truly_missing / total * 100) if total > 0 else 0,
            "tadNAPct": (tad_na / total * 100) if total > 0 else 0,
            "tsNAPct": (ts_na / total * 100) if total > 0 else 0
        },
        "defects": {
            "totalDefects": defect_analysis['total_defects'],
            "activities": defect_analysis.get('activities', {}),
            "teamMatrix": defect_analysis.get('team_matrix', {}),
            "teamDefectDetails": defect_analysis.get('team_defect_details', {}),
            "activityNames": defect_analysis.get('activity_names', [])
        },
        "teams": {}
    }
    
    # Add team data
    for team_name in teams.keys():
        team_issues = teams[team_name]
        team_total = len(team_issues)
        team_tad = sum(1 for i in team_issues if i['tad_found'])
        team_ts = sum(1 for i in team_issues if i['ts_found'])
        team_both = sum(1 for i in team_issues if i['tad_found'] and i['ts_found'])
        team_tad_na = sum(1 for i in team_issues if i.get('tad_na', False))
        team_ts_na = sum(1 for i in team_issues if i.get('ts_na', False))
        team_tad_applicable = team_total - team_tad_na
        team_ts_applicable = team_total - team_ts_na
        team_tad_truly_missing = sum(1 for i in team_issues if not i['tad_found'] and not i.get('tad_na', False))
        team_ts_truly_missing = sum(1 for i in team_issues if not i['ts_found'] and not i.get('ts_na', False))
        
        dashboard_data["teams"][team_name] = {
            "total": team_total,
            "tadComplete": team_tad,
            "tsComplete": team_ts,
            "bothComplete": team_both,
            "tadNA": team_tad_na,
            "tsNA": team_ts_na,
            "tadApplicable": team_tad_applicable,
            "tsApplicable": team_ts_applicable,
            "missingTad": team_tad_truly_missing,
            "missingTs": team_ts_truly_missing,
            "tadPct": (team_tad / team_tad_applicable * 100) if team_tad_applicable > 0 else 0,
            "tsPct": (team_ts / team_ts_applicable * 100) if team_ts_applicable > 0 else 0,
            "issues": [
                {
                    "key": issue['key'],
                    "summary": issue['summary'],
                    "type": issue['type'],
                    "status": issue['status'],
                    "sprint": issue.get('sprint', 'No Sprint'),
                    "tadFound": issue['tad_found'],
                    "tsFound": issue['ts_found'],
                    "totalPrs": issue['total_prs'],
                    "tadNA": issue.get('tad_na', False),
                    "tadNAComment": issue.get('tad_na_comment', ''),
                    "tsNA": issue.get('ts_na', False),
                    "tsNAComment": issue.get('ts_na_comment', '')
                }
                for issue in team_issues
            ]
        }
    
    with open(json_report_file, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=2)
    
    # Also create JavaScript version to bypass CORS issues
    with open(js_report_file, 'w', encoding='utf-8') as f:
        f.write('window.reportData = ')
        json.dump(dashboard_data, f, indent=2)
        f.write(';')
    
    # Save month-specific files for dashboard month selector
    if month_json_file:
        with open(month_json_file, 'w', encoding='utf-8') as f:
            json.dump(dashboard_data, f, indent=2)
        with open(month_js_file, 'w', encoding='utf-8') as f:
            f.write('window.reportData = ')
            json.dump(dashboard_data, f, indent=2)
            f.write(';')
    
    # Save sprint-specific files if sprint name is provided
    if sprint_name and 'to' not in sprint_name.lower() and 'current' not in sprint_name.lower():
        # Extract sprint number from "Sprint 26.1.2" format
        sprint_number = sprint_name.replace('Sprint ', '').strip()
        sprint_json_file = f'tad-ts-report-sprint-{sprint_number}.json'
        sprint_js_file = f'tad-ts-report-sprint-{sprint_number}.js'
        
        with open(sprint_json_file, 'w', encoding='utf-8') as f:
            json.dump(dashboard_data, f, indent=2)
        with open(sprint_js_file, 'w', encoding='utf-8') as f:
            f.write('window.reportData = ')
            json.dump(dashboard_data, f, indent=2)
            f.write(';')
    
    print(f"{'='*80}")
    print(f"✅ Reports saved:")
    print(f"   📄 CSV: {report_file} (will be deleted)")
    print(f"   📄 Markdown: {md_report_file} (will be deleted)")
    print(f"   📊 Dashboard JSON: {json_report_file}")
    print(f"   📊 Dashboard JS: {js_report_file}")
    if month_json_file:
        print(f"   📊 Month JSON: {month_json_file}")
        print(f"   📊 Month JS: {month_js_file}")
    if sprint_name and 'to' not in sprint_name.lower() and 'current' not in sprint_name.lower():
        sprint_number = sprint_name.replace('Sprint ', '').strip()
        print(f"   📊 Sprint JSON: tad-ts-report-sprint-{sprint_number}.json")
        print(f"   📊 Sprint JS: tad-ts-report-sprint-{sprint_number}.js")
    print(f"   🌐 Open: tad-ts-dashboard.html")
    
    # Delete CSV and MD files after JSON/JS files are generated
    import os
    try:
        if os.path.exists(report_file):
            os.remove(report_file)
            print(f"   🗑️  Deleted: {report_file}")
        if os.path.exists(md_report_file):
            os.remove(md_report_file)
            print(f"   🗑️  Deleted: {md_report_file}")
    except Exception as e:
        print(f"   ⚠️  Error deleting files: {e}")
    
    print(f"{'='*80}\n")

def main():
    """Main execution"""
    
    session = get_session()
    
    # Get date range or sprint name from arguments
    from_date = None
    to_date = None
    sprint_name = None
    report_title = "Current Sprint"
    
    if len(sys.argv) >= 3 and not sys.argv[1].startswith('sprint='):
        from_date = sys.argv[1]
        to_date = sys.argv[2]
        report_title = f"{from_date} to {to_date}"
        print(f"\nFetching issues updated between {from_date} and {to_date}...")
    elif len(sys.argv) == 2 and sys.argv[1].startswith('sprint='):
        sprint_name = sys.argv[1].replace('sprint=', '')
        report_title = f"Sprint {sprint_name}"
        print(f"\nFetching issues from sprint: {sprint_name}...")
    elif len(sys.argv) == 2:
        from_date = sys.argv[1]
        report_title = f"From {from_date}"
        print(f"\nFetching issues updated from {from_date}...")
    else:
        print(f"\n🔍 Fetching issues from current/open sprints...")
    
    # Get issues
    issues = get_sprint_issues_by_jql(session, from_date, to_date, sprint_name)
    
    if not issues:
        print("❌ No issues found")
        print("\nUsage:")
        print("  py sprint-tad-ts-report.py                           # Check current sprint")
        print("  py sprint-tad-ts-report.py sprint=26.1.1             # Check specific sprint by name")
        print("  py sprint-tad-ts-report.py 2025-12-01 2025-12-31    # Check date range")
        print("  py sprint-tad-ts-report.py 2025-12-01                # Check from date")
        return
    
    print(f"Found {len(issues)} issues")
    
    # Filter out bugs with Safe-SDLC activity = "QE Feature Testing", "QE Integration Testing", or "QE Regression Testing"
    filtered_out_count = 0
    filtered_issues = []
    excluded_activities = ['QE FEATURE TESTING', 'QE INTEGRATION TESTING', 'QE REGRESSION TESTING']
    
    for issue in issues:
        issue_type = issue['fields'].get('issuetype', {}).get('name', 'Unknown')
        
        # Check if it's a bug with excluded Safe-SDLC activities
        if issue_type == 'Bug':
            # Debug output for GET-68012
            if issue['key'] == 'GET-68012':
                print(f"\nDebugging GET-68012 fields:")
                for field_name, field_value in issue['fields'].items():
                    if field_value and ('sdlc' in field_name.lower() or 'activity' in field_name.lower() or 'custom' in field_name.lower()):
                        print(f"  {field_name}: {field_value}")
            
            # Check all custom fields for Safe-SDLC activity
            found_excluded_activity = False
            
            for field_name, field_value in issue['fields'].items():
                if field_value:
                    # Check dict values
                    if isinstance(field_value, dict):
                        value_str = str(field_value.get('value', '')).upper()
                        if any(activity in value_str for activity in excluded_activities):
                            found_excluded_activity = True
                            print(f"Filtering out {issue['key']}: {field_name} = {field_value.get('value')}")
                            break
                    # Check string values
                    elif isinstance(field_value, str):
                        value_str = field_value.upper()
                        if any(activity in value_str for activity in excluded_activities):
                            found_excluded_activity = True
                            print(f"Filtering out {issue['key']}: {field_name} = {field_value}")
                            break
            
            if found_excluded_activity:
                filtered_out_count += 1
                continue
        
        filtered_issues.append(issue)
    
    if filtered_out_count > 0:
        print(f"Filtered out {filtered_out_count} bugs with Safe-SDLC activity = 'QE Feature Testing', 'QE Integration Testing', or 'QE Regression Testing'")
    
    print(f"Processing {len(filtered_issues)} issues")
    print(f"Checking TAD/TS deliverables for each issue...\n")
    
    # Process each issue
    issues_data = []
    issues = filtered_issues  # Use filtered list
    
    for idx, issue in enumerate(issues, 1):
        key = issue['key']
        fields = issue['fields']
        
        print(f"  [{idx}/{len(issues)}] Checking {key}...", end="\r")
        
        # Extract description and issue type
        description = fields.get('description', '')
        issue_type = fields.get('issuetype', {}).get('name', 'Unknown')
        
        # Only check for TAD/TS PRs if issue type is Bug or Story
        if issue_type in ['Bug', 'Story']:
            deliverables = check_deliverables(session, key, issue['id'], description)
        else:
            # Skip PR check for other types (Sub-task, etc.)
            deliverables = {
                'tad_found': False,
                'ts_found': False,
                'tad_pr': None,
                'ts_pr': None,
                'total_prs': 0
            }
        
        # Extract team name from customfield_13392
        team = 'Unknown Team'
        if fields.get('customfield_13392'):
            team_field = fields['customfield_13392']
            if isinstance(team_field, dict):
                team = team_field.get('value', 'Unknown Team')
            else:
                team = str(team_field)
        
        # Apply team name mapping
        team = map_team_name(team)
        
        # Extract sprint information - try both sprint fields
        sprint_names = []
        sprints = fields.get('sprint') or fields.get('customfield_10004')
        if sprints:
            if isinstance(sprints, list):
                for sprint in sprints:
                    if isinstance(sprint, dict) and 'name' in sprint:
                        sprint_names.append(sprint['name'])
                    elif isinstance(sprint, str):
                        sprint_names.append(sprint)
            elif isinstance(sprints, dict) and 'name' in sprints:
                sprint_names.append(sprints['name'])
            elif isinstance(sprints, str):
                sprint_names.append(sprints)
        
        issues_data.append({
            'key': key,
            'summary': fields.get('summary', 'No summary'),
            'type': issue_type,
            'team': team,
            'status': fields.get('status', {}).get('name', 'Unknown'),
            'assignee': fields.get('assignee', {}).get('displayName', 'Unassigned') if fields.get('assignee') else 'Unassigned',
            'sprint': ', '.join(sprint_names) if sprint_names else 'No Sprint',
            'tad_found': deliverables['tad_found'],
            'ts_found': deliverables['ts_found'],
            'tad_pr': deliverables['tad_pr'],
            'ts_pr': deliverables['ts_pr'],
            'total_prs': deliverables['total_prs'],
            'tad_source': deliverables.get('tad_source'),
            'ts_source': deliverables.get('ts_source'),
            'tad_desc_links': deliverables.get('tad_desc_links', []),
            'ts_desc_links': deliverables.get('ts_desc_links', []),
            'tad_na': deliverables.get('tad_na', False),
            'tad_na_comment': deliverables.get('tad_na_comment'),
            'ts_na': deliverables.get('ts_na', False),
            'ts_na_comment': deliverables.get('ts_na_comment')
        })
    
    print()  # New line after progress
    
    # Filter to only include Bug and Story types in the report
    filtered_issues_data = [issue for issue in issues_data if issue['type'] in ['Bug', 'Story']]
    
    # Filter to only include the 6 target teams
    target_teams = set(TEAM_MAPPING.values())
    team_filtered_data = [issue for issue in filtered_issues_data if issue['team'] in target_teams]
    
    print(f"ℹ️  Filtered to {len(filtered_issues_data)} Bug/Story issues out of {len(issues_data)} total issues")
    print(f"ℹ️  Filtered to {len(team_filtered_data)} issues from {len(target_teams)} target teams")
    
    # Check comments for N/A status on filtered issues (Stories only)
    team_filtered_data = check_comments_for_filtered_issues(session, team_filtered_data, sprint_name)
    
    # Generate report
    generate_report(session, report_title, team_filtered_data)

if __name__ == "__main__":
    main()
