// QTest Service - Fetch Test Cases and Metrics
// Integrates with QTest API to retrieve test case counts and details

const axios = require('axios');
const config = require('./qtest-config');

class QTestService {
  constructor(apiToken = null) {
    this.apiToken = apiToken || process.env.QTEST_API_TOKEN;
    this.baseUrl = config.api.base_url;
    this.projectId = config.api.project_id;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get test cases for a specific sprint
   * @param {string} sprintKey - Sprint identifier (e.g., "chargers-26.1.1")
   * @returns {Promise<Object>} Test case metrics
   */
  async getTestCasesForSprint(sprintKey) {
    try {
      const sprintConfig = config.sprints[sprintKey];
      if (!sprintConfig) {
        console.error(`Sprint configuration not found for: ${sprintKey}`);
        return null;
      }

      // Fetch test cases from QTest
      const response = await this.client.get(`/projects/${this.projectId}/test-cases`, {
        params: {
          pageNumber: 1,
          pageSize: 500,
          filter: `"Test Design" = "${sprintConfig.name}"`
        }
      });

      const testCases = response.data?.items || [];
      
      return {
        sprint: sprintKey,
        team: sprintConfig.team,
        total: testCases.length,
        automated: testCases.filter(tc => tc.automated === true).length,
        withAttachments: testCases.filter(tc => (tc.attachments?.length || 0) > 0).length,
        qTestProjectId: sprintConfig.projectId,
        qTestUrl: `${config.qtest_base_url}${sprintConfig.testDesignPath}`,
        testCases: testCases
      };
    } catch (error) {
      console.error(`Error fetching test cases for sprint ${sprintKey}:`, error.message);
      return null;
    }
  }

  /**
   * Get test case counts for all configured sprints
   * @returns {Promise<Array>} Array of sprint test case metrics
   */
  async getAllSprintTestCases() {
    const results = [];
    
    for (const sprintKey in config.sprints) {
      const metrics = await this.getTestCasesForSprint(sprintKey);
      if (metrics) {
        results.push(metrics);
      }
    }
    
    return results;
  }

  /**
   * Get test case details for a specific test case
   * @param {number} testCaseId - QTest test case ID
   * @returns {Promise<Object>} Test case details
   */
  async getTestCaseDetails(testCaseId) {
    try {
      const response = await this.client.get(`/projects/${this.projectId}/test-cases/${testCaseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching test case ${testCaseId}:`, error.message);
      return null;
    }
  }

  /**
   * Sync test case metrics to database
   * @param {Object} db - Database connection object
   * @returns {Promise<void>}
   */
  async syncTestCaseMetrics(db) {
    const allMetrics = await this.getAllSprintTestCases();
    
    for (const metrics of allMetrics) {
      const updateQuery = `
        UPDATE [Metrics]
        SET 
          TestCasesTotal = @total,
          TestCasesAutomated = @automated,
          TestCasesWithAttachments = @withAttachments,
          QTestProjectId = @projectId,
          QTestProjectUrl = @url,
          LastUpdated = GETDATE()
        WHERE Sprint = @sprint
      `;

      try {
        await db.request()
          .input('sprint', `${metrics.team}-${metrics.sprint}`)
          .input('total', metrics.total)
          .input('automated', metrics.automated)
          .input('withAttachments', metrics.withAttachments)
          .input('projectId', metrics.qTestProjectId)
          .input('url', metrics.qTestUrl)
          .query(updateQuery);
        
        console.log(`✅ Synced test case metrics for ${metrics.sprint}`);
      } catch (error) {
        console.error(`❌ Error syncing metrics for ${metrics.sprint}:`, error.message);
      }
    }
  }

  /**
   * Get summary statistics for all sprints
   * @returns {Promise<Object>} Summary statistics
   */
  async getSummaryStatistics() {
    const allMetrics = await this.getAllSprintTestCases();
    
    const summary = {
      totalSprints: allMetrics.length,
      totalTestCases: 0,
      totalAutomated: 0,
      totalWithAttachments: 0,
      automationRate: 0,
      sprints: allMetrics
    };

    allMetrics.forEach(metrics => {
      summary.totalTestCases += metrics.total;
      summary.totalAutomated += metrics.automated;
      summary.totalWithAttachments += metrics.withAttachments;
    });

    summary.automationRate = summary.totalTestCases > 0 
      ? ((summary.totalAutomated / summary.totalTestCases) * 100).toFixed(2) 
      : 0;

    return summary;
  }
}

module.exports = QTestService;
