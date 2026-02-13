// Fetch test counts from QTest with proper sprint and attachment tracking
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// QTest API Configuration
const QTEST_CONFIG = {
  baseUrl: 'https://wk.qtestnet.com/api/v3',
  projectId: 114345,
  moduleId: 68180756,
  apiToken: 'd52ca8d3-d69b-40e8-a3bd-dde6e77fe92d'
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
          console.error(`Parse error for URL: ${url}`);
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getAllTestCases(pageNum = 1, allCases = []) {
  const pageSize = 500;
  const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases?pageSize=${pageSize}&pageNumber=${pageNum}`;
  
  console.log(`  Fetching test cases page ${pageNum}...`);
  const response = await fetchQTestData(url);
  
  const testCases = Array.isArray(response) ? response : (response.items || []);
  const pageInfo = response.pageInfo || {};
  
  allCases.push(...testCases);
  
  // Check if there are more pages
  if (pageInfo.pageNumber && pageInfo.pageNumber < pageInfo.totalPages) {
    return getAllTestCases(pageNum + 1, allCases);
  }
  
  return allCases;
}

async function getSprintInfo(sprintId) {
  const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/sprints/${sprintId}`;
  try {
    return await fetchQTestData(url);
  } catch (error) {
    console.warn(`  Could not fetch sprint ${sprintId} details: ${error.message}`);
    return { id: sprintId, name: `Sprint ${sprintId}` };
  }
}

async function processTestCases() {
  console.log('\n📥 Fetching all test cases from QTest...');
  
  const allTestCases = await getAllTestCases();
  console.log(`✓ Retrieved ${allTestCases.length} total test cases\n`);
  
  // Group by sprint
  const sprintMap = {};
  
  allTestCases.forEach(tc => {
    // Extract sprint info
    let sprintId = null;
    let sprintName = 'Unassigned';
    
    if (tc.sprint_id) {
      sprintId = tc.sprint_id;
      sprintName = tc.sprint_name || `Sprint ${sprintId}`;
    } else if (tc.link_sprints && tc.link_sprints.length > 0) {
      sprintId = tc.link_sprints[0].id;
      sprintName = tc.link_sprints[0].name || `Sprint ${sprintId}`;
    }
    
    const key = sprintName || 'Unassigned';
    
    if (!sprintMap[key]) {
      sprintMap[key] = {
        sprint_id: sprintId,
        sprint_name: key,
        test_cases: [],
        total: 0,
        automated: 0,
        with_attachments: 0,
        teams: {}
      };
    }
    
    sprintMap[key].test_cases.push(tc);
    sprintMap[key].total++;
    
    // Check if automated
    if (tc.automation_status === 'AUTOMATED' || tc.automated === true) {
      sprintMap[key].automated++;
    }
    
    // Check if has attachments
    if (tc.attachments && Array.isArray(tc.attachments) && tc.attachments.length > 0) {
      sprintMap[key].with_attachments++;
    }
  });
  
  // Process each sprint to extract team information
  console.log('📊 Processing test cases by sprint...\n');
  
  const sprintResults = {};
  
  for (const [sprintName, sprintData] of Object.entries(sprintMap)) {
    if (sprintName === 'Unassigned') continue;
    
    console.log(`Sprint: ${sprintName}`);
    console.log(`  Total: ${sprintData.total} | Automated: ${sprintData.automated} | With Attachments: ${sprintData.with_attachments}`);
    
    // Extract team information from test cases
    const teams = {};
    
    sprintData.test_cases.forEach(tc => {
      // Try to extract team/module from various fields
      let team = 'Unassigned';
      
      if (tc.module_names && tc.module_names.length > 0) {
        team = tc.module_names[0];
      } else if (tc.assigned_team) {
        team = tc.assigned_team;
      } else if (tc.name) {
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
      
      if (tc.automation_status === 'AUTOMATED' || tc.automated === true) {
        teams[team].automated_test_cases++;
      }
      
      if (tc.attachments && Array.isArray(tc.attachments) && tc.attachments.length > 0) {
        teams[team].with_attachments++;
      }
      
      teams[team].test_cases.push({
        id: tc.name || `TC-${tc.id}`,
        qtest_id: tc.id,
        name: tc.name,
        automated: tc.automation_status === 'AUTOMATED' || tc.automated === true,
        status: tc.status || 'Active',
        attachments: tc.attachments ? tc.attachments.length : 0
      });
    });
    
    // Calculate percentages and without_attachments
    Object.keys(teams).forEach(team => {
      const teamData = teams[team];
      teamData.automation_coverage_percent = teamData.total_test_cases > 0 
        ? Math.round((teamData.automated_test_cases / teamData.total_test_cases) * 100 * 10) / 10
        : 0;
      teamData.without_attachments = teamData.total_test_cases - teamData.with_attachments;
    });
    
    // Store sprint result
    sprintResults[sprintName] = {
      sprint: sprintName,
      sprint_id: sprintData.sprint_id,
      generated: new Date().toISOString().split('T')[0],
      summary: {
        total_test_cases: sprintData.total,
        total_automated: sprintData.automated,
        total_with_attachments: sprintData.with_attachments,
        automation_coverage_percent: sprintData.total > 0 
          ? Math.round((sprintData.automated / sprintData.total) * 100 * 10) / 10
          : 0,
        teams_count: Object.keys(teams).length
      },
      teams
    };
    
    // Show team breakdown
    const teamBreakdown = Object.entries(teams)
      .map(([name, info]) => `${name}(${info.total_test_cases})`)
      .join(', ');
    console.log(`  Teams: ${teamBreakdown}\n`);
  }
  
  return sprintResults;
}

async function main() {
  try {
    console.log('🔄 QTest Data Extractor');
    console.log('=======================\n');
    console.log(`Project ID: ${QTEST_CONFIG.projectId}`);
    console.log(`Module ID: ${QTEST_CONFIG.moduleId}`);
    console.log(`QTest API: ${QTEST_CONFIG.baseUrl}\n`);
    
    const sprintResults = await processTestCases();
    
    // Load db.json and update
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (!db.tests_covered) {
      db.tests_covered = {};
    }
    
    // Store results with both key formats
    Object.entries(sprintResults).forEach(([sprintName, sprintData]) => {
      db.tests_covered[sprintName] = sprintData;
      
      // Also store with chargers- prefix if not already a prefixed name
      if (!sprintName.includes('-')) {
        db.tests_covered[`chargers-${sprintName}`] = sprintData;
      }
    });
    
    // Write updated db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log('✓ db.json updated successfully\n');
    
    // Print summary
    console.log('📈 Summary:');
    console.log('===========\n');
    
    Object.entries(sprintResults).forEach(([sprintName, data]) => {
      console.log(`${sprintName}:`);
      console.log(`  Total: ${data.summary.total_test_cases}`);
      console.log(`  Automated: ${data.summary.total_automated} (${data.summary.automation_coverage_percent}%)`);
      console.log(`  With Attachments: ${data.summary.total_with_attachments}`);
      console.log(`  Teams: ${data.summary.teams_count}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
