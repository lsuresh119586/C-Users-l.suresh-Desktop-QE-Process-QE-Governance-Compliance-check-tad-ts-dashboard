import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/qtest/sprint/26.1.2',
  method: 'GET',
  timeout: 5000
};

console.log('Testing /api/qtest/sprint/26.1.2 endpoint...');

const req = http.request(options, (res) => {
  console.log(`✓ Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✓ Response received:');
      console.log(`  Sprint: ${json.sprint}`);
      console.log(`  Total: ${json.totals.total} | Auto: ${json.totals.automated} | WithAttach: ${json.totals.with_attachments}`);
      console.log(`  Teams: ${Object.keys(json.teams).length} teams in response`);
      console.log('✓✓✓ SUCCESS - Endpoint is working!');
    } catch(e) {
      console.log('✗ Error parsing JSON:', e.message);
      console.log('Raw:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.log(`✗ Error: ${e.code} - ${e.message}`);
});

req.on('timeout', () => {
  console.log('✗ Request timed out');
  req.destroy();
});

req.end();
