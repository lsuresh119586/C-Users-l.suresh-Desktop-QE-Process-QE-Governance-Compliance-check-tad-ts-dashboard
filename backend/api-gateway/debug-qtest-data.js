// Debug script to see what QTest API returns
import https from 'https';

const QTEST_CONFIG = {
  baseUrl: 'https://wk.qtestnet.com/api/v3',
  projectId: 114345,
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
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function debugSprintData() {
  console.log('🔍 Debugging QTest Sprint 26.1.1 (ID: 2621)...\n');
  
  const url = `${QTEST_CONFIG.baseUrl}/projects/${QTEST_CONFIG.projectId}/test-cases?pageSize=10&pageNumber=1&sprintId=2621`;
  
  try {
    const response = await fetchQTestData(url);
    const testCases = Array.isArray(response) ? response : (response.items || []);
    
    if (testCases.length === 0) {
      console.log('❌ No test cases found');
      return;
    }
    
    console.log(`✓ Got ${testCases.length} test cases\n`);
    console.log('📋 First test case structure:');
    const tc = testCases[0];
    console.log(JSON.stringify(tc, null, 2));
    
    console.log('\n\n🔎 Checking all test cases for team/module info:');
    testCases.forEach((tc, idx) => {
      console.log(`\n  Test ${idx + 1}: ${tc.name}`);
      console.log(`    • module_names: ${JSON.stringify(tc.module_names)}`);
      console.log(`    • assigned_team: ${tc.assigned_team || 'undefined'}`);
      console.log(`    • pid: ${tc.pid}`);
      console.log(`    • Has properties: ${tc.properties ? 'yes (' + tc.properties.length + ')' : 'no'}`);
      if (tc.properties && tc.properties.length > 0) {
        const autoProps = tc.properties.filter(p => p.field_name === 'Automation');
        console.log(`    • Automation property: ${autoProps.length > 0 ? autoProps[0].field_value : 'none'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSprintData();
