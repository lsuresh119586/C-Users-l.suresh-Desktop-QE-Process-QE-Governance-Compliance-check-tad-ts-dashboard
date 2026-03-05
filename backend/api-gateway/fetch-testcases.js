#!/usr/bin/env node
/**
 * Fetch Test Cases from qTest
 * Retrieves test cases from qTest and generates statistics
 * Usage: node fetch-testcases.js [sprint] [--save] [--update-db]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import qtestService from './qtest-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPRINTS = qtestService.SPRINT_CONFIGS;

/**
 * Load existing db.json
 */
function loadDB() {
  const dbPath = path.join(__dirname, 'db.json');
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error loading db.json: ${error.message}`);
  }
  return {
    products: [],
    teams: [],
    sprints: [],
    metrics: [],
    testCases: [],
    tests_covered: {}
  };
}

/**
 * Save db.json
 */
function saveDB(data, filename = 'db.json') {
  const dbPath = path.join(__dirname, filename);
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✅ Data saved to: ${dbPath}`);
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}: ${error.message}`);
    return false;
  }
}

/**
 * Convert qTest data to dashboard format
 */
function convertToMetrics(qTestData) {
  if (!qTestData || !qTestData.totals) {
    return null;
  }

  const totals = qTestData.totals;
  const automationCoverage = totals.total > 0 
    ? ((totals.automated / totals.total) * 100).toFixed(1)
    : 0;

  // Create team breakdown
  const teamMetrics = {};
  for (const team in qTestData.teams) {
    const teamData = qTestData.teams[team];
    const teamAutomation = teamData.total > 0
      ? ((teamData.automated / teamData.total) * 100).toFixed(1)
      : 0;
    
    teamMetrics[team] = {
      total_test_cases: teamData.total,
      automated_test_cases: teamData.automated,
      automation_coverage_percent: parseFloat(teamAutomation),
      with_attachments: teamData.with_attachments,
      without_attachments: teamData.without_attachments,
      test_cases: teamData.test_cases.slice(0, 10) // First 10 for preview
    };
  }

  return {
    sprint: qTestData.sprint_name,
    module_id: qTestData.module_id,
    generated: qTestData.generated,
    summary: {
      total_test_cases: totals.total,
      total_automated: totals.automated,
      total_with_attachments: totals.with_attachments,
      automation_coverage_percent: parseFloat(automationCoverage),
      teams_count: Object.keys(qTestData.teams).length
    },
    teams: teamMetrics
  };
}

/**
 * Print formatted report
 */
function printReport(metrics) {
  if (!metrics) {
    console.log('No metrics to display');
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`TESTS COVERED - ${metrics.sprint}`);
  console.log(`Generated: ${metrics.generated}`);
  console.log(`${'='.repeat(80)}\n`);

  const summary = metrics.summary;
  console.log('📊 SUMMARY');
  console.log(`  Total Test Cases: ${summary.total_test_cases}`);
  console.log(`  Automated: ${summary.total_automated} (${summary.automation_coverage_percent}%)`);
  console.log(`  With Test Scripts/Attachments: ${summary.total_with_attachments}`);
  console.log(`  Teams: ${summary.teams_count}`);

  console.log('\n👥 TEAM BREAKDOWN');
  console.log(`${'Team'.padEnd(25)} ${'Total'.padEnd(8)} ${'Auto'.padEnd(8)} ${'Coverage%'.padEnd(10)}`);
  console.log('-'.repeat(80));

  for (const team in metrics.teams) {
    const teamData = metrics.teams[team];
    console.log(
      `${team.padEnd(25)} ${String(teamData.total_test_cases).padEnd(8)} ${String(teamData.automated_test_cases).padEnd(8)} ${String(teamData.automation_coverage_percent).padEnd(10)}`
    );
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🧪 qTest Test Cases Fetcher');
  console.log(`${'='.repeat(80)}\n`);

  // Validate token
  if (!qtestService.validateToken()) {
    process.exit(1);
  }

  // Get sprint from args or prompt
  let sprint = process.argv[2];
  
  if (!sprint) {
    console.log('Available sprints:', Object.keys(SPRINTS).join(', '));
    console.log('\nUsage: node fetch-testcases.js <sprint> [--save] [--update-db]');
    console.log('Example: node fetch-testcases.js 26.1.2 --save --update-db\n');
    
    // Default to first sprint
    sprint = Object.keys(SPRINTS)[0];
    console.log(`Using default sprint: ${sprint}`);
  }

  if (!SPRINTS[sprint]) {
    console.error(`❌ Error: Unknown sprint '${sprint}'`);
    console.error(`Available sprints: ${Object.keys(SPRINTS).join(', ')}`);
    process.exit(1);
  }

  const moduleId = SPRINTS[sprint];
  const shouldSave = process.argv.includes('--save');
  const shouldUpdateDB = process.argv.includes('--update-db');

  // Fetch data
  console.log(`📥 Fetching test cases for Sprint ${sprint}...`);
  const qTestData = await qtestService.getSprintTestCases(moduleId, `Sprint ${sprint}`, true);

  if (!qTestData) {
    console.error('❌ Failed to fetch test data');
    process.exit(1);
  }

  // Convert to metrics format
  const metrics = convertToMetrics(qTestData);

  if (!metrics) {
    console.error('❌ Failed to convert test data');
    process.exit(1);
  }

  // Print report
  printReport(metrics);

  // Save to separate file if requested
  if (shouldSave) {
    const filename = `tests-covered-${sprint}.json`;
    saveDB(metrics, filename);
  }

  // Update db.json if requested
  if (shouldUpdateDB) {
    console.log('\n📝 Updating db.json...');
    const db = loadDB();
    
    // Update or add metrics entry
    const existingIndex = db.metrics.findIndex(m => m.id === `tests-covered-${sprint}`);
    const metricsEntry = {
      id: `tests-covered-${sprint}`,
      name: `Tests Covered - ${sprint}`,
      category: 'Quality',
      value: metrics.summary.total_test_cases,
      unit: 'test cases',
      automation_coverage: metrics.summary.automation_coverage_percent,
      generated: metrics.generated,
      details: metrics
    };

    if (existingIndex >= 0) {
      db.metrics[existingIndex] = metricsEntry;
      console.log(`  Updated existing metric for Sprint ${sprint}`);
    } else {
      db.metrics.push(metricsEntry);
      console.log(`  Added new metric for Sprint ${sprint}`);
    }

    // Also store tests_covered separately for easy access
    db.tests_covered[sprint] = metrics;

    if (saveDB(db)) {
      console.log(`✅ Successfully updated db.json with tests for ${sprint}`);
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);
}

// Run
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
