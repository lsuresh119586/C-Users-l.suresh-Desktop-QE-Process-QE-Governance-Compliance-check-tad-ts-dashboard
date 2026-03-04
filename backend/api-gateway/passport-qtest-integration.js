/**
 * Passport QTest Integration Service
 * 
 * Manages fetching automation coverage data from qTest for Passport teams.
 * Uses requirement-based linking (ELM cards → linked test cases) instead of
 * the module-based approach used by DnA/T360.
 * 
 * Key Differences from DnA/T360:
 * - Project IDs: 119791 (Passport), 123759 (Collaboration Portal)
 * - Requirement-based: search for ELM card, get linked test cases
 * - Different token: ***REMOVED_QTEST_TOKEN***
 * 
 * @see PASSPORT_QTEST_INTEGRATION.md for full documentation
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Passport qTest Configuration (separate from DnA/T360)
const PASSPORT_QTEST_CONFIG = {
  url: process.env.QTEST_URL || 'https://wk.qtestnet.com',
  apiBase: '/api/v3',
  token: process.env.QTEST_BEARER_TOKEN_PASSPORT || '***REMOVED_QTEST_TOKEN***',
  projects: {
    primary: {
      id: parseInt(process.env.QTEST_PROJECT_ID_PASSPORT) || 119791,
      name: 'Passport'
    },
    secondary: {
      id: parseInt(process.env.QTEST_PROJECT_ID_PASSPORT_SECONDARY) || 123759,
      name: 'Collaboration Portal'
    }
  },
  // Automation Status field ID in qTest
  automationStatusFieldId: 13104748,
  // Automation Tool field ID in qTest
  automationToolFieldId: 13593298,
  // Passport teams
  teams: ['PP Genesis', 'PP Pioneers', 'PP Spartacles'],
  // Sprints
  sprints: ['26.1.1', '26.1.2', '26.1.3', '26.1.4', '26.1.5', '26.1.IP']
};

// Cache directory for Passport qTest data
const cacheDir = path.join(__dirname, '.passport-qtest-cache');
const getCacheFile = (sprintName) => path.join(cacheDir, `passport-qtest-${sprintName}.json`);

/**
 * Ensure cache directory exists
 */
const ensureCacheDir = () => {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
};

/**
 * Get headers for Passport qTest API
 */
