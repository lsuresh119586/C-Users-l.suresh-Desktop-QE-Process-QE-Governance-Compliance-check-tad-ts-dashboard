import fs from 'fs';

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

console.log('\n📊 Updated Metrics Summary\n');
console.log('='.repeat(80));

const samples = [
  db.metrics[0],   // team-a-25.1.1
  db.metrics[7],   // chargers-26.1.1
  db.metrics[15],  // chubb-26.1.4
  db.metrics[23],  // matrix-26.1.2
  db.metrics[31]   // mavericks-26.1.5
];

samples.forEach(m => {
  if (m && m.sprint) {
    console.log(`${m.sprint}`);
    console.log(`  ✓ Requirements Covered: ${m.requirementsCovered}%`);
    console.log(`  ✓ Tests Covered: ${m.testsCovered}%`);
    console.log(`  ✓ Defects: ${m.defectsOpen} open, ${m.defectsClosed} closed`);
    console.log(`  ✓ Deployment Readiness: ${m.deploymentReadiness}%`);
    console.log(`  ✓ Code Quality: ${m.codeQuality}%\n`);
  }
});

console.log('='.repeat(80));
console.log(`Total Metrics Updated: ${db.metrics.filter(m => m.sprint && m.updatedFromAnalysis).length}`);
