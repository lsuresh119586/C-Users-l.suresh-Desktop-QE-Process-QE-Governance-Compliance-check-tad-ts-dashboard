#!/usr/bin/env node

// Update all sprint metrics with real requirements covered data from JIRA
// Usage: node update-requirements-from-jira.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JiraMetricsCalculator from './jira-metrics-calculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  } catch (err) {
    console.error('Error loading .env file:', err.message);
    return {};
  }
}

const envVars = loadEnv();

// Configuration
const JIRA_URL = envVars.JIRA_URL || process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
const JIRA_API_TOKEN = envVars.JIRA_API_TOKEN || process.env.JIRA_API_TOKEN || '';
const JIRA_PROJECT_KEY = envVars.JIRA_PROJECT_KEY || process.env.JIRA_PROJECT_KEY || 'GET';

// Team and sprint configurations
const TEAMS = [
  'passport', 
  't360'
];

const SPRINTS = [
  // Passport Team A
  'team-a-25.1.1', 'team-a-25.1.2',
  // T360 - Chargers
  'chargers-26.1.1', 'chargers-26.1.2', 'chargers-26.1.3', 'chargers-26.1.4', 'chargers-26.1.5', 'chargers-26.1.6',
  // T360 - Chubb
  'chubb-26.1.1', 'chubb-26.1.2', 'chubb-26.1.3', 'chubb-26.1.4', 'chubb-26.1.5', 'chubb-26.1.6',
  // T360 - Matrix
  'matrix-26.1.1', 'matrix-26.1.2', 'matrix-26.1.3', 'matrix-26.1.4', 'matrix-26.1.5', 'matrix-26.1.6',
  // T360 - Mavericks
  'mavericks-26.1.1', 'mavericks-26.1.2', 'mavericks-26.1.3', 'mavericks-26.1.4', 'mavericks-26.1.5', 'mavericks-26.1.6',
  // T360 - Nexus
  'nexus-26.1.1', 'nexus-26.1.2', 'nexus-26.1.3', 'nexus-26.1.4', 'nexus-26.1.5', 'nexus-26.1.6',
  // T360 - Vanguards
  'vanguards-26.1.1', 'vanguards-26.1.2', 'vanguards-26.1.3', 'vanguards-26.1.4', 'vanguards-26.1.5', 'vanguards-26.1.6'
];

// Function to load db.json
function loadDatabase() {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading db.json:', err.message);
    return null;
  }
}

// Function to save db.json
function saveDatabase(db) {
  try {
    const dbPath = path.join(__dirname, 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ Database saved successfully');
  } catch (err) {
    console.error('Error saving db.json:', err.message);
  }
}

// Function to update metrics for a sprint
async function updateSprintMetrics(calculator, db, sprintId) {
  try {
    console.log(`\n📊 Processing sprint: ${sprintId}`);
    
    // Calculate metrics from JIRA
    const jiraMetrics = await calculator.calculateSprintMetrics(sprintId);
    
    // Find and update existing metric or create new one
    const metricIndex = db.metrics.findIndex(m => m.sprint === sprintId);
    
    if (metricIndex >= 0) {
      // Update existing metric
      const oldMetric = db.metrics[metricIndex];
      db.metrics[metricIndex] = {
        ...oldMetric,
        requirementsCovered: jiraMetrics.requirementsCovered,
        testsCovered: jiraMetrics.testsCovered,
        defectsOpen: jiraMetrics.defectsOpen,
        defectsClosed: jiraMetrics.defectsClosed,
        deploymentReadiness: jiraMetrics.deploymentReadiness,
        codeQuality: jiraMetrics.codeQuality,
        timestamp: new Date().toISOString(),
        updatedFromJira: true
      };
      console.log(`  ✅ Updated requirements covered: ${jiraMetrics.requirementsCovered}%`);
    } else {
      console.log(`  ⚠️  Metric not found for sprint ${sprintId}, creating new entry`);
      const [team, sprint] = sprintId.split('-');
      db.metrics.push({
        id: `metric-${sprintId}-${Date.now()}`,
        product: team === 'team-a' ? 'passport' : 't360',
        team: team,
        sprint: sprintId,
        requirementsCovered: jiraMetrics.requirementsCovered,
        testsCovered: jiraMetrics.testsCovered,
        defectsOpen: jiraMetrics.defectsOpen,
        defectsClosed: jiraMetrics.defectsClosed,
        deploymentReadiness: jiraMetrics.deploymentReadiness,
        codeQuality: jiraMetrics.codeQuality,
        timestamp: new Date().toISOString(),
        updatedFromJira: true
      });
    }
    
    return true;
  } catch (err) {
    console.error(`  ❌ Error processing sprint ${sprintId}: ${err.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Requirements Covered Update from JIRA');
  console.log(`📌 JIRA URL: ${JIRA_URL}`);
  console.log(`📌 Project Key: ${JIRA_PROJECT_KEY}`);
  console.log(`📌 Sprints to process: ${SPRINTS.length}`);
  
  // Check if token is configured
  if (!JIRA_API_TOKEN) {
    console.error('❌ ERROR: JIRA_API_TOKEN is not configured. Please set it in .env file');
    process.exit(1);
  }
  
  // Load database
  const db = loadDatabase();
  if (!db) {
    console.error('❌ ERROR: Could not load database');
    process.exit(1);
  }
  
  console.log(`✅ Loaded database with ${db.metrics?.length || 0} existing metrics`);
  
  // Initialize calculator
  const calculator = new JiraMetricsCalculator();
  
  // Update each sprint
  let successCount = 0;
  let errorCount = 0;
  
  for (const sprintId of SPRINTS) {
    const success = await updateSprintMetrics(calculator, db, sprintId);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save updated database
  console.log('\n💾 Saving updated metrics to database...');
  saveDatabase(db);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Update Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} sprints`);
  console.log(`❌ Errors encountered: ${errorCount} sprints`);
  console.log(`📈 Total metrics in database: ${db.metrics?.length || 0}`);
  console.log('='.repeat(60));
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
