import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup LowDB
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

// Initialize database with default data
async function initDB() {
  await db.read();
  
  // Initialize structure if empty
  if (!db.data || Object.keys(db.data).length === 0) {
    db.data = {
      teams: [],
      sprints: [],
      metrics: []
    };
  }
  
  // Add default data if empty
  if (!db.data.teams || db.data.teams.length === 0) {
    db.data.teams = [
      { id: 1, name: 'Vanguards', displayName: 'T360 Vanguards', product: 'T360' },
      { id: 2, name: 'Pioneers', displayName: 'T360 Pioneers', product: 'T360' },
      { id: 3, name: 'Rangers', displayName: 'ELM Rangers', product: 'ELM' },
      { id: 4, name: 'Navigators', displayName: 'ELM Navigators', product: 'ELM' },
      { id: 5, name: 'Explorers', displayName: 'DMS Explorers', product: 'DMS' },
      { id: 6, name: 'Guardians', displayName: 'DMS Guardians', product: 'DMS' }
    ];
    
    db.data.sprints = [
      { id: 1, name: '26.1.1', startDate: '2026-01-01', endDate: '2026-01-14', status: 'active' },
      { id: 2, name: '26.1.0', startDate: '2025-12-18', endDate: '2025-12-31', status: 'completed' },
      { id: 3, name: '25.4.2', startDate: '2025-12-04', endDate: '2025-12-17', status: 'completed' },
      { id: 4, name: '25.4.1', startDate: '2025-11-20', endDate: '2025-12-03', status: 'completed' },
      { id: 5, name: '25.4.0', startDate: '2025-11-06', endDate: '2025-11-19', status: 'completed' }
    ];
    
    db.data.metrics = [
      {
        id: 1,
        teamId: 1,
        sprintId: 1,
        timestamp: new Date().toISOString(),
        tadTsMetrics: {
          totalStories: 24,
          tadComplete: 21,
          tadNa: 0,
          tadMissing: 3,
          tadPct: 87.5,
          tsComplete: 22,
          tsNa: 0,
          tsMissing: 2,
          tsPct: 91.7
        },
        qtestMetrics: {
          uniqueTestCases: 89,
          automatedTestCases: 72,
          manualTestCases: 17,
          automationPct: 80.9,
          totalTestRuns: 234
        },
        defectMetrics: {
          totalDefects: 12,
          reopenedDefects: 2,
          reopenedPct: 16.7,
          bySeverity: { Critical: 1, High: 3, Medium: 6, Low: 2 },
          bySdlc: { Development: 5, 'System Test': 4, UAT: 2, Production: 1 }
        }
      }
    ];
    
    await db.write();
  }
}

// API Routes
app.get('/api/teams', async (req, res) => {
  await db.read();
  res.json(db.data.teams);
});

app.get('/api/sprints', async (req, res) => {
  await db.read();
  res.json(db.data.sprints);
});

app.get('/api/metrics/:teamId/:sprintId', async (req, res) => {
  await db.read();
  const { teamId, sprintId } = req.params;
  const metrics = db.data.metrics.find(
    m => m.teamId === parseInt(teamId) && m.sprintId === parseInt(sprintId)
  );
  
  if (metrics) {
    res.json(metrics);
  } else {
    res.status(404).json({ error: 'Metrics not found' });
  }
});

app.post('/api/metrics', async (req, res) => {
  await db.read();
  const newMetric = {
    id: db.data.metrics.length + 1,
    ...req.body,
    timestamp: new Date().toISOString()
  };
  db.data.metrics.push(newMetric);
  await db.write();
  res.status(201).json(newMetric);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gateway with LowDB is running' });
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`📊 Database file: ${file}`);
    console.log(`✅ Available endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/teams`);
    console.log(`   GET  /api/sprints`);
    console.log(`   GET  /api/metrics/:teamId/:sprintId`);
    console.log(`   POST /api/metrics`);
  });
});
