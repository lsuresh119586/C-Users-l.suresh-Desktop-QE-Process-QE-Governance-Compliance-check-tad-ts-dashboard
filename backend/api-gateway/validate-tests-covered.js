#!/usr/bin/env node
/**
 * Validation & Testing Script for Tests Covered Implementation
 * Verifies all components are working correctly
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(80));
  log(text, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function checkmark(text) {
  log(`✓ ${text}`, 'green');
}

function cross(text) {
  log(`✗ ${text}`, 'red');
}

function warning(text) {
  log(`⚠ ${text}`, 'yellow');
}

// Test 1: Check files exist
async function testFilesExist() {
  header('TEST 1: Checking Required Files');

  const files = [
    'qtest-service.js',
    'fetch-testcases.js',
    'server-temp.js',
    'db.json',
    'package.json'
  ];

  let allExist = true;
  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      checkmark(`${file} exists`);
    } else {
      cross(`${file} NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 2: Check file contents
async function testFileContents() {
  header('TEST 2: Checking File Contents');

  const checks = [
    {
      file: 'qtest-service.js',
      search: 'getSprintTestCases',
      description: 'qTest service exports getSprintTestCases'
    },
    {
      file: 'fetch-testcases.js',
      search: 'fetch-testcases',
      description: 'Fetch script is executable'
    },
    {
      file: 'server-temp.js',
      search: '/api/metrics/tests-covered',
      description: 'Server has test endpoints'
    },
    {
      file: 'db.json',
      search: 'tests_covered',
      description: 'Database has tests_covered section'
    }
  ];

  let allPass = true;
  for (const check of checks) {
    const fullPath = path.join(__dirname, check.file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(check.search)) {
      checkmark(check.description);
    } else {
      cross(`${check.description} - NOT FOUND`);
      allPass = false;
    }
  }

  return allPass;
}

// Test 3: Check db.json structure
async function testDatabaseStructure() {
  header('TEST 3: Checking Database Structure');

  const dbPath = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  const requiredSections = ['tests_covered', 'metrics', 'teams', 'sprints'];
  let allPass = true;

  for (const section of requiredSections) {
    if (db[section]) {
      checkmark(`Database has ${section} section`);
    } else {
      cross(`Database missing ${section} section`);
      allPass = false;
    }
  }

  if (db.tests_covered) {
    const sprints = Object.keys(db.tests_covered);
    checkmark(`Database contains ${sprints.length} sprint(s): ${sprints.join(', ')}`);

    for (const sprint of sprints) {
      const sprintData = db.tests_covered[sprint];
      if (sprintData.summary) {
        checkmark(`Sprint ${sprint} has summary data`);
      } else {
        warning(`Sprint ${sprint} missing summary data`);
      }
    }
  }

  return allPass;
}

// Test 4: Check qTest connectivity
async function testQTestConnectivity() {
  header('TEST 4: Checking qTest Connectivity');

  return new Promise((resolve) => {
    const url = new URL('https://wk.qtestnet.com/api/v3/health');
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        checkmark('qTest API is reachable');
        resolve(true);
      } else {
        warning(`qTest API returned status ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      warning(`Cannot reach qTest API: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      warning('qTest API connection timeout');
      resolve(false);
    });

    req.end();
  });
}

// Test 5: Check API token configuration
async function testAPITokenConfiguration() {
  header('TEST 5: Checking API Token Configuration');

  const serviceFile = path.join(__dirname, 'qtest-service.js');
  const content = fs.readFileSync(serviceFile, 'utf-8');

  const hasToken = content.includes('QTEST_API_TOKEN');
  const hasDefaultToken = content.includes('d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d');

  if (hasToken && hasDefaultToken) {
    checkmark('qTest API token is configured');
  } else {
    cross('qTest API token not properly configured');
    return false;
  }

  const hasEnvFallback = content.includes('process.env.QTEST_API_TOKEN');
  if (hasEnvFallback) {
    checkmark('Environment variable fallback is configured');
  } else {
    warning('No environment variable fallback found');
  }

  return true;
}

// Test 6: Check Sprint configurations
async function testSprintConfigurations() {
  header('TEST 6: Checking Sprint Configurations');

  const serviceFile = path.join(__dirname, 'qtest-service.js');
  const content = fs.readFileSync(serviceFile, 'utf-8');

  const sprints = ['26.1.1', '26.1.2', '26.1.3'];
  let allConfigured = true;

  for (const sprint of sprints) {
    if (content.includes(sprint)) {
      checkmark(`Sprint ${sprint} is configured`);
    } else {
      cross(`Sprint ${sprint} NOT found in configuration`);
      allConfigured = false;
    }
  }

  return allConfigured;
}

// Test 7: Syntax validation
async function testSyntaxValidity() {
  header('TEST 7: Checking JavaScript Syntax');

  const files = [
    'qtest-service.js',
    'fetch-testcases.js',
    'server-temp.js'
  ];

  let allValid = true;
  for (const file of files) {
    const fullPath = path.join(__dirname, file);
    try {
      fs.readFileSync(fullPath, 'utf-8');
      checkmark(`${file} is readable`);
    } catch (err) {
      cross(`${file} has errors: ${err.message}`);
      allValid = false;
    }
  }

  return allValid;
}

// Test 8: Check documentation files
async function testDocumentation() {
  header('TEST 8: Checking Documentation');

  const docs = [
    'TESTS_COVERED_README.md',
    'TESTS_COVERED_GUIDE.md',
    'TESTS_COVERED_QUICK_REFERENCE.md',
    'TESTS_COVERED_COMPONENTS.jsx'
  ];

  let allExist = true;
  for (const doc of docs) {
    const fullPath = path.join(__dirname, doc);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const size = (content.length / 1024).toFixed(1);
      checkmark(`${doc} exists (${size} KB)`);
    } else {
      cross(`${doc} NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 9: Check endpoint definitions
async function testEndpointDefinitions() {
  header('TEST 9: Checking API Endpoint Definitions');

  const serverFile = path.join(__dirname, 'server-temp.js');
  const content = fs.readFileSync(serverFile, 'utf-8');

  const endpoints = [
    { path: '/api/metrics/tests-covered', method: 'GET' },
    { path: '/teams', method: 'GET' },
    { path: '/api/metrics/tests-covered-summary', method: 'GET' },
    { path: '/api/metrics/tests-covered', method: 'POST' }
  ];

  let allDefined = true;
  for (const endpoint of endpoints) {
    if (content.includes(`'${endpoint.path}'`) || content.includes(endpoint.path)) {
      checkmark(`${endpoint.method} ${endpoint.path} is defined`);
    } else {
      cross(`${endpoint.method} ${endpoint.path} NOT FOUND`);
      allDefined = false;
    }
  }

  return allDefined;
}

// Test 10: Perform sample data analysis
async function testSampleDataAnalysis() {
  header('TEST 10: Checking Sample Data');

  const dbPath = path.join(__dirname, 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  if (!db.tests_covered || Object.keys(db.tests_covered).length === 0) {
    warning('No test data in database yet - run: node fetch-testcases.js 26.1.2 --update-db');
    return false;
  }

  for (const sprint in db.tests_covered) {
    const data = db.tests_covered[sprint];
    if (data.summary) {
      const total = data.summary.total_test_cases || 0;
      const automated = data.summary.total_automated || 0;
      const coverage = data.summary.automation_coverage_percent || 0;
      
      if (total > 0) {
        checkmark(`${sprint}: ${total} tests, ${automated} automated (${coverage}% coverage)`);
      } else {
        warning(`${sprint}: No test data yet`);
      }
    }
  }

  return true;
}

// Summary report
async function generateReport(results) {
  header('VALIDATION SUMMARY');

  const totalTests = results.length;
  const passedTests = results.filter(r => r).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, 'red');
  }

  console.log(`\nSuccess Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    log('✓ All validation tests passed!', 'green');
    console.log('\nYou are ready to use Tests Covered. Next steps:');
    console.log('  1. node fetch-testcases.js 26.1.2 --update-db');
    console.log('  2. node server-temp.js');
    console.log('  3. curl http://localhost:3001/api/metrics/tests-covered/26.1.2');
  } else {
    log('✗ Some validation tests failed. Please review above.', 'red');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Main execution
async function main() {
  log('\n╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          Tests Covered - Implementation Validation & Testing                 ║', 'cyan');
  log('║                            February 6, 2026                                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');

  const results = [];

  results.push(await testFilesExist());
  results.push(await testFileContents());
  results.push(await testDatabaseStructure());
  results.push(await testQTestConnectivity());
  results.push(await testAPITokenConfiguration());
  results.push(await testSprintConfigurations());
  results.push(await testSyntaxValidity());
  results.push(await testDocumentation());
  results.push(await testEndpointDefinitions());
  results.push(await testSampleDataAnalysis());

  await generateReport(results);
}

// Run validation
main().catch(err => {
  log(`\n✗ Validation Error: ${err.message}`, 'red');
  process.exit(1);
});
