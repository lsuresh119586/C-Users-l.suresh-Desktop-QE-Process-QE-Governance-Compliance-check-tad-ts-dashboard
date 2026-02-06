#!/usr/bin/env node
/**
 * qTest Integration Service
 * Fetches test case data from qTest API and analyzes statistics
 */

import https from 'https';
import { URL } from 'url';

// qTest Configuration
const QTEST_URL = "https://wk.qtestnet.com/api/v3";
const PROJECT_ID = 114345;
const QTEST_API_TOKEN = process.env.QTEST_API_TOKEN || "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d";

/**
 * Make HTTPS request to qTest API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${QTEST_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'qTest-Service/1.0'
      }
    };

    if (options.headers) {
      Object.assign(requestOptions.headers, options.headers);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = data ? JSON.parse(data) : {};
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Get module structure with descendants
 */
export async function getModuleStructure(moduleId) {
  const url = `${QTEST_URL}/projects/${PROJECT_ID}/modules/${moduleId}?expand=descendants`;
  try {
    return await makeRequest(url);
  } catch (error) {
    console.error(`Error fetching module structure: ${error.message}`);
    return null;
  }
}

/**
 * Get test cases from a module
 */
export async function getTestCases(parentId, page = 1, pageSize = 100) {
  const url = `${QTEST_URL}/projects/${PROJECT_ID}/test-cases?parentId=${parentId}&page=${page}&size=${pageSize}`;
  try {
    const response = await makeRequest(url);
    return response.items || [];
  } catch (error) {
    console.error(`Error fetching test cases for module ${parentId}: ${error.message}`);
    return [];
  }
}

/**
 * Get attachments for a test case
 */
