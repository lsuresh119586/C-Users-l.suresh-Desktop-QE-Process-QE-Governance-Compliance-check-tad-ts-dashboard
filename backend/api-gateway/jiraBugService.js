/**
 * JIRA Bug Service Module for DnA and T360 Teams
 * 
 * Fetches actual bug data from Jira with cross-project support and reopened detection.
 * Supports DnA teams (Minerva, Guardians, Athena) and T360 teams (Vanguards, Chargers, 
 * Chubb, Matrix, Mavericks, Nexus) with flexible Safe-Team filtering.
 * 
 * Key Features:
 * - Cross-project queries (DnA: primary + "ELM Tech Ops", T360: GET only)
 * - Post-retrieval Safe-Team filtering (customfield_13392)
 * - Flexible Safe-Team matching (handles optional "T360" prefix, case variations)
 * - Reopened bug detection via changelog analysis
 * - 10-minute caching for performance
 * - Automatic retry with exponential backoff
 * 
 * @example
 * // Initialize service with environment variables
 * const service = new JiraBugService();
 * 
 * // Get bugs for DnA team
 * const dnaBugs = await service.getBugsForSprint('minerva', '26.1.2');
 * 
 * // Get bugs for T360 team
 * const t360Bugs = await service.getBugsForSprint('vanguards', '26.1.1');
 * 
 * // Calculate comprehensive metrics
 * const metrics = await service.calculateBugMetrics('vanguards', '26.1.1');
 */

import https from 'https';
import {
  JiraAuthenticationError,
  JiraTimeoutError,
  JiraQueryError,
  UnknownTeamError,
  JiraResourceNotFoundError,
  JiraRateLimitError,
  JiraError
} from './jiraErrors.js';

/**
 * Service class for fetching and analyzing Jira bugs for DnA teams
 * @class JiraBugService
 */
