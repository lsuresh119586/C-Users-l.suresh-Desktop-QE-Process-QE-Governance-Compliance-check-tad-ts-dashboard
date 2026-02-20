// Populate all sprints with realistic test data
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const teams = ['Chubb', 'Matrix', 'Mavericks', 'Nexus', 'Vanguards'];

// Sample test case names by team
const testCases = {
  Chubb: [
    'Login with valid credentials',
    'Create new policy',
    'Update policy details',
    'Cancel policy request',
    'Renew policy',
    'View policy summary',
    'Export policy to PDF',
    'Search by policy number',
    'Filter by status',
    'Sort by date'
  ],
  Matrix: [
    'SSO authentication flow',
    'Angular scheduler component',
    'Delete scheduled item',
    'Reschedule appointment',
    'Email notification',
    'Calendar sync',
    'Time zone handling',
    'Bulk operations',
    'Permission validation',
    'Audit logging'
  ],
  Mavericks: [
    'AFA amount adjustment validation',
    'Time period editing',
    'AI Console UI updates',
    'Batch processing',
    'Error handling',
    'Retry logic',
    'Data validation',
    'Workflow approval',
    'Report generation',
    'Dashboard updates'
  ],
  Nexus: [
    'Export to Excel validation',
    'Search performance optimization',
    'Token claims validation',
    'JWT refresh flow',
    'Cache invalidation',
    'Query optimization',
    'Pagination handling',
    'Sort performance',
    'Filter combinations',
    'Search suggestions'
  ],
  Vanguards: [
    'Invoice AI - Line Item ID',
    'Invoice AI Citations',
    'Citations to Interactive Links',
    'Document processing',
    'ML model accuracy',
    'Confidence scoring',
    'Manual review workflow',
    'Batch processing',
    'Error classification',
    'Performance metrics'
  ]
};

function generateSprintData(sprintNumber) {
  const sprintKey = `26.1.${sprintNumber}`;
  let totalTests = 0;
  let totalAutomated = 0;
  let totalWithAttachments = 0;
  
  const teamsData = {};
  let testIdCounter = 1000 + (sprintNumber * 10000);
  
  teams.forEach((team, teamIndex) => {
    const baseTestCount = 60 + Math.floor(Math.random() * 40); // 60-100 tests per team
    let teamAutomated = 0;
    
    const testCasesForTeam = [];
    const teamTestCases = testCases[team] || [];
    
    for (let i = 0; i < baseTestCount; i++) {
      const automated = Math.random() > 0.25; // ~75% automated
      const withAttachments = automated || Math.random() > 0.6; // 75% auto + some manual have attachments
      
      if (automated) teamAutomated++;
      
      const tcId = `TC-${team.toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
      const testName = teamTestCases[i % teamTestCases.length] || `Test case ${i + 1}`;
      
      testCasesForTeam.push({
        id: tcId,
        qtest_id: testIdCounter++,
        name: testName,
        automated: automated,
        status: 'Active'
      });
    }
    
    const teamWithAttach = Math.ceil(teamAutomated * 0.85); // ~85% of automated have attachments
    
    teamsData[team] = {
      total_test_cases: baseTestCount,
      automated_test_cases: teamAutomated,
      automation_coverage_percent: Math.round((teamAutomated / baseTestCount) * 100 * 10) / 10,
      with_attachments: teamWithAttach,
      without_attachments: baseTestCount - teamWithAttach,
      test_cases: testCasesForTeam
    };
    
    totalTests += baseTestCount;
    totalAutomated += teamAutomated;
    totalWithAttachments += teamWithAttach;
  });
  
  return {
    sprint: sprintKey,
    module_id: 68209713 + sprintNumber,
    generated: new Date().toISOString().split('T')[0],
    summary: {
      total_test_cases: totalTests,
      total_automated: totalAutomated,
      total_with_attachments: totalWithAttachments,
      automation_coverage_percent: Math.round((totalAutomated / totalTests) * 100 * 10) / 10,
      teams_count: teams.length
    },
    teams: teamsData
  };
}

// Generate data for sprints 26.1.1 through 26.1.6
if (!db.tests_covered) {
  db.tests_covered = {};
}

for (let i = 1; i <= 6; i++) {
  const sprintData = generateSprintData(i);
  // Store with both key formats for compatibility
  db.tests_covered[`26.1.${i}`] = sprintData;
  db.tests_covered[`chargers-26.1.${i}`] = sprintData;
  console.log(`Generated data for sprint 26.1.${i}: ${sprintData.summary.total_test_cases} tests`);
}

// Write back to db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('\n✓ All sprints populated with test data');

// Show summary
Object.keys(db.tests_covered).forEach(sprint => {
  const data = db.tests_covered[sprint];
  if (data.summary && data.summary.total_test_cases > 0) {
    console.log(`  ${sprint}: ${data.summary.total_test_cases} tests | ${data.summary.total_automated} automated | ${Math.round((data.summary.total_automated / data.summary.total_test_cases) * 100)}% coverage`);
  }
});
