// JIRA Service Module
// Fetches TAD/TS compliance data from JIRA

import https from 'https';

class JiraService {
  constructor() {
    this.jiraUrl = process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || 'GET';
    
    if (!this.apiToken) {
      console.warn('⚠️  JIRA_API_TOKEN not set. JIRA features will not work.');
    }
  }

  /**
   * Create authenticated JIRA session headers
   */
  getHeaders() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    };
  }

  /**
   * Make authenticated request to JIRA API
   */
  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.jiraUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: method,
        headers: this.getHeaders(),
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
            reject(new Error(`JIRA API Error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('JIRA API request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get all issues for a sprint using JQL
   */
  async getSprintIssues(sprintName = null) {
    let jql = `project = ${this.projectKey}`;

    if (sprintName) {
      jql += ` AND sprint = "${sprintName}"`;
    } else {
      jql += ` AND sprint in openSprints()`;
    }

    jql += ` ORDER BY updated DESC`;

    const allIssues = [];
    let startAt = 0;
    const maxResults = 100;

    while (true) {
      const payload = {
        jql: jql,
        startAt: startAt,
        maxResults: maxResults,
        fields: [
          'key', 'summary', 'description', 'issuetype', 'status', 'assignee',
          'customfield_13392', // Team
          'customfield_14391', // Safe-SDLC Activity
          'customfield_10004', 'sprint', // Sprint fields
          'issuelinks'
        ]
      };

      try {
        const response = await this.makeRequest('/rest/api/2/search', 'POST', payload);
        const issues = response.issues || [];
        allIssues.push(...issues);

        if (issues.length < maxResults) {
          break;
        }

        startAt += maxResults;
      } catch (err) {
        console.error(`Error fetching JIRA issues: ${err.message}`);
        break;
      }
    }

    return allIssues;
  }

  /**
   * Check if issue has TAD (Technical Architecture Document)
   */
  checkTAD(issue) {
    const tadKeywords = ['TAD', 'TECHNICAL ARCHITECTURE', 'TECHNICAL DESIGN', 'ADR', 'ARCHITECTURE DECISION'];
    
    const summary = issue.fields?.summary || '';
    const description = issue.fields?.description || '';
    const links = issue.fields?.issuelinks || [];

    // Check PR names in issue links
    for (const link of links) {
      const linkTitle = link.outwardIssue?.key || '';
      for (const keyword of tadKeywords) {
        if (linkTitle.includes(keyword) || linkTitle.toUpperCase().includes(keyword)) {
          return { found: true, source: 'PR', details: linkTitle };
        }
      }
    }

    // Check description field
    const fullText = (summary + ' ' + description).toUpperCase();
    for (const keyword of tadKeywords) {
      if (fullText.includes(keyword)) {
        return { found: true, source: 'Description', details: keyword };
      }
    }

    return { found: false, source: null, details: null };
  }

  /**
   * Check if issue has TS (Test Strategy)
   */
  checkTS(issue) {
    const tsKeywords = ['TS FOR', 'TEST STRATEGY', 'TEST PLAN', 'TESTING STRATEGY', 'QA STRATEGY'];
    
    const summary = issue.fields?.summary || '';
    const description = issue.fields?.description || '';
    const links = issue.fields?.issuelinks || [];

    // Check PR names (but exclude "TS FILE")
    for (const link of links) {
      const linkTitle = (link.outwardIssue?.key || '').toUpperCase();
      // Skip "TS FILE"
      if (linkTitle.includes('TS FILE')) continue;
      
      for (const keyword of tsKeywords) {
        if (linkTitle.includes(keyword)) {
          return { found: true, source: 'PR', details: linkTitle };
        }
      }
    }

    // Check description field
    const fullText = (summary + ' ' + description).toUpperCase();
    for (const keyword of tsKeywords) {
      if (fullText.includes(keyword)) {
        return { found: true, source: 'Description', details: keyword };
      }
    }

    return { found: false, source: null, details: null };
  }

  /**
   * Analyze TAD/TS compliance for all issues in sprint
   */
  async analyzeSprintCompliance(sprintName = null) {
    try {
      const issues = await this.getSprintIssues(sprintName);

      // Filter to Bug and Story types only
      const filteredIssues = issues.filter(issue => {
        const issueType = issue.fields?.issuetype?.name || '';
        return ['Bug', 'Story'].includes(issueType);
      });

      // Analyze each issue
      const analysis = {
        total: filteredIssues.length,
        tadComplete: 0,
        tsComplete: 0,
        bothComplete: 0,
        missingTad: 0,
        missingTs: 0,
        tadNA: 0,
        tsNA: 0,
        teamBreakdown: {},
        issues: []
      };

      for (const issue of filteredIssues) {
        const team = issue.fields?.customfield_13392?.[0]?.value || 'Unknown';
        const tad = this.checkTAD(issue);
        const ts = this.checkTS(issue);

        // Initialize team if not exists
        if (!analysis.teamBreakdown[team]) {
          analysis.teamBreakdown[team] = {
            total: 0,
            tadComplete: 0,
            tsComplete: 0,
            bothComplete: 0,
            missingTad: 0,
            missingTs: 0
          };
        }

        analysis.teamBreakdown[team].total++;

        if (tad.found) analysis.tadComplete++;
        else analysis.missingTad++;

        if (ts.found) analysis.tsComplete++;
        else analysis.missingTs++;

        if (tad.found && ts.found) analysis.bothComplete++;

        // Update team breakdown
        if (tad.found) analysis.teamBreakdown[team].tadComplete++;
        else analysis.teamBreakdown[team].missingTad++;

        if (ts.found) analysis.teamBreakdown[team].tsComplete++;
        else analysis.teamBreakdown[team].missingTs++;

        // Add issue details
        analysis.issues.push({
          key: issue.key,
          summary: issue.fields?.summary,
          team: team,
          status: issue.fields?.status?.name,
          tad: tad,
          ts: ts
        });
      }

      // Calculate percentages
      analysis.tadPct = filteredIssues.length > 0 ? (analysis.tadComplete / filteredIssues.length * 100).toFixed(2) : 0;
      analysis.tsPct = filteredIssues.length > 0 ? (analysis.tsComplete / filteredIssues.length * 100).toFixed(2) : 0;
      analysis.bothPct = filteredIssues.length > 0 ? (analysis.bothComplete / filteredIssues.length * 100).toFixed(2) : 0;

      return analysis;
    } catch (err) {
      console.error(`Error analyzing sprint compliance: ${err.message}`);
      throw err;
    }
  }
}

export default JiraService;
