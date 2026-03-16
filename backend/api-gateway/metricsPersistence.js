/**
 * Metrics Persistence Module
 * 
 * Persists aggregated bug metrics from live Jira API data to SQL Server.
 * Uses the mssql (Tedious) driver to connect to the Polarisdashboard database.
 * 
 * Architecture:
 * - Dashboard ALWAYS reads from live Jira API (source of truth)
 * - After live data is fetched and displayed, this module persists aggregated
 *   metrics to SQL Server for verification, reporting, and historical analysis
 * - Uses MERGE (upsert) pattern to avoid duplicates
 * 
 * Table: Metrics (Polarisdashboard)
 * Columns: Product, Team, Sprint, OverallBugsCount, TotalOpenBugs, 
 *          TotalClosedBugs, TotalReopenedBugs, ReopenedBugPercentage
 * 
 * @module metricsPersistence
 */

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SQL Server connection configuration
 * Server: zusscntssql19\sql2022
 * Database: Polarisdashboard
 */
const DB_CONFIG = {
  server: process.env.DB_SERVER || 'zusscntssql19\\sql2022',
  database: process.env.DB_NAME || 'Polarisdashboard',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'sql-cs-user',
      password: process.env.DB_PASSWORD || '***REMOVED_DB_PASSWORD***'
    }
  },
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true
  },
  pool: {
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000
  }
};

/**
 * MetricsPersistence class - Handles saving live Jira bug data to SQL Server
 */
class MetricsPersistence {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Connect to SQL Server
   * @returns {Promise<boolean>} true if connection successful
   */
  async connect() {
    if (this.isConnected && this.pool) {
      return true;
    }

    try {
      this.pool = new sql.ConnectionPool(DB_CONFIG);
      // Handle pool error events to prevent unhandled error crashes
      this.pool.on('error', (err) => {
        console.warn('⚠️  MetricsPersistence pool error:', err.message);
        this.isConnected = false;
      });
      await this.pool.connect();
      this.isConnected = true;
      console.log('✅ MetricsPersistence: Connected to SQL Server');
      console.log(`   Server: ${DB_CONFIG.server}`);
      console.log(`   Database: ${DB_CONFIG.database}`);
      return true;
    } catch (error) {
      console.error('⚠️  MetricsPersistence: Failed to connect to SQL Server:', error.message);
      this.isConnected = false;
      if (this.pool) {
        try { await this.pool.close(); } catch (_) { /* ignore */ }
      }
      this.pool = null;
      return false;
    }
  }

