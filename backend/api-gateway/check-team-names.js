// Check all test case names to find team pattern
import https from 'https';

const url = 'https://wk.qtestnet.com/api/v3/projects/114345/test-cases?pageSize=20&pageNumber=1&sprintId=2621';
const options = {
  headers: {
    'Authorization': 'Bearer d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d',
    'Accept': 'application/json'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const items = response.items || [];
      
      console.log('All test cases in Sprint 26.1.1:\n');
      items.forEach((tc, idx) => {
        console.log(`[${idx + 1}] ${tc.name}`);
      });
      
      console.log('\n\nLooking for team patterns in names:');
      const teamCounts = {};
      items.forEach(tc => {
        const nameLower = tc.name.toLowerCase();
        if (nameLower.includes('chargers')) teamCounts['Chargers'] = (teamCounts['Chargers'] || 0) + 1;
        else if (nameLower.includes('chubb')) teamCounts['Chubb'] = (teamCounts['Chubb'] || 0) + 1;
        else if (nameLower.includes('matrix')) teamCounts['Matrix'] = (teamCounts['Matrix'] || 0) + 1;
        else if (nameLower.includes('vanguard')) teamCounts['Vanguards'] = (teamCounts['Vanguards'] || 0) + 1;
        else if (nameLower.includes('maverick')) teamCounts['Mavericks'] = (teamCounts['Mavericks'] || 0) + 1;
        else if (nameLower.includes('nexus')) teamCounts['Nexus'] = (teamCounts['Nexus'] || 0) + 1;
        else teamCounts['No Team'] = (teamCounts['No Team'] || 0) + 1;
      });
      
      console.log(JSON.stringify(teamCounts, null, 2));
      
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
}).on('error', e => console.error('Error:', e.message));
