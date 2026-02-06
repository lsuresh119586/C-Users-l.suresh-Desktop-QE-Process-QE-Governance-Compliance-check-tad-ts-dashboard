import { execSync } from 'child_process';

const server = 'zusscntssql19\\sql2022';
const database = 'Polarisdashboard';
const username = 'sql-cs-user';
const password = '***REMOVED_DB_PASSWORD***';

function runSqlCommand(query) {
  try {
    const result = execSync(
      `sqlcmd -S "${server}" -d "${database}" -U "${username}" -P "${password}" -C -h -1 -W -s "," -Q "${query.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim();
  } catch (error) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

const defaultData = {
  products: [
    { id: 'collaboration-portal', name: 'Collaboration Portal' },
    { id: 'dna', name: 'DnA' },
    { id: 'passport', name: 'Passport' },
    { id: 't360', name: 'T360' }
  ],
  teams: [
    { id: 'team-a', name: 'Team A', product: 'passport' },
    { id: 'team-b', name: 'Team B', product: 'passport' },
    { id: 'team-c', name: 'Team C', product: 'passport' },
    { id: 'chargers', name: 'Chargers', product: 't360' },
    { id: 'chubb', name: 'Chubb', product: 't360' },
    { id: 'matrix', name: 'Matrix', product: 't360' },
    { id: 'mavericks', name: 'Mavericks', product: 't360' },
    { id: 'nexus', name: 'Nexus', product: 't360' },
    { id: 'vanguards', name: 'Vanguards', product: 't360' }
  ],
  sprints: [
    { id: 'team-a-25.1.1', name: 'Sprint 25.1.1', team: 'team-a' },
    { id: 'team-a-25.1.2', name: 'Sprint 25.1.2', team: 'team-a' },
    { id: 'chargers-26.1.1', name: 'Sprint 26.1.1', team: 'chargers' },
    { id: 'chargers-26.1.2', name: 'Sprint 26.1.2', team: 'chargers' },
    { id: 'chargers-26.1.3', name: 'Sprint 26.1.3', team: 'chargers' },
    { id: 'chargers-26.1.4', name: 'Sprint 26.1.4', team: 'chargers' },
    { id: 'chargers-26.1.5', name: 'Sprint 26.1.5', team: 'chargers' },
    { id: 'chargers-26.1.6', name: 'Sprint 26.1.6', team: 'chargers' },
    { id: 'chubb-26.1.1', name: 'Sprint 26.1.1', team: 'chubb' },
    { id: 'chubb-26.1.2', name: 'Sprint 26.1.2', team: 'chubb' },
    { id: 'chubb-26.1.3', name: 'Sprint 26.1.3', team: 'chubb' },
    { id: 'chubb-26.1.4', name: 'Sprint 26.1.4', team: 'chubb' },
    { id: 'chubb-26.1.5', name: 'Sprint 26.1.5', team: 'chubb' },
    { id: 'chubb-26.1.6', name: 'Sprint 26.1.6', team: 'chubb' },
    { id: 'matrix-26.1.1', name: 'Sprint 26.1.1', team: 'matrix' },
    { id: 'matrix-26.1.2', name: 'Sprint 26.1.2', team: 'matrix' },
    { id: 'matrix-26.1.3', name: 'Sprint 26.1.3', team: 'matrix' },
    { id: 'matrix-26.1.4', name: 'Sprint 26.1.4', team: 'matrix' },
    { id: 'matrix-26.1.5', name: 'Sprint 26.1.5', team: 'matrix' },
    { id: 'matrix-26.1.6', name: 'Sprint 26.1.6', team: 'matrix' },
    { id: 'mavericks-26.1.1', name: 'Sprint 26.1.1', team: 'mavericks' },
    { id: 'mavericks-26.1.2', name: 'Sprint 26.1.2', team: 'mavericks' },
    { id: 'mavericks-26.1.3', name: 'Sprint 26.1.3', team: 'mavericks' },
    { id: 'mavericks-26.1.4', name: 'Sprint 26.1.4', team: 'mavericks' },
    { id: 'mavericks-26.1.5', name: 'Sprint 26.1.5', team: 'mavericks' },
    { id: 'mavericks-26.1.6', name: 'Sprint 26.1.6', team: 'mavericks' },
    { id: 'nexus-26.1.1', name: 'Sprint 26.1.1', team: 'nexus' },
    { id: 'nexus-26.1.2', name: 'Sprint 26.1.2', team: 'nexus' },
    { id: 'nexus-26.1.3', name: 'Sprint 26.1.3', team: 'nexus' },
    { id: 'nexus-26.1.4', name: 'Sprint 26.1.4', team: 'nexus' },
    { id: 'nexus-26.1.5', name: 'Sprint 26.1.5', team: 'nexus' },
    { id: 'nexus-26.1.6', name: 'Sprint 26.1.6', team: 'nexus' },
    { id: 'vanguards-26.1.1', name: 'Sprint 26.1.1', team: 'vanguards' },
    { id: 'vanguards-26.1.2', name: 'Sprint 26.1.2', team: 'vanguards' },
    { id: 'vanguards-26.1.3', name: 'Sprint 26.1.3', team: 'vanguards' },
    { id: 'vanguards-26.1.4', name: 'Sprint 26.1.4', team: 'vanguards' },
    { id: 'vanguards-26.1.5', name: 'Sprint 26.1.5', team: 'vanguards' },
    { id: 'vanguards-26.1.6', name: 'Sprint 26.1.6', team: 'vanguards' }
  ],
  metrics: [
    { id: 'metric-team-a-25.1.1', product: 'passport', team: 'team-a', sprint: 'team-a-25.1.1', requirementsCovered: 95, testsCovered: 92, defectsOpen: 3, defectsClosed: 18, deploymentReadiness: 90, codeQuality: 88, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-team-a-25.1.2', product: 'passport', team: 'team-a', sprint: 'team-a-25.1.2', requirementsCovered: 93, testsCovered: 90, defectsOpen: 5, defectsClosed: 20, deploymentReadiness: 87, codeQuality: 85, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-chargers-26.1.1', product: 't360', team: 'chargers', sprint: 'chargers-26.1.1', requirementsCovered: 88, testsCovered: 82, defectsOpen: 8, defectsClosed: 25, deploymentReadiness: 85, codeQuality: 80, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-chargers-26.1.2', product: 't360', team: 'chargers', sprint: 'chargers-26.1.2', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 26, deploymentReadiness: 86, codeQuality: 82, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-chargers-26.1.3', product: 't360', team: 'chargers', sprint: 'chargers-26.1.3', requirementsCovered: 90, testsCovered: 85, defectsOpen: 6, defectsClosed: 27, deploymentReadiness: 87, codeQuality: 83, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-chargers-26.1.4', product: 't360', team: 'chargers', sprint: 'chargers-26.1.4', requirementsCovered: 91, testsCovered: 86, defectsOpen: 5, defectsClosed: 28, deploymentReadiness: 88, codeQuality: 84, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-chargers-26.1.5', product: 't360', team: 'chargers', sprint: 'chargers-26.1.5', requirementsCovered: 92, testsCovered: 87, defectsOpen: 4, defectsClosed: 29, deploymentReadiness: 89, codeQuality: 85, timestamp: '2025-01-19T10:00:00Z' },
    { id: 'metric-chargers-26.1.6', product: 't360', team: 'chargers', sprint: 'chargers-26.1.6', requirementsCovered: 93, testsCovered: 88, defectsOpen: 3, defectsClosed: 30, deploymentReadiness: 90, codeQuality: 86, timestamp: '2025-01-20T10:00:00Z' },
    { id: 'metric-chubb-26.1.1', product: 't360', team: 'chubb', sprint: 'chubb-26.1.1', requirementsCovered: 87, testsCovered: 81, defectsOpen: 9, defectsClosed: 24, deploymentReadiness: 84, codeQuality: 79, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-chubb-26.1.2', product: 't360', team: 'chubb', sprint: 'chubb-26.1.2', requirementsCovered: 88, testsCovered: 83, defectsOpen: 8, defectsClosed: 25, deploymentReadiness: 85, codeQuality: 81, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-chubb-26.1.3', product: 't360', team: 'chubb', sprint: 'chubb-26.1.3', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 26, deploymentReadiness: 86, codeQuality: 82, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-chubb-26.1.4', product: 't360', team: 'chubb', sprint: 'chubb-26.1.4', requirementsCovered: 90, testsCovered: 85, defectsOpen: 6, defectsClosed: 27, deploymentReadiness: 87, codeQuality: 83, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-chubb-26.1.5', product: 't360', team: 'chubb', sprint: 'chubb-26.1.5', requirementsCovered: 91, testsCovered: 86, defectsOpen: 5, defectsClosed: 28, deploymentReadiness: 88, codeQuality: 84, timestamp: '2025-01-19T10:00:00Z' },
    { id: 'metric-chubb-26.1.6', product: 't360', team: 'chubb', sprint: 'chubb-26.1.6', requirementsCovered: 92, testsCovered: 87, defectsOpen: 4, defectsClosed: 29, deploymentReadiness: 89, codeQuality: 85, timestamp: '2025-01-20T10:00:00Z' },
    { id: 'metric-matrix-26.1.1', product: 't360', team: 'matrix', sprint: 'matrix-26.1.1', requirementsCovered: 86, testsCovered: 80, defectsOpen: 10, defectsClosed: 23, deploymentReadiness: 83, codeQuality: 78, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-matrix-26.1.2', product: 't360', team: 'matrix', sprint: 'matrix-26.1.2', requirementsCovered: 87, testsCovered: 82, defectsOpen: 9, defectsClosed: 24, deploymentReadiness: 84, codeQuality: 80, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-matrix-26.1.3', product: 't360', team: 'matrix', sprint: 'matrix-26.1.3', requirementsCovered: 88, testsCovered: 83, defectsOpen: 8, defectsClosed: 25, deploymentReadiness: 85, codeQuality: 81, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-matrix-26.1.4', product: 't360', team: 'matrix', sprint: 'matrix-26.1.4', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 26, deploymentReadiness: 86, codeQuality: 82, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-matrix-26.1.5', product: 't360', team: 'matrix', sprint: 'matrix-26.1.5', requirementsCovered: 90, testsCovered: 85, defectsOpen: 6, defectsClosed: 27, deploymentReadiness: 87, codeQuality: 83, timestamp: '2025-01-19T10:00:00Z' },
    { id: 'metric-matrix-26.1.6', product: 't360', team: 'matrix', sprint: 'matrix-26.1.6', requirementsCovered: 91, testsCovered: 86, defectsOpen: 5, defectsClosed: 28, deploymentReadiness: 88, codeQuality: 84, timestamp: '2025-01-20T10:00:00Z' },
    { id: 'metric-mavericks-26.1.1', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.1', requirementsCovered: 85, testsCovered: 79, defectsOpen: 11, defectsClosed: 22, deploymentReadiness: 82, codeQuality: 77, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-mavericks-26.1.2', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.2', requirementsCovered: 86, testsCovered: 81, defectsOpen: 10, defectsClosed: 23, deploymentReadiness: 83, codeQuality: 79, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-mavericks-26.1.3', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.3', requirementsCovered: 87, testsCovered: 82, defectsOpen: 9, defectsClosed: 24, deploymentReadiness: 84, codeQuality: 80, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-mavericks-26.1.4', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.4', requirementsCovered: 88, testsCovered: 83, defectsOpen: 8, defectsClosed: 25, deploymentReadiness: 85, codeQuality: 81, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-mavericks-26.1.5', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.5', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 26, deploymentReadiness: 86, codeQuality: 82, timestamp: '2025-01-19T10:00:00Z' },
    { id: 'metric-mavericks-26.1.6', product: 't360', team: 'mavericks', sprint: 'mavericks-26.1.6', requirementsCovered: 90, testsCovered: 85, defectsOpen: 6, defectsClosed: 27, deploymentReadiness: 87, codeQuality: 83, timestamp: '2025-01-20T10:00:00Z' },
    { id: 'metric-nexus-26.1.1', product: 't360', team: 'nexus', sprint: 'nexus-26.1.1', requirementsCovered: 84, testsCovered: 78, defectsOpen: 12, defectsClosed: 21, deploymentReadiness: 81, codeQuality: 76, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-nexus-26.1.2', product: 't360', team: 'nexus', sprint: 'nexus-26.1.2', requirementsCovered: 85, testsCovered: 80, defectsOpen: 11, defectsClosed: 22, deploymentReadiness: 82, codeQuality: 78, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-nexus-26.1.3', product: 't360', team: 'nexus', sprint: 'nexus-26.1.3', requirementsCovered: 86, testsCovered: 81, defectsOpen: 10, defectsClosed: 23, deploymentReadiness: 83, codeQuality: 79, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-nexus-26.1.4', product: 't360', team: 'nexus', sprint: 'nexus-26.1.4', requirementsCovered: 87, testsCovered: 82, defectsOpen: 9, defectsClosed: 24, deploymentReadiness: 84, codeQuality: 80, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-nexus-26.1.5', product: 't360', team: 'nexus', sprint: 'nexus-26.1.5', requirementsCovered: 88, testsCovered: 83, defectsOpen: 8, defectsClosed: 25, deploymentReadiness: 85, codeQuality: 81, timestamp: '2025-01-19T10:00:00Z' },
    { id: 'metric-nexus-26.1.6', product: 't360', team: 'nexus', sprint: 'nexus-26.1.6', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 26, deploymentReadiness: 86, codeQuality: 82, timestamp: '2025-01-20T10:00:00Z' },
    { id: 'metric-vanguards-26.1.1', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.1', requirementsCovered: 89, testsCovered: 84, defectsOpen: 7, defectsClosed: 21, deploymentReadiness: 87, codeQuality: 82, timestamp: '2025-01-14T10:00:00Z' },
    { id: 'metric-vanguards-26.1.2', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.2', requirementsCovered: 90, testsCovered: 85, defectsOpen: 6, defectsClosed: 22, deploymentReadiness: 88, codeQuality: 83, timestamp: '2025-01-15T10:00:00Z' },
    { id: 'metric-vanguards-26.1.3', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.3', requirementsCovered: 92, testsCovered: 87, defectsOpen: 4, defectsClosed: 24, deploymentReadiness: 90, codeQuality: 86, timestamp: '2025-01-16T10:00:00Z' },
    { id: 'metric-vanguards-26.1.4', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.4', requirementsCovered: 91, testsCovered: 86, defectsOpen: 5, defectsClosed: 23, deploymentReadiness: 89, codeQuality: 84, timestamp: '2025-01-17T10:00:00Z' },
    { id: 'metric-vanguards-26.1.5', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.5', requirementsCovered: 93, testsCovered: 88, defectsOpen: 3, defectsClosed: 26, deploymentReadiness: 91, codeQuality: 87, timestamp: '2025-01-18T10:00:00Z' },
    { id: 'metric-vanguards-26.1.6', product: 't360', team: 'vanguards', sprint: 'vanguards-26.1.6', requirementsCovered: 94, testsCovered: 89, defectsOpen: 2, defectsClosed: 28, deploymentReadiness: 92, codeQuality: 88, timestamp: '2025-01-19T10:00:00Z' }
  ]
};

function migrate() {
  try {
    console.log('Connecting to SQL Server...');
    
    // Test connection
    runSqlCommand('SELECT 1');
    console.log('✅ Connected to SQL Server\n');

    // Create Products table
    console.log('Creating Products table...');
    runSqlCommand(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
      CREATE TABLE Products (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL
      )
    `);
    console.log('✅ Products table ready');

    // Create Teams table
    console.log('Creating Teams table...');
    runSqlCommand(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Teams')
      CREATE TABLE Teams (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        product NVARCHAR(50) NOT NULL,
        FOREIGN KEY (product) REFERENCES Products(id)
      )
    `);
    console.log('✅ Teams table ready');

    // Create Sprints table
    console.log('Creating Sprints table...');
    runSqlCommand(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sprints')
      CREATE TABLE Sprints (
        id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        team NVARCHAR(50) NOT NULL,
        FOREIGN KEY (team) REFERENCES Teams(id)
      )
    `);
    console.log('✅ Sprints table ready');

    // Create Metrics table
    console.log('Creating Metrics table...');
    runSqlCommand(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Metrics')
      CREATE TABLE Metrics (
        id NVARCHAR(100) PRIMARY KEY,
        product NVARCHAR(50) NOT NULL,
        team NVARCHAR(50) NOT NULL,
        sprint NVARCHAR(100) NOT NULL,
        requirementsCovered INT NOT NULL,
        testsCovered INT NOT NULL,
        defectsOpen INT NOT NULL,
        defectsClosed INT NOT NULL,
        deploymentReadiness INT NOT NULL,
        codeQuality INT NOT NULL,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (product) REFERENCES Products(id),
        FOREIGN KEY (team) REFERENCES Teams(id),
        FOREIGN KEY (sprint) REFERENCES Sprints(id)
      )
    `);
    console.log('✅ Metrics table ready');

    // Check if data already exists
    const productCount = runSqlCommand('SELECT COUNT(*) FROM Products');
    if (productCount && parseInt(productCount) > 0) {
      console.log('\n⚠️  Data already exists. Skipping seed data insertion.');
      console.log('To re-seed, manually delete data from tables first.');
      return;
    }

    // Seed Products
    console.log('\nSeeding Products...');
    for (const product of defaultData.products) {
      runSqlCommand(`INSERT INTO Products (id, name) VALUES ('${product.id}', '${product.name}')`);
    }
    console.log(`✅ Inserted ${defaultData.products.length} products`);

    // Seed Teams
    console.log('Seeding Teams...');
    for (const team of defaultData.teams) {
      runSqlCommand(`INSERT INTO Teams (id, name, product) VALUES ('${team.id}', '${team.name}', '${team.product}')`);
    }
    console.log(`✅ Inserted ${defaultData.teams.length} teams`);

    // Seed Sprints
    console.log('Seeding Sprints...');
    for (const sprint of defaultData.sprints) {
      runSqlCommand(`INSERT INTO Sprints (id, name, team) VALUES ('${sprint.id}', '${sprint.name}', '${sprint.team}')`);
    }
    console.log(`✅ Inserted ${defaultData.sprints.length} sprints`);

    // Seed Metrics
    console.log('Seeding Metrics...');
    for (const metric of defaultData.metrics) {
      runSqlCommand(`
        INSERT INTO Metrics (id, product, team, sprint, requirementsCovered, testsCovered, 
                            defectsOpen, defectsClosed, deploymentReadiness, codeQuality, timestamp)
        VALUES ('${metric.id}', '${metric.product}', '${metric.team}', '${metric.sprint}', 
                ${metric.requirementsCovered}, ${metric.testsCovered}, 
                ${metric.defectsOpen}, ${metric.defectsClosed}, 
                ${metric.deploymentReadiness}, ${metric.codeQuality}, '${metric.timestamp}')
      `);
    }
    console.log(`✅ Inserted ${defaultData.metrics.length} metrics`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nDatabase Summary:');
    console.log(`  - Products: ${defaultData.products.length}`);
    console.log(`  - Teams: ${defaultData.teams.length}`);
    console.log(`  - Sprints: ${defaultData.sprints.length}`);
    console.log(`  - Metrics: ${defaultData.metrics.length}`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
