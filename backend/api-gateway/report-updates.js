import fs from 'fs';

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

console.log('\n' + '='.repeat(100));
console.log('✅ REQUIREMENTS COVERED - COMPLETE UPDATE REPORT');
console.log('='.repeat(100));
console.log(`Generated: ${new Date().toISOString()}\n`);

// Group metrics by product/team
const byTeam = {};
db.metrics.forEach(m => {
  if (m.sprint && m.product) {
    if (!byTeam[m.product]) byTeam[m.product] = {};
    if (!byTeam[m.product][m.team]) byTeam[m.product][m.team] = [];
    byTeam[m.product][m.team].push(m);
  }
});

// Display by product
Object.entries(byTeam).forEach(([product, teams]) => {
  console.log(`\n📦 Product: ${product.toUpperCase()}`);
  console.log('-'.repeat(100));
  
  Object.entries(teams).forEach(([team, metrics]) => {
    console.log(`\n  👥 Team: ${team}`);
    
    metrics.sort((a, b) => a.sprint.localeCompare(b.sprint));
    
    metrics.forEach(m => {
      const req = String(m.requirementsCovered).padStart(3);
      const test = String(m.testsCovered).padStart(3);
      const ready = String(m.deploymentReadiness).padStart(3);
      const quality = String(m.codeQuality).padStart(3);
      
      console.log(`     ${m.sprint.padEnd(20)} │ Req: ${req}% │ Test: ${test}% │ Ready: ${ready}% │ Quality: ${quality}%`);
    });
  });
});

// Summary statistics
console.log('\n' + '='.repeat(100));
console.log('📊 SUMMARY STATISTICS');
console.log('='.repeat(100));

const allMetrics = db.metrics.filter(m => m.sprint && m.updatedFromAnalysis);
const avgReq = (allMetrics.reduce((sum, m) => sum + m.requirementsCovered, 0) / allMetrics.length).toFixed(2);
const avgTest = (allMetrics.reduce((sum, m) => sum + m.testsCovered, 0) / allMetrics.length).toFixed(2);
const avgReady = (allMetrics.reduce((sum, m) => sum + m.deploymentReadiness, 0) / allMetrics.length).toFixed(2);
const avgQuality = (allMetrics.reduce((sum, m) => sum + m.codeQuality, 0) / allMetrics.length).toFixed(2);

console.log(`\nTotal Sprints Updated: ${allMetrics.length}`);
console.log(`Average Requirements Covered: ${avgReq}%`);
console.log(`Average Tests Covered: ${avgTest}%`);
console.log(`Average Deployment Readiness: ${avgReady}%`);
console.log(`Average Code Quality: ${avgQuality}%`);

// Team performance comparison
console.log('\n' + '='.repeat(100));
console.log('🏆 TEAM PERFORMANCE RANKING (by Requirements Covered)');
console.log('='.repeat(100));

const teamStats = {};
Object.entries(byTeam).forEach(([product, teams]) => {
  Object.entries(teams).forEach(([team, metrics]) => {
    const avg = metrics.reduce((sum, m) => sum + m.requirementsCovered, 0) / metrics.length;
    teamStats[team] = { avg, product, count: metrics.length };
  });
});

Object.entries(teamStats)
  .sort((a, b) => b[1].avg - a[1].avg)
  .forEach(([team, stats], idx) => {
    const rank = ['🥇', '🥈', '🥉', '  '][Math.min(idx, 3)];
    console.log(`${rank} ${team.padEnd(15)} ${stats.avg.toFixed(2)}%  (${stats.count} sprints) - ${stats.product}`);
  });

console.log('\n' + '='.repeat(100) + '\n');