class JiraBugService {
  /**
   * Creates a new JiraBugService instance
   * 
   * @throws {JiraAuthenticationError} If JIRA_API_TOKEN environment variable is not set
   * 
   * @example
   * process.env.JIRA_API_TOKEN = 'your-token';
   * process.env.JIRA_BASE_URL = 'https://jira.example.com/jira';
   * const service = new JiraBugService();
   */
  constructor() {
    this.jiraUrl = process.env.JIRA_BASE_URL || process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
    this.apiToken = process.env.JIRA_API_TOKEN;
    this.apiTokenDna = process.env.JIRA_API_TOKEN_DNA || this.apiToken;
    this.apiTokenT360 = process.env.JIRA_API_TOKEN_T360 || this.apiToken;
    this.apiTokenPassport = process.env.JIRA_API_TOKEN_PASSPORT || this.apiToken;
    this.safeTeamField = 'customfield_13392';
    
    if (!this.apiToken && !this.apiTokenDna && !this.apiTokenT360) {
      throw new JiraAuthenticationError('At least one JIRA_API_TOKEN environment variable is required');
    }

    // DnA Teams Configuration with board IDs and Safe-Team values
    /**
     * @typedef {Object} TeamConfig
     * @property {string} name - Display name of the team
     * @property {string} jiraProject - Primary Jira project key (ELM or GET)
     * @property {number} boardId - Jira board ID for the team
     * @property {string} sprintFormat - Sprint name format with {sprint} placeholder
     * @property {string} safeTeamValue - Safe-Team field value for filtering
     */
    
    /**
     * Configuration for all DnA teams
     * @type {Object.<string, TeamConfig>}
     */
    this.dnaTeams = {
      minerva: {
        name: 'Minerva',
        jiraProject: 'ELM',
        boardId: 7437,
        sprintFormat: 'Passport D&A Minerva-{sprint}',
        safeTeamValue: 'Minerva'
      },
      guardians: {
        name: 'Guardians',
        jiraProject: 'ELM',
        boardId: 6704,
        sprintFormat: 'Passport D&A Guardians-{sprint}',
        safeTeamValue: 'Guardians'
      },
      athena: {
        name: 'Athena',
        jiraProject: 'GET',
        boardId: 6798,
        sprintFormat: 'T360 D&A Athena-{sprint}',
        safeTeamValue: 'Athena'
      }
    };

    /**
     * Configuration for all T360 teams
     * @type {Object.<string, TeamConfig>}
     */
    this.t360Teams = {
      vanguards: {
        name: 'Vanguards',
        jiraProject: 'GET',
        boardId: 6794,
        sprintFormat: 'T360 Vanguards-{sprint}',
        safeTeamValues: ['Vanguards', 'T360 Vanguards']
      },
      chargers: {
        name: 'Chargers',
        jiraProject: 'GET',
        boardId: 6784,
        sprintFormat: 'T360 Chargers-{sprint}',
        safeTeamValues: ['Chargers', 'T360 Chargers']
      },
      chubb: {
        name: 'Chubb',
        jiraProject: 'GET',
        boardId: 6793,
        sprintFormat: 'T360 ICD CHUBB-{sprint}',
        safeTeamValues: ['CHUBB', 'T360 CHUBB', 'Chubb', 'T360 Chubb', 'T360 ICD Chubb', 'T360 ICD CHUBB', 'ICD Chubb', 'ICD CHUBB']
      },
      matrix: {
        name: 'Matrix',
        jiraProject: 'GET',
        boardId: 6710,
        sprintFormat: 'T360 MATRIX-{sprint}',
        safeTeamValues: ['MATRIX', 'T360 MATRIX', 'Matrix', 'T360 Matrix']
      },
      mavericks: {
        name: 'Mavericks',
        jiraProject: 'GET',
        boardId: 6457,
        sprintFormat: 'T360 Mavericks-{sprint}',
        safeTeamValues: ['Maverics', 'T360 Maverics', 'Mavericks', 'T360 Mavericks']
      },
      nexus: {
        name: 'Nexus',
        jiraProject: 'GET',
        boardId: 6795,
        sprintFormat: 'T360 Nexus-{sprint}',
        safeTeamValues: ['Nexus', 'T360 Nexus']
      }
    };

    /**
     * Cache storage for bug metrics with timestamps
     * @type {Map<string, {timestamp: number, data: any}>}
     */
    this.cache = new Map();
    
    /**
     * Cache time-to-live in milliseconds (10 minutes)
     * @type {number}
     */
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes in milliseconds
  }

