import http from 'http';
import { execSync } from 'child_process';
import url from 'url';

// SQL Server Configuration
const server = 'zusscntssql19\\sql2022';
const database = 'Polarisdashboard';
const username = 'sql-cs-user';
const password = '***REMOVED_DB_PASSWORD***';

/**
 * Execute SQL command via sqlcmd
 */
function runSqlCommand(query) {
  try {
    const result = execSync(
      `sqlcmd -S "${server}" -d "${database}" -U "${username}" -P "${password}" -C -h -1 -W -s "," -Q "${query.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim();
  } catch (error) {
    console.error('SQL Error:', error.message);
    return null;
  }
}

/**
 * Parse CSV result from sqlcmd into array of objects
 */
function parseCsvResult(csvText, columns) {
  if (!csvText) return [];
  
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = values[idx] || '';
    });
    return obj;
  });
}

/**
 * Get all products
 */
function getProducts() {
  const query = 'SELECT id, name FROM Products ORDER BY name';
  const result = runSqlCommand(query);
  return parseCsvResult(result, ['id', 'name']);
}

/**
 * Get teams by product
 */
function getTeams(productId = null) {
  let query = 'SELECT t.id, t.name, t.product FROM Teams t';
  if (productId) {
    query += ` WHERE t.product = '${productId.replace(/'/g, "''")}'`;
  }
  query += ' ORDER BY t.name';
  
  const result = runSqlCommand(query);
  return parseCsvResult(result, ['id', 'name', 'product']);
}

/**
 * Get sprints by team
 */
function getSprints(teamId = null) {
  let query = 'SELECT s.id, s.name, s.team FROM Sprints s';
  if (teamId) {
    query += ` WHERE s.team = '${teamId.replace(/'/g, "''")}'`;
  }
  query += ' ORDER BY s.name';
  
  const result = runSqlCommand(query);
  return parseCsvResult(result, ['id', 'name', 'team']);
}

/**
 * Get metrics with optional filters
 */
function getMetrics(filters = {}) {
  let query = `
    SELECT 
      m.id,
      m.product,
      m.team,
      m.sprint,
      m.testsCovered,
      m.newDefects,
      m.totalDefects,
      m.testExecution,
      m.automationProgress,
      m.codeReviews
    FROM Metrics m
  `;
  
  const whereClauses = [];
  if (filters.product) {
    whereClauses.push(`m.product = '${filters.product.replace(/'/g, "''")}'`);
  }
  if (filters.team) {
    whereClauses.push(`m.team = '${filters.team.replace(/'/g, "''")}'`);
  }
  if (filters.sprint) {
    whereClauses.push(`m.sprint = '${filters.sprint.replace(/'/g, "''")}'`);
  }
  
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  const result = runSqlCommand(query);
  return parseCsvResult(result, [
    'id', 'product', 'team', 'sprint',
    'testsCovered', 'newDefects', 'totalDefects',
    'testExecution', 'automationProgress', 'codeReviews'
  ]).map(m => ({
    ...m,
    testsCovered: parseInt(m.testsCovered) || 0,
    newDefects: parseInt(m.newDefects) || 0,
    totalDefects: parseInt(m.totalDefects) || 0,
    testExecution: parseInt(m.testExecution) || 0,
    automationProgress: parseInt(m.automationProgress) || 0,
    codeReviews: parseInt(m.codeReviews) || 0
  }));
}

/**
 * Create or update a metric
 */
