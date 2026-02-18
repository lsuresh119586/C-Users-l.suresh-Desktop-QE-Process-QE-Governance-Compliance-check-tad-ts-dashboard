import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import url from 'url';
import dotenv from 'dotenv';
import { getSprintDefectsData } from './sample-tadts-data.js';
import JiraBugService from './jiraBugService.js';
import MetricsPersistence from './metricsPersistence.js';

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
    
    // Enrich DnA and T360 team metrics with actual bug data from Jira
    if ((product === 'dna' || product === 't360') && jiraBugService) {
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
  console.log(`   GET  /api/metrics/persisted?product=<product>&sprint=<sprint-number>`);
  console.log(`   GET  /api/defects/by-module?sprint=<sprint-name>`);
});
