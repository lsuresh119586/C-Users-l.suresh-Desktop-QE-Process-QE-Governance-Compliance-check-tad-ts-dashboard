import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import dotenv from 'dotenv';
import { getSprintDefectsData } from './sample-tadts-data.js';
import JiraBugService from './jiraBugService.js';
import MetricsPersistence from './metricsPersistence.js';
import { fetchSprintTestCases } from './qtest-integration.js';
import { fetchPassportSprintCoverage, getCachedPassportData, getPassportQTestConfig } from './passport-qtest-integration.js';
import { getAvailableSprints, getSprintCompliance } from './tadTsComplianceService.js';
import { getPassportAvailableSprints, getPassportSprintCompliance } from './passportTadTsComplianceService.js';
import { isCpodCalendarMode } from './cpodQueryMode.js';
import { processMetricsQuery } from './metricsQueryProcessor.js';
import { getSprintDates, getAllSprintDates, TEAM_FOLDER_PATTERNS } from './jira-sprint-dates.js';
import { applyCpodBugMetrics, applyCpodFallbackMetrics } from './cpodMetricsMapper.js';
import { syncAzurePipeline, getAzurePipelineData, exportAzurePipelineCsv } from './azure-pipeline.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the api-gateway directory
dotenv.config({ path: path.join(__dirname, '.env') });
const dbFile = path.join(__dirname, 'db.json');

// Initialize Jira Bug Service
let jiraBugService = null;
try {
  jiraBugService = new JiraBugService();
  console.log('✅ Jira Bug Service initialized');
} catch (error) {
  console.error('⚠️  Jira Bug Service initialization failed:', error.message);
}

// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️  Unhandled Promise Rejection:', reason?.message || reason);
});

// Prevent uncaught exceptions from crashing the server (for mssql error events)
process.on('uncaughtException', (error) => {
  console.warn('⚠️  Uncaught Exception (non-fatal):', error?.message || error);
});