  /**
   * Disconnect from SQL Server
   */
  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.close();
      } catch (error) {
        console.error('⚠️  MetricsPersistence: Error disconnecting:', error.message);
      }
      this.pool = null;
      this.isConnected = false;
    }
  }

  /**
   * Persist a single team's bug metrics from live Jira data to SQL Server.
   * Uses MERGE (upsert) to insert or update based on Sprint key.
   * 
   * @param {Object} bugMetrics - Live bug metrics from JiraBugService.calculateBugMetrics()
   * @param {string} bugMetrics.teamId - Team identifier (e.g., 'chargers', 'matrix')
   * @param {string} bugMetrics.sprintNumber - Sprint number (e.g., '26.1.1')
   * @param {number} bugMetrics.totalBugs - Total bugs in sprint
   * @param {number} bugMetrics.openBugs - Currently open bugs
   * @param {number} bugMetrics.closedBugs - Currently closed bugs
   * @param {number} bugMetrics.reopenedBugs - Bugs that were reopened (even if closed now)
   * @param {number} bugMetrics.reopenedRate - Reopened percentage
   * @param {string} product - Product name ('T360', 'DnA', 'Passport', 'Collaboration Portal')
   * @returns {Promise<boolean>} true if persisted successfully
   */
  async persistBugMetrics(bugMetrics, product) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        console.warn('⚠️  MetricsPersistence: Cannot persist - not connected to SQL Server');
        return false;
      }
    }

    const sprintKey = `${bugMetrics.teamId}-${bugMetrics.sprintNumber}`;

    try {
      const request = this.pool.request();
      request.input('Sprint', sql.NVarChar(100), sprintKey);
      request.input('Team', sql.NVarChar(100), bugMetrics.teamId);
      request.input('Product', sql.NVarChar(100), product);
      request.input('OverallBugsCount', sql.Int, bugMetrics.totalBugs || 0);
      request.input('TotalOpenBugs', sql.Int, bugMetrics.openBugs || 0);
      request.input('TotalClosedBugs', sql.Int, bugMetrics.closedBugs || 0);
      request.input('TotalReopenedBugs', sql.Int, bugMetrics.reopenedBugs || 0);
      request.input('ReopenedBugPercentage', sql.Decimal(5, 2), bugMetrics.reopenedRate || 0);
      request.input('DefectsOpen', sql.Int, bugMetrics.openBugs || 0);
      request.input('DefectsClosed', sql.Int, bugMetrics.closedBugs || 0);

      await request.query(`
        MERGE INTO [Metrics] AS target
        USING (SELECT @Sprint AS Sprint) AS source
        ON target.Sprint = source.Sprint
        WHEN MATCHED THEN
          UPDATE SET
            Team = @Team,
            Product = @Product,
            OverallBugsCount = @OverallBugsCount,
            TotalOpenBugs = @TotalOpenBugs,
            TotalClosedBugs = @TotalClosedBugs,
            TotalReopenedBugs = @TotalReopenedBugs,
            ReopenedBugPercentage = @ReopenedBugPercentage,
            DefectsOpen = @DefectsOpen,
            DefectsClosed = @DefectsClosed,
            SyncSource = 'jira-live-api',
            LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (Sprint, Team, Product, DefectsOpen, DefectsClosed, 
                  OverallBugsCount, TotalOpenBugs, TotalClosedBugs, 
                  TotalReopenedBugs, ReopenedBugPercentage, SyncSource, LastUpdated)
          VALUES (@Sprint, @Team, @Product, @DefectsOpen, @DefectsClosed,
                  @OverallBugsCount, @TotalOpenBugs, @TotalClosedBugs,
                  @TotalReopenedBugs, @ReopenedBugPercentage, 'jira-live-api', GETDATE());
      `);

      console.log(`📊 Persisted metrics: ${product}/${bugMetrics.teamId}/${bugMetrics.sprintNumber} → ${bugMetrics.totalBugs} bugs (${bugMetrics.openBugs} open, ${bugMetrics.closedBugs} closed, ${bugMetrics.reopenedBugs} reopened)`);
      return true;
    } catch (error) {
      console.error(`⚠️  MetricsPersistence: Failed to persist ${sprintKey}:`, error.message);
      return false;
    }
  }

  /**
   * Persist bug metrics for all teams in a product.
   * Called after live Jira data is fetched for the dashboard.
   * 
   * @param {Array<Object>} allTeamMetrics - Array of bug metrics from getAllDnATeamMetrics/getAllT360TeamMetrics
   * @param {string} product - Product name ('T360', 'DnA')
   * @returns {Promise<{success: number, failed: number}>} Count of successful and failed persists
   */
  async persistAllTeamMetrics(allTeamMetrics, product) {
    let success = 0;
    let failed = 0;

    for (const metrics of allTeamMetrics) {
      const result = await this.persistBugMetrics(metrics, product);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    // Log sync event
    await this.logSync('bug-metrics-persist', `jira-live-api-${product.toLowerCase()}`, success, failed === 0 ? 'success' : 'partial');

    return { success, failed };
  }

  /**
   * Log a sync event to the SyncLog table
   * 
   * @param {string} syncType - Type of sync operation
   * @param {string} source - Data source
   * @param {number} recordsAffected - Number of records affected
   * @param {string} status - 'success', 'partial', or 'failed'
   * @param {string|null} errorMessage - Error message if failed
   */
  async logSync(syncType, source, recordsAffected, status, errorMessage = null) {
    if (!this.isConnected) return;

    try {
      const request = this.pool.request();
      request.input('SyncType', sql.NVarChar(100), syncType);
      request.input('Source', sql.NVarChar(100), source);
      request.input('RecordsAffected', sql.Int, recordsAffected);
      request.input('Status', sql.NVarChar(50), status);
      request.input('ErrorMessage', sql.NVarChar(sql.MAX), errorMessage);

      await request.query(`
        INSERT INTO [SyncLog] (SyncType, Source, RecordsAffected, Status, ErrorMessage, SyncDate)
        VALUES (@SyncType, @Source, @RecordsAffected, @Status, @ErrorMessage, GETDATE())
      `);
    } catch (error) {
      console.error('⚠️  MetricsPersistence: Failed to log sync:', error.message);
    }
  }

  /**
   * Read metrics from SQL Server for verification purposes
   * 
   * @param {string} product - Product name filter (optional)
   * @param {string} sprint - Sprint filter like '%26.1.1%' (optional)
   * @returns {Promise<Array>} Array of metric rows
   */
  async readMetrics(product = null, sprint = null) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) return [];
    }

    try {
      let query = 'SELECT Product, Team, Sprint, OverallBugsCount, TotalOpenBugs, TotalClosedBugs, TotalReopenedBugs, ReopenedBugPercentage, SyncSource, LastUpdated FROM [Metrics]';
      const conditions = [];
      const request = this.pool.request();

      if (product) {
        conditions.push('Product = @Product');
        request.input('Product', sql.NVarChar(100), product);
      }
      if (sprint) {
        conditions.push('Sprint LIKE @Sprint');
        request.input('Sprint', sql.NVarChar(100), `%${sprint}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY Product, Team, Sprint';

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('⚠️  MetricsPersistence: Failed to read metrics:', error.message);
      return [];
    }
  }
}

export default MetricsPersistence;
