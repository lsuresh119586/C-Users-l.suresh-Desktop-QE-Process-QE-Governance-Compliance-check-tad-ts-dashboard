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
    this.apiTokenPassportCpod = process.env.JIRA_API_TOKEN_PASSPORT_CPOD || this.apiTokenPassport;
    this.safeTeamField = 'customfield_13392';
    this.safeProductField = process.env.JIRA_SAFE_PRODUCT_FIELD || 'customfield_13790';
    this.safeProductFieldCandidates = [this.safeProductField, 'Safe-Product', 'SAFe-Product'];
    this.cpodOpenStatusSet = ['NEW', 'ANALYZE', 'PRE-REFINEMENT', 'RE-FINEMENT', 'REFINED', 'IN PROGRESS', 'CODE COMPLETE', 'TO VERIFY'];
    this.cpodAllowedDateFields = new Set(['created']);
    this.discoveredSafeProductField = null;
    this.lastCpodQueryContext = {
      safeTeamFilterApplied: null,
      safeProductFilterApplied: null,
      cpodFilterMode: null
    };
    
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
     * Configuration for all Passport teams
     * @type {Object.<string, TeamConfig>}
     */
    this.passportTeams = {
      'pp-genesis': {
        name: 'PP Genesis',
        jiraProject: 'ELM',
        boardId: null,
        sprintFormat: '{sprint}',
        safeTeamValues: ['PP Genesis']
      },
      'pp-pioneers': {
        name: 'PP Pioneers',
        jiraProject: 'ELM',
        boardId: null,
        sprintFormat: '{sprint}',
        safeTeamValues: ['PP Pioneers']
      },
      'pp-spartacles': {
        name: 'PP Spartacles',
        jiraProject: 'ELM',
        boardId: null,
        sprintFormat: '{sprint}',
        safeTeamValues: ['PP Spartacles']
      },
      'cpod': {
        name: 'CPOD',
        jiraProject: 'ELM',
        boardId: null,
        sprintFormat: '{sprint}',
        safeTeamValues: ['CPOD']
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

  formatJqlField(fieldName) {
    if (!fieldName) {
      return '';
    }

    if (/^customfield_\d+$/i.test(fieldName)) {
      return fieldName;
    }

    if (fieldName.startsWith('"') && fieldName.endsWith('"')) {
      return fieldName;
    }

    return `"${fieldName}"`;
  }

  getSafeProductFieldCandidates() {
    const source = [
      ...(this.discoveredSafeProductField ? [this.discoveredSafeProductField] : []),
      ...this.safeProductFieldCandidates
    ];

    const uniqueCandidates = [];
    const seen = new Set();
    for (const candidate of source) {
      const normalized = String(candidate || '').trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueCandidates.push(normalized);
    }

    return uniqueCandidates;
  }

  isMissingJiraFieldError(error, fieldName) {
    const message = String(error?.message || '').toLowerCase();
    const normalizedField = String(fieldName || '').replace(/"/g, '').toLowerCase();
    return message.includes('does not exist') && message.includes(normalizedField);
  }

  async discoverSafeProductField() {
    try {
      const fields = await this.makeRequest('/rest/api/2/field', 'GET', null, 1, 'cpod');
      if (!Array.isArray(fields)) {
        return null;
      }

      const safeProductField = fields.find((field) => {
        const name = String(field?.name || '').toLowerCase();
        return name.includes('safe product') || name.includes('safe-product');
      });

      if (safeProductField?.id) {
        this.discoveredSafeProductField = safeProductField.id;
        return safeProductField.id;
      }
    } catch (error) {
      console.warn(`⚠️  Unable to auto-discover Safe-Product field: ${error.message}`);
    }

    return null;
  }

  /**
   * Create authenticated JIRA session headers
   * 
   * @returns {Object} Headers object with authentication and content-type
   * @private
   */
  getHeaders(teamId) {
    // Use product/team-specific token selection.
    // DnA teams use DNA token, T360 teams use T360 token, Passport/Collaboration Portal use Passport token,
    // and Passport+CPOD can use a dedicated token when configured.
    let token;
    let tokenSource;
    if (teamId && this.isPassportTeam(teamId)) {
      const normalizedTeamId = String(teamId).trim().toLowerCase();
      if (normalizedTeamId === 'cpod') {
        token = this.apiTokenPassportCpod;
        tokenSource = 'passport_cpod';
      } else {
        token = this.apiTokenPassport;
        tokenSource = 'passport';
      }
    } else if (teamId && !this.isDnaTeam(teamId)) {
      token = this.apiTokenT360;
      tokenSource = 't360';
    } else {
      token = this.apiTokenDna;
      tokenSource = 'dna';
    }

    if (process.env.JIRA_DEBUG_TOKEN_SOURCE === 'true') {
      console.log(`🔐 Jira token source selected: ${tokenSource} (team=${teamId || 'n/a'})`);
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
    return this.dnaTeams[teamId] || this.t360Teams[teamId] || this.passportTeams[teamId] || null;
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
    return !!this.passportTeams[teamId];
  }

  /**
   * Maps Jira priority name to a Severity label (Sev 1 – Sev 4).
   *
   * Mapping:
   *   Critical / Highest → Sev 1
   *   High               → Sev 2
   *   Medium / Normal     → Sev 3
   *   Low / Lowest / None → Sev 4
   *
   * @param {string|undefined} priorityName - Jira priority name
   * @returns {string} Severity label, e.g. "Sev 1"
   */
  mapPriorityToSeverity(priorityName) {
    const p = (priorityName || '').toLowerCase();
    if (p === 'critical' || p === 'highest') return 'Sev 1';
    if (p === 'high') return 'Sev 2';
    if (p === 'medium' || p === 'normal') return 'Sev 3';
    return 'Sev 4';
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

    // Build project clause: DnA teams search primary + Tech Ops, T360 teams search GET only, Passport teams search ELM with SAFe Team filter
    let projectClause;
    let jql;
    if (teamId === 'cpod') {
      // CPOD team: ELM project, type Bug, sprint-based, no SAFe Team filter (CPOD is not a SAFe Team option)
      jql = `project = ELM AND type = Bug AND Sprint in ('${sprintNumber}') AND status NOT IN ('New') ORDER BY created DESC`;
    } else if (this.isPassportTeam(teamId)) {
      // Passport teams: ELM project with SAFe Team filtering in JQL and Sprint by number
      const safeTeamValues = team.safeTeamValues || [team.safeTeamValue];
      const teamFilter = safeTeamValues.map(t => `'${t}'`).join(', ');
      jql = `project = ELM AND type = Bug AND cf[13392] in (${teamFilter}) AND Sprint in ('${sprintNumber}') AND status NOT IN ('New') ORDER BY created DESC`;
    } else if (this.isDnaTeam(teamId)) {
      // Multi-project query for DnA teams: primary project AND "ELM Tech Ops" (TO project)
      const toProject = '"ELM Tech Ops"';
      projectClause = team.jiraProject === 'ELM' 
        ? `(project = ELM OR project = ${toProject})`  // Minerva/Guardians
        : `(project = ${team.jiraProject} OR project = ${toProject})`;  // Athena
      jql = `${projectClause} AND type = Bug AND sprint = "${sprintName}" ORDER BY created DESC`;
    } else {
      // Single project query for T360 teams
      projectClause = `project = ${team.jiraProject}`;
      jql = `${projectClause} AND type = Bug AND sprint = "${sprintName}" ORDER BY created DESC`;
    }
    
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
      // Passport teams already filter by SAFe Team in JQL, so exclude null Safe-Team
      if (!safeTeamValue) {
        const includeToBug = this.isDnaTeam(teamId);
        if (includeToBug) {
          console.log(`  Bug ${bug.key}: Safe-Team missing/null, including (TO bug for DnA team)`);
        } else {
          console.log(`  Bug ${bug.key}: Safe-Team missing/null, excluding (${this.isPassportTeam(teamId) ? 'Passport' : 'T360'} team requires Safe-Team)`);
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
      // Classification: Closed/Resolved/Done/Fixed = closed, everything else = open
      const closedStatusSet = new Set(['closed', 'done', 'resolved', 'fixed', 'verified']);
      for (const bug of bugs) {
        const status = bug.fields.status?.name || 'Unknown';
        const normalizedStatus = status.trim().toLowerCase();
        const isClosed = closedStatusSet.has(normalizedStatus);
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
          severity: this.mapPriorityToSeverity(bug.fields.priority?.name),
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
   * Get CPOD Closed Cards issues within a date range.
   *
   * FR-3 Mandatory filters applied in JQL:
   * - Project = "ELM Tech Ops"
   * - Issue Type = Bug
   * - Engagement Reason = Troubleshooting
  * - Safe-Product IN (Oasis, Passport)
   * - Safe-Team IN (CPOD 1, Passport Support, CPOD 3, CPOD 2)
   * - Status transition CHANGED FROM "To Verify" TO "Resolved"
   *
   * FR-4 Date rule:
   * - Transition timestamp filtered DURING (startDate, endDate)
   *
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>>} Array of Jira issues matching CPOD Closed Cards criteria
   */
  async getBugsForDateRange(startDate, endDate) {
    const cacheKey = `bugs-cpod-${startDate}-${endDate}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      console.log(`\u2705 Cache hit for ${cacheKey}`);
      this.lastCpodQueryContext = cached.cpodQueryContext || {
        safeTeamFilterApplied: null,
        safeProductFilterApplied: null,
        cpodFilterMode: null
      };
      return cached.data;
    }

    console.log(`\ud83d\udd0d Fetching CPOD bugs by date range: ${startDate} to ${endDate}`);

    const fetchByJql = async (jql, tokenSource = 'cpod') => {
      console.log(`\ud83d\udccb JQL Query: ${jql}`);

      const allBugs = [];
      let startAt = 0;
      const maxResults = 50;

      while (true) {
        const payload = {
          jql,
          startAt,
          maxResults,
          fields: ['key', 'summary', 'status', 'priority', 'created', 'updated', 'assignee', 'reporter', 'components', 'labels']
        };

        const response = await this.makeRequest('/rest/api/2/search', 'POST', payload, 3, tokenSource);
        const issues = response.issues || [];
        allBugs.push(...issues);

        if (issues.length < maxResults) break;
        startAt += maxResults;
      }

      return allBugs;
    };

    const fetchBySafeProductField = async (safeProductFieldName, tokenSource = 'cpod') => {
      const safeProductField = this.formatJqlField(safeProductFieldName);
      const jql = `project = "ELM Tech Ops" AND issuetype = Bug AND "Engagement Reason" = Troubleshooting AND ${safeProductField} in (Oasis, Passport) AND "Safe-Team" in ("CPOD 1","Passport Support","CPOD 3","CPOD 2") AND status CHANGED FROM "To Verify" TO Resolved DURING ("${startDate}","${endDate}") ORDER BY created DESC`;
      return fetchByJql(jql, tokenSource);
    };

    const fetchByLegacyCpodQuery = async () => {
      const jql = `project = "ELM Tech Ops" AND issuetype = Bug AND "Engagement Reason" = Troubleshooting AND "Safe-Team" in ("CPOD 1","Passport Support","CPOD 3","CPOD 2") AND status CHANGED FROM "To Verify" TO Resolved DURING ("${startDate}","${endDate}") ORDER BY created DESC`;
      return fetchByJql(jql, 'cpod');
    };

    const candidates = this.getSafeProductFieldCandidates();
    let lastError = null;
    let safeProductFieldUnavailable = false;
    const canTryPassportTokenForCpod = Boolean(this.apiTokenPassport && this.apiTokenPassportCpod && this.apiTokenPassport !== this.apiTokenPassportCpod);

    for (const candidate of candidates) {
      try {
        const allBugs = await fetchBySafeProductField(candidate, 'cpod');
        console.log(`\u2705 Found ${allBugs.length} CPOD bugs for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, candidate)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`\u26a0\ufe0f  CPOD token cannot query Safe-Product field '${candidate}'. Retrying strict query with Passport token...`);
              const allBugs = await fetchBySafeProductField(candidate, 'passport');
              console.log(`\u2705 Found ${allBugs.length} CPOD bugs for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, candidate)) {
                console.error(`\u274c Error fetching CPOD bugs by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }

          safeProductFieldUnavailable = true;
          console.warn(`\u26a0\ufe0f  CPOD Safe-Product field '${candidate}' unavailable. Trying next candidate...`);
          continue;
        }
        console.error(`\u274c Error fetching CPOD bugs by date range: ${err.message}`);
        throw err;
      }
    }

    const discoveredField = await this.discoverSafeProductField();
    if (discoveredField && !candidates.includes(discoveredField)) {
      try {
        const allBugs = await fetchBySafeProductField(discoveredField, 'cpod');
        console.log(`\u2705 Found ${allBugs.length} CPOD bugs for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, discoveredField)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`\u26a0\ufe0f  CPOD token cannot query discovered Safe-Product field '${discoveredField}'. Retrying strict query with Passport token...`);
              const allBugs = await fetchBySafeProductField(discoveredField, 'passport');
              console.log(`\u2705 Found ${allBugs.length} CPOD bugs for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, discoveredField)) {
                console.error(`\u274c Error fetching CPOD bugs by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }
          safeProductFieldUnavailable = true;
        }
      }
    }

    if (safeProductFieldUnavailable) {
      try {
        console.warn('\u26a0\ufe0f  Safe-Product field unavailable. Falling back to legacy CPOD query for compatibility.');
        const allBugs = await fetchByLegacyCpodQuery();
        console.log(`\u2705 Found ${allBugs.length} CPOD bugs using legacy fallback for ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: false,
          cpodFilterMode: 'fallback_without_safe_product'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (legacyErr) {
        lastError = legacyErr;
      }
    }

    console.error(`\u274c Error fetching CPOD bugs by date range: ${lastError?.message || 'Unknown Jira field error'}`);
    throw (lastError || new Error('Unable to resolve Safe-Product field for CPOD query'));
  }

  /**
   * Get CPOD Open Cards issues within a date range.
   *
   * FR-3 Mandatory filters applied in JQL:
   * - Project = "ELM Tech Ops"
   * - Issue Type = Bug
   * - Engagement Reason = Troubleshooting
  * - Safe-Product IN (Oasis, Passport)
   * - Safe-Team IN (CPOD 1, Passport Support, CPOD 3, CPOD 2)
  * - Status IN (NEW, ANALYZE, PRE-REFINEMENT, RE-FINEMENT, REFINED, IN PROGRESS, CODE COMPLETE, TO VERIFY)
   *
  * FR-4 Date rule:
  * - Date filtering uses issue created timestamp
   *
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} dateField - Jira date field to filter by (default: created)
   * @returns {Promise<Array<Object>>} Array of Jira issues matching CPOD Open Cards criteria
   */
  async getOpenCardsForDateRange(startDate, endDate, dateField = 'created') {
    const normalizedDateField = String(dateField || 'created').trim().toLowerCase();
    const effectiveDateField = this.cpodAllowedDateFields.has(normalizedDateField)
      ? normalizedDateField
      : 'created';
    const statusClause = this.cpodOpenStatusSet.map((status) => `"${status}"`).join(',');

    const cacheKey = `bugs-cpod-open-${effectiveDateField}-${startDate}-${endDate}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      this.lastCpodQueryContext = cached.cpodQueryContext || {
        safeTeamFilterApplied: null,
        safeProductFilterApplied: null,
        cpodFilterMode: null
      };
      return cached.data;
    }

    console.log(`🔍 Fetching CPOD open cards by date range: ${startDate} to ${endDate} (${effectiveDateField})`);

    const fetchByJql = async (jql, tokenSource = 'cpod') => {
      console.log(`📋 JQL Query: ${jql}`);

      const allBugs = [];
      let startAt = 0;
      const maxResults = 50;

      while (true) {
        const payload = {
          jql,
          startAt,
          maxResults,
          fields: ['key', 'summary', 'status', 'priority', 'created', 'updated', 'assignee', 'reporter', 'components', 'labels']
        };

        const response = await this.makeRequest('/rest/api/2/search', 'POST', payload, 3, tokenSource);
        const issues = response.issues || [];
        allBugs.push(...issues);

        if (issues.length < maxResults) break;
        startAt += maxResults;
      }

      return allBugs;
    };

    const fetchBySafeProductField = async (safeProductFieldName, tokenSource = 'cpod') => {
      const safeProductField = this.formatJqlField(safeProductFieldName);
      const jql = `project = "ELM Tech Ops" AND issuetype = Bug AND "Engagement Reason" = Troubleshooting AND ${safeProductField} in (Oasis, Passport) AND "Safe-Team" in ("CPOD 1","Passport Support","CPOD 3","CPOD 2") AND status in (${statusClause}) AND ${effectiveDateField} >= "${startDate}" AND ${effectiveDateField} <= "${endDate}" ORDER BY ${effectiveDateField} DESC`;
      return fetchByJql(jql, tokenSource);
    };

    const fetchByLegacyCpodQuery = async () => {
      const jql = `project = "ELM Tech Ops" AND issuetype = Bug AND "Engagement Reason" = Troubleshooting AND "Safe-Team" in ("CPOD 1","Passport Support","CPOD 3","CPOD 2") AND status in (${statusClause}) AND ${effectiveDateField} >= "${startDate}" AND ${effectiveDateField} <= "${endDate}" ORDER BY ${effectiveDateField} DESC`;
      return fetchByJql(jql, 'cpod');
    };

    const candidates = this.getSafeProductFieldCandidates();
    let lastError = null;
    let safeProductFieldUnavailable = false;
    const canTryPassportTokenForCpod = Boolean(this.apiTokenPassport && this.apiTokenPassportCpod && this.apiTokenPassport !== this.apiTokenPassportCpod);

    for (const candidate of candidates) {
      try {
        const allBugs = await fetchBySafeProductField(candidate, 'cpod');
        console.log(`✅ Found ${allBugs.length} CPOD open cards for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'open_strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, candidate)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`⚠️  CPOD token cannot query Safe-Product field '${candidate}'. Retrying strict open-card query with Passport token...`);
              const allBugs = await fetchBySafeProductField(candidate, 'passport');
              console.log(`✅ Found ${allBugs.length} CPOD open cards for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'open_strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, candidate)) {
                console.error(`❌ Error fetching CPOD open cards by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }

          safeProductFieldUnavailable = true;
          console.warn(`⚠️  CPOD Safe-Product field '${candidate}' unavailable. Trying next candidate...`);
          continue;
        }
        console.error(`❌ Error fetching CPOD open cards by date range: ${err.message}`);
        throw err;
      }
    }

    const discoveredField = await this.discoverSafeProductField();
    if (discoveredField && !candidates.includes(discoveredField)) {
      try {
        const allBugs = await fetchBySafeProductField(discoveredField, 'cpod');
        console.log(`✅ Found ${allBugs.length} CPOD open cards for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'open_strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, discoveredField)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`⚠️  CPOD token cannot query discovered Safe-Product field '${discoveredField}'. Retrying strict open-card query with Passport token...`);
              const allBugs = await fetchBySafeProductField(discoveredField, 'passport');
              console.log(`✅ Found ${allBugs.length} CPOD open cards for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'open_strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, discoveredField)) {
                console.error(`❌ Error fetching CPOD open cards by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }
          safeProductFieldUnavailable = true;
        }
      }
    }

    if (safeProductFieldUnavailable) {
      try {
        console.warn('⚠️  Safe-Product field unavailable. Falling back to legacy CPOD open-card query for compatibility.');
        const allBugs = await fetchByLegacyCpodQuery();
        console.log(`✅ Found ${allBugs.length} CPOD open cards using legacy fallback for ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: false,
          cpodFilterMode: 'open_fallback_without_safe_product'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (legacyErr) {
        lastError = legacyErr;
      }
    }

    console.error(`❌ Error fetching CPOD open cards by date range: ${lastError?.message || 'Unknown Jira field error'}`);
    throw (lastError || new Error('Unable to resolve Safe-Product field for CPOD open-card query'));
  }

  /**
   * Get CPOD ReOpened Cards issues within a date range.
   *
   * FR-3 Mandatory filters applied in JQL:
   * - Project = "ELM Tech Ops"
   * - Issue Type = Bug
   * - Engagement Reason = Troubleshooting
   * - Safe-Product IN (Oasis, Passport)
   * - Safe-Team IN (CPOD 1, Passport Support, CPOD 3, CPOD 2)
   * - Status transition CHANGED FROM Closed TO New
   *
   * FR-4 Date rule:
   * - Transition timestamp filtered DURING (startDate, endDate)
   * - Jira server timezone semantics are used by JQL DURING
   *
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>>} Array of Jira issues matching CPOD ReOpened Cards criteria
   */
  async getReopenedCardsForDateRange(startDate, endDate) {
    const cacheKey = `bugs-cpod-reopened-${startDate}-${endDate}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
      console.log(`✅ Cache hit for ${cacheKey}`);
      this.lastCpodQueryContext = cached.cpodQueryContext || {
        safeTeamFilterApplied: null,
        safeProductFilterApplied: null,
        cpodFilterMode: null
      };
      return cached.data;
    }

    console.log(`🔍 Fetching CPOD reopened cards by date range: ${startDate} to ${endDate}`);

    const fetchByJql = async (jql, tokenSource = 'cpod') => {
      console.log(`📋 JQL Query: ${jql}`);

      const allBugs = [];
      let startAt = 0;
      const maxResults = 50;

      while (true) {
        const payload = {
          jql,
          startAt,
          maxResults,
          fields: ['key', 'summary', 'status', 'priority', 'created', 'updated', 'assignee', 'reporter', 'components', 'labels']
        };

        const response = await this.makeRequest('/rest/api/2/search', 'POST', payload, 3, tokenSource);
        const issues = response.issues || [];
        allBugs.push(...issues);

        if (issues.length < maxResults) break;
        startAt += maxResults;
      }

      return allBugs;
    };

    const fetchBySafeProductField = async (safeProductFieldName, tokenSource = 'cpod') => {
      const safeProductField = this.formatJqlField(safeProductFieldName);
      const jql = `project = "ELM Tech Ops" AND issuetype = Bug AND "Engagement Reason" = Troubleshooting AND ${safeProductField} in (Oasis, Passport) AND "Safe-Team" in ("CPOD 1","Passport Support","CPOD 3","CPOD 2") AND ((status CHANGED FROM Closed TO New DURING ("${startDate}","${endDate}")) OR (status CHANGED FROM Closed TO "NEW" DURING ("${startDate}","${endDate}"))) ORDER BY created DESC`;
      return fetchByJql(jql, tokenSource);
    };

    const candidates = this.getSafeProductFieldCandidates();
    let lastError = null;
    const canTryPassportTokenForCpod = Boolean(this.apiTokenPassport && this.apiTokenPassportCpod && this.apiTokenPassport !== this.apiTokenPassportCpod);

    for (const candidate of candidates) {
      try {
        const allBugs = await fetchBySafeProductField(candidate, 'cpod');
        console.log(`✅ Found ${allBugs.length} CPOD reopened cards for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'reopen_strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, candidate)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`⚠️  CPOD token cannot query Safe-Product field '${candidate}'. Retrying strict reopened-card query with Passport token...`);
              const allBugs = await fetchBySafeProductField(candidate, 'passport');
              console.log(`✅ Found ${allBugs.length} CPOD reopened cards for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'reopen_strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, candidate)) {
                console.error(`❌ Error fetching CPOD reopened cards by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }

          console.warn(`⚠️  CPOD Safe-Product field '${candidate}' unavailable. Trying next candidate...`);
          continue;
        }
        console.error(`❌ Error fetching CPOD reopened cards by date range: ${err.message}`);
        throw err;
      }
    }

    const discoveredField = await this.discoverSafeProductField();
    if (discoveredField && !candidates.includes(discoveredField)) {
      try {
        const allBugs = await fetchBySafeProductField(discoveredField, 'cpod');
        console.log(`✅ Found ${allBugs.length} CPOD reopened cards for date range ${startDate} to ${endDate}`);
        this.lastCpodQueryContext = {
          safeTeamFilterApplied: true,
          safeProductFilterApplied: true,
          cpodFilterMode: 'reopen_strict'
        };
        this.cache.set(cacheKey, {
          data: allBugs,
          timestamp: Date.now(),
          cpodQueryContext: this.lastCpodQueryContext
        });
        return allBugs;
      } catch (err) {
        lastError = err;
        if (this.isMissingJiraFieldError(err, discoveredField)) {
          if (canTryPassportTokenForCpod) {
            try {
              console.warn(`⚠️  CPOD token cannot query discovered Safe-Product field '${discoveredField}'. Retrying strict reopened-card query with Passport token...`);
              const allBugs = await fetchBySafeProductField(discoveredField, 'passport');
              console.log(`✅ Found ${allBugs.length} CPOD reopened cards for date range ${startDate} to ${endDate} (strict via Passport token)`);
              this.lastCpodQueryContext = {
                safeTeamFilterApplied: true,
                safeProductFilterApplied: true,
                cpodFilterMode: 'reopen_strict'
              };
              this.cache.set(cacheKey, {
                data: allBugs,
                timestamp: Date.now(),
                cpodQueryContext: this.lastCpodQueryContext
              });
              return allBugs;
            } catch (passportErr) {
              lastError = passportErr;
              if (!this.isMissingJiraFieldError(passportErr, discoveredField)) {
                console.error(`❌ Error fetching CPOD reopened cards by date range with Passport token: ${passportErr.message}`);
                throw passportErr;
              }
            }
          }
        }
      }
    }

    console.error(`❌ Error fetching CPOD reopened cards by date range: ${lastError?.message || 'Unknown Jira field error'}`);
    throw (lastError || new Error('Unable to resolve Safe-Product field for CPOD reopened-card query'));
  }

  /**
  * Calculate CPOD metrics for date-range mode.
   *
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} Bug metrics object
   */
  async calculateBugMetricsByDateRange(startDate, endDate) {
    const startTime = Date.now();
    try {
      const bugs = await this.getBugsForDateRange(startDate, endDate);
      let openCardsCount = 0;
      let openCardsFallbackApplied = false;
      let reOpenedCardsCount = 0;
      let reOpenedCardsFallbackApplied = false;
      try {
        const openCards = await this.getOpenCardsForDateRange(startDate, endDate, 'created');
        openCardsCount = Array.isArray(openCards) ? openCards.length : 0;
      } catch (openCardsError) {
        openCardsFallbackApplied = true;
        console.warn(`⚠️  Failed to fetch CPOD open cards for date range ${startDate} to ${endDate}. Using fallback openCardsCount=0.`, openCardsError?.message || openCardsError);
      }
      try {
        const reopenedCards = await this.getReopenedCardsForDateRange(startDate, endDate);
        const uniqueReopenedIssueKeys = new Set();
        if (Array.isArray(reopenedCards)) {
          reopenedCards.forEach((issue) => {
            const issueKey = String(issue?.key || '').trim();
            if (issueKey) {
              uniqueReopenedIssueKeys.add(issueKey);
            }
          });
        }
        reOpenedCardsCount = uniqueReopenedIssueKeys.size;
      } catch (reopenedCardsError) {
        reOpenedCardsFallbackApplied = true;
        console.warn(`⚠️  Failed to fetch CPOD reopened cards for date range ${startDate} to ${endDate}. Using fallback reOpenedCardsCount=0.`, reopenedCardsError?.message || reopenedCardsError);
      }
      const uniqueBugs = [];
      const seenIssueKeys = new Set();
      for (const bug of bugs) {
        if (!seenIssueKeys.has(bug.key)) {
          seenIssueKeys.add(bug.key);
          uniqueBugs.push(bug);
        }
      }
      const closedCardsCount = uniqueBugs.length;

      let totalBugs = closedCardsCount;
      let openBugs = 0;
      let closedBugs = 0;
      let reopenedBugs = 0;
      const bugDetails = [];

      const closedStatusSet = new Set(['closed', 'done', 'resolved', 'fixed', 'verified']);
      for (const bug of uniqueBugs) {
        const status = bug.fields.status?.name || 'Unknown';
        const normalizedStatus = status.trim().toLowerCase();
        const isClosed = closedStatusSet.has(normalizedStatus);
        const isOpen = !isClosed;
        if (isOpen) openBugs++; else closedBugs++;

        bugDetails.push({
          key: bug.key,
          summary: bug.fields.summary,
          status: status,
          severity: this.mapPriorityToSeverity(bug.fields.priority?.name),
          priority: bug.fields.priority?.name || 'None',
          created: bug.fields.created,
          updated: bug.fields.updated,
          isOpen: isOpen,
          isClosed: isClosed
        });
      }

      // Detect reopened bugs
      console.log(`\ud83d\udd0d Detecting reopened bugs for ${uniqueBugs.length} CPOD issues...`);
      const reopenPromises = uniqueBugs.map(bug => this.detectReopenedBug(bug.key, 'cpod'));
      const reopenResults = await Promise.all(reopenPromises);
      for (let i = 0; i < bugDetails.length; i++) {
        bugDetails[i].reopened = reopenResults[i].reopened;
        bugDetails[i].reopenCount = reopenResults[i].reopenCount;
        bugDetails[i].reopenHistory = reopenResults[i].reopenHistory;
        if (reopenResults[i].reopened) reopenedBugs++;
      }

      const reopenedRate = totalBugs > 0 ? (reopenedBugs / totalBugs) * 100 : 0;
      let qualityIndicator = 'Excellent';
      if (reopenedRate > 15) qualityIndicator = 'Poor';
      else if (reopenedRate > 10) qualityIndicator = 'Needs Improvement';
      else if (reopenedRate > 5) qualityIndicator = 'Good';

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\u2705 CPOD date-range bug metrics calculated in ${elapsedTime}s: ${totalBugs} total, ${openBugs} open, ${closedBugs} closed`);

      return {
        teamId: 'cpod',
        dateRange: { startDate, endDate },
        closedCardsCount,
        openCardsCount,
        openCardsFallbackApplied,
        reOpenedCardsCount,
        reOpenedCardsFallbackApplied,
        safeTeamFilterApplied: this.lastCpodQueryContext?.safeTeamFilterApplied ?? null,
        safeProductFilterApplied: this.lastCpodQueryContext?.safeProductFilterApplied ?? null,
        cpodFilterMode: this.lastCpodQueryContext?.cpodFilterMode ?? null,
        totalBugs,
        openBugs,
        closedBugs,
        reopenedBugs,
        reopenedRate: parseFloat(reopenedRate.toFixed(2)),
        qualityIndicator,
        bugDetails,
        fetchedAt: new Date().toISOString(),
        processingTimeSeconds: parseFloat(elapsedTime)
      };
    } catch (err) {
      console.error(`\u274c Error calculating CPOD date-range bug metrics:`, err.message);
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
   * Get bug metrics for all Passport teams for a specific sprint
   * 
   * Fetches metrics for PP Genesis, PP Pioneers, and PP Spartacles in parallel.
   * 
   * @param {string} sprintNumber - Sprint number (e.g., "26.1.1")
   * @returns {Promise<Array<Object>>} Array of metrics objects, one per team
   * @throws {Error} If any team's metrics calculation fails
   */
  async getAllPassportTeamMetrics(sprintNumber) {
    const teamIds = Object.keys(this.passportTeams);
    const promises = teamIds.map(teamId => this.calculateBugMetrics(teamId, sprintNumber));
    
    try {
      const results = await Promise.all(promises);
      return results;
    } catch (err) {
      console.error(`❌ Error fetching metrics for all Passport teams:`, err.message);
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
