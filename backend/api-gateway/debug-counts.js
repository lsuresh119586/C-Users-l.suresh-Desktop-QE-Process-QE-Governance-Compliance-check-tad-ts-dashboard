import fs from 'fs';

const db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));

const sprint = db.tests_covered['26.1.1'];
const teams = sprint.teams;

console.log('Sprint 26.1.1 Test Case Details:\n');

Object.keys(teams).sort().forEach(team => {
  const tcs = teams[team].test_cases;
  console.log(`\n${team}: Total=${tcs.length}`);
  
  let autoCount = 0;
  let attachCount = 0;
  
  tcs.forEach(tc => {
    if (tc.automated) autoCount++;
    if (tc.attachments > 0) attachCount++;
    console.log(`  ${tc.id}: auto=${tc.automated} attach=${tc.attachments}`);
  });
  
  console.log(`  Summary: Auto=${autoCount} WithAttach=${attachCount}\n`);
});

// Check totals
console.log('\nGrand Totals:');
console.log(`Total tests: ${sprint.summary.total_test_cases}`);
console.log(`Total automated: ${sprint.summary.total_automated}`);
console.log(`Total with attachments: ${sprint.summary.total_with_attachments}`);
