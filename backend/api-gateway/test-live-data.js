import JiraMetricsCalculator from "./jira-metrics-calculator.js";

const calc = new JiraMetricsCalculator({
  JIRA_URL: process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira',
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || '***REMOVED_JIRA_TOKEN***',
  JIRA_PROJECT_KEY: process.env.JIRA_PROJECT_KEY || 'GET'
});

console.log('🧪 Testing JIRA live data fetch...\n');

try {
  console.log('📊 Fetching issues for chargers-26.1.4...');
  const issues = await calc.getSprintIssues('chargers-26.1.4');
  
  console.log(`✅ Found ${issues.length} issues\n`);
  
  const open = issues.filter(i => {
    const status = (i.fields?.status?.name || '').toLowerCase();
    return status.includes('open') || status.includes('in progress') || status.includes('to do');
  });
  
  const closed = issues.filter(i => {
    const status = (i.fields?.status?.name || '').toLowerCase();
    return status.includes('closed') || status.includes('done') || status.includes('resolved');
  });
  
  console.log(`Open: ${open.length}`);
  console.log(`Closed: ${closed.length}`);
  console.log('\nFirst 5 issues:');
  
  issues.slice(0, 5).forEach(i => {
    console.log(`  ${i.key}: ${i.fields.issuetype.name} - ${i.fields.status.name}`);
  });
} catch (err) {
  console.error('❌ Error:', err.message);
}
