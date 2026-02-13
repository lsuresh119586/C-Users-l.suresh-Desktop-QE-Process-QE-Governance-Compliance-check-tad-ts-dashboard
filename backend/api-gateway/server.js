import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import { getSprintDefectsData } from './sample-tadts-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'db.json');

const parseJson = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

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

// Default data structure
const defaultData = {
  products: [
    { id: 'passport', name: 'Passport' },
    { id: 't360', name: 'T360' },
    { id: 'dna', name: 'DnA' },
    { id: 'collaboration-portal', name: 'Collaboration Portal' }
  ],
  teams: [
    // Passport teams
    { id: 'team-a', name: 'Team A', product: 'passport' },
    { id: 'team-b', name: 'Team B', product: 'passport' },
    { id: 'team-c', name: 'Team C', product: 'passport' },
    
    // T360 teams
    { id: 'vanguards', name: 'Vanguards', product: 't360' },
    { id: 'chargers', name: 'Chargers', product: 't360' },
    { id: 'chubb', name: 'Chubb', product: 't360' },
    { id: 'matrix', name: 'Matrix', product: 't360' },
    { id: 'mavericks', name: 'Mavericks', product: 't360' },
    { id: 'nexus', name: 'Nexus', product: 't360' }
  ],
  sprints: [
    // Passport sprints
    { id: 'team-a-25.1.1', name: 'Sprint 25.1.1', team: 'team-a' },
    { id: 'team-a-25.1.2', name: 'Sprint 25.1.2', team: 'team-a' },
    
    // T360 - Vanguards sprints
    { id: 'vanguards-26.1.2', name: 'Sprint 26.1.2', team: 'vanguards' },
    { id: 'vanguards-26.1.3', name: 'Sprint 26.1.3', team: 'vanguards' },
    { id: 'vanguards-26.1.4', name: 'Sprint 26.1.4', team: 'vanguards' },
    { id: 'vanguards-26.1.5', name: 'Sprint 26.1.5', team: 'vanguards' },
    { id: 'vanguards-26.1.6', name: 'Sprint 26.1.6', team: 'vanguards' },
    
    // T360 - Chargers sprints
    { id: 'chargers-26.1.1', name: 'Sprint 26.1.1', team: 'chargers' },
    { id: 'chargers-26.1.2', name: 'Sprint 26.1.2', team: 'chargers' },
    { id: 'chargers-26.1.3', name: 'Sprint 26.1.3', team: 'chargers' },
    { id: 'chargers-26.1.4', name: 'Sprint 26.1.4', team: 'chargers' },
    { id: 'chargers-26.1.5', name: 'Sprint 26.1.5', team: 'chargers' },
    { id: 'chargers-26.1.6', name: 'Sprint 26.1.6', team: 'chargers' },
    
    // T360 - Chubb sprints
    { id: 'chubb-26.1.1', name: 'Sprint 26.1.1', team: 'chubb' },
    { id: 'chubb-26.1.2', name: 'Sprint 26.1.2', team: 'chubb' },
    { id: 'chubb-26.1.3', name: 'Sprint 26.1.3', team: 'chubb' },
    { id: 'chubb-26.1.4', name: 'Sprint 26.1.4', team: 'chubb' },
    { id: 'chubb-26.1.5', name: 'Sprint 26.1.5', team: 'chubb' },
    { id: 'chubb-26.1.6', name: 'Sprint 26.1.6', team: 'chubb' },
    
    // T360 - Matrix sprints
    { id: 'matrix-26.1.1', name: 'Sprint 26.1.1', team: 'matrix' },
    { id: 'matrix-26.1.2', name: 'Sprint 26.1.2', team: 'matrix' },
    { id: 'matrix-26.1.3', name: 'Sprint 26.1.3', team: 'matrix' },
    { id: 'matrix-26.1.4', name: 'Sprint 26.1.4', team: 'matrix' },
    { id: 'matrix-26.1.5', name: 'Sprint 26.1.5', team: 'matrix' },
    { id: 'matrix-26.1.6', name: 'Sprint 26.1.6', team: 'matrix' },
    
    // T360 - Mavericks sprints
    { id: 'mavericks-26.1.1', name: 'Sprint 26.1.1', team: 'mavericks' },
    { id: 'mavericks-26.1.2', name: 'Sprint 26.1.2', team: 'mavericks' },
    { id: 'mavericks-26.1.3', name: 'Sprint 26.1.3', team: 'mavericks' },
    { id: 'mavericks-26.1.4', name: 'Sprint 26.1.4', team: 'mavericks' },
    { id: 'mavericks-26.1.5', name: 'Sprint 26.1.5', team: 'mavericks' },
    { id: 'mavericks-26.1.6', name: 'Sprint 26.1.6', team: 'mavericks' },
    
    // T360 - Nexus sprints
    { id: 'nexus-26.1.1', name: 'Sprint 26.1.1', team: 'nexus' },
    { id: 'nexus-26.1.2', name: 'Sprint 26.1.2', team: 'nexus' },
    { id: 'nexus-26.1.3', name: 'Sprint 26.1.3', team: 'nexus' },
    { id: 'nexus-26.1.4', name: 'Sprint 26.1.4', team: 'nexus' },
    { id: 'nexus-26.1.5', name: 'Sprint 26.1.5', team: 'nexus' },
    { id: 'nexus-26.1.6', name: 'Sprint 26.1.6', team: 'nexus' }
  ],
  metrics: [
    // Passport Team A Sprint 25.1.1
    {
      id: 'metric-team-a-25.1.1',
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-25.1.1',
      requirementsCovered: 95,
      testsCovered: 92,
      defectsOpen: 3,
      defectsClosed: 18,
      deploymentReadiness: 90,
      codeQuality: 88,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // Passport Team A Sprint 25.1.2
    {
      id: 'metric-team-a-25.1.2',
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-25.1.2',
      requirementsCovered: 93,
      testsCovered: 90,
      defectsOpen: 5,
      defectsClosed: 20,
      deploymentReadiness: 87,
      codeQuality: 85,
      timestamp: '2025-01-16T10:00:00Z'
    },
    
    // T360 - Vanguards Sprint 26.1.2
    {
      id: 'metric-vanguards-26.1.2',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.2',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 22,
      deploymentReadiness: 88,
      codeQuality: 83,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.3
    {
      id: 'metric-vanguards-26.1.3',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.3',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 24,
      deploymentReadiness: 90,
      codeQuality: 86,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.4
    {
      id: 'metric-vanguards-26.1.4',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.4',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 23,
      deploymentReadiness: 89,
      codeQuality: 84,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.5
    {
      id: 'metric-vanguards-26.1.5',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.5',
      requirementsCovered: 93,
      testsCovered: 88,
      defectsOpen: 3,
      defectsClosed: 26,
      deploymentReadiness: 91,
      codeQuality: 87,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Vanguards Sprint 26.1.6
    {
      id: 'metric-vanguards-26.1.6',
      product: 't360',
      team: 'vanguards',
      sprint: 'vanguards-26.1.6',
      requirementsCovered: 94,
      testsCovered: 89,
      defectsOpen: 2,
      defectsClosed: 28,
      deploymentReadiness: 92,
      codeQuality: 88,
      timestamp: '2025-01-19T10:00:00Z'
    },
    
    // T360 - Chargers Sprint 26.1.1
    {
      id: 'metric-chargers-26.1.1',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.1',
      requirementsCovered: 88,
      testsCovered: 82,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 80,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.2
    {
      id: 'metric-chargers-26.1.2',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.2',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.3
    {
      id: 'metric-chargers-26.1.3',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.3',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.4
    {
      id: 'metric-chargers-26.1.4',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.4',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.5
    {
      id: 'metric-chargers-26.1.5',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.5',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 29,
      deploymentReadiness: 89,
      codeQuality: 85,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Chargers Sprint 26.1.6
    {
      id: 'metric-chargers-26.1.6',
      product: 't360',
      team: 'chargers',
      sprint: 'chargers-26.1.6',
      requirementsCovered: 93,
      testsCovered: 88,
      defectsOpen: 3,
      defectsClosed: 30,
      deploymentReadiness: 90,
      codeQuality: 86,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Chubb Sprint 26.1.1
    {
      id: 'metric-chubb-26.1.1',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.1',
      requirementsCovered: 87,
      testsCovered: 81,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 79,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.2
    {
      id: 'metric-chubb-26.1.2',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.2',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.3
    {
      id: 'metric-chubb-26.1.3',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.3',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.4
    {
      id: 'metric-chubb-26.1.4',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.4',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.5
    {
      id: 'metric-chubb-26.1.5',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.5',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Chubb Sprint 26.1.6
    {
      id: 'metric-chubb-26.1.6',
      product: 't360',
      team: 'chubb',
      sprint: 'chubb-26.1.6',
      requirementsCovered: 92,
      testsCovered: 87,
      defectsOpen: 4,
      defectsClosed: 29,
      deploymentReadiness: 89,
      codeQuality: 85,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Matrix Sprint 26.1.1
    {
      id: 'metric-matrix-26.1.1',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.1',
      requirementsCovered: 86,
      testsCovered: 80,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 78,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.2
    {
      id: 'metric-matrix-26.1.2',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.2',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.3
    {
      id: 'metric-matrix-26.1.3',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.3',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.4
    {
      id: 'metric-matrix-26.1.4',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.4',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.5
    {
      id: 'metric-matrix-26.1.5',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.5',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Matrix Sprint 26.1.6
    {
      id: 'metric-matrix-26.1.6',
      product: 't360',
      team: 'matrix',
      sprint: 'matrix-26.1.6',
      requirementsCovered: 91,
      testsCovered: 86,
      defectsOpen: 5,
      defectsClosed: 28,
      deploymentReadiness: 88,
      codeQuality: 84,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Mavericks Sprint 26.1.1
    {
      id: 'metric-mavericks-26.1.1',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.1',
      requirementsCovered: 85,
      testsCovered: 79,
      defectsOpen: 11,
      defectsClosed: 22,
      deploymentReadiness: 82,
      codeQuality: 77,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.2
    {
      id: 'metric-mavericks-26.1.2',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.2',
      requirementsCovered: 86,
      testsCovered: 81,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 79,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.3
    {
      id: 'metric-mavericks-26.1.3',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.3',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.4
    {
      id: 'metric-mavericks-26.1.4',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.4',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.5
    {
      id: 'metric-mavericks-26.1.5',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.5',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Mavericks Sprint 26.1.6
    {
      id: 'metric-mavericks-26.1.6',
      product: 't360',
      team: 'mavericks',
      sprint: 'mavericks-26.1.6',
      requirementsCovered: 90,
      testsCovered: 85,
      defectsOpen: 6,
      defectsClosed: 27,
      deploymentReadiness: 87,
      codeQuality: 83,
      timestamp: '2025-01-20T10:00:00Z'
    },
    
    // T360 - Nexus Sprint 26.1.1
    {
      id: 'metric-nexus-26.1.1',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.1',
      requirementsCovered: 84,
      testsCovered: 78,
      defectsOpen: 12,
      defectsClosed: 21,
      deploymentReadiness: 81,
      codeQuality: 76,
      timestamp: '2025-01-15T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.2
    {
      id: 'metric-nexus-26.1.2',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.2',
      requirementsCovered: 85,
      testsCovered: 80,
      defectsOpen: 11,
      defectsClosed: 22,
      deploymentReadiness: 82,
      codeQuality: 78,
      timestamp: '2025-01-16T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.3
    {
      id: 'metric-nexus-26.1.3',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.3',
      requirementsCovered: 86,
      testsCovered: 81,
      defectsOpen: 10,
      defectsClosed: 23,
      deploymentReadiness: 83,
      codeQuality: 79,
      timestamp: '2025-01-17T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.4
    {
      id: 'metric-nexus-26.1.4',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.4',
      requirementsCovered: 87,
      testsCovered: 82,
      defectsOpen: 9,
      defectsClosed: 24,
      deploymentReadiness: 84,
      codeQuality: 80,
      timestamp: '2025-01-18T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.5
    {
      id: 'metric-nexus-26.1.5',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.5',
      requirementsCovered: 88,
      testsCovered: 83,
      defectsOpen: 8,
      defectsClosed: 25,
      deploymentReadiness: 85,
      codeQuality: 81,
      timestamp: '2025-01-19T10:00:00Z'
    },
    // T360 - Nexus Sprint 26.1.6
    {
      id: 'metric-nexus-26.1.6',
      product: 't360',
      team: 'nexus',
      sprint: 'nexus-26.1.6',
      requirementsCovered: 89,
      testsCovered: 84,
      defectsOpen: 7,
      defectsClosed: 26,
      deploymentReadiness: 86,
      codeQuality: 82,
      timestamp: '2025-01-20T10:00:00Z'
    }
  ]
};

// Initialize database if it doesn't exist
const initDatabase = () => {
  let db = readDatabase();
  if (!db) {
    console.log('📝 Creating database with default data...');
    db = defaultData;
    writeDatabase(db);
    console.log('✅ Database initialized successfully');
  }
  return db;
};

// Start server
const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const db = readDatabase();

  // GET /api/products
  if (pathname === '/api/products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.products));
    return;
  }

  // GET /api/teams
  if (pathname === '/api/teams' && req.method === 'GET') {
    const { product } = query;
    let teams = db.teams;
    
    if (product) {
      teams = teams.filter(t => t.product === product);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(teams));
    return;
  }

  // GET /api/sprints
  if (pathname === '/api/sprints' && req.method === 'GET') {
    const { team } = query;
    let sprints = db.sprints;
    
    if (team) {
      sprints = sprints.filter(s => s.team === team);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sprints));
    return;
  }

  // GET /api/metrics
  if (pathname === '/api/metrics' && req.method === 'GET') {
    const { product, team, sprint } = query;
    let metrics = db.metrics;
    
    if (product) {
      metrics = metrics.filter(m => m.product === product);
    }
    if (team) {
      metrics = metrics.filter(m => m.team === team);
    }
    if (sprint) {
      metrics = metrics.filter(m => m.sprint === sprint);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
    return;
  }

  // GET /api/qtest/sprint/:sprint - Get test case metrics from QTest data
  if (req.method === 'GET' && req.url.startsWith('/api/qtest/sprint/')) {
    try {
      // Extract sprint name from URL path: /api/qtest/sprint/26.1.2
      const pathParts = req.url.split('/');
      const sprintName = pathParts[pathParts.length - 1].split('?')[0]; // Remove query params if any
      
      if (!sprintName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'sprint name required' }));
        return;
      }

      // Get test case data from db.json tests_covered section
      const testsCovered = db.tests_covered || {};
      let sprintData = null;

      // Find sprint by number
      if (testsCovered[sprintName]) {
        sprintData = testsCovered[sprintName];
      }

      if (!sprintData) {
        // Return default structure if not found
        sprintData = {
          sprint: sprintName,
          summary: {
            total_test_cases: 0,
            total_automated: 0,
            total_with_attachments: 0
          },
          teams: {}
        };
      }

      // Format for frontend consumption
      const summary = sprintData.summary || {};
      const response = {
        sprint: sprintName,
        totals: {
          total: summary.total_test_cases || 0,
          automated: summary.total_automated || 0,
          with_attachments: summary.total_with_attachments || 0,
          without_attachments: Math.max(0, (summary.total_automated || 0) - (summary.total_with_attachments || 0))
        },
        teams: sprintData.teams || {}
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error in /api/qtest/sprint:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // POST /api/metrics
  if (pathname === '/api/metrics' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const data = parseJson(body);
      if (!data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      
      const metric = {
        id: `metric-${data.team}-${data.sprint}-${Date.now()}`,
        product: data.product,
        team: data.team,
        sprint: data.sprint,
        requirementsCovered: data.requirementsCovered || 0,
        testsCovered: data.testsCovered || 0,
        defectsOpen: data.defectsOpen || 0,
        defectsClosed: data.defectsClosed || 0,
        deploymentReadiness: data.deploymentReadiness || 0,
        codeQuality: data.codeQuality || 0,
        timestamp: new Date().toISOString()
      };
      
      db.metrics.push(metric);
      writeDatabase(db);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metric));
    });
    return;
  }

  // GET /api/defects/by-module - Get defects for a specific sprint
  if (req.method === 'GET' && req.url.startsWith('/api/defects/by-module')) {
    const urlObj = new url.URL(req.url, `http://${req.headers.host}`);
    const sprintName = urlObj.searchParams.get('sprint');
    
    if (!sprintName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    const defectData = getSprintDefectsData(sprintName);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(defectData, null, 2));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize DB and start server
initDatabase();

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

const listener = server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/teams?product=<product-id>`);
  console.log(`   GET  /api/sprints?team=<team-id>`);
  console.log(`   GET  /api/metrics?product=<product-id>&team=<team-id>&sprint=<sprint-id>`);
  console.log(`   POST /api/metrics`);
  console.log(`   GET  /api/qtest/sprint/<sprint-name>`);
  console.log(`   GET  /api/defects/by-module?sprint=<sprint-name>`);
  console.log(`✅ Callback executed successfully - server should be listening`);
});

// Keep server alive and handle graceful shutdown
listener.keepAliveTimeout = 65000;
console.log(`⏳ Server object created, about to listen on port ${PORT}...`);
console.log(`✅ Listener configured - keeping process alive`);
process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM received, shutting down gracefully...');
  listener.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