const getHeaders = () => ({
  'Authorization': `Bearer ${PASSPORT_QTEST_CONFIG.token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

/**
 * Make HTTPS request to qTest API with retry logic
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Request options
 * @param {number} retries - Number of retries
 * @returns {Promise<Object>}
 */
const makeRequest = async (endpoint, options = {}, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fullUrl = `${PASSPORT_QTEST_CONFIG.url}${PASSPORT_QTEST_CONFIG.apiBase}${endpoint}`;
      const url = new URL(fullUrl);
      
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 30000);

        const reqOptions = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: options.method || 'GET',
          headers: getHeaders()
        };

        const req = https.request(reqOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            clearTimeout(timeout);
            try {
              if (res.statusCode >= 400) {
                reject(new Error(`qTest API ${res.statusCode}: ${data}`));
              } else {
                resolve(JSON.parse(data));
              }
            } catch {
              resolve(data);
            }
          });
        });

        req.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });

        if (options.body) {
          req.write(JSON.stringify(options.body));
        }
        req.end();
      });
    } catch (error) {
      console.error(`[Passport qTest] Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
};

/**
 * Search for a requirement (ELM card) in qTest
 * @param {string} elmKey - ELM issue key (e.g., "ELM-39559")
 * @param {number} projectId - qTest project ID
 * @returns {Promise<Object|null>} Requirement object or null
 */
export const searchRequirement = async (elmKey, projectId) => {
  try {
    const endpoint = `/projects/${projectId}/search`;
    const body = {
      object_type: 'requirements',
      fields: ['id', 'pid', 'name'],
      query: `'name' ~ '${elmKey}'`
    };

    const response = await makeRequest(endpoint, { method: 'POST', body });
    const items = response.items || [];
    
    // Find exact match for ELM key
    return items.find(item => item.name && item.name.includes(elmKey)) || null;
  } catch (error) {
    console.error(`[Passport qTest] Error searching requirement ${elmKey}: ${error.message}`);
    return null;
  }
};

/**
 * Get test cases linked to a requirement
 * @param {number} requirementId - qTest requirement ID
 * @param {number} projectId - qTest project ID
 * @returns {Promise<Array>} Array of linked test cases
 */
export const getLinkedTestCases = async (requirementId, projectId) => {
  try {
    const endpoint = `/projects/${projectId}/linked-artifacts?type=requirements&ids=${requirementId}`;
    const response = await makeRequest(endpoint);
    
    // Response is array of objects with 'objects' array
    if (Array.isArray(response) && response.length > 0) {
      return response[0].objects || [];
    }
    return [];
  } catch (error) {
    console.error(`[Passport qTest] Error getting linked TCs for requirement ${requirementId}: ${error.message}`);
    return [];
  }
};

/**
 * Get test case details including automation properties
 * @param {number} testCaseId - qTest test case ID
 * @param {number} projectId - qTest project ID
 * @returns {Promise<Object|null>} Test case details or null
 */
export const getTestCaseDetails = async (testCaseId, projectId) => {
  try {
    const endpoint = `/projects/${projectId}/test-cases/${testCaseId}`;
    return await makeRequest(endpoint);
  } catch (error) {
    console.error(`[Passport qTest] Error getting TC details ${testCaseId}: ${error.message}`);
    return null;
  }
};

/**
 * Normalize automation status to standard values
 * @param {string} status - Raw automation status
 * @returns {string} Normalized status
 */
export const normalizeAutomationStatus = (status) => {
  if (!status) return 'Not Evaluated';
  
  const normalized = status.toLowerCase().trim();
  
  if (normalized.includes('automated') && !normalized.includes('partial') && !normalized.includes('not')) {
    return 'Automated';
  }
  if (normalized.includes('partial')) {
    return 'Partially Automated';
  }
  if (normalized.includes('manual')) {
    return 'Manual';
  }
  if (normalized.includes('not possible') || normalized.includes('cannot')) {
    return 'Not Possible';
  }
  if (normalized.includes('candidate')) {
    return 'Automation Candidate';
  }
  return 'Not Evaluated';
};

/**
 * Extract automation status from test case properties
 * @param {Array} properties - Test case properties array
 * @returns {Object} { status, tool }
 */
export const classifyAutomationStatus = (properties) => {
  let status = 'Not Evaluated';
  let tool = 'Unknown';

  if (!Array.isArray(properties)) return { status, tool };

  for (const prop of properties) {
    if (prop.field_id === PASSPORT_QTEST_CONFIG.automationStatusFieldId ||
        prop.field_name === 'Automation Status') {
      status = prop.field_value_name || prop.field_value || 'Not Evaluated';
    }
    if (prop.field_id === PASSPORT_QTEST_CONFIG.automationToolFieldId ||
        prop.field_name === 'Automation Tool') {
      tool = prop.field_value_name || prop.field_value || 'Unknown';
    }
  }

  return { status: normalizeAutomationStatus(status), tool };
};

/**
 * Build qTest URL for browser link
 * @param {number} testCaseId - Test case ID
 * @param {number} projectId - Project ID
 * @returns {string} qTest URL
 */
export const buildQTestUrl = (testCaseId, projectId) => {
  return `${PASSPORT_QTEST_CONFIG.url}/p/${projectId}/portal/project#tab=testdesign&object=1&id=${testCaseId}`;
};

/**
 * Process a single ELM card to get its test coverage
 * @param {string} elmKey - ELM issue key
 * @param {string} team - Team name
 * @returns {Promise<Object>} Coverage data for the ELM card
 */
export const processElmCard = async (elmKey, team) => {
  const result = {
    elmKey,
    team,
    qtestSource: null,
    qtestProject: null,
    testCases: [],
    metrics: {
      total: 0,
      automated: 0,
      partiallyAutomated: 0,
      manual: 0,
      notPossible: 0,
      automationCandidate: 0,
      notEvaluated: 0,
      coveragePercentage: 0
    }
  };

  // Try primary project first
  let requirement = await searchRequirement(elmKey, PASSPORT_QTEST_CONFIG.projects.primary.id);
  let projectId = PASSPORT_QTEST_CONFIG.projects.primary.id;
  let projectName = PASSPORT_QTEST_CONFIG.projects.primary.name;

  // If not found or no linked TCs, try secondary project
  if (!requirement) {
    requirement = await searchRequirement(elmKey, PASSPORT_QTEST_CONFIG.projects.secondary.id);
    projectId = PASSPORT_QTEST_CONFIG.projects.secondary.id;
    projectName = PASSPORT_QTEST_CONFIG.projects.secondary.name;
  }

  if (!requirement) {
    result.qtestSource = 'not_found';
    return result;
  }

  result.qtestSource = 'requirement';
  result.qtestProject = projectName;
  result.qtestId = requirement.id;

  // Get linked test cases
  const linkedTCs = await getLinkedTestCases(requirement.id, projectId);

  // If primary had 0 TCs, check secondary
  if (linkedTCs.length === 0 && projectId === PASSPORT_QTEST_CONFIG.projects.primary.id) {
    const secondaryReq = await searchRequirement(elmKey, PASSPORT_QTEST_CONFIG.projects.secondary.id);
    if (secondaryReq) {
      const secondaryTCs = await getLinkedTestCases(secondaryReq.id, PASSPORT_QTEST_CONFIG.projects.secondary.id);
      if (secondaryTCs.length > 0) {
        linkedTCs.push(...secondaryTCs);
        result.qtestProject = PASSPORT_QTEST_CONFIG.projects.secondary.name;
        projectId = PASSPORT_QTEST_CONFIG.projects.secondary.id;
      }
    }
  }

  // Get details for each test case
  for (const tc of linkedTCs) {
    const tcId = tc.target_id || tc.id;
    const details = await getTestCaseDetails(tcId, projectId);
    
    if (details) {
      const { status, tool } = classifyAutomationStatus(details.properties);
      
      result.testCases.push({
        id: tcId,
        pid: details.pid || tc.pid,
        name: details.name || tc.name,
        automationStatus: status,
        automationTool: tool,
        qtestUrl: buildQTestUrl(tcId, projectId)
      });

      // Update metrics
      result.metrics.total++;
      switch (status) {
        case 'Automated': result.metrics.automated++; break;
        case 'Partially Automated': result.metrics.partiallyAutomated++; break;
        case 'Manual': result.metrics.manual++; break;
        case 'Not Possible': result.metrics.notPossible++; break;
        case 'Automation Candidate': result.metrics.automationCandidate++; break;
        default: result.metrics.notEvaluated++;
      }
    }
  }

  // Calculate coverage percentage
  if (result.metrics.total > 0) {
    result.metrics.coveragePercentage = Math.round(
      ((result.metrics.automated + result.metrics.partiallyAutomated) / result.metrics.total) * 100
    );
  }

  return result;
};

/**
 * Fetch automation coverage for a Passport sprint
 * Links ELM cards to qTest test cases via requirement mapping
 * 
 * @param {string} sprintName - Sprint name (e.g., "26.1.3")
 * @param {Array<Object>} elmCards - Array of ELM card objects { key, team, summary }
 * @returns {Promise<Object>} Sprint coverage data
 */
export const fetchPassportSprintCoverage = async (sprintName, elmCards = []) => {
  console.log(`[Passport qTest] Fetching coverage for sprint ${sprintName} (${elmCards.length} ELM cards)...`);

  // Check cache first
  const cacheFile = getCacheFile(sprintName);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      // Return cached data if not too old (1 hour for Passport since it's requirement-based)
      if (Date.now() - cached.timestamp < 3600000) {
        console.log(`[Passport qTest] Cache hit for sprint ${sprintName}`);
        return cached.data;
      }
    } catch {
      // Cache read failed, continue with fresh fetch
    }
  }

  const sprintResults = {
    sprint_name: sprintName,
    generated: new Date().toISOString(),
    source: 'passport-qtest-live',
    elm_cards: [],
    totals: {
      total_elm_cards: elmCards.length,
      elm_cards_in_qtest: 0,
      elm_cards_missing: 0,
      total_test_cases: 0,
      automated: 0,
      partially_automated: 0,
      manual: 0,
      not_possible: 0,
      automation_candidate: 0,
      not_evaluated: 0,
      coverage_percentage: 0
    },
    teams: {}
  };

  // Initialize team stats
  for (const team of PASSPORT_QTEST_CONFIG.teams) {
    sprintResults.teams[team] = {
      total: 0,
      automated: 0,
      with_attachments: 0,  // For compatibility with existing format
      without_attachments: 0,
      test_cases: []
    };
  }

  // Process each ELM card
  for (const elmCard of elmCards) {
    const coverage = await processElmCard(elmCard.key, elmCard.team);
    sprintResults.elm_cards.push(coverage);

    if (coverage.qtestSource === 'requirement') {
      sprintResults.totals.elm_cards_in_qtest++;
    } else {
      sprintResults.totals.elm_cards_missing++;
    }

    // Aggregate totals
    sprintResults.totals.total_test_cases += coverage.metrics.total;
    sprintResults.totals.automated += coverage.metrics.automated;
    sprintResults.totals.partially_automated += coverage.metrics.partiallyAutomated;
    sprintResults.totals.manual += coverage.metrics.manual;
    sprintResults.totals.not_possible += coverage.metrics.notPossible;
    sprintResults.totals.automation_candidate += coverage.metrics.automationCandidate;
    sprintResults.totals.not_evaluated += coverage.metrics.notEvaluated;

    // Aggregate by team
    const team = coverage.team;
    if (sprintResults.teams[team]) {
      sprintResults.teams[team].total += coverage.metrics.total;
      sprintResults.teams[team].automated += coverage.metrics.automated;
      
      // Add test cases to team
      for (const tc of coverage.testCases) {
        sprintResults.teams[team].test_cases.push({
          id: tc.pid,
          qtest_id: tc.id,
          name: tc.name,
          automated: tc.automationStatus === 'Automated' || tc.automationStatus === 'Partially Automated',
          has_attachment: false, // Not tracked in requirement-based approach
          status: tc.automationStatus
        });
      }
    }
  }

  // Calculate overall coverage percentage
  if (sprintResults.totals.total_test_cases > 0) {
    sprintResults.totals.coverage_percentage = Math.round(
      ((sprintResults.totals.automated + sprintResults.totals.partially_automated) / 
        sprintResults.totals.total_test_cases) * 100
    );
  }

  // Cache the result
  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    data: sprintResults
  }, null, 2));

  console.log(`[Passport qTest] Coverage fetched: ${sprintResults.totals.total_test_cases} TCs, ${sprintResults.totals.coverage_percentage}% coverage`);

  return sprintResults;
};

/**
 * Get cached Passport sprint data
 * @param {string} sprintName - Sprint name
 * @returns {Object|null} Cached data or null
 */
export const getCachedPassportData = (sprintName) => {
  const cacheFile = getCacheFile(sprintName);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return cached.data;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Clear Passport qTest cache
 */
export const clearPassportCache = () => {
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true });
    console.log('[Passport qTest] Cache cleared');
  }
};

/**
 * Get Passport qTest configuration (for debugging)
 */
export const getPassportQTestConfig = () => ({
  url: PASSPORT_QTEST_CONFIG.url,
  projects: PASSPORT_QTEST_CONFIG.projects,
  teams: PASSPORT_QTEST_CONFIG.teams,
  sprints: PASSPORT_QTEST_CONFIG.sprints
});

export default {
  fetchPassportSprintCoverage,
  getCachedPassportData,
  clearPassportCache,
  getPassportQTestConfig,
  processElmCard,
  searchRequirement,
  getLinkedTestCases,
  getTestCaseDetails,
  PASSPORT_QTEST_CONFIG
};
