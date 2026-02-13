import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import https from 'https';
import { getSprintDefectsData } from './sample-tadts-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'db.json');

// QTest API configuration
const QTEST_CONFIG = {
  baseUrl: 'https://wk.qtestnet.com/api/v3',
  projectId: '114345',
  apiToken: process.env.QTEST_API_TOKEN || '',
  // Sprint name to QTest project ID mapping
  sprintMapping: {
    '26.1.1': 68209713,
    '26.1.2': 68209714,
    '26.1.3': 68209719,
    '26.1.4': 68289134,
    '26.1.5': 68341069,
    '26.1.6': 68341070,
    'chargers-26.1.1': 68209713,
    'chargers-26.1.2': 68209714,
    'chargers-26.1.3': 68209719,
    'chargers-26.1.4': 68289134,
    'chargers-26.1.5': 68341069,
    'chargers-26.1.6': 68341070
  }
};

// Fetch data from QTest API
const fetchQTestData = (apiUrl, method = 'GET') => {
  return new Promise((resolve, reject) => {
    if (!QTEST_CONFIG.apiToken) {
      reject(new Error('QTEST_API_TOKEN environment variable not set'));
      return;
    }

    console.log(`[fetchQTest] URL: ${apiUrl}`);
    console.log(`[fetchQTest] Token: ${QTEST_CONFIG.apiToken.substring(0, 20)}...`);

    const urlObj = new URL(apiUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${QTEST_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'QTest-Dashboard/1.0'
      }
    };

    console.log(`[fetchQTest] Headers:`, JSON.stringify(options.headers, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      console.log(`[fetchQTest] Response status: ${res.statusCode}`);
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[fetchQTest] Parsed successfully. Keys: ${Object.keys(parsed).join(', ')}`);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse QTest response: ${err.message}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[fetchQTest] Request error:`, e.message);
      reject(e);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('QTest API request timeout'));
    });
    req.end();
  });
};

// Aggregate test case metrics from QTest data
const aggregateTestMetrics = (testCases, sprintName) => {
  const totals = {
    total: testCases.length,
    automated: 0,
    with_attachments: 0,
    without_attachments: 0
  };

  const teams = {};

  testCases.forEach(tc => {
    // Count automated test cases
    if (tc.automation_status === 'AUTOMATED' || tc.automated === true) {
      totals.automated++;
    }

    // Count test cases with attachments
    if (tc.attachments && tc.attachments.length > 0) {
      totals.with_attachments++;
    }

    // Group by team/module
    const team = tc.assigned_team || tc.team || 'Unassigned';
    if (!teams[team]) {
      teams[team] = {
        total_test_cases: 0,
        automated_test_cases: 0,
        with_attachments: 0
      };
    }
    teams[team].total_test_cases++;

    if (tc.automation_status === 'AUTOMATED' || tc.automated === true) {
      teams[team].automated_test_cases++;
    }

    if (tc.attachments && tc.attachments.length > 0) {
      teams[team].with_attachments++;
    }
  });

  totals.without_attachments = Math.max(0, totals.automated - totals.with_attachments);

  return { sprint: sprintName, totals, teams };
};

const parseJson = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const readDatabase = () => {
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database:', err.message);
  }
  return null;
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err.message);
    return false;
  }
};

