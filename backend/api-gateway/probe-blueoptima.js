// Temporary probe script - safe to delete after use
import https from 'https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySW5mbyI6MTQwNTIsInBhdE5hbWUiOiJCbHVlT3B0aW1hIiwiZXhwIjoxNzc5MjgyNTYxLCJpYXQiOjE3NzE1MDY1NjF9.JBb5fuEZS_-MTpp0gZF6c6Ncl9Dl0njt906ZC_uusL0';

function makeReq(hostname, path, headers) {
  return new Promise((resolve) => {
    const options = { hostname, path, method: 'GET', headers: { ...headers, 'Accept': 'application/json, text/html' } };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ hostname, path, status: res.statusCode, body: data.substring(0, 500) }));
    });
    req.on('error', e => resolve({ hostname, path, status: 'ERR', body: e.message }));
    req.end();
  });
}

async function main() {
  const bearerHeaders = { 'Authorization': 'Bearer ' + token };
  const xAuthHeaders  = { 'X-Auth-Token': token };

  // 1. Fetch main page to find JS bundle and API hints
  console.log('\n=== Fetching main page for API hints ===');
  const mainPage = await makeReq('uix.blueoptima.com', '/', {});
  const html = mainPage.body;
  // Extract script src references
  const scripts = (html.match(/src="([^"]+\.js[^"]*)"/g) || []).slice(0, 5);
  console.log('Script refs:', scripts);
  // Extract any API base URL hints
  const apiBase = (html.match(/[a-zA-Z_]+\s*[:=]\s*["'][https?://[^"']+api[^"']*["']/g) || []);
  console.log('API base hints:', apiBase.slice(0, 5));

  // 2. Try common BlueOptima API paths with Bearer
  console.log('\n=== Testing API paths ===');
  const paths = [
    '/api/v1/users/me',
    '/api/v1/teams',
    '/api/v1/projects',
    '/api/v1/workspaces',
    '/api/v1/metrics/developer',
    '/api/v1/metrics/team',
    '/api/v1/codi',
    '/api/v1/coding-days',
    '/api/v2/users/me',
    '/api/v2/teams',
    '/api/v2/metrics',
    '/api/v3/users/me',
  ];

  const results = await Promise.all(
    paths.flatMap(p => [
      makeReq('uix.blueoptima.com', p, bearerHeaders),
      makeReq('uix.blueoptima.com', p, xAuthHeaders),
    ])
  );

  results.forEach(r => {
    const mark = r.status === 200 ? '✅' : r.status === 401 ? '🔒' : r.status === 403 ? '🚫' : r.status === 404 ? '❌' : '⚠️ ';
    const authType = r.path; // already grouped
    if (r.status !== 404) {
      console.log(`${mark} [${r.status}] ${r.hostname}${r.path}`);
      if (r.status === 200 || r.status === 403) console.log('   BODY:', r.body.substring(0, 300));
    }
  });

  // 3. Also try the API subdomain
  console.log('\n=== Testing api.blueoptima.com subdomain ===');
  const subResults = await Promise.all([
    makeReq('api.blueoptima.com', '/v1/users/me', bearerHeaders),
    makeReq('api.blueoptima.com', '/v1/teams', bearerHeaders),
    makeReq('api.blueoptima.com', '/v2/users/me', bearerHeaders),
  ]);
  subResults.forEach(r => {
    console.log(`[${r.status}] ${r.hostname}${r.path}` + (r.status !== 404 && r.status !== 401 ? ' => ' + r.body.substring(0,200) : ''));
  });
}

main().catch(console.error);
