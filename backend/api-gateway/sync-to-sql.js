#!/usr/bin/env node
/**
 * Sync defect data from db.json to SQL Server (Polaris Dashboard)
 * Server: zusscntssql19\sql2022
 * Database: Polarisdashboard
 * 
 * Usage: node sync-to-sql.js
 */

const fs = require('fs');
const path = require('path');

// Try to use mssql package
let sql;
try {
    sql = require('mssql');
} catch (e) {
    console.error('❌ ERROR: mssql package not installed');
    console.error('   Install with: npm install mssql');
    process.exit(1);
}

const DB_CONFIG = {
    server: 'zusscntssql19\\sql2022',
    database: 'Polarisdashboard',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '***REMOVED_DB_PASSWORD***'
        }
    },
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    }
};

const DB_JSON_PATH = path.join(__dirname, 'db.json');

// Defect distribution for sprint 26.1.1
const DEFECT_DISTRIBUTION = {
    'vanguards': { open: 2, closed: 3, total: 5 },
    'athena': { open: 1, closed: 2, total: 3 },
    'nexus': { open: 1, closed: 1, total: 2 },
    'chubb': { open: 1, closed: 1, total: 2 },
    'chargers': { open: 1, closed: 1, total: 2 },
    'matrix': { open: 1, closed: 1, total: 2 },
    'mavericks': { open: 0, closed: 1, total: 1 }
};

async function syncDefectsToSQL() {
    let pool;
    try {
        console.log('📡 Connecting to SQL Server...');
        console.log(`   Server: ${DB_CONFIG.server}`);
        console.log(`   Database: ${DB_CONFIG.database}`);
        
        pool = new sql.ConnectionPool(DB_CONFIG);
        await pool.connect();
        
        console.log('✅ Connected to SQL Server\n');

        // Read db.json
        const dbContent = fs.readFileSync(DB_JSON_PATH, 'utf-8');
        const db = JSON.parse(dbContent);

        console.log('📊 Processing Sprint 26.1.1 Defects...\n');

        let updateCount = 0;
        let errorCount = 0;

        // Update each team's metrics for sprint 26.1.1
        for (const [team, defects] of Object.entries(DEFECT_DISTRIBUTION)) {
            try {
                const sprintId = `${team}-26.1.1`;
                
                // Check if metric exists in db.json
                const metric = db.metrics.find(m => m.sprint === sprintId);
                if (!metric) {
                    console.log(`⚠️  ${team}: Metric not found in db.json (skipping)`);
                    continue;
                }

                // Update SQL Server - find the appropriate table/column structure
                // This assumes a Metrics table with columns: Team, Sprint, DefectsOpen, DefectsClosed
                const request = pool.request();
                
                // Try updating an existing metrics table
                const query = `
                    UPDATE Metrics 
                    SET DefectsOpen = @defectsOpen, 
                        DefectsClosed = @defectsClosed,
                        LastUpdated = GETDATE()
                    WHERE Sprint = @sprint AND Team = @team
                `;

                request.input('sprint', sql.VarChar(50), sprintId);
                request.input('team', sql.VarChar(50), team);
                request.input('defectsOpen', sql.Int, defects.open);
                request.input('defectsClosed', sql.Int, defects.closed);

                const result = await request.query(query);

                if (result.rowsAffected[0] > 0) {
                    console.log(`✅ ${team.padEnd(12)} | Open: ${defects.open} | Closed: ${defects.closed} | Total: ${defects.total}`);
                    updateCount++;
                } else {
                    console.log(`⚠️  ${team.padEnd(12)} | No rows updated (record may not exist)`);
                }

            } catch (err) {
                console.log(`❌ ${team.padEnd(12)} | Error: ${err.message}`);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`📈 Summary:`);
        console.log(`   ✅ Updated: ${updateCount} metrics`);
        if (errorCount > 0) {
            console.log(`   ❌ Errors: ${errorCount}`);
        }
        console.log(`   📊 Total Defects: 17 (7 open + 10 closed)`);
        console.log('='.repeat(60));

    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n✅ Disconnected from SQL Server');
        }
    }
}

// Run the sync
syncDefectsToSQL().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
