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
      products: [],
      teams: [],
      sprints: [],
      metrics: []
    };
  }
  
  // Add default data if empty
  if (!db.data.products || db.data.products.length === 0) {
    db.data.products = [
      { id: 1, code: 'PASSPORT', name: 'Passport', displayName: 'Passport' },
      { id: 2, code: 'T360', name: 'T360', displayName: 'Tymetrix 360' },
      { id: 3, code: 'DNA', name: 'DnA', displayName: 'Data & Analytics' },
      { id: 4, code: 'COLLAB', name: 'Collaboration Portal', displayName: 'Collaboration Portal' }
    ];
  }
  
  if (!db.data.teams || db.data.teams.length === 0) {
    db.data.teams = [
      // T360 Teams
      { id: 1, name: 'Chubb', displayName: 'T360 Chubb', productId: 2 },
      { id: 2, name: 'Chargers', displayName: 'T360 Chargers', productId: 2 },
      { id: 3, name: 'Matrix', displayName: 'T360 Matrix', productId: 2 },
      { id: 4, name: 'Mavericks', displayName: 'T360 Mavericks', productId: 2 },
      { id: 5, name: 'Vanguards', displayName: 'T360 Vanguards', productId: 2 },
      { id: 6, name: 'Nexus', displayName: 'T360 Nexus', productId: 2 },
      // Passport Teams
      { id: 7, name: 'Spartacles', displayName: 'Passport Spartacles', productId: 1 },
      { id: 8, name: 'Genesis', displayName: 'Passport Genesis', productId: 1 },
      // Collaboration Portal Teams
      { id: 9, name: 'Pioneers', displayName: 'Collab Pioneers', productId: 4 },
      // DnA Teams
      { id: 10, name: 'Guardians', displayName: 'DnA Guardians', productId: 3 },
      { id: 11, name: 'Athena', displayName: 'DnA Athena', productId: 3 }
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
        teamId: 5,  // T360 Vanguards
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
app.get('/api/products', async (req, res) => {
  await db.read();
  res.json(db.data.products);
});

app.get('/api/teams', async (req, res) => {
  await db.read();
  const { productId } = req.query;
  let teams = db.data.teams;
  
  if (productId) {
    teams = teams.filter(t => t.productId === parseInt(productId));
  }
  
  res.json(teams);
});

app.get('/api/sprints', async (req, res) => {
  await db.read();
  res.json(db.data.sprints);
});

// Get metrics by team and sprint
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

// Get aggregated metrics by product
app.get('/api/metrics/product/:productId', async (req, res) => {
  await db.read();
  const { productId } = req.params;
  const teams = db.data.teams.filter(t => t.productId === parseInt(productId));
  const teamIds = teams.map(t => t.id);
  const productMetrics = db.data.metrics.filter(m => teamIds.includes(m.teamId));
  
  if (productMetrics.length === 0) {
    return res.status(404).json({ error: 'No metrics found for this product' });
  }
  
  // Aggregate metrics across all teams
  const aggregated = aggregateMetrics(productMetrics);
  res.json({ productId: parseInt(productId), ...aggregated });
});

// Get aggregated metrics by team (across all sprints)
app.get('/api/metrics/team/:teamId', async (req, res) => {
  await db.read();
  const { teamId } = req.params;
  const teamMetrics = db.data.metrics.filter(m => m.teamId === parseInt(teamId));
  
  if (teamMetrics.length === 0) {
    return res.status(404).json({ error: 'No metrics found for this team' });
  }
  
  const aggregated = aggregateMetrics(teamMetrics);
  res.json({ teamId: parseInt(teamId), ...aggregated });
});

// Helper function to aggregate metrics
function aggregateMetrics(metricsArray) {
  const totals = {
    tadComplete: 0,
    tadNa: 0,
    tadMissing: 0,
    tsComplete: 0,
    tsNa: 0,
    tsMissing: 0,
    automatedTestCases: 0,
    manualTestCases: 0,
    totalDefects: 0,
    reopenedDefects: 0,
    totalStories: 0,
    totalTestRuns: 0,
    bySdlc: {}
  };
  
  metricsArray.forEach(m => {
    totals.tadComplete += m.tadTsMetrics.tadComplete;
    totals.tadNa += m.tadTsMetrics.tadNa;
    totals.tadMissing += m.tadTsMetrics.tadMissing;
    totals.tsComplete += m.tadTsMetrics.tsComplete;
    totals.tsNa += m.tadTsMetrics.tsNa;
    totals.tsMissing += m.tadTsMetrics.tsMissing;
    totals.automatedTestCases += m.qtestMetrics.automatedTestCases;
    totals.manualTestCases += m.qtestMetrics.manualTestCases;
    totals.totalDefects += m.defectMetrics.totalDefects;
    totals.reopenedDefects += m.defectMetrics.reopenedDefects;
    totals.totalStories += m.tadTsMetrics.totalStories;
    totals.totalTestRuns += m.qtestMetrics.totalTestRuns;
    
    // Aggregate defects by SDLC
    Object.entries(m.defectMetrics.bySdlc).forEach(([phase, count]) => {
      totals.bySdlc[phase] = (totals.bySdlc[phase] || 0) + count;
    });
  });
  
  const totalTad = totals.tadComplete + totals.tadNa + totals.tadMissing;
  const totalTs = totals.tsComplete + totals.tsNa + totals.tsMissing;
  const totalTests = totals.automatedTestCases + totals.manualTestCases;
  
  return {
    tadTsMetrics: {
      totalStories: totals.totalStories,
      tadComplete: totals.tadComplete,
      tadNa: totals.tadNa,
      tadMissing: totals.tadMissing,
      tadPct: totalTad > 0 ? ((totals.tadComplete / totalTad) * 100).toFixed(1) : 0,
      tsComplete: totals.tsComplete,
      tsNa: totals.tsNa,
      tsMissing: totals.tsMissing,
      tsPct: totalTs > 0 ? ((totals.tsComplete / totalTs) * 100).toFixed(1) : 0
    },
    qtestMetrics: {
      automatedTestCases: totals.automatedTestCases,
      manualTestCases: totals.manualTestCases,
      totalTestRuns: totals.totalTestRuns,
      automationPct: totalTests > 0 ? ((totals.automatedTestCases / totalTests) * 100).toFixed(1) : 0
    },
    defectMetrics: {
      totalDefects: totals.totalDefects,
      reopenedDefects: totals.reopenedDefects,
      reopenedPct: totals.totalDefects > 0 ? ((totals.reopenedDefects / totals.totalDefects) * 100).toFixed(1) : 0,
      bySdlc: totals.bySdlc
    }
  };
}

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
    console.log(`   GET  /api/products`);
    console.log(`   GET  /api/teams?productId=<id>`);
    console.log(`   GET  /api/sprints`);
    console.log(`   GET  /api/metrics/:teamId/:sprintId`);
    console.log(`   GET  /api/metrics/product/:productId`);
    console.log(`   GET  /api/metrics/team/:teamId`);
    console.log(`   POST /api/metrics`);
  });
});