// Initialize Metrics Persistence (SQL Server)
let metricsPersistence = null;
try {
  metricsPersistence = new MetricsPersistence();
  // Connect asynchronously - don't block server startup
  metricsPersistence.connect().then(connected => {
    if (connected) {
      console.log('✅ Metrics Persistence connected to SQL Server');
    } else {
      console.warn('⚠️  Metrics Persistence: SQL Server unavailable - persistence disabled (dashboard still works with live Jira data)');
      metricsPersistence = null; // Disable persistence
    }
  }).catch(err => {
    console.warn('⚠️  Metrics Persistence connection error:', err.message);
    metricsPersistence = null; // Disable persistence
  });
} catch (error) {
  console.error('⚠️  Metrics Persistence initialization failed:', error.message);
  console.warn('   Dashboard will continue to work with live Jira data only');
}

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
    { id: 'pp-genesis', name: 'PP Genesis', product: 'passport' },
    { id: 'pp-pioneers', name: 'PP Pioneers', product: 'passport' },
    { id: 'pp-spartacles', name: 'PP Spartacles', product: 'passport' },
    
    // T360 teams
    { id: 'vanguards', name: 'Vanguards', product: 't360' },
    { id: 'chargers', name: 'Chargers', product: 't360' },
    { id: 'chubb', name: 'Chubb', product: 't360' },
    { id: 'matrix', name: 'Matrix', product: 't360' },
    { id: 'mavericks', name: 'Mavericks', product: 't360' },
    { id: 'nexus', name: 'Nexus', product: 't360' }
  ],
  sprints: [
    // Passport - PP Genesis sprints
    { id: 'pp-genesis-26.1.1', name: 'Sprint 26.1.1', team: 'pp-genesis' },
    { id: 'pp-genesis-26.1.2', name: 'Sprint 26.1.2', team: 'pp-genesis' },
    { id: 'pp-genesis-26.1.3', name: 'Sprint 26.1.3', team: 'pp-genesis' },
    { id: 'pp-genesis-26.1.4', name: 'Sprint 26.1.4', team: 'pp-genesis' },
    { id: 'pp-genesis-26.1.5', name: 'Sprint 26.1.5', team: 'pp-genesis' },
    // Passport - PP Pioneers sprints
    { id: 'pp-pioneers-26.1.1', name: 'Sprint 26.1.1', team: 'pp-pioneers' },
    { id: 'pp-pioneers-26.1.2', name: 'Sprint 26.1.2', team: 'pp-pioneers' },
    { id: 'pp-pioneers-26.1.3', name: 'Sprint 26.1.3', team: 'pp-pioneers' },
    { id: 'pp-pioneers-26.1.4', name: 'Sprint 26.1.4', team: 'pp-pioneers' },
    { id: 'pp-pioneers-26.1.5', name: 'Sprint 26.1.5', team: 'pp-pioneers' },
    // Passport - PP Spartacles sprints
    { id: 'pp-spartacles-26.1.1', name: 'Sprint 26.1.1', team: 'pp-spartacles' },
    { id: 'pp-spartacles-26.1.2', name: 'Sprint 26.1.2', team: 'pp-spartacles' },
    { id: 'pp-spartacles-26.1.3', name: 'Sprint 26.1.3', team: 'pp-spartacles' },
    { id: 'pp-spartacles-26.1.4', name: 'Sprint 26.1.4', team: 'pp-spartacles' },
    { id: 'pp-spartacles-26.1.5', name: 'Sprint 26.1.5', team: 'pp-spartacles' },
    
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
    // Passport PP Genesis Sprint 26.1.1
    {
      id: 'metric-pp-genesis-26.1.1',
      product: 'passport',
      team: 'pp-genesis',
      sprint: 'pp-genesis-26.1.1',
      requirementsCovered: 95,
      testsCovered: 92,
      defectsOpen: 3,
      defectsClosed: 18,
      deploymentReadiness: 90,
      codeQuality: 88,
      timestamp: '2026-01-15T10:00:00Z'
    },
    // Passport PP Genesis Sprint 26.1.2
    {
      id: 'metric-pp-genesis-26.1.2',
      product: 'passport',
      team: 'pp-genesis',
      sprint: 'pp-genesis-26.1.2',
      requirementsCovered: 93,
      testsCovered: 90,
      defectsOpen: 5,
      defectsClosed: 20,
      deploymentReadiness: 87,
      codeQuality: 85,
      timestamp: '2026-01-16T10:00:00Z'
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

const server = http.createServer(async (req, res) => {
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

  // GET /api/qtest/sprint/:sprint - Fetch qTest test case data for a sprint
  // Uses local db.json tests_covered data first, falls back to live qTest API
  if (pathname.startsWith('/api/qtest/sprint/') && req.method === 'GET') {
    const sprintName = pathname.replace('/api/qtest/sprint/', '');
    const checkAttachments = query.attachments === 'true';

    // Try local db.json tests_covered data first (reliable, no external API dependency)
    const db = readDatabase();
    const testsCovered = db?.tests_covered?.[sprintName];
    if (testsCovered && testsCovered.teams && Object.keys(testsCovered.teams).length > 0) {
      // Transform tests_covered format to match expected frontend format
      const teams = {};
      for (const [teamName, teamData] of Object.entries(testsCovered.teams)) {
        teams[teamName] = {
          total: teamData.total_test_cases || teamData.total || 0,
          automated: teamData.automated_test_cases || teamData.automated || 0,
          with_attachments: teamData.with_attachments || 0,
          without_attachments: teamData.without_attachments || 0,
          test_cases: teamData.test_cases || []
        };
      }
      const totals = {
        total: testsCovered.summary?.total_test_cases || Object.values(teams).reduce((s, t) => s + t.total, 0),
        automated: testsCovered.summary?.total_automated || Object.values(teams).reduce((s, t) => s + t.automated, 0),
        with_attachments: testsCovered.summary?.total_with_attachments || Object.values(teams).reduce((s, t) => s + t.with_attachments, 0),
        without_attachments: Object.values(teams).reduce((s, t) => s + t.without_attachments, 0)
      };
      const result = {
        sprint_name: sprintName,
        module_id: testsCovered.module_id || null,
        generated: testsCovered.generated || new Date().toISOString(),
        source: 'local',
        totals,
        teams
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Fallback to live qTest API with timeout
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('qTest API request timed out')), 15000)
      );
      const data = await Promise.race([
        fetchSprintTestCases(sprintName, checkAttachments),
        timeoutPromise
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      console.error(`Error fetching qTest sprint data: ${error.message}`);
      // On timeout/error, try stale cache as last resort
      try {
        const cacheFile = path.join(__dirname, '.qtest-cache', `qtest-sprint-${sprintName}.json`);
        if (fs.existsSync(cacheFile)) {
          const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          console.log(`Returning stale cached data for sprint ${sprintName}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(cached.data));
          return;
        }
      } catch (cacheErr) {
        console.error(`Cache read failed: ${cacheErr.message}`);
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/qtest/passport/sprint/:sprint - Fetch Passport qTest test coverage data
  // Uses requirement-based linking (ELM cards → linked test cases) instead of module-based
  if (pathname.startsWith('/api/qtest/passport/sprint/') && req.method === 'GET') {
    const sprintName = pathname.replace('/api/qtest/passport/sprint/', '');
    
    console.log(`[Passport qTest] Fetching coverage for sprint ${sprintName}...`);

    const passportTeams = ['PP Genesis', 'PP Pioneers', 'PP Spartacles'];

    // Try cached Passport qTest LIVE data FIRST (fresher than db.json)
    const cachedData = getCachedPassportData(sprintName);
    if (cachedData && cachedData.source === 'passport-qtest-live') {
      console.log(`[Passport qTest] Returning live cached data for sprint ${sprintName}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cachedData));
      return;
    }

    // Fallback to local db.json tests_covered data for Passport teams
    const db = readDatabase();
    const testsCovered = db?.tests_covered?.[sprintName];
    
    // Check if we have Passport team data in tests_covered
    let hasPassportData = false;
    if (testsCovered && testsCovered.teams) {
      hasPassportData = passportTeams.some(team => testsCovered.teams[team]);
    }

    if (hasPassportData) {
      // Return Passport-specific data from db.json
      const teams = {};
      for (const teamName of passportTeams) {
        const teamData = testsCovered.teams[teamName];
        if (teamData) {
          teams[teamName] = {
            total: teamData.total_test_cases || teamData.total || 0,
            automated: teamData.automated_test_cases || teamData.automated || 0,
            with_attachments: teamData.with_attachments || 0,
            without_attachments: teamData.without_attachments || 0,
            test_cases: teamData.test_cases || []
          };
        }
      }
      const totals = {
        total: Object.values(teams).reduce((s, t) => s + t.total, 0),
        automated: Object.values(teams).reduce((s, t) => s + t.automated, 0),
        with_attachments: Object.values(teams).reduce((s, t) => s + t.with_attachments, 0),
        without_attachments: Object.values(teams).reduce((s, t) => s + t.without_attachments, 0)
      };
      const result = {
        sprint_name: sprintName,
        generated: testsCovered.generated || new Date().toISOString(),
        source: 'local-passport',
        totals,
        teams
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Try any cached Passport qTest data (even older)
    if (cachedData) {
      console.log(`[Passport qTest] Returning cached data for sprint ${sprintName}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cachedData));
      return;
    }

    // No data available - return empty structure with indicator
    // Note: Live fetching requires ELM cards from TAD-TS compliance data
    const emptyResult = {
      sprint_name: sprintName,
      generated: new Date().toISOString(),
      source: 'no-data',
      message: 'No Passport qTest data available. Use /api/qtest/passport/sync-from-tadts/:sprint to sync from live qTest.',
      totals: { total: 0, automated: 0, with_attachments: 0, without_attachments: 0 },
      teams: {}
    };
    for (const team of passportTeams) {
      emptyResult.teams[team] = { total: 0, automated: 0, with_attachments: 0, without_attachments: 0, test_cases: [] };
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(emptyResult));
    return;
  }

  // POST /api/qtest/passport/sync/:sprint - Sync Passport qTest data from live API
  // Requires ELM cards in request body: { elmCards: [{ key: "ELM-39559", team: "PP Genesis" }] }
  if (pathname.startsWith('/api/qtest/passport/sync/') && req.method === 'POST') {
    const sprintName = pathname.replace('/api/qtest/passport/sync/', '');
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { elmCards } = JSON.parse(body || '{}');
        
        if (!elmCards || !Array.isArray(elmCards) || elmCards.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'elmCards array required in request body',
            example: { elmCards: [{ key: 'ELM-39559', team: 'PP Genesis' }] }
          }));
          return;
        }

        console.log(`[Passport qTest] Syncing sprint ${sprintName} with ${elmCards.length} ELM cards...`);
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Passport qTest sync timed out')), 120000)
        );
        
        const data = await Promise.race([
          fetchPassportSprintCoverage(sprintName, elmCards),
          timeoutPromise
        ]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (error) {
        console.error(`[Passport qTest] Sync error: ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // GET /api/qtest/passport/config - Get Passport qTest configuration (for debugging)
  if (pathname === '/api/qtest/passport/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getPassportQTestConfig()));
    return;
  }

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
    const { product, team, sprint, startDate, endDate } = query;

    // Use metricsQueryProcessor for filtering (supports CPOD calendar mode)
    const queryResult = processMetricsQuery({
      metrics: db.metrics,
      query: { product, team, sprint, startDate, endDate }
    });

    if (queryResult.validationError) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: queryResult.validationError }));
      return;
    }

    let metrics = queryResult.filteredMetrics;
    const isCpod = isCpodCalendarMode(product, team);

    if (isCpod && metrics.length === 0) {
      metrics = db.metrics.filter((metric) => {
        const metricProduct = String(metric.product || '').trim().toLowerCase();
        const metricTeam = String(metric.team || '').trim().toLowerCase();
        return metricProduct === 'passport' && metricTeam === 'cpod';
      });
    }

    if (!isCpod && metrics.length === 0 && product && team && sprint) {
      const normalizedSprint = String(sprint).toLowerCase().startsWith(`${String(team).toLowerCase()}-`)
        ? sprint
        : `${team}-${sprint}`;

      metrics = [{
        id: `metric-${team}-${normalizedSprint}`,
        product,
        team,
        sprint: normalizedSprint,
        requirementsCovered: 0,
        testsCovered: 0,
        defectsOpen: 0,
        defectsClosed: 0,
        deploymentReadiness: 0,
        codeQuality: 0,
        timestamp: new Date().toISOString(),
        generatedFallbackMetric: true
      }];
    }
    
    // Enrich DnA, T360, and Passport team metrics with actual bug data from Jira
    if ((product === 'dna' || product === 't360' || product === 'passport') && jiraBugService) {
      // CPOD uses date-range based Jira queries instead of sprint-based
      if (isCpod && startDate && endDate) {
        try {
          console.log(`📅 Enriching CPOD metrics with date-range Jira data: ${startDate} to ${endDate}`);
          const bugMetrics = await jiraBugService.calculateBugMetricsByDateRange(startDate, endDate);
          metrics = applyCpodBugMetrics(metrics, bugMetrics, startDate, endDate);
        } catch (error) {
          console.error('Error enriching CPOD metrics with date-range bug data:', error.message);
          metrics = applyCpodFallbackMetrics(metrics, startDate, endDate);
        }
      } else {
        const enrichPromises = metrics.map(async (metric) => {
          try {
            // Extract sprint number from sprint ID (e.g., "minerva-26.1.2" -> "26.1.2")
            const sprintMatch = metric.sprint.match(/-(.+)$/);
            if (sprintMatch) {
              const sprintNumber = sprintMatch[1];
              const bugMetrics = await jiraBugService.calculateBugMetrics(metric.team, sprintNumber);
              
              // Enrich metric with actual bug data
              return {
                ...metric,
                totalBugs: bugMetrics.totalBugs,
                defectsOpen: bugMetrics.openBugs,
                defectsClosed: bugMetrics.closedBugs,
                reopenedBugs: bugMetrics.reopenedBugs,
                reopenedRate: bugMetrics.reopenedRate,
                qualityIndicator: bugMetrics.qualityIndicator,
                bugDetails: bugMetrics.bugDetails,
                updatedFromJiraBugs: true,
                jiraBugsFetchedAt: bugMetrics.fetchedAt
              };
            }
            return metric;
          } catch (error) {
            console.error(`Error enriching metrics for ${metric.team}:`, error.message);
            return metric;
          }
        });
        
        try {
          metrics = await Promise.all(enrichPromises);
        } catch (error) {
          console.error('Error enriching metrics with bug data:', error.message);
        }
      }
    }

    // Enrich with live TAD/TS compliance data for DoR Readiness %
    if ((product === 'dna' || product === 't360' || product === 'passport') && !isCpod) {
      try {
        const firstSprint = metrics[0]?.sprint;
        const sprintMatch = firstSprint?.match(/-(.+)$/);
        if (sprintMatch) {
          const sprintNumber = sprintMatch[1];
          console.log(`📋 Enriching DoR Readiness with live TAD/TS compliance for sprint ${sprintNumber}...`);
          const complianceData = product === 'passport'
            ? await getPassportSprintCompliance(sprintNumber)
            : await getSprintCompliance(sprintNumber);

          if (complianceData && complianceData.teams) {
            metrics = metrics.map(metric => {
              const teamName = metric.team;
              let dorPct = null;
              let teamTadPct = null, teamTsPct = null;
              // Match team name from compliance data (case-insensitive)
              for (const [compTeam, compData] of Object.entries(complianceData.teams)) {
                if (compTeam.toLowerCase() === teamName.toLowerCase() ||
                    compTeam.toLowerCase().includes(teamName.toLowerCase()) ||
                    teamName.toLowerCase().includes(compTeam.toLowerCase())) {
                  // DoR requires BOTH TAD and TS — use bothPct (% of issues with both complete)
                  teamTadPct = compData.tadPct;
                  teamTsPct = compData.tsPct;
                  dorPct = compData.bothPct !== undefined ? compData.bothPct : Math.min(compData.tadPct || 0, compData.tsPct || 0);
                  break;
                }
              }
              if (dorPct !== null && dorPct !== undefined) {
                console.log(`  📊 ${teamName}: DoR=${Math.round(dorPct)}% (TAD=${teamTadPct?.toFixed(1)}%, TS=${teamTsPct?.toFixed(1)}%)`);
                return { ...metric, requirementsCovered: Math.round(dorPct), dorSource: 'qtest-live' };
              }
              // Use overall summary bothPct as fallback
              if (complianceData.summary) {
                const summaryDor = complianceData.summary.bothPct !== undefined
                  ? complianceData.summary.bothPct
                  : Math.min(complianceData.summary.tadPct || 0, complianceData.summary.tsPct || 0);
                return { ...metric, requirementsCovered: Math.round(summaryDor), dorSource: 'qtest-live-summary' };
              }
              return metric;
            });
            console.log(`✅ DoR Readiness enriched from live qTest TAD/TS data (TAD + TS combined)`);
          }
        }
      } catch (error) {
        console.error('Error enriching DoR Readiness with TAD/TS compliance:', error.message);
      }
    }

    // Enrich Passport metrics with Automation Coverage % from qTest cache
    if (product === 'passport' && !isCpod) {
      try {
        const firstSprint = metrics[0]?.sprint;
        // Extract just the version number (e.g., "pp-spartacles-26.1.4" → "26.1.4")
        const sprintVersionMatch = firstSprint?.match(/(\d+\.\d+\.\d+)$/);
        if (sprintVersionMatch) {
          const sprintVersion = sprintVersionMatch[1];
          const cachedQTestData = getCachedPassportData(sprintVersion);
          if (cachedQTestData && cachedQTestData.teams) {
            metrics = metrics.map(metric => {
              const teamName = metric.team;
              // Match team from qTest cache (e.g., "pp-spartacles" → "PP Spartacles")
              for (const [cacheTeam, cacheData] of Object.entries(cachedQTestData.teams)) {
                const normalizedCache = cacheTeam.toLowerCase().replace(/\s+/g, '-');
                const normalizedMetric = teamName.toLowerCase().replace(/\s+/g, '-');
                if (normalizedCache === normalizedMetric ||
                    normalizedCache.includes(normalizedMetric) ||
                    normalizedMetric.includes(normalizedCache)) {
                  const total = cacheData.total || 0;
                  const automated = cacheData.automated || 0;
                  const coveragePct = total > 0 ? Math.round((automated / total) * 100) : 0;
                  console.log(`  🧪 ${teamName}: Automation Coverage=${coveragePct}% (${automated}/${total} test cases)`);
                  return { ...metric, testsCovered: coveragePct, automationSource: 'qtest-cache' };
                }
              }
              // Fallback to overall totals if team not found
              if (cachedQTestData.totals) {
                const total = cachedQTestData.totals.total_test_cases || 0;
                const automated = cachedQTestData.totals.automated || 0;
                const coveragePct = total > 0 ? Math.round((automated / total) * 100) : 0;
                console.log(`  🧪 ${teamName}: Automation Coverage=${coveragePct}% (overall totals fallback)`);
                return { ...metric, testsCovered: coveragePct, automationSource: 'qtest-cache-totals' };
              }
              return metric;
            });
            console.log(`✅ Automation Coverage enriched from Passport qTest cache`);
          }
        }
      } catch (error) {
        console.error('Error enriching Automation Coverage from qTest cache:', error.message);
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
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

  // GET /api/metrics/tests-covered - Get all tests-covered data
  if (pathname === '/api/metrics/tests-covered' && req.method === 'GET') {
    const db = readDatabase();
    const testsCovered = db?.tests_covered || {};
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: testsCovered,
      available_sprints: Object.keys(testsCovered),
      total_sprints: Object.keys(testsCovered).length
    }));
    return;
  }

  // GET /api/metrics/tests-covered/:sprint - Get tests-covered for specific sprint
  if (pathname.startsWith('/api/metrics/tests-covered/') && req.method === 'GET') {
    const sprint = pathname.split('/').pop();
    const db = readDatabase();
    const testsCovered = db?.tests_covered || {};
    
    if (testsCovered[sprint]) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        sprint: sprint,
        data: testsCovered[sprint]
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Sprint not found',
        available_sprints: Object.keys(testsCovered),
        requested_sprint: sprint
      }));
    }
    return;
  }

  // GET /api/defects/by-module - Get LIVE defects from Jira for a specific sprint
  if (req.method === 'GET' && req.url.startsWith('/api/defects/by-module')) {
    const urlObj = new url.URL(req.url, `http://${req.headers.host}`);
    const sprintName = urlObj.searchParams.get('sprint');
    const defectProduct = urlObj.searchParams.get('product') || '';
    const defectTeam = urlObj.searchParams.get('team') || '';
    
    if (!sprintName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    // If Jira service is not available, fall back to mock data
    if (!jiraBugService) {
      console.log('⚠️  Jira Bug Service not available, falling back to mock defect data');
      const defectData = getSprintDefectsData(sprintName);
      defectData.source = 'mock';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(defectData, null, 2));
      return;
    }

    try {
      console.log(`🔍 Fetching LIVE defects from Jira for sprint ${sprintName} (product=${defectProduct || 'all'}, team=${defectTeam || 'all'})...`);

      // Fetch only relevant product's teams (or all if no product specified)
      const fetchPromises = [];
      if (!defectProduct || defectProduct === 'dna') {
        fetchPromises.push(jiraBugService.getAllDnATeamMetrics(sprintName).catch(err => {
          console.warn(`⚠️  DnA team metrics failed: ${err.message}`);
          return [];
        }));
      } else {
        fetchPromises.push(Promise.resolve([]));
      }
      if (!defectProduct || defectProduct === 't360') {
        fetchPromises.push(jiraBugService.getAllT360TeamMetrics(sprintName).catch(err => {
          console.warn(`⚠️  T360 team metrics failed: ${err.message}`);
          return [];
        }));
      } else {
        fetchPromises.push(Promise.resolve([]));
      }
      if (!defectProduct || defectProduct === 'passport') {
        fetchPromises.push(jiraBugService.getAllPassportTeamMetrics(sprintName).catch(err => {
          console.warn(`⚠️  Passport team metrics failed: ${err.message}`);
          return [];
        }));
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      const [dnaResults, t360Results, passportResults] = await Promise.all(fetchPromises);

      let allTeamMetrics = [...dnaResults, ...t360Results, ...passportResults];

      // Filter by team if specified
      if (defectTeam) {
        allTeamMetrics = allTeamMetrics.filter(m =>
          m.teamId.toLowerCase() === defectTeam.toLowerCase() ||
          m.teamId.toLowerCase().includes(defectTeam.toLowerCase()) ||
          defectTeam.toLowerCase().includes(m.teamId.toLowerCase())
        );
      }

      // Aggregate across all teams
      let totalOpen = 0, totalClosed = 0, totalReopened = 0;
      const teams = {};
      const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      const statusCounts = { open: 0, 'in-progress': 0, closed: 0 };
      const moduleMap = {};  // team name → defect count (team acts as "module")

      for (const teamMetric of allTeamMetrics) {
        const teamName = teamMetric.teamId;
        const teamDisplayName = teamName.charAt(0).toUpperCase() + teamName.slice(1);
        
        totalOpen += teamMetric.openBugs || 0;
        totalClosed += teamMetric.closedBugs || 0;
        totalReopened += teamMetric.reopenedBugs || 0;

        teams[teamDisplayName] = {
          open: teamMetric.openBugs || 0,
          closed: teamMetric.closedBugs || 0,
          total: teamMetric.totalBugs || 0,
          reopened: teamMetric.reopenedBugs || 0,
          bugs: (teamMetric.bugDetails || []).map(b => ({
            key: b.key,
            summary: b.summary,
            status: b.status,
            priority: b.priority,
            created: b.created,
            updated: b.updated,
            isOpen: b.isOpen,
            reopened: b.reopened || false,
            reopenCount: b.reopenCount || 0
          }))
        };

        // Count by priority and status from bug details
        for (const bug of (teamMetric.bugDetails || [])) {
          const priority = (bug.priority || 'None').toLowerCase();
          if (priority === 'critical' || priority === 'highest') priorityCounts.critical++;
          else if (priority === 'high') priorityCounts.high++;
          else if (priority === 'medium' || priority === 'normal') priorityCounts.medium++;
          else priorityCounts.low++;

          const status = (bug.status || '').toLowerCase();
          if (status === 'closed' || status === 'done' || status === 'resolved') {
            statusCounts.closed++;
          } else if (status === 'in progress' || status === 'in-progress') {
            statusCounts['in-progress']++;
          } else {
            statusCounts.open++;
          }
        }

        // Build module (team) breakdown — only include teams with defects
        if (teamMetric.totalBugs > 0) {
          const topSeverity = teamMetric.bugDetails?.find(b => b.isOpen)?.priority?.toLowerCase() || 'low';
          moduleMap[teamDisplayName] = {
            module: teamDisplayName,
            defects: teamMetric.totalBugs,
            open: teamMetric.openBugs,
            closed: teamMetric.closedBugs,
            severity: topSeverity,
            status: teamMetric.openBugs > 0 ? 'open' : 'closed'
          };
        }
      }

      const totalAll = totalOpen + totalClosed;

      const result = {
        sprint: sprintName,
        source: 'jira-live',
        fetchedAt: new Date().toISOString(),
        totals: {
          open: totalOpen,    // everything not closed/resolved
          closed: totalClosed,
          total: totalAll,
          critical: priorityCounts.critical,
          high: priorityCounts.high,
          reopened: totalReopened
        },
        byModule: Object.values(moduleMap),
        bySeverity: priorityCounts,
        byStatus: statusCounts,
        teams: teams
      };

      console.log(`✅ Live defect data: ${totalAll} total (${totalOpen} open, ${totalClosed} closed) across ${allTeamMetrics.length} teams`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Error fetching live defect data:', error.message);
      // Fall back to mock data on error
      console.log('⚠️  Falling back to mock defect data');
      const defectData = getSprintDefectsData(sprintName);
      defectData.source = 'mock-fallback';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(defectData, null, 2));
    }
    return;
  }

  // GET /api/bugs/dna - Get bug metrics for DnA teams
  if (pathname === '/api/bugs/dna' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { team, sprint } = query;
    
    if (!team || !sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'team and sprint parameters required' }));
      return;
    }

    // Extract sprint number from sprint ID (e.g., "26.1.2")
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;
    const teamId = team.toLowerCase(); // Normalize to match service keys

    try {
      const bugMetrics = await jiraBugService.calculateBugMetrics(teamId, sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bugMetrics));

      // Persist live data to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistBugMetrics(bugMetrics, 'DnA').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist DnA metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching bug metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/bugs/dna/all - Get bug metrics for all DnA teams for a sprint
  if (pathname === '/api/bugs/dna/all' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { sprint } = query;
    
    if (!sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    // Extract sprint number from sprint ID
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;

    try {
      const allMetrics = await jiraBugService.getAllDnATeamMetrics(sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allMetrics));

      // Persist all DnA team metrics to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistAllTeamMetrics(allMetrics, 'DnA').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist all DnA metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching all DnA team metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/bugs/t360 - Get bug metrics for T360 teams
  if (pathname === '/api/bugs/t360' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { team, sprint } = query;
    
    if (!team || !sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'team and sprint parameters required' }));
      return;
    }

    // Extract sprint number from sprint ID (e.g., "26.1.1")
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;
    const teamId = team.toLowerCase(); // Normalize to match service keys

    try {
      const bugMetrics = await jiraBugService.calculateBugMetrics(teamId, sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bugMetrics));

      // Persist live data to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistBugMetrics(bugMetrics, 'T360').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist T360 metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching T360 bug metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/bugs/t360/all - Get bug metrics for all T360 teams for a sprint
  if (pathname === '/api/bugs/t360/all' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { sprint } = query;
    
    if (!sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    // Extract sprint number from sprint ID
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;

    try {
      const allMetrics = await jiraBugService.getAllT360TeamMetrics(sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allMetrics));

      // Persist all T360 team metrics to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistAllTeamMetrics(allMetrics, 'T360').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist all T360 metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching all T360 team metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/bugs/passport - Get bug metrics for Passport teams
  if (pathname === '/api/bugs/passport' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { team, sprint } = query;
    
    if (!team || !sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'team and sprint parameters required' }));
      return;
    }

    // Extract sprint number from sprint ID (e.g., "26.1.1")
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;
    const teamId = team.toLowerCase(); // Normalize to match service keys

    try {
      const bugMetrics = await jiraBugService.calculateBugMetrics(teamId, sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(bugMetrics));

      // Persist live data to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistBugMetrics(bugMetrics, 'Passport').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist Passport metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching Passport bug metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/bugs/passport/all - Get bug metrics for all Passport teams for a sprint
  if (pathname === '/api/bugs/passport/all' && req.method === 'GET') {
    if (!jiraBugService) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Jira Bug Service not available' }));
      return;
    }

    const { sprint } = query;
    
    if (!sprint) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sprint parameter required' }));
      return;
    }

    // Extract sprint number from sprint ID
    const sprintNumber = sprint.includes('-') ? sprint.split('-').pop() : sprint;

    try {
      const allMetrics = await jiraBugService.getAllPassportTeamMetrics(sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allMetrics));

      // Persist all Passport team metrics to SQL Server (async, non-blocking)
      if (metricsPersistence) {
        metricsPersistence.persistAllTeamMetrics(allMetrics, 'Passport').catch(err => {
          console.warn('⚠️  Non-blocking: Failed to persist all Passport metrics to SQL:', err.message);
        });
      }
    } catch (error) {
      console.error('Error fetching all Passport team metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/metrics/persisted - Read persisted bug metrics from SQL Server
  if (pathname === '/api/metrics/persisted' && req.method === 'GET') {
    if (!metricsPersistence) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Metrics Persistence not available' }));
      return;
    }

    const { product, sprint } = query;

    try {
      const metrics = await metricsPersistence.readMetrics(product || null, sprint || null);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics));
    } catch (error) {
      console.error('Error reading persisted metrics:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ── TAD/TS Compliance Endpoints ──
  if (pathname === '/api/tad-ts/sprints' && req.method === 'GET') {
    try {
      const sprints = await getAvailableSprints();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', sprints }));
    } catch (error) {
      console.error('Error fetching TAD/TS sprints:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (pathname.startsWith('/api/tad-ts/sprint/') && req.method === 'GET') {
    const sprintNumber = pathname.split('/api/tad-ts/sprint/')[1];
    if (!sprintNumber) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sprint number required' }));
      return;
    }
    try {
      const data = await getSprintCompliance(sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', data }));
    } catch (error) {
      console.error(`Error fetching TAD/TS compliance for sprint ${sprintNumber}:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ── Passport TAD/TS Compliance Endpoints ──
  if (pathname === '/api/tad-ts/passport/sprints' && req.method === 'GET') {
    try {
      const sprints = await getPassportAvailableSprints();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', sprints }));
    } catch (error) {
      console.error('Error fetching Passport TAD/TS sprints:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (pathname.startsWith('/api/tad-ts/passport/sprint/') && req.method === 'GET') {
    const sprintNumber = pathname.split('/api/tad-ts/passport/sprint/')[1];
    if (!sprintNumber) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sprint number required' }));
      return;
    }
    try {
      const data = await getPassportSprintCompliance(sprintNumber);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', data }));
    } catch (error) {
      console.error(`Error fetching Passport TAD/TS compliance for sprint ${sprintNumber}:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // GET /api/qtest/passport/sync-from-tadts/:sprint - Auto-sync from TAD-TS compliance ELM cards
  if (pathname.startsWith('/api/qtest/passport/sync-from-tadts/') && req.method === 'GET') {
    const sprintNumber = pathname.replace('/api/qtest/passport/sync-from-tadts/', '');
    
    console.log(`[Passport qTest] Auto-syncing from TAD-TS for sprint ${sprintNumber}...`);
    
    try {
      // Step 1: Get ELM cards from TAD-TS compliance
      const tadTsData = await getPassportSprintCompliance(sprintNumber);
      
      // Extract issues from teams (TAD-TS stores issues inside teams object)
      const elmCards = [];
      if (tadTsData.teams) {
        for (const [teamName, teamData] of Object.entries(tadTsData.teams)) {
          const teamIssues = teamData.issues || [];
          for (const issue of teamIssues) {
            elmCards.push({
              key: issue.key,
              team: teamName,
              summary: issue.summary
            });
          }
        }
      }
      
      if (elmCards.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          sprint_name: sprintNumber,
          source: 'tadts-sync-empty',
          message: 'No ELM cards found in TAD-TS compliance data',
          totals: { total: 0, automated: 0 },
          teams: {}
        }));
        return;
      }
      
      console.log(`[Passport qTest] Found ${elmCards.length} ELM cards from TAD-TS`);
      
      // Step 2: Fetch coverage from qTest
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Passport qTest sync timed out')), 180000)
      );
      
      const coverage = await Promise.race([
        fetchPassportSprintCoverage(sprintNumber, elmCards),
        timeoutPromise
      ]);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(coverage));
    } catch (error) {
      console.error(`[Passport qTest] Sync error: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // ─── Azure Pipeline Routes ───────────────────────────────────────────────

  // POST /api/azure-pipeline/sync/:productId
  if (pathname.match(/^\/api\/azure-pipeline\/sync\/([^\/]+)$/) && req.method === 'POST') {
    const productId = pathname.split('/')[4];
    try {
      const result = await syncAzurePipeline(db, productId);
      // Persist to db.json
      writeDatabase(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result.data, errors: result.errors }));
    } catch (error) {
      console.error('[Azure Pipeline] Sync error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // GET /api/azure-pipeline/:productId/export/csv  (must be before the generic GET)
  if (pathname.match(/^\/api\/azure-pipeline\/([^\/]+)\/export\/csv$/) && req.method === 'GET') {
    const productId = pathname.split('/')[3];
    const project = query.project || null;
    const filters = {
      category: query.category || null,
      upgradeType: query.upgradeType || null,
      dateFrom: query.dateFrom || null,
      dateTo: query.dateTo || null,
    };
    const csv = exportAzurePipelineCsv(db, productId, project, filters);
    if (!csv) {
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=pipeline-export.csv' });
      res.end('No data available. Trigger a sync first.');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=pipeline-export.csv' });
      res.end(csv);
    }
    return;
  }

  // GET /api/azure-pipeline/:productId
  if (pathname.match(/^\/api\/azure-pipeline\/([^\/]+)$/) && req.method === 'GET') {
    const productId = pathname.split('/')[3];
    const project = query.project || null;
    const data = getAzurePipelineData(db, productId, project);
    if (!data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: null, message: 'No data available. Trigger a sync first.' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
    }
    return;
  }

  // ─── Sprint Date Routes (JIRA Agile API) ────────────────────────────────

  // GET /api/sprint-dates/:teamId/:sprintId — single sprint dates
  if (pathname.match(/^\/api\/sprint-dates\/([^\/]+)\/([^\/]+)$/) && req.method === 'GET') {
    const parts = pathname.split('/');
    const teamId = parts[3];
    const sprintId = parts[4];
    try {
      const dates = await getSprintDates(teamId, sprintId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: dates }));
    } catch (error) {
      console.error('[Sprint Dates] Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // GET /api/sprint-dates/:teamId — all sprint dates for a team
  if (pathname.match(/^\/api\/sprint-dates\/([^\/]+)$/) && req.method === 'GET') {
    const teamId = pathname.split('/')[3];
    try {
      const sprints = await getAllSprintDates(teamId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: sprints }));
    } catch (error) {
      console.error('[Sprint Dates] Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
    return;
  }

  // GET /api/team-folder-patterns — team-to-Azure-folder mapping
  if (pathname === '/api/team-folder-patterns' && req.method === 'GET') {
    const patterns = {};
    for (const [teamId, regex] of Object.entries(TEAM_FOLDER_PATTERNS)) {
      patterns[teamId] = regex.source;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: patterns }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize DB and start server
initDatabase();

server.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET  /api/products`);
  console.log(`   GET  /api/teams?product=<product-id>`);
  console.log(`   GET  /api/sprints?team=<team-id>`);
  console.log(`   GET  /api/metrics?product=<product-id>&team=<team-id>&sprint=<sprint-id>`);
  console.log(`   POST /api/metrics`);
  console.log(`   GET  /api/bugs/dna?team=<team-id>&sprint=<sprint-number>`);
  console.log(`   GET  /api/bugs/dna/all?sprint=<sprint-number>`);
  console.log(`   GET  /api/bugs/t360?team=<team-id>&sprint=<sprint-number>`);
  console.log(`   GET  /api/bugs/t360/all?sprint=<sprint-number>`);
  console.log(`   GET  /api/bugs/passport?team=<team-id>&sprint=<sprint-number>`);
  console.log(`   GET  /api/bugs/passport/all?sprint=<sprint-number>`);
  console.log(`   GET  /api/metrics/persisted?product=<product>&sprint=<sprint-number>`);
  console.log(`   GET  /api/defects/by-module?sprint=<sprint-name>`);
  console.log(`   GET  /api/tad-ts/sprints`);
  console.log(`   GET  /api/tad-ts/sprint/:sprint`);
  console.log(`   GET  /api/tad-ts/passport/sprints`);
  console.log(`   GET  /api/tad-ts/passport/sprint/:sprint`);
  console.log(`   POST /api/azure-pipeline/sync/:productId`);
  console.log(`   GET  /api/azure-pipeline/:productId`);
  console.log(`   GET  /api/azure-pipeline/:productId/export/csv`);
  console.log(`   GET  /api/sprint-dates/:teamId`);
  console.log(`   GET  /api/sprint-dates/:teamId/:sprintId`);
});