// Default data structure
const defaultData = {
  products: [
    { id: 'passport', name: 'Passport' },
    { id: 't360', name: 'T360' },
    { id: 'dna', name: 'DnA' },
    { id: 'collaboration-portal', name: 'Collaboration Portal' }
  ],
  teams: [
    // Passport teams
    { id: 'team-a', name: 'Team A', product: 'passport' },
    { id: 'team-b', name: 'Team B', product: 'passport' },
    { id: 'team-c', name: 'Team C', product: 'passport' },
    
    // T360 teams
    { id: 'vanguards', name: 'Vanguards', product: 't360' },
    { id: 'chargers', name: 'Chargers', product: 't360' },
    { id: 'chubb', name: 'Chubb', product: 't360' },
    { id: 'matrix', name: 'Matrix', product: 't360' },
    { id: 'mavericks', name: 'Mavericks', product: 't360' },
    { id: 'nexus', name: 'Nexus', product: 't360' }
  ],
  sprints: [
    // Passport sprints
    { id: 'team-a-25.1.1', name: 'Sprint 25.1.1', team: 'team-a' },
    { id: 'team-a-25.1.2', name: 'Sprint 25.1.2', team: 'team-a' },
    
    // T360 - Vanguards sprints
    { id: 'vanguards-26.1.2', name: 'Sprint 26.1.2', team: 'vanguards' },
    { id: 'vanguards-26.1.3', name: 'Sprint 26.1.3', team: 'vanguards' },
    { id: 'vanguards-26.1.4', name: 'Sprint 26.1.4', team: 'vanguards' },
    { id: 'vanguards-26.1.5', name: 'Sprint 26.1.5', team: 'vanguards' },
    { id: 'vanguards-26.1.6', name: 'Sprint 26.1.6', team: 'vanguards' },
    
    // T360 - Chargers sprints
    { id: 'chargers-26.1.1', name: 'Sprint 26.1.1', team: 'chargers' },
    { id: 'chargers-26.1.2', name: 'Sprint 26.1.2', team: 'chargers' },
    { id: 'chargers-26.1.3', name: 'Sprint 26.1.3', team: 'chargers' },
    { id: 'chargers-26.1.4', name: 'Sprint 26.1.4', team: 'chargers' },
    { id: 'chargers-26.1.5', name: 'Sprint 26.1.5', team: 'chargers' },
    { id: 'chargers-26.1.6', name: 'Sprint 26.1.6', team: 'chargers' },
    
    // T360 - Chubb sprints
    { id: 'chubb-26.1.1', name: 'Sprint 26.1.1', team: 'chubb' },
    { id: 'chubb-26.1.2', name: 'Sprint 26.1.2', team: 'chubb' },
    { id: 'chubb-26.1.3', name: 'Sprint 26.1.3', team: 'chubb' },
    { id: 'chubb-26.1.4', name: 'Sprint 26.1.4', team: 'chubb' },
    { id: 'chubb-26.1.5', name: 'Sprint 26.1.5', team: 'chubb' },
    { id: 'chubb-26.1.6', name: 'Sprint 26.1.6', team: 'chubb' },
    
    // T360 - Matrix sprints
    { id: 'matrix-26.1.1', name: 'Sprint 26.1.1', team: 'matrix' },
    { id: 'matrix-26.1.2', name: 'Sprint 26.1.2', team: 'matrix' },
    { id: 'matrix-26.1.3', name: 'Sprint 26.1.3', team: 'matrix' },
    { id: 'matrix-26.1.4', name: 'Sprint 26.1.4', team: 'matrix' },
    { id: 'matrix-26.1.5', name: 'Sprint 26.1.5', team: 'matrix' },
    { id: 'matrix-26.1.6', name: 'Sprint 26.1.6', team: 'matrix' },
    
    // T360 - Mavericks sprints
    { id: 'mavericks-26.1.1', name: 'Sprint 26.1.1', team: 'mavericks' },
    { id: 'mavericks-26.1.2', name: 'Sprint 26.1.2', team: 'mavericks' },
    { id: 'mavericks-26.1.3', name: 'Sprint 26.1.3', team: 'mavericks' },
    { id: 'mavericks-26.1.4', name: 'Sprint 26.1.4', team: 'mavericks' },
    { id: 'mavericks-26.1.5', name: 'Sprint 26.1.5', team: 'mavericks' },
    { id: 'mavericks-26.1.6', name: 'Sprint 26.1.6', team: 'mavericks' },
    
    // T360 - Nexus sprints
    { id: 'nexus-26.1.1', name: 'Sprint 26.1.1', team: 'nexus' },
    { id: 'nexus-26.1.2', name: 'Sprint 26.1.2', team: 'nexus' },
    { id: 'nexus-26.1.3', name: 'Sprint 26.1.3', team: 'nexus' },
    { id: 'nexus-26.1.4', name: 'Sprint 26.1.4', team: 'nexus' },
    { id: 'nexus-26.1.5', name: 'Sprint 26.1.5', team: 'nexus' },
    { id: 'nexus-26.1.6', name: 'Sprint 26.1.6', team: 'nexus' }
  ],
  metrics: [
    // Passport Team A Sprint 25.1.1
    {
      id: 'metric-team-a-25.1.1',
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-25.1.1',
      requirementsCovered: 95,
      testsCovered: 92,
      defectsOpen: 3,
      defectsClosed: 18,
      deploymentReadiness: 90,
      codeQuality: 88,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // Passport Team A Sprint 25.1.2
    {
      id: 'metric-team-a-25.1.2',
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-25.1.2',
      requirementsCovered: 93,
      testsCovered: 90,
      defectsOpen: 5,
      defectsClosed: 20,
      deploymentReadiness: 87,
      codeQuality: 85,
      timestamp: '2025-01-16T10:00:00Z'
    },
    
    // T360 - Vanguards Sprint 26.1.2
    {
      id: 'metric-vanguards-26.1.2',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.2',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 22,
      deploymentReadiness: 88,
      codeQuality: 83,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.3
    {
      id: 'metric-vanguards-26.1.3',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.3',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 24,
      deploymentReadiness: 90,
      codeQuality: 86,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.4
    {
      id: 'metric-vanguards-26.1.4',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.4',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 23,
      deploymentReadiness: 89,
      codeQuality: 84,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.5
    {
      id: 'metric-vanguards-26.1.5',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.5',
      requirementsCovered: 93,
      testsCovered: 88,
      defectsOpen: 3,
      defectsClosed: 26,
      deploymentReadiness: 91,
      codeQuality: 87,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.6
    {
      id: 'metric-vanguards-26.1.6',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.6',
      requirementsCovered: 94,
      testsCovered: 89,
      defectsOpen: 2,
      defectsClosed: 28,
      deploymentReadiness: 92,
      codeQuality: 88,
      timestamp: '2025-01-19T10:00:00Z'
    },
    
    // T360 - Chargers Sprint 26.1.1
    {
      id: 'metric-chargers-26.1.1',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.1',
      requirementsCovered: 88,
      testsCovered: 82,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 80,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.2
    {
      id: 'metric-chargers-26.1.2',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.2',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.3
    {
      id: 'metric-chargers-26.1.3',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.3',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.4
    {
      id: 'metric-chargers-26.1.4',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.4',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.5
    {
      id: 'metric-chargers-26.1.5',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.5',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 29,
      deploymentReadiness: 89,
      codeQuality: 85,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.6
    {
      id: 'metric-chargers-26.1.6',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.6',
      requirementsCovered: 93,
      testsCovered: 88,
      defectsOpen: 3,
      defectsClosed: 30,
      deploymentReadiness: 90,
      codeQuality: 86,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Chubb Sprint 26.1.1
    {
      id: 'metric-chubb-26.1.1',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.1',
      requirementsCovered: 87,
      testsCovered: 81,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 79,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.2
    {
      id: 'metric-chubb-26.1.2',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.2',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.3
    {
      id: 'metric-chubb-26.1.3',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.3',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.4
    {
      id: 'metric-chubb-26.1.4',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.4',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.5
    {
      id: 'metric-chubb-26.1.5',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.5',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.6
    {
      id: 'metric-chubb-26.1.6',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.6',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 29,
      deploymentReadiness: 89,
      codeQuality: 85,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Matrix Sprint 26.1.1
    {
      id: 'metric-matrix-26.1.1',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.1',
      requirementsCovered: 86,
      testsCovered: 80,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 78,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.2
    {
      id: 'metric-matrix-26.1.2',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.2',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.3
    {
      id: 'metric-matrix-26.1.3',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.3',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.4
    {
      id: 'metric-matrix-26.1.4',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.4',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.5
    {
      id: 'metric-matrix-26.1.5',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.5',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.6
    {
      id: 'metric-matrix-26.1.6',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.6',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Mavericks Sprint 26.1.1
    {
      id: 'metric-mavericks-26.1.1',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.1',
      requirementsCovered: 85,
      testsCovered: 79,
      defectsOpen: 11,
      defectsClosed: 22,
      deploymentReadiness: 82,
      codeQuality: 77,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.2
    {
      id: 'metric-mavericks-26.1.2',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.2',
      requirementsCovered: 86,
      testsCovered: 81,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 79,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.3
    {
      id: 'metric-mavericks-26.1.3',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.3',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.4
    {
      id: 'metric-mavericks-26.1.4',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.4',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.5
    {
      id: 'metric-mavericks-26.1.5',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.5',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.6
    {
      id: 'metric-mavericks-26.1.6',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.6',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Nexus Sprint 26.1.1
    {
      id: 'metric-nexus-26.1.1',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.1',
      requirementsCovered: 84,
      testsCovered: 78,
      defectsOpen: 12,
      defectsClosed: 21,
      deploymentReadiness: 81,
      codeQuality: 76,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.2
    {
      id: 'metric-nexus-26.1.2',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.2',
      requirementsCovered: 85,
      testsCovered: 80,
      defectsOpen: 11,
      defectsClosed: 22,
      deploymentReadiness: 82,
      codeQuality: 78,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.3
    {
      id: 'metric-nexus-26.1.3',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.3',
      requirementsCovered: 86,
      testsCovered: 81,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 79,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.4
    {
      id: 'metric-nexus-26.1.4',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.4',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.5
    {
      id: 'metric-nexus-26.1.5',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.5',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.6
    {
      id: 'metric-nexus-26.1.6',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.6',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-20T10:00:00Z'
    }
  ]
};

// Initialize database if it doesn't exist
const initDatabase = () => {
  let db = readDatabase();
  if (!db) {
    console.log('📝 Creating database with default data...');
    db = defaultData;
    writeDatabase(db);
    console.log('✅ Database initialized successfully');
  }
  return db;
};

// Start server
const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const db = readDatabase();

  // GET /api/products
  if (pathname === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.products));
    return;
  }

  // GET /api/teams
  if (pathname === '/api/teams' && req.method === 'GET') {
    const { product } = query;
    let teams = db.teams;
    
    if (product) {
      teams = teams.filter(t => t.product === product);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(teams));
    return;
  }

  // GET /api/sprints
  if (pathname === '/api/sprints' && req.method === 'GET') {
    const { team } = query;
    let sprints = db.sprints;
    
    if (team) {
      sprints = sprints.filter(s => s.team === team);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sprints));
    return;
  }

  // GET /api/metrics
  if (pathname === '/api/metrics' && req.method === 'GET') {
    const { product, team, sprint } = query;
    let metrics = db.metrics;
    
    if (product) {
      metrics = metrics.filter(m => m.product === product);
    }
    if (team) {
      metrics = metrics.filter(m => m.team === team);
    }
    if (sprint) {
      metrics = metrics.filter(m => m.sprint === sprint);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
    return;
  }

  // GET /api/qtest/sprint/:sprint - Get test case metrics from QTest API (live data)
  if (req.method === 'GET' && req.url.startsWith('/api/qtest/sprint/')) {
    try {
      // Extract sprint name from URL path: /api/qtest/sprint/26.1.2
      const pathParts = req.url.split('/');
      const sprintName = pathParts[pathParts.length - 1].split('?')[0]; // Remove query params if any
      const useBackup = req.url.includes('?backup=true');
      
      if (!sprintName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'sprint name required' }));
        return;
      }

      // Function to handle request
      const handleQTestRequest = async () => {
        try {
          // PRIORITY 1: Use mock data from db.json (has proper team breakdown)
          console.log(`[QTest] Loading mock data for sprint ${sprintName}`);
          const testsCovered = db.tests_covered || {};
          let sprintData = testsCovered[sprintName];

          // If mock data exists and has teams with test cases, use it
          if (sprintData && sprintData.teams && Object.keys(sprintData.teams).length > 0) {
            console.log(`[QTest] ✓ Found mock data with ${Object.keys(sprintData.teams).length} teams`);
            const summary = sprintData.summary || {};
            const response = {
              sprint: sprintName,
              totals: {
                total: summary.total_test_cases || 0,
                automated: summary.total_automated || 0,
                with_attachments: summary.total_with_attachments || 0,
                without_attachments: Math.max(0, (summary.total_automated || 0) - (summary.total_with_attachments || 0))
              },
              teams: sprintData.teams || {},
              source: 'mock-data'
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
            return;
          }

          // PRIORITY 2: Fall back to live QTest API if no mock data
          if (!useBackup && QTEST_CONFIG.apiToken) {
            const qTestSprintId = QTEST_CONFIG.sprintMapping[sprintName];
            if (qTestSprintId) {
              try {
                console.log(`[QTest] No mock data found, fetching live data for sprint ${sprintName} (ID: ${qTestSprintId})`);
                // Use the working QTest API endpoint format
                const qTestUrl = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases?pageSize=500&sprintId=${qTestSprintId}`;
                const qTestData = await fetchQTestData(qTestUrl);
                
                console.log(`[QTest] Response type: ${Array.isArray(qTestData) ? 'Array' : typeof qTestData}, length: ${qTestData.length || Object.keys(qTestData).length}`);
                
                if (Array.isArray(qTestData) && qTestData.length > 0) {
                  console.log(`[QTest] ✓ Got ${qTestData.length} test cases from QTest API`);
                  const aggregated = aggregateTestMetrics(qTestData, sprintName);
                  aggregated.source = 'qtest-live';
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(aggregated, null, 2));
                  return;
                } else if (qTestData && qTestData.items && Array.isArray(qTestData.items)) {
                  console.log(`[QTest] ✓ Got ${qTestData.items.length} test cases (items format)`);
                  const aggregated = aggregateTestMetrics(qTestData.items, sprintName);
                  aggregated.source = 'qtest-live';
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(aggregated, null, 2));
                  return;
                }
              } catch (qtestErr) {
                console.warn(`[QTest] Live API error: ${qtestErr.message}`);
              }
            }
          }

          // PRIORITY 3: Return empty mock data if nothing else available
          if (!sprintData) {
            sprintData = {
              sprint: sprintName,
              summary: {
                total_test_cases: 0,
                total_automated: 0,
                total_with_attachments: 0
              },
              teams: {}
            };
          }

          const summary = sprintData.summary || {};
          const response = {
            sprint: sprintName,
            totals: {
              total: summary.total_test_cases || 0,
              automated: summary.total_automated || 0,
              with_attachments: summary.total_with_attachments || 0,
              without_attachments: Math.max(0, (summary.total_automated || 0) - (summary.total_with_attachments || 0))
            },
            teams: sprintData.teams || {},
            source: 'mock-data'
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response, null, 2));
        } catch (error) {
          console.error('[QTest] Error fetching sprint data:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message, source: 'error' }));
        }
      };

      handleQTestRequest();
    } catch (error) {
      console.error('Error in /api/qtest/sprint:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // POST /api/metrics
  if (pathname === '/api/metrics' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const data = parseJson(body);
      if (!data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      
      const metric = {
        id: `metric-${data.team}-${data.sprint}-${Date.now()}`,
        product: data.product,
        team: data.team,
        sprint: data.sprint,
        requirementsCovered: data.requirementsCovered || 0,
        testsCovered: data.testsCovered || 0,
        defectsOpen: data.defectsOpen || 0,
        defectsClosed: data.defectsClosed || 0,
        deploymentReadiness: data.deploymentReadiness || 0,
        codeQuality: data.codeQuality || 0,
        timestamp: new Date().toISOString()
      };
      
      db.metrics.push(metric);
      writeDatabase(db);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metric));
    });
    return;
  }

  // GET /api/defects/by-module - Get defects for a specific sprint
  if (req.method === 'GET' && req.url.startsWith('/api/defects/by-module')) {
    const urlObj = new url.URL(req.url, `http://${req.headers.host}`);
    const sprintName = urlObj.searchParams.get('sprint');
    
    if (!sprintName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    const defectData = getSprintDefectsData(sprintName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(defectData, null, 2));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize DB and start server
initDatabase();

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

const listener = server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/teams?product=<product-id>`);
  console.log(`   GET  /api/sprints?team=<team-id>`);
  console.log(`   GET  /api/metrics?product=<product-id>&team=<team-id>&sprint=<sprint-id>`);
  console.log(`   POST /api/metrics`);
  console.log(`   GET  /api/qtest/sprint/<sprint-name>`);
  console.log(`   GET  /api/defects/by-module?sprint=<sprint-name>`);
  console.log(`✅ Callback executed successfully - server should be listening`);
});

// Keep server alive and handle graceful shutdown
listener.keepAliveTimeout = 65000;
console.log(`⏳ Server object created, about to listen on port ${PORT}...`);
console.log(`✅ Listener configured - keeping process alive`);
process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM received, shutting down gracefully...');
  listener.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
