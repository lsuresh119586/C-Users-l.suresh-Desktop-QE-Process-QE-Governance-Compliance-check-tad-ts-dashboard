// Fetch test cases by requirements/team folders
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

// Sprint mapping
const sprintMapping = {
  '26.1.1': 2621,
  '26.1.2': 2622,
  '26.1.3': 2623,
  '26.1.4': 2624,
  '26.1.5': 2625,
  '26.1.6': 2626
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

async function fetchSprintTestCases(sprintId, sprintKey) {
  console.log(`\nFetching test cases for sprint ID ${sprintId} (Sprint ${sprintKey})...`);
  
  try {
    // Fetch test cases for this sprint
    const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases?pageSize=999&sprintId=${sprintId}`;
    const response = await fetchQTestData(url);
    
    const testCases = Array.isArray(response) ? response : (response.items || []);
    console.log(`  ✓ Found ${testCases.length} test cases in sprint ${sprintKey}`);
    
    if (testCases.length === 0) {
      console.log(`  (No test cases found - this may be expected if QTest is empty)`);
    }
    
    // Group by team (extract from test case properties)
    const teams = {};
    let totalAutomated = 0;
    let totalWithAttachments = 0;
    
    testCases.forEach(tc => {
      // Try to extract team from assigned_user, module, or other field
      let team = 'Unassigned';
      
      if (tc.assigned_team) team = tc.assigned_team;
      else if (tc.module) team = tc.module;
      else if (tc.assigned_user) team = tc.assigned_user;
      else if (tc.name) {
        // Try to infer from name
        const nameLower = tc.name.toLowerCase();
        if (nameLower.includes('chubb')) team = 'Chubb';
        else if (nameLower.includes('matrix')) team = 'Matrix';
        else if (nameLower.includes('mavericks') || nameLower.includes('maverick')) team = 'Mavericks';
        else if (nameLower.includes('nexus')) team = 'Nexus';
        else if (nameLower.includes('vanguards') || nameLower.includes('vanguard')) team = 'Vanguards';
      }
      
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
      
      // Check if automated
      const isAutomated = tc.automation_status === 'AUTOMATED' || tc.automated === true;
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
    if (Object.keys(teams).length > 0) {
      const teamInfo = Object.entries(teams).map(([name, info]) => `${name}(${info.total_test_cases})`).join(', ');
      console.log(`  Teams: ${teamInfo}`);
    }
    
    return {
      sprint: sprintKey,
      module_id: null,
      generated: new Date().toISOString().split('T')[0],
      summary,
      teams
    };
  } catch (error) {
    console.error(`  ✗ Error fetching sprint ${sprintKey}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Fetching test counts from QTest by sprint...\n');
  
  const dbPath = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (!db.tests_covered) {
    db.tests_covered = {};
  }
  
  // Fetch data for each sprint
  for (const [sprint, sprintId] of Object.entries(sprintMapping)) {
    const sprintData = await fetchSprintTestCases(sprintId, sprint);
    
    if (sprintData) {
      db.tests_covered[sprint] = sprintData;
      db.tests_covered[`chargers-${sprint}`] = sprintData;
    }
  }
  
  // Write back to db.json
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('\n✓ db.json updated with actual QTest sprint counts\n');
}

main().catch(console.error);
