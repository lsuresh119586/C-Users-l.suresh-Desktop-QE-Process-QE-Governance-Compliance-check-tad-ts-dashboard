import https from 'https';

const token = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d";
const projectId = "114345";
const sprintId = "68209714";

const endpoints = [
  // v3 API endpoints
  {
    url: `https://wk.qtestnet.com/api/v3/projects/${projectId}/sprints/${sprintId}/test-cases?pageSize=500`,
    desc: "v3 - GET test-cases"
  },
  {
    url: `https://wk.qtestnet.com/api/v3/projects/${projectId}/test-cases?pageSize=500&sprintId=${sprintId}`,
    desc: "v3 - GET test-cases with sprint filter"
  },
  // v2 API endpoints
  {
    url: `https://wk.qtestnet.com/api/v2/projects/${projectId}/sprints/${sprintId}/test-cases?pageSize=500`,
    desc: "v2 - GET test-cases"
  },
  {
    url: `https://wk.qtestnet.com/api/v2/projects/${projectId}/test-cases?pageSize=500&sprintId=${sprintId}`,
    desc: "v2 - GET test-cases with sprint filter"
  },
  // Search endpoints
  {
    url: `https://wk.qtestnet.com/api/v3/search?projectId=${projectId}&sprintId=${sprintId}&type=test-case`,
    desc: "v3 - Search endpoint"
  }
];

const testEndpoint = (url, desc) => {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'QTest-Explorer/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✓ ${desc}`);
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Keys: ${Object.keys(parsed).join(', ')}`);
          if (parsed.items) console.log(`  Items: ${parsed.items.length}`);
          if (parsed.error) console.log(`  Error: ${parsed.error}`);
          console.log();
        } catch (e) {
          console.log(`✗ ${desc}`);
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Parse Error: ${e.message}`);
          console.log();
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`✗ ${desc} - ${e.message}`);
      console.log();
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`✗ ${desc} - Timeout`);
      console.log();
      resolve();
    });

    req.end();
  });
};

(async () => {
  console.log("Testing QTest API Endpoints\n");
  console.log(`Token: ${token.substring(0, 20)}...`);
  console.log(`Project: ${projectId}, Sprint: ${sprintId}\n`);

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.url, endpoint.desc);
  }
})();