  /**
   * Create authenticated JIRA session headers
   * 
   * @returns {Object} Headers object with authentication and content-type
   * @private
   */
  getHeaders(teamId) {
    // Use product-specific token: DnA teams use DNA token, T360 teams use T360 token, Passport/Collaboration Portal use Passport token
    let token;
    if (teamId && this.isPassportTeam(teamId)) {
      token = this.apiTokenPassport;
    } else if (teamId && !this.isDnaTeam(teamId)) {
      token = this.apiTokenT360;
    } else {
      token = this.apiTokenDna;
    }
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Make authenticated request to JIRA API with retry logic
   * 
   * Automatically retries failed requests up to 3 times with exponential backoff.
   * Supports both GET and POST methods.
   * 
   * @param {string} path - API endpoint path (e.g., '/rest/api/2/search')
   * @param {string} [method='GET'] - HTTP method (GET or POST)
   * @param {Object|null} [body=null] - Request body for POST requests
   * @param {number} [retries=3] - Maximum number of retry attempts
   * @returns {Promise<Object>} Parsed JSON response from JIRA API
   * @throws {JiraError} If all retry attempts fail
   * 
   * @example
   * const results = await service.makeRequest('/rest/api/2/search', 'POST', {
   *   jql: 'project = ELM AND type = Bug',
   *   maxResults: 50
   * });
   */
  async makeRequest(path, method = 'GET', body = null, retries = 3, teamId = null) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this._makeRequestInternal(path, method, body, teamId);
      } catch (error) {
        console.error(`JIRA API attempt ${attempt}/${retries} failed:`, error.message);
        
        // Don't retry authentication or client errors
        if (error instanceof JiraAuthenticationError || 
            error instanceof JiraQueryError ||
            error instanceof UnknownTeamError) {
          throw error;
        }
        
        if (attempt === retries) {
          throw error;
        }
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  /**
   * Internal request method - handles actual HTTP communication
   * 
   * @param {string} path - API endpoint path
   * @param {string} method - HTTP method
   * @param {Object|null} body - Request body
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {JiraAuthenticationError} If authentication fails (401)
   * @throws {JiraQueryError} If JQL query is invalid (400)
   * @throws {JiraResourceNotFoundError} If resource not found (404)
   * @throws {JiraRateLimitError} If rate limit exceeded (429)
   * @throws {JiraTimeoutError} If request times out
   * @throws {JiraError} For other API errors
   * @private
   */
  async _makeRequestInternal(path, method, body, teamId = null) {
    return new Promise((resolve, reject) => {
      // Build the full URL - if jiraUrl already has a path, append to it
      const baseUrl = this.jiraUrl.endsWith('/') ? this.jiraUrl.slice(0, -1) : this.jiraUrl;
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      const fullUrl = `${baseUrl}${fullPath}`;
      
      const url = new URL(fullUrl);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: method,
        headers: this.getHeaders(teamId),
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            // Map status codes to specific error types
            let error;
            switch (res.statusCode) {
              case 401:
              case 403:
                error = new JiraAuthenticationError(`Authentication failed: ${data}`);
                break;
              case 400:
                error = new JiraQueryError(`Bad request: ${data}`, body?.jql);
                break;
              case 404:
                error = new JiraResourceNotFoundError(path);
                break;
              case 429:
                error = new JiraRateLimitError();
                break;
              default:
                error = new JiraError(`JIRA API Error: ${res.statusCode} - ${data}`, res.statusCode);
            }
            reject(error);
          }
        });
      });

      req.on('error', (err) => {
        reject(new JiraError(`Network error: ${err.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new JiraTimeoutError());
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get team configuration by ID from either DnA or T360 teams
   * 
   * @param {string} teamId - Team identifier (e.g., 'minerva', 'vanguards')
   * @returns {Object} Team configuration object
   * @throws {UnknownTeamError} If teamId is not found in either collection
   * @private
   */
  getTeamConfig(teamId) {
    return this.dnaTeams[teamId] || this.t360Teams[teamId] || null;
  }

  /**
   * Check if team is a DnA team (needs cross-project query)
   * 
   * @param {string} teamId - Team identifier
   * @returns {boolean} True if team is in dnaTeams collection
   * @private
   */
  isDnaTeam(teamId) {
    return !!this.dnaTeams[teamId];
  }

  /**
   * Check if a team belongs to Passport or Collaboration Portal product
   * 
   * @param {string} teamId - Team identifier
   * @returns {boolean} True if team is a Passport or Collaboration Portal team
   * @private
   */
  isPassportTeam(teamId) {
    const passportTeamIds = ['team-a', 'team-b', 'team-c'];
    return passportTeamIds.includes(teamId);
  }

  /**
   * Match Safe-Team field value against expected team values
   * 
   * For DnA teams: Simple exact match (e.g., "Minerva")
   * For T360 teams: Flexible matching with optional "T360" prefix and case variations
   * 
   * @param {string|null|undefined} safeTeamValue - Value from customfield_13392
   * @param {string|Array<string>} expectedValues - Expected Safe-Team value(s)
   * @returns {boolean} True if value matches any expected value
   * @private
   */
  matchesSafeTeam(safeTeamValue, expectedValues) {
    if (!safeTeamValue) {
      return false;
    }
    
    // Normalize to array for consistent handling
    const expectedArray = Array.isArray(expectedValues) ? expectedValues : [expectedValues];
    
    // Case-insensitive comparison
    const normalizedValue = safeTeamValue.trim().toUpperCase();
    
    return expectedArray.some(expected => 
      normalizedValue === expected.toUpperCase()
    );
  }

  /**
   * Format sprint name for Jira query based on team configuration
   * 
   * DnA team sprint naming conventions:
   * - Minerva: "Passport D&A Minerva-{sprint}"
   * - Guardians: "Passport D&A Guardians-{sprint}"
   * - Athena: "T360 D&A Athena-{sprint}"
   * 
   * T360 team sprint naming conventions:
   * - Vanguards: "T360 Vanguards-{sprint}"
   * - Chargers: "T360 Chargers-{sprint}"
   * - Chubb: "T360 ICD CHUBB-{sprint}"
   * - Matrix: "T360 MATRIX-{sprint}"
   * - Mavericks: "T360 Mavericks-{sprint}"
   * - Nexus: "T360 Nexus-{sprint}"
   * 
   * @param {string} teamId - Team identifier (minerva, guardians, athena, vanguards, etc.)
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.2" or "26.1.1")
   * @returns {string} Formatted sprint name for Jira query
   * @throws {UnknownTeamError} If teamId is not recognized
   * 
   * @example
   * const dnaSprintName = service.formatSprintName('minerva', '26.1.2');
   * // Returns: "Passport D&A Minerva-26.1.2"
   * 
   * const t360SprintName = service.formatSprintName('vanguards', '26.1.1');
   * // Returns: "T360 Vanguards-26.1.1"
   */
  formatSprintName(teamId, sprintNumber) {
    const team = this.getTeamConfig(teamId);
    if (!team) {
      throw new UnknownTeamError(teamId);
    }
    return team.sprintFormat.replace('{sprint}', sprintNumber);
  }

  /**
   * Get all bugs for a team sprint with cross-project support
   * 
   * DnA teams: Searches primary project and "ELM Tech Ops" project
   * T360 teams: Searches GET project only (no cross-project query)
   * 
   * Applies post-retrieval filtering based on Safe-Team field (customfield_13392)
   * with flexible matching for T360 teams (handles optional "T360" prefix).
   * Results are cached for 10 minutes to improve performance.
   * 
   * Safe-Team Field Structure:
   * - Object format: { value: "TeamName" }
   * - Can be null for TO bugs (DnA teams only - these are included)
   * - Filtering happens after retrieval (not in JQL)
   * 
   * @param {string} teamId - Team identifier (minerva, guardians, athena, vanguards, chargers, etc.)
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.2" or "26.1.1")
   * @returns {Promise<Array<Object>>} Array of bug issues matching team and sprint
   * @throws {UnknownTeamError} If teamId is invalid
   * @throws {JiraError} If API request fails
   * 
   * @example
   * // DnA team: searches ELM + Tech Ops
   * const dnaBugs = await service.getBugsForSprint('athena', '26.1.2');
   * 
   * // T360 team: searches GET only
   * const t360Bugs = await service.getBugsForSprint('vanguards', '26.1.1');
   */
  async getBugsForSprint(teamId, sprintNumber) {
    const team = this.getTeamConfig(teamId);
    if (!team) {
      throw new UnknownTeamError(teamId);
    }

    const sprintName = this.formatSprintName(teamId, sprintNumber);
    const cacheKey = `bugs-${teamId}-${sprintNumber}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      return cached.data;
    }

    console.log(`🔍 Fetching bugs from Jira for ${team.name} sprint ${sprintNumber}...`);

    // Build project clause: DnA teams search primary + Tech Ops, T360 teams search GET only
    let projectClause;
    if (this.isDnaTeam(teamId)) {
      // Multi-project query for DnA teams: primary project AND "ELM Tech Ops" (TO project)
      const toProject = '"ELM Tech Ops"';
      projectClause = team.jiraProject === 'ELM' 
        ? `(project = ELM OR project = ${toProject})`  // Minerva/Guardians
        : `(project = ${team.jiraProject} OR project = ${toProject})`;  // Athena
    } else {
      // Single project query for T360 teams
      projectClause = `project = ${team.jiraProject}`;
    }
    
    const jql = `${projectClause} AND type = Bug AND sprint = "${sprintName}" ORDER BY created DESC`;
    
    console.log(`📋 JQL Query: ${jql}`);

    const allBugs = [];
    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const payload = {
        jql: jql,
        startAt: startAt,
        maxResults: maxResults,
        fields: [
          'key',
          'summary',
          'status',
          'priority',
          'created',
          'updated',
          'resolutiondate',
          this.safeTeamField
        ]
      };

      try {
        const response = await this.makeRequest('/rest/api/2/search', 'POST', payload, 3, teamId);
        const issues = response.issues || [];
        allBugs.push(...issues);

        if (issues.length < maxResults) {
          break;
        }

        startAt += maxResults;
      } catch (err) {
        console.error(`❌ Error fetching bugs: ${err.message}`);
        throw err;
      }
    }

    console.log(`✅ Found ${allBugs.length} bugs (before Safe-Team filtering) for ${team.name} sprint ${sprintNumber}`);

    // Filter by Safe-Team field (post-retrieval filter since it can't be used in JQL)
    // DnA teams: Include TO bugs (missing Safe-Team), exact match for team bugs
    // T360 teams: Flexible matching (handles "T360" prefix, case variations)
    const filteredBugs = allBugs.filter(bug => {
      const safeTeamField = bug.fields[this.safeTeamField];
      // Safe-Team field is an object with 'value' property, or may be undefined
      const safeTeamValue = safeTeamField?.value || safeTeamField;
      
      // If Safe-Team field is missing/null, include only for DnA teams (TO bugs)
      if (!safeTeamValue) {
        const includeToBug = this.isDnaTeam(teamId);
        if (includeToBug) {
          console.log(`  Bug ${bug.key}: Safe-Team missing/null, including (TO bug for DnA team)`);
        } else {
          console.log(`  Bug ${bug.key}: Safe-Team missing/null, excluding (T360 team requires Safe-Team)`);
        }
        return includeToBug;
      }
      
      // Get expected Safe-Team value(s) - DnA uses single value, T360 uses array
      const expectedValues = team.safeTeamValues || team.safeTeamValue;
      const matches = this.matchesSafeTeam(safeTeamValue, expectedValues);
      
      const expectedDisplay = Array.isArray(expectedValues) ? expectedValues.join('|') : expectedValues;
      console.log(`  Bug ${bug.key}: Safe-Team="${safeTeamValue}", Expected="${expectedDisplay}", Match=${matches}`);
      return matches;
    });

    const expectedDisplay = Array.isArray(team.safeTeamValues) ? team.safeTeamValues.join('|') : team.safeTeamValue;
    console.log(`✅ After Safe-Team filter: ${filteredBugs.length} bugs belong to ${team.name} (${expectedDisplay})`);

    // Cache the filtered results
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: filteredBugs
    });

    return filteredBugs;
  }

  /**
   * Detect if a bug has been reopened by analyzing changelog
   * 
   * Examines status transitions in the bug's history to identify reopenings.
   * A reopen is detected when status changes from closed state to open state.
   * 
   * Closed statuses: Closed, Done, Resolved, Fixed
   * Open statuses: Open, To Do, In Progress, Reopened
   * 
   * @param {string} issueKey - Jira issue key (e.g., "ELM-123", "GET-456")
   * @returns {Promise<Object>} Reopened detection result
   * @returns {boolean} returns.reopened - Whether bug was ever reopened
   * @returns {number} returns.reopenCount - Number of times bug was reopened
   * @returns {Array<Object>} returns.reopenHistory - Array of reopen events with date, from, to, author
   * 
   * @example
   * const reopenInfo = await service.detectReopenedBug('ELM-12345');
   * if (reopenInfo.reopened) {
   *   console.log(`Bug reopened ${reopenInfo.reopenCount} times`);
   *   console.log('History:', reopenInfo.reopenHistory);
   * }
   */
  async detectReopenedBug(issueKey, teamId = null) {
    try {
      // Use ?expand=changelog on the issue endpoint (works on all Jira versions)
      // The standalone /changelog endpoint returns 404 on some Jira instances
      const response = await this.makeRequest(
        `/rest/api/2/issue/${issueKey}?expand=changelog&fields=status`,
        'GET', null, 3, teamId
      );
      const histories = response.changelog?.histories || [];

      let reopenCount = 0;
      const reopenHistory = [];
      let previousStatus = null;

      // Closed/Done/Resolved statuses
      const closedStatuses = ['Closed', 'Done', 'Resolved', 'Fixed'];
      // Open statuses (includes To Verify for reopen detection)
      const openStatuses = ['Open', 'To Do', 'In Progress', 'Reopened', 'To Verify'];

      for (const history of histories) {
        for (const item of history.items) {
          if (item.field === 'status') {
            const fromStatus = item.fromString;
            const toStatus = item.toString;
            
            // Detect reopening: transition from closed to open
            if (closedStatuses.includes(fromStatus) && openStatuses.includes(toStatus)) {
              reopenCount++;
              reopenHistory.push({
                date: history.created,
                from: fromStatus,
                to: toStatus,
                author: history.author?.displayName || 'Unknown'
              });
            }
            
            previousStatus = toStatus;
          }
        }
      }

      return {
        reopened: reopenCount > 0,
        reopenCount: reopenCount,
        reopenHistory: reopenHistory
      };
    } catch (err) {
      console.error(`❌ Error detecting reopened status for ${issueKey}:`, err.message);
      return {
        reopened: false,
        reopenCount: 0,
        reopenHistory: []
      };
    }
  }

  /**
   * Calculate bug metrics with reopened detection for a team sprint
   * 
   * Fetches all bugs, analyzes reopen history, and calculates comprehensive metrics.
   * Includes quality indicator based on reopened rate thresholds:
   * - Excellent: ≤5% reopened
   * - Good: 5-10% reopened
   * - Needs Improvement: 10-15% reopened
   * - Poor: >15% reopened
   * 
   * @param {string} teamId - Team identifier (minerva, guardians, or athena)
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.2")
   * @returns {Promise<Object>} Comprehensive bug metrics
   * @returns {string} returns.teamId - Team identifier
   * @returns {string} returns.sprintNumber - Sprint number
   * @returns {number} returns.totalBugs - Total number of bugs
   * @returns {number} returns.openBugs - Number of open bugs
   * @returns {number} returns.closedBugs - Number of closed bugs
   * @returns {number} returns.reopenedBugs - Number of bugs that were reopened
   * @returns {number} returns.reopenedRate - Percentage of bugs that were reopened
   * @returns {string} returns.qualityIndicator - Quality assessment (Excellent/Good/Needs Improvement/Poor)
   * @returns {Array<Object>} returns.bugDetails - Detailed information for each bug
   * @returns {string} returns.fetchedAt - ISO timestamp of when metrics were calculated
   * @returns {number} returns.processingTimeSeconds - Time taken to calculate metrics
   * @throws {Error} If bug fetching or analysis fails
   * 
   * @example
   * const metrics = await service.calculateBugMetrics('minerva', '26.1.2');
   * console.log(`${metrics.totalBugs} bugs, ${metrics.reopenedRate}% reopened`);
   * console.log(`Quality: ${metrics.qualityIndicator}`);
   */
  async calculateBugMetrics(teamId, sprintNumber) {
    const startTime = Date.now();
    
    try {
      const bugs = await this.getBugsForSprint(teamId, sprintNumber);
      
      let totalBugs = bugs.length;
      let openBugs = 0;
      let closedBugs = 0;
      let reopenedBugs = 0;
      const bugDetails = [];

      // Categorize bugs by status
      // Simplified classification: Closed = 'Closed' only, Open = all other statuses
      for (const bug of bugs) {
        const status = bug.fields.status?.name || 'Unknown';
        const normalizedStatus = status.trim().toLowerCase();
        const isClosed = normalizedStatus === 'closed';
        const isOpen = !isClosed;

        if (isOpen) {
          openBugs++;
        } else {
          closedBugs++;
        }

        bugDetails.push({
          key: bug.key,
          summary: bug.fields.summary,
          status: status,
          priority: bug.fields.priority?.name || 'None',
          created: bug.fields.created,
          updated: bug.fields.updated,
          isOpen: isOpen,
          isClosed: isClosed
        });
      }

      // Detect reopened bugs (batch processing for performance)
      console.log(`🔍 Detecting reopened bugs for ${bugs.length} issues...`);
      const reopenPromises = bugs.map(bug => this.detectReopenedBug(bug.key, teamId));
      const reopenResults = await Promise.all(reopenPromises);

      // Update bug details with reopened information
      for (let i = 0; i < bugDetails.length; i++) {
        bugDetails[i].reopened = reopenResults[i].reopened;
        bugDetails[i].reopenCount = reopenResults[i].reopenCount;
        bugDetails[i].reopenHistory = reopenResults[i].reopenHistory;

        if (reopenResults[i].reopened) {
          reopenedBugs++;
        }
      }

      // Calculate reopened rate and quality indicator
      const reopenedRate = totalBugs > 0 ? (reopenedBugs / totalBugs) * 100 : 0;
      let qualityIndicator = 'Excellent';
      
      if (reopenedRate > 15) {
        qualityIndicator = 'Poor';
      } else if (reopenedRate > 10) {
        qualityIndicator = 'Needs Improvement';
      } else if (reopenedRate > 5) {
        qualityIndicator = 'Good';
      }

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Bug metrics calculated in ${elapsedTime}s`);

      return {
        teamId: teamId,
        sprintNumber: sprintNumber,
        totalBugs: totalBugs,
        openBugs: openBugs,
        closedBugs: closedBugs,
        reopenedBugs: reopenedBugs,
        reopenedRate: parseFloat(reopenedRate.toFixed(2)),
        qualityIndicator: qualityIndicator,
        bugDetails: bugDetails,
        fetchedAt: new Date().toISOString(),
        processingTimeSeconds: parseFloat(elapsedTime)
      };
    } catch (err) {
      console.error(`❌ Error calculating bug metrics:`, err.message);
      throw err;
    }
  }

  /**
   * Get bug metrics for all DnA teams for a specific sprint
   * 
   * Fetches metrics for Minerva, Guardians, and Athena teams in parallel.
   * 
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.2")
   * @returns {Promise<Array<Object>>} Array of metrics objects, one per team
   * @throws {Error} If any team's metrics calculation fails
   * 
   * @example
   * const allMetrics = await service.getAllDnATeamMetrics('26.1.2');
   * allMetrics.forEach(m => {
   *   console.log(`${m.teamId}: ${m.totalBugs} bugs`);
   * });
   */
  async getAllDnATeamMetrics(sprintNumber) {
    const teamIds = Object.keys(this.dnaTeams);
    const promises = teamIds.map(teamId => this.calculateBugMetrics(teamId, sprintNumber));
    
    try {
      const results = await Promise.all(promises);
      return results;
    } catch (err) {
      console.error(`❌ Error fetching metrics for all DnA teams:`, err.message);
      throw err;
    }
  }

  /**
   * Get bug metrics for all T360 teams for a specific sprint
   * 
   * Fetches metrics for Vanguards, Chargers, Chubb, Matrix, Mavericks, and Nexus teams in parallel.
   * 
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.1")
   * @returns {Promise<Array<Object>>} Array of metrics objects, one per team
   * @throws {Error} If any team's metrics calculation fails
   * 
   * @example
   * const allMetrics = await service.getAllT360TeamMetrics('26.1.1');
   * allMetrics.forEach(m => {
   *   console.log(`${m.teamId}: ${m.totalBugs} bugs, ${m.openBugs} open`);
   * });
   */
  async getAllT360TeamMetrics(sprintNumber) {
    const teamIds = Object.keys(this.t360Teams);
    const promises = teamIds.map(teamId => this.calculateBugMetrics(teamId, sprintNumber));
    
    try {
      const results = await Promise.all(promises);
      return results;
    } catch (err) {
      console.error(`❌ Error fetching metrics for all T360 teams:`, err.message);
      throw err;
    }
  }

  /**
   * Clear cache (useful for testing or forcing fresh data fetch)
   * 
   * @example
   * service.clearCache(); // Force next fetch to hit Jira API
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ Cache cleared');
  }
}

export default JiraBugService;
