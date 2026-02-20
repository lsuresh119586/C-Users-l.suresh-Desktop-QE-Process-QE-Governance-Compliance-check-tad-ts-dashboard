// Fetch actual test counts from QTest modules
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// QTest API Configuration
const QTEST_CONFIG = {
  baseUrl: 'https://wk.qtestnet.com/api/v3',
  projectId: 114345,
  apiToken: 'd52ca8d3-d69b-40e8-a3bd-dde6e77fe92d'
};

// Module mapping: sprint -> module_id
const moduleMapping = {
  '26.1.1': 68209713,
  '26.1.2': 68209714,
  '26.1.3': 68209719,
  '26.1.4': 68289134,
  '26.1.5': 68341069,
  '26.1.6': 68341070
};

// Team mapping for grouping (based on test case assignment)
const teamMapping = {
  'chubb': 'Chubb',
  'matrix': 'Matrix',
  'mavericks': 'Mavericks',
  'nexus': 'Nexus',
  'vanguards': 'Vanguards',
  'chargers': 'Chargers'
};

function fetchQTestData(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QTEST_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function extractTeamFromTestCase(tc) {
  if (!tc.name) return 'Unassigned';
  
  const name = tc.name.toLowerCase();
  for (const [keyword, team] of Object.entries(teamMapping)) {
    if (name.includes(keyword)) return team;
  }
  return 'Unassigned';
}

async function fetchModuleTestCases(moduleId, sprintKey) {
  console.log(`\nFetching test cases for module ${moduleId} (Sprint ${sprintKey})...`);
  
  try {
    // Fetch all test cases in the module
    const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/modules/${moduleId}/test-cases?pageSize=999`;
    const response = await fetchQTestData(url);
    
    const testCases = Array.isArray(response) ? response : (response.items || []);
    console.log(`  ✓ Found ${testCases.length} test cases in module ${moduleId}`);
    
    // Group by team
    const teams = {};
    let totalAutomated = 0;
    let totalWithAttachments = 0;
    
    testCases.forEach(tc => {
      const team = extractTeamFromTestCase(tc);
      
      if (!teams[team]) {
        teams[team] = {
          total_test_cases: 0,
          automated_test_cases: 0,
          with_attachments: 0,
          without_attachments: 0,
          test_cases: []
        };
      }
      
      teams[team].total_test_cases++;
      
      // Check if automated (based on name or status)
      const isAutomated = tc.automation_status === 'AUTOMATED' || 
                         tc.name?.toLowerCase().includes('automated') ||
                         tc.automation_type === 'Automated';
      
      if (isAutomated) {
        teams[team].automated_test_cases++;
        totalAutomated++;
      }
      
      // Check attachments
      const hasAttachments = tc.attachments && tc.attachments.length > 0;
      if (hasAttachments) {
        teams[team].with_attachments++;
        totalWithAttachments++;
      }
      
      // Store test case details
      teams[team].test_cases.push({
        id: tc.name || `TC-${tc.id}`,
        qtest_id: tc.id,
        name: tc.name || 'Unnamed test case',
        automated: isAutomated,
        status: tc.status || 'Active'
      });
    });
    
    // Calculate coverage percentages
    Object.keys(teams).forEach(team => {
      const teamData = teams[team];
      teamData.automation_coverage_percent = teamData.total_test_cases > 0 
        ? Math.round((teamData.automated_test_cases / teamData.total_test_cases) * 100 * 10) / 10
        : 0;
      teamData.without_attachments = teamData.total_test_cases - teamData.with_attachments;
    });
    
    const summary = {
      total_test_cases: testCases.length,
      total_automated: totalAutomated,
      total_with_attachments: totalWithAttachments,
      automation_coverage_percent: testCases.length > 0 
        ? Math.round((totalAutomated / testCases.length) * 100 * 10) / 10
        : 0,
      teams_count: Object.keys(teams).length
    };
    
    console.log(`  Summary: ${summary.total_test_cases} total | ${summary.total_automated} automated | ${summary.automation_coverage_percent}% coverage`);
    
    return {
      sprint: sprintKey,
      module_id: moduleId,
      generated: new Date().toISOString().split('T')[0],
      summary,
      teams
    };
  } catch (error) {
    console.error(`  ✗ Error fetching module ${moduleId}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Fetching test counts from QTest modules...\n');
  
  const dbPath = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (!db.tests_covered) {
    db.tests_covered = {};
  }
  
  // Fetch data for each module
  for (const [sprint, moduleId] of Object.entries(moduleMapping)) {
    const sprintData = await fetchModuleTestCases(moduleId, sprint);
    
    if (sprintData) {
      db.tests_covered[sprint] = sprintData;
      db.tests_covered[`chargers-${sprint}`] = sprintData;
    }
  }
  
  // Write back to db.json
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('\n✓ db.json updated with actual QTest module counts\n');
  
  // Show summary
  console.log('Summary of test counts by sprint:');
  console.log('');
  Object.keys(moduleMapping).forEach(sprint => {
    const data = db.tests_covered[sprint];
    if (data && data.summary) {
      console.log(`${sprint} (Module ${moduleMapping[sprint]}): ${data.summary.total_test_cases} tests | ${data.summary.total_automated} automated | ${data.summary.automation_coverage_percent}% coverage`);
      const teamSummary = Object.entries(data.teams)
        .map(([name, info]) => `${name}(${info.total_test_cases})`)
        .join(', ');
      console.log(`  Teams: ${teamSummary}`);
    }
  });
}

main().catch(console.error);
