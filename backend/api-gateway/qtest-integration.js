/**
 * qTest Integration Service
 * Manages fetching and caching test case data from qTest API
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// qTest Configuration
const QTEST_CONFIG = {
  url: 'https://wk.qtestnet.com/api/v3',
  projectId: 114345,
  token: process.env.QTEST_API_TOKEN || 'd52ca8d3-d69b-40e8-a3bd-dde6e77fe92d',
  sprints: {
    '26.1.1': 68209713,
    '26.1.2': 68209714,
    '26.1.3': 68209719,
  }
};

// Cache file location
const cacheDir = path.join(__dirname, '.qtest-cache');
const getCacheFile = (sprintId) => path.join(cacheDir, `qtest-sprint-${sprintId}.json`);

/**
 * Ensure cache directory exists
 */
const ensureCacheDir = () => {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
};

/**
 * Get headers for qTest API
 */
const getHeaders = () => ({
  'Authorization': `Bearer ${QTEST_CONFIG.token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

/**
 * Make HTTPS request to qTest API
 */
const makeRequest = (endpoint, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, QTEST_CONFIG.url);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: getHeaders()
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
};

/**
 * Get module structure
 */
const getModuleStructure = async (moduleId) => {
  try {
    const endpoint = `/projects/${QTEST_CONFIG.projectId}/modules/${moduleId}?expand=descendants`;
    return await makeRequest(endpoint);
  } catch (error) {
    console.error(`Error fetching module structure: ${error.message}`);
    return null;
  }
};

/**
 * Get test cases from a module
 */
const getTestCases = async (parentId, page = 1, pageSize = 100) => {
  try {
    const endpoint = `/projects/${QTEST_CONFIG.projectId}/test-cases?parentId=${parentId}&page=${page}&size=${pageSize}`;
    const response = await makeRequest(endpoint);
    return Array.isArray(response) ? response : response.items || [];
  } catch (error) {
    console.error(`Error fetching test cases: ${error.message}`);
    return [];
  }
};

/**
 * Get test case attachments
 */
const getTestCaseAttachments = async (testCaseId) => {
  try {
    const endpoint = `/projects/${QTEST_CONFIG.projectId}/test-cases/${testCaseId}/attachments`;
    const response = await makeRequest(endpoint);
    return Array.isArray(response) ? response : response.items || [];
  } catch {
    return [];
  }
};

/**
 * Get all test cases from module recursively
 */
const getAllTestCasesFromModule = async (moduleId, teamName) => {
  let allTestCases = [];
  let page = 1;

  while (true) {
    const testCases = await getTestCases(moduleId, page);
    if (!testCases || testCases.length === 0) break;

    testCases.forEach(tc => {
      tc.team = teamName;
    });

    allTestCases = allTestCases.concat(testCases);

    if (testCases.length < 100) break;
    page++;
  }

  return allTestCases;
};

/**
 * Process module recursively
 */
const processModuleRecursive = async (module, teamName) => {
  let allTestCases = [];
  const moduleId = module.id;

  // Get test cases from this module
  const testCases = await getAllTestCasesFromModule(moduleId, teamName);
  allTestCases = allTestCases.concat(testCases);

  // Process children recursively
  const children = module.children || [];
  for (const child of children) {
    const childTestCases = await processModuleRecursive(child, teamName);
    allTestCases = allTestCases.concat(childTestCases);
  }

  return allTestCases;
};

/**
 * Analyze test cases
 */
const analyzeTestCases = async (testCases, checkAttachments = false) => {
  const teamStats = {};

  for (const tc of testCases) {
    const team = tc.team || 'Unknown';
    if (!teamStats[team]) {
      teamStats[team] = {
        total: 0,
        automated: 0,
        with_attachments: 0,
        without_attachments: 0,
        test_cases: []
      };
    }

    teamStats[team].total++;

    // Check if automated
    let isAutomated = false;
    const props = tc.properties || [];
    for (const prop of props) {
      if (prop.field_name === 'Automation' && prop.field_value === '711') {
        isAutomated = true;
        break;
      }
    }

    if (isAutomated) {
      teamStats[team].automated++;
    }

    // Check attachments
    let hasAttachment = false;
    if (checkAttachments && isAutomated && tc.id) {
      try {
        const attachments = await getTestCaseAttachments(tc.id);
        hasAttachment = attachments && attachments.length > 0;
      } catch {
        hasAttachment = false;
      }
    }

    if (isAutomated) {
      if (hasAttachment) {
        teamStats[team].with_attachments++;
      } else {
        teamStats[team].without_attachments++;
      }
    }

    teamStats[team].test_cases.push({
      id: tc.pid,
      qtest_id: tc.id,
      name: tc.name,
      automated: isAutomated,
      has_attachment: hasAttachment
    });
  }

  return teamStats;
};

/**
 * Fetch sprint test cases
 */
export const fetchSprintTestCases = async (sprintName, checkAttachments = false) => {
  const moduleId = QTEST_CONFIG.sprints[sprintName];
  if (!moduleId) {
    throw new Error(`Unknown sprint: ${sprintName}`);
  }

  // Check cache first
  const cacheFile = getCacheFile(sprintName);
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    // Return cached data if not too old (24 hours)
    if (Date.now() - cached.timestamp < 86400000) {
      return cached.data;
    }
  }

  console.log(`Fetching test cases for Sprint ${sprintName}...`);

  const module = await getModuleStructure(moduleId);
  if (!module) {
    throw new Error('Could not fetch module structure');
  }

  let allTestCases = [];
  const children = module.children || [];

  if (children.length > 0) {
    for (const child of children) {
      const teamTestCases = await processModuleRecursive(child, child.name);
      allTestCases = allTestCases.concat(teamTestCases);
    }
  } else {
    const testCases = await getAllTestCasesFromModule(moduleId, 'All Teams');
    allTestCases = allTestCases.concat(testCases);
  }

  const teamStats = await analyzeTestCases(allTestCases, checkAttachments);

  // Calculate totals
  const totals = {
    total: Object.values(teamStats).reduce((sum, team) => sum + team.total, 0),
    automated: Object.values(teamStats).reduce((sum, team) => sum + team.automated, 0),
    with_attachments: Object.values(teamStats).reduce((sum, team) => sum + team.with_attachments, 0),
    without_attachments: Object.values(teamStats).reduce((sum, team) => sum + team.without_attachments, 0)
  };

  const result = {
    sprint_name: sprintName,
    module_id: moduleId,
    generated: new Date().toISOString(),
    totals,
    teams: teamStats
  };

  // Cache the result
  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    data: result
  }, null, 2));

  return result;
};

/**
 * Get cached data
 */
export const getCachedSprintData = (sprintName) => {
  const cacheFile = getCacheFile(sprintName);
  if (fs.existsSync(cacheFile)) {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return cached.data;
  }
  return null;
};

/**
 * Clear cache
 */
export const clearCache = () => {
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
  }
};

export default {
  fetchSprintTestCases,
  getCachedSprintData,
  clearCache,
  QTEST_CONFIG
};
