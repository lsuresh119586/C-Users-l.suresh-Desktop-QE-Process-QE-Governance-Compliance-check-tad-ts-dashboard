#!/usr/bin/env python3
"""
Polaris Data Integration Service

Orchestrates data collection from Jira, QTest, and Bitbucket to populate
the Polaris ELM Metrics Dashboard.

Phase 1 Week 2 Scope:
- Fetch Jira stories and defects
- Extract TAD/TS status via Jira MCP Server
- Transform to metrics
- Push to Polaris API Gateway
"""

import os
import sys
import json
import logging
import subprocess
import time
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'integration_service.log')

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
JIRA_MCP_SERVER_PATH = os.getenv('JIRA_MCP_SERVER_PATH')
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
JIRA_BASE_URL = os.getenv('JIRA_BASE_URL')
JIRA_PROJECT_KEY = os.getenv('JIRA_PROJECT_KEY', 'ELM')
POLARIS_API_URL = os.getenv('POLARIS_API_URL', 'http://localhost:3000/api')


class JiraMCPClient:
    """Client for interacting with Jira MCP Server via stdio."""
    
    def __init__(self, server_path: str):
        self.server_path = server_path
        self.env = os.environ.copy()
        self.env.update({
            'JIRA_API_TOKEN': JIRA_API_TOKEN,
            'JIRA_BASE_URL': JIRA_BASE_URL,
            'JIRA_PROJECT_KEY': JIRA_PROJECT_KEY,
            'NODE_TLS_REJECT_UNAUTHORIZED': '0'
        })
    
    def call_tool(self, tool_name: str, arguments: Dict) -> Dict:
        """Call an MCP tool via stdio communication."""
        try:
            # Prepare MCP request
            request_id = int(time.time() * 1000)
            mcp_request = {
                "jsonrpc": "2.0",
                "id": request_id,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments
                }
            }
            
            # Start MCP server process
            logger.debug(f"Starting MCP server: {self.server_path}")
            process = subprocess.Popen(
                ['node', self.server_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=self.env,
                text=True
            )
            
            # Send request
            request_json = json.dumps(mcp_request)
            logger.debug(f"MCP Request: {request_json}")
            stdout, stderr = process.communicate(input=request_json, timeout=30)
            
            if stderr:
                logger.warning(f"MCP stderr: {stderr}")
            
            # Parse response
            logger.debug(f"MCP Response: {stdout}")
            response = json.loads(stdout)
            
            if 'error' in response:
                raise Exception(f"MCP Error: {response['error']}")
            
            return response.get('result', {})
            
        except subprocess.TimeoutExpired:
            process.kill()
            raise Exception("MCP server timeout")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MCP response: {stdout}")
            raise Exception(f"Invalid JSON response: {e}")
        except Exception as e:
            logger.error(f"MCP client error: {e}")
            raise


class PolarisAPIClient:
    """Client for interacting with Polaris API Gateway."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
    
    def push_metrics(self, metrics: Dict) -> Dict:
        """Push metrics to Polaris API."""
        try:
            url = f"{self.base_url}/metrics"
            logger.info(f"Pushing metrics to {url}")
            
            response = self.session.post(
                url,
                json=metrics,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Metrics pushed successfully: ID {result.get('id')}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to push metrics: {e}")
            raise
    
    def get_teams(self) -> List[Dict]:
        """Fetch all teams from Polaris API."""
        try:
            url = f"{self.base_url}/teams"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch teams: {e}")
            return []
    
    def get_sprints(self) -> List[Dict]:
        """Fetch all sprints from Polaris API."""
        try:
            url = f"{self.base_url}/sprints"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch sprints: {e}")
            return []


class DataIntegrationService:
    """Main service for orchestrating data collection and transformation."""
    
    def __init__(self):
        self.jira_client = JiraMCPClient(JIRA_MCP_SERVER_PATH)
        self.polaris_client = PolarisAPIClient(POLARIS_API_URL)
    
    def fetch_jira_stories(self, team_id: int, sprint_name: str) -> List[Dict]:
        """Fetch Jira stories for a team and sprint."""
        try:
            logger.info(f"Fetching Jira stories for team {team_id}, sprint {sprint_name}")
            
            # Use Jira MCP get_my_issues tool with JQL filter
            # Note: In real implementation, need to map team_id to Jira team name/field
            # For now, using simplified approach
            result = self.jira_client.call_tool(
                'get_my_issues',
                {
                    'maxResults': 50,
                    'status': 'all'  # Get all statuses
                }
            )
            
            # Parse result
            stories = []
            if isinstance(result, dict) and 'content' in result:
                # MCP returns text content, need to parse
                logger.debug(f"Raw MCP response: {result}")
                # For Phase 1, return empty list - will implement full parsing later
                logger.warning("Story parsing not yet implemented, returning empty list")
            
            return stories
            
        except Exception as e:
            logger.error(f"Error fetching Jira stories: {e}")
            return []
    
    def fetch_tad_ts_status(self, story_key: str) -> Dict[str, str]:
        """Fetch TAD/TS status for a story via Jira MCP."""
        try:
            logger.info(f"Fetching TAD/TS status for {story_key}")
            
            # Call TAD tool
            tad_result = self.jira_client.call_tool(
                'get_tad_document',
                {'issueKey': story_key}
            )
            
            tad_status = 'N/A'
            if isinstance(tad_result, dict):
                content = tad_result.get('content', [])
                if content and len(content[0].get('text', '')) > 100:
                    tad_status = 'Complete'
                elif content:
                    tad_status = 'Incomplete'
            
            # Call TS tool
            ts_result = self.jira_client.call_tool(
                'get_test_strategy',
                {'issueKey': story_key}
            )
            
            ts_status = 'N/A'
            if isinstance(ts_result, dict):
                content = ts_result.get('content', [])
                if content and len(content[0].get('text', '')) > 100:
                    ts_status = 'Complete'
                elif content:
                    ts_status = 'Incomplete'
            
            return {
                'tadStatus': tad_status,
                'tsStatus': ts_status
            }
            
        except Exception as e:
            logger.error(f"Error fetching TAD/TS for {story_key}: {e}")
            return {'tadStatus': 'N/A', 'tsStatus': 'N/A'}
    
    def fetch_defects(self, team_id: int, sprint_name: str) -> List[Dict]:
        """Fetch defects for a team and sprint."""
        # Phase 1: Return mock data, implement in Phase 2
        logger.info(f"Fetching defects for team {team_id}, sprint {sprint_name}")
        logger.warning("Defect fetching not yet implemented, returning empty list")
        return []
    
    def transform_to_metrics(self, stories: List[Dict], test_cases: List[Dict], 
                            defects: List[Dict]) -> Dict:
        """Transform raw data into metrics format."""
        
        # Calculate TAD/TS metrics
        tad_complete = sum(1 for s in stories if s.get('tadStatus') == 'Complete')
        tad_na = sum(1 for s in stories if s.get('tadStatus') == 'N/A')
        tad_missing = len(stories) - tad_complete - tad_na
        
        ts_complete = sum(1 for s in stories if s.get('tsStatus') == 'Complete')
        ts_na = sum(1 for s in stories if s.get('tsStatus') == 'N/A')
        ts_missing = len(stories) - ts_complete - ts_na
        
        total_tad = tad_complete + tad_missing  # Exclude N/A
        total_ts = ts_complete + ts_missing
        
        # Calculate test case metrics
        automated = sum(1 for tc in test_cases if tc.get('automation_status') == 'Automated')
        manual = len(test_cases) - automated
        total_tests = len(test_cases)
        
        # Calculate defect metrics
        reopened = sum(1 for d in defects if d.get('reopened'))
        
        metrics = {
            'tadTsMetrics': {
                'totalStories': len(stories),
                'tadComplete': tad_complete,
                'tadNa': tad_na,
                'tadMissing': tad_missing,
                'tadPct': round((tad_complete / total_tad * 100) if total_tad > 0 else 0, 1),
                'tsComplete': ts_complete,
                'tsNa': ts_na,
                'tsMissing': ts_missing,
                'tsPct': round((ts_complete / total_ts * 100) if total_ts > 0 else 0, 1)
            },
            'qtestMetrics': {
                'uniqueTestCases': total_tests,
                'automatedTestCases': automated,
                'manualTestCases': manual,
                'automationPct': round((automated / total_tests * 100) if total_tests > 0 else 0, 1),
                'totalTestRuns': 0  # Not available yet
            },
            'defectMetrics': {
                'totalDefects': len(defects),
                'reopenedDefects': reopened,
                'reopenedPct': round((reopened / len(defects) * 100) if len(defects) > 0 else 0, 1),
                'bySeverity': {},
                'bySdlc': {}
            }
        }
        
        return metrics
    
    def sync_team_sprint_metrics(self, team_id: int, sprint_id: int, sprint_name: str) -> Optional[Dict]:
        """Sync metrics for a specific team and sprint."""
        try:
            logger.info(f"========== Syncing metrics for Team {team_id}, Sprint {sprint_name} ==========")
            
            # Step 1: Fetch stories
            stories = self.fetch_jira_stories(team_id, sprint_name)
            logger.info(f"✓ Fetched {len(stories)} stories")
            
            # Step 2: Fetch TAD/TS status for each story
            for story in stories:
                tad_ts = self.fetch_tad_ts_status(story['key'])
                story['tadStatus'] = tad_ts['tadStatus']
                story['tsStatus'] = tad_ts['tsStatus']
            logger.info(f"✓ Fetched TAD/TS status for {len(stories)} stories")
            
            # Step 3: Fetch test cases (Phase 2)
            test_cases = []
            logger.info(f"⏸️ Test case fetching not implemented yet")
            
            # Step 4: Fetch defects
            defects = self.fetch_defects(team_id, sprint_name)
            logger.info(f"✓ Fetched {len(defects)} defects")
            
            # Step 5: Transform to metrics
            metrics = self.transform_to_metrics(stories, test_cases, defects)
            metrics['teamId'] = team_id
            metrics['sprintId'] = sprint_id
            logger.info(f"✓ Transformed data to metrics")
            
            # Step 6: Push to API
            result = self.polaris_client.push_metrics(metrics)
            logger.info(f"✓ Metrics pushed successfully: {result}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error syncing team {team_id}, sprint {sprint_id}: {e}", exc_info=True)
            return None
    
    def sync_all_teams(self):
        """Sync metrics for all teams and active sprints."""
        logger.info("=" * 80)
        logger.info("Starting full sync for all teams")
        logger.info("=" * 80)
        
        # Fetch teams and sprints from Polaris API
        teams = self.polaris_client.get_teams()
        sprints = self.polaris_client.get_sprints()
        
        if not teams:
            logger.error("No teams found, aborting sync")
            return
        
        if not sprints:
            logger.error("No sprints found, aborting sync")
            return
        
        # Get active sprint (status = 'active')
        active_sprint = next((s for s in sprints if s.get('status') == 'active'), None)
        if not active_sprint:
            logger.warning("No active sprint found, using first sprint")
            active_sprint = sprints[0]
        
        logger.info(f"Active sprint: {active_sprint['name']} (ID: {active_sprint['id']})")
        logger.info(f"Teams to sync: {len(teams)}")
        
        # Sync each team
        success_count = 0
        for team in teams:
            team_id = team['id']
            team_name = team['displayName']
            
            logger.info(f"\n--- Syncing {team_name} (ID: {team_id}) ---")
            
            result = self.sync_team_sprint_metrics(
                team_id,
                active_sprint['id'],
                active_sprint['name']
            )
            
            if result:
                success_count += 1
        
        logger.info("=" * 80)
        logger.info(f"Sync complete: {success_count}/{len(teams)} teams synced successfully")
        logger.info("=" * 80)


def main():
    """Main entry point."""
    logger.info("🚀 Polaris Data Integration Service Starting...")
    
    # Validate configuration
    if not JIRA_MCP_SERVER_PATH:
        logger.error("JIRA_MCP_SERVER_PATH not configured")
        sys.exit(1)
    
    if not os.path.exists(JIRA_MCP_SERVER_PATH):
        logger.error(f"Jira MCP server not found at: {JIRA_MCP_SERVER_PATH}")
        sys.exit(1)
    
    logger.info(f"Jira MCP Server: {JIRA_MCP_SERVER_PATH}")
    logger.info(f"Polaris API: {POLARIS_API_URL}")
    
    # Initialize service
    service = DataIntegrationService()
    
    # Run initial sync
    logger.info("Running initial sync...")
    service.sync_all_teams()
    
    logger.info("✅ Initial sync complete. Service ready.")
    logger.info("💡 To run periodic sync, implement schedule.every().minutes.do()")


if __name__ == "__main__":
    main()
