#!/usr/bin/env node
/**
 * Generate Sample Test Data for Tests Covered
 * Creates realistic mock data for demonstration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');

// Sample data generator
function generateSampleData() {
  return {
    sprint: "26.1.2",
    module_id: 68209714,
    generated: new Date().toISOString().split('T')[0],
    summary: {
      total_test_cases: 345,
      total_automated: 287,
      total_with_attachments: 287,
      automation_coverage_percent: 83.2,
      teams_count: 5
    },
    teams: {
      "Chubb": {
        total_test_cases: 67,
        automated_test_cases: 58,
        automation_coverage_percent: 86.6,
        with_attachments: 58,
        without_attachments: 9,
        test_cases: [
          {
            id: "TC-CHUBB-001",
            qtest_id: 1001,
            name: "Login with valid credentials",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-CHUBB-002",
            qtest_id: 1002,
            name: "Create new policy",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-CHUBB-003",
            qtest_id: 1003,
            name: "Update policy details",
            automated: false,
            status: "Active"
          }
        ]
      },
      "Matrix": {
        total_test_cases: 72,
        automated_test_cases: 61,
        automation_coverage_percent: 84.7,
        with_attachments: 61,
        without_attachments: 11,
        test_cases: [
          {
            id: "TC-MATRIX-001",
            qtest_id: 2001,
            name: "SSO authentication flow",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-MATRIX-002",
            qtest_id: 2002,
            name: "Angular scheduler component",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-MATRIX-003",
            qtest_id: 2003,
            name: "Delete scheduled item",
            automated: true,
            status: "Active"
          }
        ]
      },
      "Mavericks": {
        total_test_cases: 68,
        automated_test_cases: 56,
        automation_coverage_percent: 82.4,
        with_attachments: 56,
        without_attachments: 12,
        test_cases: [
          {
            id: "TC-MAV-001",
            qtest_id: 3001,
            name: "AFA amount adjustment validation",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-MAV-002",
            qtest_id: 3002,
            name: "Time period editing",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-MAV-003",
            qtest_id: 3003,
            name: "AI Console UI updates",
            automated: false,
            status: "Active"
          }
        ]
      },
      "Nexus": {
        total_test_cases: 70,
        automated_test_cases: 58,
        automation_coverage_percent: 82.9,
        with_attachments: 58,
        without_attachments: 12,
        test_cases: [
          {
            id: "TC-NEX-001",
            qtest_id: 4001,
            name: "Export to Excel validation",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-NEX-002",
            qtest_id: 4002,
            name: "Search performance optimization",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-NEX-003",
            qtest_id: 4003,
            name: "Token claims validation",
            automated: true,
            status: "Active"
          }
        ]
      },
      "Vanguards": {
        total_test_cases: 68,
        automated_test_cases: 54,
        automation_coverage_percent: 79.4,
        with_attachments: 54,
        without_attachments: 14,
        test_cases: [
          {
            id: "TC-VAN-001",
            qtest_id: 5001,
            name: "Invoice AI - Line Item ID",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-VAN-002",
            qtest_id: 5002,
            name: "Invoice AI Citations",
            automated: true,
            status: "Active"
          },
          {
            id: "TC-VAN-003",
            qtest_id: 5003,
            name: "Citations to Interactive Links",
            automated: false,
            status: "Active"
          }
        ]
      }
    }
  };
}

// Main function
function main() {
  console.log('\n📝 Generating Sample Test Data for Sprint 26.1.2...\n');

  try {
    // Load current db.json
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    // Generate sample data
    const sampleData = generateSampleData();

    // Update db.json with sample data
    db.tests_covered["26.1.2"] = sampleData;

    // Also add to metrics
    db.metrics = db.metrics || [];
    db.metrics.push({
      id: "tests-covered-26.1.2-sample",
      name: "Tests Covered - 26.1.2 (Sample Data)",
      category: "Quality",
      value: sampleData.summary.total_test_cases,
      unit: "test cases",
      automation_coverage: sampleData.summary.automation_coverage_percent,
      generated: sampleData.generated,
      details: sampleData
    });

    // Write updated db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');

    // Display report
    console.log('✅ Sample data generated and saved to db.json\n');
    console.log('📊 TEST COVERAGE SUMMARY - Sprint 26.1.2');
    console.log('='.repeat(70));
    console.log(`Total Test Cases: ${sampleData.summary.total_test_cases}`);
    console.log(`Automated: ${sampleData.summary.total_automated} (${sampleData.summary.automation_coverage_percent}% coverage)`);
    console.log(`With Attachments: ${sampleData.summary.total_with_attachments}`);
    console.log(`Teams: ${sampleData.summary.teams_count}\n`);

    console.log('👥 TEAM BREAKDOWN');
    console.log('-'.repeat(70));
    console.log(String('Team').padEnd(15) + String('Total').padEnd(8) + String('Auto').padEnd(8) + String('Coverage %').padEnd(12));
    console.log('-'.repeat(70));

    for (const [team, stats] of Object.entries(sampleData.teams)) {
      console.log(String(team).padEnd(15) + String(stats.total_test_cases).padEnd(8) + String(stats.automated_test_cases).padEnd(8) + String(stats.automation_coverage_percent).padEnd(12));
    }

    console.log('-'.repeat(70));
    console.log(String('TOTAL').padEnd(15) + String(sampleData.summary.total_test_cases).padEnd(8) + String(sampleData.summary.total_automated).padEnd(8) + String(sampleData.summary.automation_coverage_percent).padEnd(12) + '\n');

    console.log('✅ Sample data ready! Next steps:');
    console.log('   1. node server-temp.js');
    console.log('   2. curl http://localhost:3001/api/metrics/tests-covered/26.1.2\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
