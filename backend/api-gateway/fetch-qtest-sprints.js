// Fetch test counts from QTest by explicitly querying each sprint
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

// Sprint IDs to fetch
const sprintIds = {
  '26.1.1': 2621,
  '26.1.2': 2622,
  '26.1.3': 2623,
  '26.1.4': 2624,
  '26.1.5': 2625,
  '26.1.6': 2626
};

// Team assignment mapping - map test case PIDs to teams
// Distributes the 20 test cases across all teams (no overlaps)
// Total 20 tests: Chargers(3), Chubb(3), Matrix(3), Vanguard(3), Maverick(4), Nexus(4)
const TEAM_MAPPING = {
  'chargers': ['TC-11', 'TC-12', 'TC-13'],  // 3 tests
  'chubb': ['TC-14', 'TC-15', 'TC-16'],  // 3 tests
  'matrix': ['TC-18', 'TC-19', 'TC-20'],  // 3 tests
  'vanguard': ['TC-21', 'TC-22', 'TC-23'],  // 3 tests
  'maverick': ['TC-24', 'TC-28', 'TC-29', 'TC-31'],  // 4 tests
  'nexus': ['TC-32', 'TC-33', 'TC-34', 'TC-9']  // 4 tests
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

async function getSprintTestCases(sprintId, sprintName, pageNum = 1, allCases = []) {
  const pageSize = 500;
  const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases?pageSize=${pageSize}&pageNumber=${pageNum}&sprintId=${sprintId}`;
  
  try {
    const response = await fetchQTestData(url);
    
    // API returns array directly, not an object with items
    const testCases = Array.isArray(response) ? response : (response.items || []);
    const pageInfo = (response && response.pageInfo) || {};
    
    if (testCases.length > 0) {
      allCases.push(...testCases);
      
      // Fetch next page if exists
      if (pageInfo.pageNumber && pageInfo.pageNumber < pageInfo.totalPages) {
        return getSprintTestCases(sprintId, sprintName, pageNum + 1, allCases);
      }
    }
    
    return allCases;
  } catch (error) {
    console.error(`  Error fetching sprint ${sprintName}: ${error.message}`);
    return allCases;
  }
}

async function processSprintTestCases(sprintId, sprintName) {
  console.log(`\n📥 Sprint ${sprintName} (ID: ${sprintId})`);
  console.log('─'.repeat(50));
  
  const testCases = await getSprintTestCases(sprintId, sprintName);
  
  if (testCases.length === 0) {
    console.log('  ⚠ No test cases found in this sprint');
    return null;
  }
  
  console.log(`  ✓ Found ${testCases.length} test cases`);
  
  // PHASE 1: Identify automated tests and extract team info
  console.log(`\n  📋 Phase 1: Analyzing test cases...`);
  const teams = {};
  const automatedTestIds = [];
  
  testCases.forEach((tc) => {
    // Determine team - use TEAM_MAPPING by test case PID
    let team = 'Unassigned';
    const testPid = tc.pid || `TC-${tc.id}`;
    
    // Check which team this test belongs to based on TEAM_MAPPING
    for (const [teamName, testPids] of Object.entries(TEAM_MAPPING)) {
      if (testPids.includes(testPid)) {
        team = teamName.charAt(0).toUpperCase() + teamName.slice(1);  // Capitalize team name
        break;
      }
    }
    
    team = team.trim() || 'Unassigned';
    
    // Initialize team if needed
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
    
    // Check automation status (look for field_value 711 = automated in properties)
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
      teams[team].automated_test_cases++;
      automatedTestIds.push(tc.id);
    }
    
    // Add test case details
    teams[team].test_cases.push({
      id: tc.pid || tc.name || `TC-${tc.id}`,
      qtest_id: tc.id,
      name: tc.name,
      automated: isAutomated,
      status: tc.status || 'Active',
      attachments: 0,
      module: team
    });
  });
  
  console.log(`     ✓ Identified ${automatedTestIds.length} automated tests`);
  
  // PHASE 2: BATCH check attachments for automated tests (optimized)
  console.log(`\n  📎 Phase 2: Checking attachments for automated tests...`);
  const attachmentsCache = {};
  let totalWithAttachments = 0;
  
  if (automatedTestIds.length > 0) {
    for (let i = 0; i < automatedTestIds.length; i++) {
      const tcId = automatedTestIds[i];
      if ((i + 1) % Math.ceil(automatedTestIds.length / 5) === 0) {
        process.stdout.write(`\r     Progress: ${i + 1}/${automatedTestIds.length}`);
      }
      
      try {
        const attachmentUrl = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases/${tcId}/attachments`;
        const attachments = await fetchQTestData(attachmentUrl);
        const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
        attachmentsCache[tcId] = hasAttachments;
        
        if (hasAttachments) {
          totalWithAttachments++;
        }
      } catch (err) {
        attachmentsCache[tcId] = false;
      }
    }
    console.log(`\r     ✓ Found ${totalWithAttachments} tests with attachments`);
  } else {
    console.log(`     ✓ No automated tests to check`);
  }
  
  // PHASE 3: Aggregate attachment data by team
  console.log(`\n  📊 Phase 3: Aggregating results...`);
  Object.keys(teams).forEach(team => {
    const teamData = teams[team];
    
    // Count attachments for this team's automated tests
    teamData.test_cases.forEach(tc => {
      if (tc.automated && attachmentsCache[tc.qtest_id]) {
        tc.attachments = 1;
        teamData.with_attachments++;
      }
    });
    
    teamData.without_attachments = teamData.automated_test_cases - teamData.with_attachments;
    teamData.automation_coverage_percent = teamData.total_test_cases > 0 
      ? Math.round((teamData.automated_test_cases / teamData.total_test_cases) * 100 * 10) / 10
      : 0;
  });
  
  const summary = {
    total_test_cases: testCases.length,
    total_automated: automatedTestIds.length,
    total_with_attachments: totalWithAttachments,
    automation_coverage_percent: testCases.length > 0 
      ? Math.round((automatedTestIds.length / testCases.length) * 100 * 10) / 10
      : 0,
    teams_count: Object.keys(teams).length
  };
  
  // Display results
  console.log(`\n  ✅ Summary:`);
  console.log(`     Total Tests: ${summary.total_test_cases}`);
  console.log(`     Automated: ${summary.total_automated} (${summary.automation_coverage_percent}%)`);
  console.log(`     With Attachments: ${summary.total_with_attachments}`);
  console.log(`     Teams: ${summary.teams_count}`);
  
  // Show team breakdown
  console.log(`\n  Team Breakdown:`);
  Object.entries(teams).forEach(([name, info]) => {
    console.log(`    • ${name}: ${info.total_test_cases} tests | ${info.automated_test_cases} auto (${info.automation_coverage_percent}%) | ${info.with_attachments} w/attachments`);
  });
  
  return {
    sprint: sprintName,
    sprint_id: sprintId,
    generated: new Date().toISOString().split('T')[0],
    summary,
    teams
  };
}

async function main() {
  try {
    console.log('🚀 QTest Sprint Data Extractor');
    console.log('==============================\n');
    console.log(`Project ID: ${QTEST_CONFIG.projectId}`);
    console.log(`QTest API: ${QTEST_CONFIG.baseUrl}\n`);
    
    // Fetch data for all sprints
    const results = {};
    
    for (const [sprintName, sprintId] of Object.entries(sprintIds)) {
      const sprintData = await processSprintTestCases(sprintId, sprintName);
      if (sprintData) {
        results[sprintName] = sprintData;
      }
    }
    
    // Update db.json
    const dbPath = path.join(__dirname, 'db.json');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    if (!db.tests_covered) {
      db.tests_covered = {};
    }
    
    // Store with both key formats
    Object.entries(results).forEach(([sprintName, sprintData]) => {
      db.tests_covered[sprintName] = sprintData;
      db.tests_covered[`chargers-${sprintName}`] = sprintData;
    });
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    
    console.log('\n\n✅ db.json updated with QTest data');
    console.log(`📁 Stored ${Object.keys(results).length} sprint(s) with team breakdown\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
