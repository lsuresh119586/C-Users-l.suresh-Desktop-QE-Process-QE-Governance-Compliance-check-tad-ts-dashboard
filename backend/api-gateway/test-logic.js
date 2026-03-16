import fs from 'fs';

// Simulate the endpoint logic
const db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

const sprintName = '26.1.2';

// Get test case data from db.json tests_covered section
const testsCovered = db.tests_covered || {};
let sprintData = null;

// Find sprint by number
if (testsCovered[sprintName]) {
  sprintData = testsCovered[sprintName];
}

if (!sprintData) {
  // Return default structure if not found
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

// Format for frontend consumption
const summary = sprintData.summary || {};
const response = {
  sprint: sprintName,
  totals: {
    total: summary.total_test_cases || 0,
    automated: summary.total_automated || 0,
    with_attachments: summary.total_with_attachments || 0,
    without_attachments: Math.max(0, (summary.total_automated || 0) - (summary.total_with_attachments || 0))
  },
  teams: sprintData.teams || {}
};

console.log('✅ Endpoint logic works!');
console.log('Response for sprint ' + sprintName + ':');
console.log(JSON.stringify(response, null, 2));
