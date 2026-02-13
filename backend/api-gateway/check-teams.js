// Check what teams are actually in QTest data
import https from 'https';

const url = 'https://wk.qtestnet.com/api/v3/projects/114345/test-cases?pageSize=20&pageNumber=1&sprintId=2621';
const options = {
  headers: {
    'Authorization': 'Bearer d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d',
    'Accept': 'application/json'
  }
};

console.log('Fetching sample test cases from Sprint 26.1.1 (ID: 2621)...\n');

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const items = response.items || [];
      
      console.log(`Total items: ${items.length}\n`);
      console.log('Sample test cases with team/module info:');
      console.log('─'.repeat(80));
      
      items.forEach((tc, idx) => {
        console.log(`\n[${idx + 1}] ${tc.name}`);
        console.log(`    ID: ${tc.id}`);
        console.log(`    module_names: ${tc.module_names ? JSON.stringify(tc.module_names) : 'null'}`);
        console.log(`    assigned_team: ${tc.assigned_team || 'null'}`);
        console.log(`    module_id: ${tc.module_id || 'null'}`);
        console.log(`    automation_status: ${tc.automation_status || 'null'}`);
        console.log(`    attachments: ${tc.attachments && tc.attachments.length > 0 ? tc.attachments.length + ' files' : '0'}`);
      });
      
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
}).on('error', e => console.error('Request error:', e.message));
