import { execSync } from 'child_process';

// qTest Configuration
const QTEST_URL = "https://wk.qtestnet.com/api/v3";
const PROJECT_ID = 114345;
const QTEST_API_TOKEN = "d52ca8d3-d69b-40e8-a3bd-dde6e77fe92d";

// SQL Server Configuration
const server = 'zusscntssql19\\sql2022';
const database = 'Polarisdashboard';
const username = 'sql-cs-user';
const password = '***REMOVED_DB_PASSWORD***';

// Sprint to Module ID mapping (from Python script)
const SPRINT_MODULES = {
  '26.1.1': 68209713,
  '26.1.2': 68209714,
  '26.1.3': 68209719,
  '26.1.4': 68209720,
  '26.1.5': 68209721,
  '26.1.6': 68209722
};

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
 * Fetch data from qTest API
 */
async function qtestFetch(endpoint) {
  const url = `${QTEST_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${QTEST_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`qTest API Error: ${response.status} - ${endpoint}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Fetch Error (${endpoint}):`, error.message);
    return null;
  }
}

/**
 * Get module structure including sub-modules
 */
async function getModuleStructure(moduleId) {
  return await qtestFetch(`/projects/${PROJECT_ID}/modules/${moduleId}?expand=descendants`);
}

/**
 * Get test cases from a specific module
 */
async function getTestCases(parentId, page = 1, pageSize = 100) {
  return await qtestFetch(`/projects/${PROJECT_ID}/test-cases?parentId=${parentId}&page=${page}&size=${pageSize}`);
}

/**
 * Get all test cases from a module (handling pagination)
 */
async function getAllTestCasesFromModule(moduleId, teamName) {
  let allTestCases = [];
  let page = 1;
  
  while (true) {
    const testCases = await getTestCases(moduleId, page);
    if (!testCases || testCases.length === 0) {
      break;
    }
    
    // Tag each test case with the team name
    testCases.forEach(tc => tc.team = teamName);
    allTestCases.push(...testCases);
    
    if (testCases.length < 100) {
      break;
    }
    page++;
  }
  
  return allTestCases;
}

/**
 * Recursively process module and all its children
 */
async function processModuleRecursive(module, teamName) {
  let allTestCases = [];
  
  const moduleId = module.id;
  const moduleName = module.name;
  
  // Get test cases from this module
  const testCases = await getAllTestCasesFromModule(moduleId, teamName);
  allTestCases.push(...testCases);
  
  // Process children recursively
  const children = module.children || [];
  for (const child of children) {
    const childTestCases = await processModuleRecursive(child, teamName);
    allTestCases.push(...childTestCases);
  }
  
  return allTestCases;
}

/**
 * Analyze test cases and return statistics
 */
function analyzeTestCases(testCases) {
  const teamStats = {};
  
  for (const tc of testCases) {
    const team = tc.team || 'Unknown';
    
    if (!teamStats[team]) {
      teamStats[team] = {
        total: 0,
        automated: 0
      };
    }
    
    teamStats[team].total++;
    
    // Check if automated (Automation field = 711 means "Yes")
    const isAutomated = tc.properties?.some(
      prop => prop.field_name === 'Automation' && prop.field_value === '711'
    );
    
    if (isAutomated) {
      teamStats[team].automated++;
    }
  }
  
  return teamStats;
}

/**
 * Get test case statistics for a sprint
 */
async function getSprintTestCases(moduleId, sprintName) {
  console.log(`\nFetching test cases for ${sprintName} (Module: ${moduleId})...`);
  
  // Get module structure
  const module = await getModuleStructure(moduleId);
  if (!module) {
    console.error('Error: Could not fetch module structure');
    return null;
  }
  
  let allTestCases = [];
  
  // Check if module has children (team sub-modules)
  const children = module.children || [];
  if (children.length > 0) {
    console.log(`Found ${children.length} team modules`);
    
    for (const child of children) {
      const childName = child.name;
      console.log(`  Processing team: ${childName}...`);
      
      const teamTestCases = await processModuleRecursive(child, childName);
      allTestCases.push(...teamTestCases);
      
      console.log(`    Found ${teamTestCases.length} test cases`);
    }
  } else {
    // No children, get test cases directly
    console.log('No team modules found, getting test cases from parent module');
    const testCases = await getAllTestCasesFromModule(moduleId, 'All Teams');
    allTestCases.push(...testCases);
  }
  
  console.log(`Total test cases: ${allTestCases.length}`);
  
  // Analyze test cases
  const teamStats = analyzeTestCases(allTestCases);
  
  return teamStats;
}

/**
 * Update metrics in SQL Server database
 */
function updateMetrics(teamName, sprintName, testStats) {
  const total = testStats.total || 0;
  const automated = testStats.automated || 0;
  
  console.log(`    Updating: ${teamName} - ${sprintName} => Total: ${total}, Automated: ${automated}`);
  
  // Update the Metrics table
  const query = `
    UPDATE Metrics
    SET testsCovered = ${automated},
        timestamp = GETDATE()
    FROM Metrics m
    INNER JOIN Teams t ON m.team = t.id
    INNER JOIN Sprints s ON m.sprint = s.id
    WHERE t.name = '${teamName.replace(/'/g, "''")}'
      AND s.name = '${sprintName.replace(/'/g, "''")}';
  `;
  
  const result = runSqlCommand(query);
  return result !== null;
}

/**
 * Sync qTest data to SQL Server
 */
async function syncQTestData(sprintName = null) {
  console.log('='.repeat(80));
  console.log('qTest Data Sync - Polaris Dashboard');
  console.log('='.repeat(80));
  
  // Get sprints to process
  const sprintsToProcess = sprintName 
    ? [sprintName] 
    : Object.keys(SPRINT_MODULES);
  
  for (const sprint of sprintsToProcess) {
    const moduleId = SPRINT_MODULES[sprint];
    
    if (!moduleId) {
      console.error(`\nError: Unknown sprint '${sprint}'`);
      continue;
    }
    
    try {
      // Fetch test case statistics from qTest
      const teamStats = await getSprintTestCases(moduleId, `Sprint ${sprint}`);
      
      if (!teamStats) {
        console.error(`Failed to fetch data for ${sprint}`);
        continue;
      }
      
      // Update each team's metrics in SQL Server
      console.log(`\nUpdating database for Sprint ${sprint}...`);
      for (const [teamName, stats] of Object.entries(teamStats)) {
        updateMetrics(teamName, sprint, stats);
      }
      
      console.log(`✅ Sprint ${sprint} completed\n`);
      
    } catch (error) {
      console.error(`Error processing sprint ${sprint}:`, error.message);
    }
  }
  
  console.log('='.repeat(80));
  console.log('Sync completed!');
  console.log('='.repeat(80));
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const sprintName = args[0]; // Optional: specific sprint like "26.1.2"
  
  if (sprintName && !SPRINT_MODULES[sprintName]) {
    console.error(`Error: Unknown sprint '${sprintName}'`);
    console.log(`Available sprints: ${Object.keys(SPRINT_MODULES).join(', ')}`);
    process.exit(1);
  }
  
  try {
    await syncQTestData(sprintName);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

export { syncQTestData, getSprintTestCases };