function upsertMetric(metric) {
  // Check if metric exists
  const checkQuery = `
    SELECT COUNT(*) as count
    FROM Metrics
    WHERE product = '${metric.product.replace(/'/g, "''")}'
      AND team = '${metric.team.replace(/'/g, "''")}'
      AND sprint = '${metric.sprint.replace(/'/g, "''")}'
  `;
  
  const checkResult = runSqlCommand(checkQuery);
  const exists = checkResult && parseInt(checkResult.split(',')[0]) > 0;
  
  let query;
  if (exists) {
    // Update existing metric
    query = `
      UPDATE Metrics
      SET testsCovered = ${metric.testsCovered || 0},
          newDefects = ${metric.newDefects || 0},
          totalDefects = ${metric.totalDefects || 0},
          testExecution = ${metric.testExecution || 0},
          automationProgress = ${metric.automationProgress || 0},
          codeReviews = ${metric.codeReviews || 0},
          timestamp = GETDATE()
      WHERE product = '${metric.product.replace(/'/g, "''")}'
        AND team = '${metric.team.replace(/'/g, "''")}'
        AND sprint = '${metric.sprint.replace(/'/g, "''")}'
    `;
  } else {
    // Insert new metric
    query = `
      INSERT INTO Metrics (product, team, sprint, testsCovered, newDefects, totalDefects, testExecution, automationProgress, codeReviews, timestamp)
      VALUES (
        '${metric.product.replace(/'/g, "''")}',
        '${metric.team.replace(/'/g, "''")}',
        '${metric.sprint.replace(/'/g, "''")}',
        ${metric.testsCovered || 0},
        ${metric.newDefects || 0},
        ${metric.totalDefects || 0},
        ${metric.testExecution || 0},
        ${metric.automationProgress || 0},
        ${metric.codeReviews || 0},
        GETDATE()
      )
    `;
  }
  
  const result = runSqlCommand(query);
  return result !== null;
}

const parseJson = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
};

const sendError = (res, statusCode, message) => {
  sendJson(res, statusCode, { error: message });
};

const server_http = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  console.log(`${req.method} ${pathname}`);

  // GET /api/products
  if (req.method === 'GET' && pathname === '/api/products') {
    try {
      const products = getProducts();
      sendJson(res, 200, products);
    } catch (error) {
      console.error('Error fetching products:', error);
      sendError(res, 500, 'Failed to fetch products');
    }
    return;
  }

  // GET /api/teams?product=...
  if (req.method === 'GET' && pathname === '/api/teams') {
    try {
      const teams = getTeams(query.product);
      sendJson(res, 200, teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      sendError(res, 500, 'Failed to fetch teams');
    }
    return;
  }

  // GET /api/sprints?team=...
  if (req.method === 'GET' && pathname === '/api/sprints') {
    try {
      const sprints = getSprints(query.team);
      sendJson(res, 200, sprints);
    } catch (error) {
      console.error('Error fetching sprints:', error);
      sendError(res, 500, 'Failed to fetch sprints');
    }
    return;
  }

  // GET /api/metrics?product=...&team=...&sprint=...
  if (req.method === 'GET' && pathname === '/api/metrics') {
    try {
      const filters = {
        product: query.product,
        team: query.team,
        sprint: query.sprint
      };
      const metrics = getMetrics(filters);
      sendJson(res, 200, metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      sendError(res, 500, 'Failed to fetch metrics');
    }
    return;
  }

  // POST /api/metrics
  if (req.method === 'POST' && pathname === '/api/metrics') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const metric = parseJson(body);
        if (!metric || !metric.product || !metric.team || !metric.sprint) {
          sendError(res, 400, 'Invalid metric data');
          return;
        }

        const success = upsertMetric(metric);
        if (success) {
          sendJson(res, 200, { message: 'Metric saved successfully' });
        } else {
          sendError(res, 500, 'Failed to save metric');
        }
      } catch (error) {
        console.error('Error saving metric:', error);
        sendError(res, 500, 'Failed to save metric');
      }
    });
    return;
  }

  // 404 for all other routes
  sendError(res, 404, 'Not Found');
});

const PORT = process.env.PORT || 3000;

server_http.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  Polaris Dashboard API Server (SQL Server)');
  console.log('='.repeat(60));
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  Database: ${database} on ${server}`);
  console.log('='.repeat(60) + '\n');
  console.log('Available endpoints:');
  console.log('  GET  /api/products');
  console.log('  GET  /api/teams?product={productId}');
  console.log('  GET  /api/sprints?team={teamId}');
  console.log('  GET  /api/metrics?product={productId}&team={teamId}&sprint={sprintId}');
  console.log('  POST /api/metrics');
  console.log('\n' + '='.repeat(60) + '\n');
});
