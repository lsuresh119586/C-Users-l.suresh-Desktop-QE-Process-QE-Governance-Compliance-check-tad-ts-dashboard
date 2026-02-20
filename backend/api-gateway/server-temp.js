import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Database file path
const dbFile = path.join(__dirname, 'db.json');

const parseJson = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

// Simple file-based database functions
const readDatabase = () => {
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database:', err.message);
  }
  return null;
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err.message);
    return false;
  }
};

// Handle HTTP requests
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // GET Products
  if (pathname === '/api/products' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200);
    res.end(JSON.stringify(db?.products || []));
    return;
  }

  // GET Teams
  if (pathname === '/api/teams' && req.method === 'GET') {
    const db = readDatabase();
    const product = query.product;
    let teams = db?.teams || [];
    if (product) {
      teams = teams.filter(t => t.product === product);
    }
    res.writeHead(200);
    res.end(JSON.stringify(teams));
    return;
  }

  // GET Sprints
  if (pathname === '/api/sprints' && req.method === 'GET') {
    const db = readDatabase();
    const team = query.team;
    const product = query.product;
    let sprints = db?.sprints || [];
    if (team) {
      sprints = sprints.filter(s => s.team === team);
    }
    if (product) {
      sprints = sprints.filter(s => s.product === product);
    }
    res.writeHead(200);
    res.end(JSON.stringify(sprints));
    return;
  }

  // GET Metrics
  if (pathname === '/api/metrics' && req.method === 'GET') {
    const db = readDatabase();
    const product = query.product;
    const team = query.team;
    const sprint = query.sprint;
    let metrics = db?.metrics || [];

    if (sprint) {
      metrics = metrics.filter(m => m.sprint === sprint);
    } else if (team) {
      metrics = metrics.filter(m => m.team === team);
    } else if (product) {
      metrics = metrics.filter(m => m.product === product);
    }

    if (metrics.length === 0) {
      res.writeHead(200);
      res.end(JSON.stringify(null));
      return;
    }

    if (metrics.length === 1) {
      res.writeHead(200);
      res.end(JSON.stringify(metrics[0]));
      return;
    }

    // Average aggregation
    const aggregated = {
      product: metrics[0].product,
      team: team || null,
      sprint: sprint || null,
      metricsDate: new Date().toISOString().split('T')[0],
      requirementsCovered: Math.round(metrics.reduce((sum, m) => sum + m.requirementsCovered, 0) / metrics.length),
      testsCovered: Math.round(metrics.reduce((sum, m) => sum + m.testsCovered, 0) / metrics.length),
      defectsOpen: Math.round(metrics.reduce((sum, m) => sum + m.defectsOpen, 0) / metrics.length),
      defectsClosed: Math.round(metrics.reduce((sum, m) => sum + m.defectsClosed, 0) / metrics.length),
      deploymentReadiness: Math.round(metrics.reduce((sum, m) => sum + m.deploymentReadiness, 0) / metrics.length),
      codeQuality: Math.round(metrics.reduce((sum, m) => sum + m.codeQuality, 0) / metrics.length)
    };

    res.writeHead(200);
    res.end(JSON.stringify(aggregated));
    return;
  }

  // POST Metrics
  if (pathname === '/api/metrics' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const db = readDatabase();
      const newMetric = {
        id: `metric-${Date.now()}`,
        metricsDate: new Date().toISOString().split('T')[0],
        ...parseJson(body)
      };
      db.metrics = db.metrics || [];
      db.metrics.push(newMetric);
      writeDatabase(db);
      res.writeHead(201);
      res.end(JSON.stringify(newMetric));
    });
    return;
  }

  // GET Tests Covered by Sprint
  if (pathname === '/api/metrics/tests-covered' && req.method === 'GET') {
    const db = readDatabase();
    const testsCovered = db.tests_covered || {};
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      data: testsCovered,
      available_sprints: Object.keys(testsCovered),
      total_sprints: Object.keys(testsCovered).length
    }));
    return;
  }

  // GET Tests Covered for Specific Sprint
  if (pathname.startsWith('/api/metrics/tests-covered/') && req.method === 'GET') {
    const sprint = pathname.split('/').pop();
    const db = readDatabase();
    const testsCovered = db.tests_covered || {};
    
    if (testsCovered[sprint]) {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        sprint: sprint,
        data: testsCovered[sprint]
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Sprint not found',
        available_sprints: Object.keys(testsCovered),
        requested_sprint: sprint
      }));
    }
    return;
  }

  // GET Tests Covered Summary (all sprints aggregated)
  if (pathname === '/api/metrics/tests-covered-summary' && req.method === 'GET') {
    const db = readDatabase();
    const testsCovered = db.tests_covered || {};
    
    // Calculate aggregated stats
    let totalTestCases = 0;
    let totalAutomated = 0;
    let totalWithAttachments = 0;
    const sprintStats = [];
    
    for (const sprint in testsCovered) {
      const data = testsCovered[sprint];
      const summary = data.summary || {};
      
      totalTestCases += summary.total_test_cases || 0;
      totalAutomated += summary.total_automated || 0;
      totalWithAttachments += summary.total_with_attachments || 0;
      
      sprintStats.push({
        sprint: sprint,
        total_test_cases: summary.total_test_cases || 0,
        total_automated: summary.total_automated || 0,
        automation_coverage_percent: summary.automation_coverage_percent || 0,
        teams_count: summary.teams_count || 0
      });
    }
    
    const aggregatedCoverage = totalTestCases > 0 
      ? ((totalAutomated / totalTestCases) * 100).toFixed(1)
      : 0;
    
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      aggregate: {
        total_test_cases: totalTestCases,
        total_automated: totalAutomated,
        automation_coverage_percent: parseFloat(aggregatedCoverage),
        total_with_attachments: totalWithAttachments,
        sprints_tracked: Object.keys(testsCovered).length
      },
      sprints: sprintStats
    }));
    return;
  }

  // GET Team Breakdown for a Sprint
  if (pathname.startsWith('/api/metrics/tests-covered/') && pathname.includes('/teams') && req.method === 'GET') {
    const parts = pathname.split('/');
    const sprint = parts[4];
    const db = readDatabase();
    const testsCovered = db.tests_covered || {};
    
    if (testsCovered[sprint]) {
      const data = testsCovered[sprint];
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'success',
        sprint: sprint,
        teams: data.teams || {},
        summary: {
          total_teams: Object.keys(data.teams || {}).length,
          total_test_cases: data.summary?.total_test_cases || 0
        }
      }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Sprint not found',
        requested_sprint: sprint
      }));
    }
    return;
  }

  // POST Update Tests Covered (for manual updates)
  if (pathname === '/api/metrics/tests-covered' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const db = readDatabase();
      const payload = parseJson(body);
      
      if (payload && payload.sprint && payload.data) {
        db.tests_covered = db.tests_covered || {};
        db.tests_covered[payload.sprint] = payload.data;
        
        if (writeDatabase(db)) {
          res.writeHead(201);
          res.end(JSON.stringify({
            status: 'success',
            message: `Tests covered data saved for sprint ${payload.sprint}`,
            sprint: payload.sprint
          }));
        } else {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to save data' }));
        }
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ 
          error: 'Invalid payload. Expected: { sprint: string, data: object }' 
        }));
      }
    });
    return;
  }

  // Health Check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'JSON File (db.json)',
      message: 'API Server is running - using temporary JSON database',
      endpoints: {
        tests_covered: '/api/metrics/tests-covered',
        tests_covered_sprint: '/api/metrics/tests-covered/:sprint',
        tests_covered_summary: '/api/metrics/tests-covered-summary',
        team_breakdown: '/api/metrics/tests-covered/:sprint/teams'
      }
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${dbFile}`);
  console.log(`📋 Using temporary JSON database (db.json)`);
  console.log(`⚠️  Note: npm packages not yet installed. Install mssql and dotenv when npm is available.`);
});