export async function getTestCaseAttachments(testCaseId) {
  const url = `${QTEST_URL}/projects/${PROJECT_ID}/test-cases/${testCaseId}/attachments`;
  try {
    const response = await makeRequest(url);
    return response.items || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get all test cases from a module recursively
 */
async function getAllTestCasesFromModule(moduleId, teamName) {
  let allTestCases = [];
  let page = 1;

  while (true) {
    const testCases = await getTestCases(moduleId, page);
    if (!testCases || testCases.length === 0) {
      break;
    }

    for (const tc of testCases) {
      tc.team = teamName;
    }

    allTestCases = allTestCases.concat(testCases);

    if (testCases.length < 100) {
      break;
    }
    page++;
  }

  return allTestCases;
}

/**
 * Process module recursively
 */
async function processModuleRecursive(module, teamName) {
  let allTestCases = [];
  const moduleId = module.id;
  const moduleName = module.name;

  console.log(`  Processing: ${moduleName}`);

  // Get test cases from this module
  const testCases = await getAllTestCasesFromModule(moduleId, teamName);
  allTestCases = allTestCases.concat(testCases);

  if (testCases.length > 0) {
    console.log(`    Found ${testCases.length} test cases`);
  }

  // Process children recursively
  if (module.children && module.children.length > 0) {
    console.log(`    Found ${module.children.length} sub-modules`);
    for (const child of module.children) {
      const childTestCases = await processModuleRecursive(child, teamName);
      allTestCases = allTestCases.concat(childTestCases);
    }
  }

  return allTestCases;
}

/**
 * Analyze test cases and generate statistics
 */
function analyzeTestCases(testCases, checkAttachments = false) {
  const teamStats = {};
  const totalCases = testCases.length;

  console.log(`\nAnalyzing ${totalCases} test cases...`);

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const team = tc.team || 'Unknown';
    const tcId = tc.id;
    const tcPid = tc.pid || 'Unknown';

    // Initialize team stats if needed
    if (!teamStats[team]) {
      teamStats[team] = {
        total: 0,
        automated: 0,
        with_attachments: 0,
        without_attachments: 0,
        test_cases: []
      };
    }

    // Count total
    teamStats[team].total += 1;

    // Check if automated (Automation field = 711 means "Yes")
    let isAutomated = false;
    if (tc.properties && Array.isArray(tc.properties)) {
      for (const prop of tc.properties) {
        if (prop.field_name === 'Automation' && prop.field_value === '711') {
          isAutomated = true;
          break;
        }
      }
    }

    if (isAutomated) {
      teamStats[team].automated += 1;
      teamStats[team].with_attachments += 1; // Assume automated tests have attachments/scripts
    } else {
      teamStats[team].without_attachments += 1;
    }

    teamStats[team].test_cases.push({
      id: tcPid,
      qtest_id: tcId,
      name: tc.name || 'Unknown',
      automated: isAutomated,
      status: tc.status || 'Unknown'
    });
  }

  return teamStats;
}

/**
 * Get sprint test cases
 */
export async function getSprintTestCases(moduleId, sprintName, checkAttachments = false) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Fetching Test Cases for ${sprintName}`);
  console.log(`Module ID: ${moduleId}`);
  console.log(`${'='.repeat(80)}\n`);

  // Get module structure
  const module = await getModuleStructure(moduleId);
  if (!module) {
    console.log('Error: Could not fetch module structure');
    return null;
  }

  let allTestCases = [];

  // Check if module has children (team sub-modules)
  if (module.children && module.children.length > 0) {
    console.log(`Found ${module.children.length} team modules\n`);

    for (const child of module.children) {
      const childName = child.name;
      console.log(`Processing team: ${childName}`);

      // Process this team module and all its descendants recursively
      const teamTestCases = await processModuleRecursive(child, childName);
      allTestCases = allTestCases.concat(teamTestCases);

      console.log(`  Team ${childName} total: ${teamTestCases.length} test cases\n`);
    }
  } else {
    // No children, get test cases directly
    console.log('No team modules found, getting test cases from parent module');
    const testCases = await getAllTestCasesFromModule(moduleId, 'All Teams');
    allTestCases = allTestCases.concat(testCases);
  }

  if (allTestCases.length === 0) {
    console.log('\nNo test cases found!');
    return null;
  }

  console.log(`\nTotal test cases retrieved: ${allTestCases.length}`);

  // Analyze test cases
  const teamStats = analyzeTestCases(allTestCases, checkAttachments);

  // Calculate totals
  const totals = {
    total: 0,
    automated: 0,
    with_attachments: 0,
    without_attachments: 0
  };

  for (const team in teamStats) {
    totals.total += teamStats[team].total;
    totals.automated += teamStats[team].automated;
    totals.with_attachments += teamStats[team].with_attachments;
    totals.without_attachments += teamStats[team].without_attachments;
  }

  const result = {
    sprint_name: sprintName,
    module_id: moduleId,
    generated: new Date().toISOString().split('T')[0],
    totals: totals,
    teams: teamStats
  };

  return result;
}

/**
 * Print formatted report
 */
export function printReport(data) {
  if (!data) {
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST CASE SUMMARY - ${data.sprint_name}`);
  console.log(`Generated: ${data.generated}`);
  console.log(`${'='.repeat(80)}\n`);

  // Print team breakdown
  console.log(`${'Team'.padEnd(20)} ${'Total'.padEnd(8)} ${'Automated'.padEnd(12)} ${'Automated %'.padEnd(12)}`);
  console.log('-'.repeat(80));

  const teams = data.teams;
  for (const teamName of Object.keys(teams).sort()) {
    const team = teams[teamName];
    const automatedPct = team.total > 0 ? ((team.automated / team.total) * 100).toFixed(1) : '0.0';
    console.log(`${teamName.padEnd(20)} ${String(team.total).padEnd(8)} ${String(team.automated).padEnd(12)} ${automatedPct}%`);
  }

  console.log('-'.repeat(80));
  const totals = data.totals;
  const totalAutomatedPct = totals.total > 0 ? ((totals.automated / totals.total) * 100).toFixed(1) : '0.0';
  console.log(`${'TOTAL'.padEnd(20)} ${String(totals.total).padEnd(8)} ${String(totals.automated).padEnd(12)} ${totalAutomatedPct}%`);

  console.log(`\nAutomation Coverage: ${totals.automated}/${totals.total} (${totalAutomatedPct}%)`);
  console.log(`Tests with Attachments: ${totals.with_attachments}/${totals.total}`);
}

/**
 * Validate API token
 */
export function validateToken() {
  if (QTEST_API_TOKEN === 'YOUR_TOKEN_HERE' || !QTEST_API_TOKEN) {
    console.error('ERROR: Please set your qTest API token!');
    console.error('Get your token from: https://wk.qtestnet.com/user/api-token');
    console.error('Update QTEST_API_TOKEN environment variable or in the script');
    return false;
  }
  return true;
}

/**
 * Sprint configurations
 */
export const SPRINT_CONFIGS = {
  '26.1.1': 68209713,
  '26.1.2': 68209714,
  '26.1.3': 68209719,
};

export default {
  getModuleStructure,
  getTestCases,
  getTestCaseAttachments,
  getSprintTestCases,
  printReport,
  validateToken,
  SPRINT_CONFIGS,
  PROJECT_ID,
  QTEST_URL
};
