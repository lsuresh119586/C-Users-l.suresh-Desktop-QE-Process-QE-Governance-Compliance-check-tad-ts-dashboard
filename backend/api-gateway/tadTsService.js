// TAD/TS Compliance Service
// Analyzes JIRA issues for TAD (Technical Architecture Document) and TS (Test Strategy) deliverables

import https from 'https';
import JiraService from './jiraService.js';

class TADTSService {
  constructor() {
    this.jiraService = new JiraService();
  }

  /**
   * Check for PR links in dev-status API (Bitbucket, GitHub, GitLab)
   */
  async checkDevStatusPRs(issueId) {
    return new Promise((resolve) => {
      const result = {
        tad_found: false,
        ts_found: false,
        tad_pr: null,
        ts_pr: null,
        total_prs: 0,
        tad_source: null,
        ts_source: null
      };

      const appTypes = ['stash', 'github', 'gitlab'];
      let completedRequests = 0;
      let totalPRs = 0;

      appTypes.forEach(appType => {
        const options = {
          hostname: 'jira.wolterskluwer.io',
          port: 443,
          path: `/rest/dev-status/1.0/issue/detail?issueId=${issueId}&applicationType=${appType}&dataType=pullrequest`,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.JIRA_API_TOKEN || ''}`
          },
          timeout: 10000
        };

        https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              const details = response.detail || [];

              details.forEach(detail => {
                const prs = detail.pullRequests || [];
                totalPRs += prs.length;

                prs.forEach(pr => {
                  const prName = (pr.name || '').toUpperCase();
                  const prStatus = pr.status || 'Unknown';
                  const prUrl = pr.url || '';

                  // Check for TAD
                  if (prName.includes('TAD') || prName.includes('TECHNICAL ARCHITECTURE')) {
                    result.tad_found = true;
                    result.tad_pr = { name: pr.name, status: prStatus, url: prUrl };
                  }

                  // Check for TS
                  if ((prName.includes('[TS]') || prName.includes('TS FOR') || 
                       prName.includes('TEST STRATEGY')) && !prName.includes('TS FILE')) {
                    result.ts_found = true;
                    result.ts_pr = { name: pr.name, status: prStatus, url: prUrl };
                  }
                });
              });
            } catch (e) {
              // Silently continue on parse errors
            }

            completedRequests++;
            if (completedRequests === appTypes.length) {
              result.total_prs = totalPRs;
              if (result.tad_found) result.tad_source = 'PR';
              if (result.ts_found) result.ts_source = 'PR';
              resolve(result);
            }
          });
        }).on('error', () => {
          completedRequests++;
          if (completedRequests === appTypes.length) {
            result.total_prs = totalPRs;
            resolve(result);
          }
        }).end();
      });

      // Timeout fallback
      setTimeout(() => {
        if (completedRequests < appTypes.length) {
          result.total_prs = totalPRs;
          resolve(result);
        }
      }, 12000);
    });
  }

  /**
   * Check issue description for TAD/TS documentation links
   */
  checkDescriptionForLinks(description) {
    const result = {
      tad_in_desc: false,
      ts_in_desc: false,
      tad_links: [],
      ts_links: []
    };

    if (!description) return result;

    const descUpper = description.toUpperCase();
    const urlRegex = /https?:\/\/[^\s\]\)]+/g;

    // TAD keywords
    const tadKeywords = [
      'TECHNICAL ARCHITECTURE',
      'TAD DOCUMENT',
      'ADR',
      'ARCHITECTURE DECISION',
      'DESIGN DOCUMENT',
      'TECHNICAL DESIGN'
    ];

    // TS keywords
    const tsKeywords = [
      'TEST STRATEGY',
      'TS FOR',
      'TEST PLAN',
      'TESTING STRATEGY',
      'QA STRATEGY'
    ];

    // Check for TAD
    for (const keyword of tadKeywords) {
      if (descUpper.includes(keyword)) {
        result.tad_in_desc = true;
        const urls = description.match(urlRegex) || [];
        result.tad_links = urls.slice(0, 5);
        break;
      }
    }

    // Check for TS
    for (const keyword of tsKeywords) {
      if (descUpper.includes(keyword) && !descUpper.includes('TS FILE')) {
        result.ts_in_desc = true;
        const urls = description.match(urlRegex) || [];
        result.ts_links = urls.slice(0, 5);
        break;
      }
    }

    return result;
  }

  /**
   * Check issue comments for N/A indicators
   */
  checkCommentsForNA(comments, deliverableType) {
    const result = {
      na_found: false,
      na_comment: null
    };

    if (!comments || comments.length === 0) return result;

    const naKeywords = [
      'NOT APPLICABLE', 'N/A', 'NA', 'NOT REQUIRED', 'NOT NEEDED',
      'DOES NOT APPLY', "DOESN'T APPLY", 'NOT APPLY', 'NO NEED',
      'NOT NECESSARY', 'IS NOT APPLICABLE', 'ARE NOT APPLICABLE',
      'NO TAD AND TS IS REQUIRED', 'NO TAD AND TS REQUIRED',
      'NO TAD AND TS ARE REQUIRED', 'TAD AND TS NOT REQUIRED',
      'TAD AND TS ARE NOT REQUIRED'
    ];

    const deliverableKeywords = deliverableType === 'TAD' 
      ? ['TAD'] 
      : ['TS', 'TEST STRATEGY'];

    for (const comment of comments) {
      if (!comment) continue;

      const commentUpper = comment.toUpperCase();
      const hasDeliverable = deliverableKeywords.some(kw => commentUpper.includes(kw));
      const hasNAKeyword = naKeywords.some(kw => commentUpper.includes(kw));

      if (hasDeliverable && hasNAKeyword) {
        result.na_found = true;
        result.na_comment = comment.substring(0, 200);
        break;
      }
    }

    return result;
  }

  /**
   * Check if a bug is linked to a story in the same sprint
   */
  async checkBugLinkedToStory(issueKey, issueSprint, targetSprint = null) {
    const result = {
      linked_to_story: false,
      linked_issue_key: null
    };

    try {
      const jiraUrl = process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
      const url = new URL(`/rest/api/2/issue/${issueKey}`, jiraUrl);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search + '?fields=issuelinks,sprint,customfield_10004',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.JIRA_API_TOKEN || ''}`
        },
        timeout: 10000
      };

      return new Promise((resolve) => {
        https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const issueData = JSON.parse(data);
              const issueLinks = issueData.fields?.issuelinks || [];

              for (const link of issueLinks) {
                const linkedIssue = link.inwardIssue || link.outwardIssue;
                if (!linkedIssue) continue;

                const linkedType = linkedIssue.fields?.issuetype?.name || '';
                const linkedKey = linkedIssue.key || '';

                if (linkedType === 'Story') {
                  // Check if story is in target sprint
                  const linkedSprints = linkedIssue.fields?.sprint || linkedIssue.fields?.customfield_10004;
                  const linkedSprintNames = [];

                  if (Array.isArray(linkedSprints)) {
                    linkedSprints.forEach(sprint => {
                      if (sprint?.name) linkedSprintNames.push(sprint.name);
                    });
                  } else if (linkedSprints?.name) {
                    linkedSprintNames.push(linkedSprints.name);
                  }

                  // Check sprint match
                  const issueSprintList = issueSprint && issueSprint !== 'No Sprint' 
                    ? issueSprint.split(', ') 
                    : [];

                  const sprintMatch = issueSprintList.length > 0
                    ? issueSprintList.some(sprint => linkedSprintNames.includes(sprint))
                    : targetSprint && linkedSprintNames.includes(targetSprint);

                  if (sprintMatch) {
                    result.linked_to_story = true;
                    result.linked_issue_key = linkedKey;
                    return resolve(result);
                  }
                }
              }

              resolve(result);
            } catch (e) {
              resolve(result);
            }
          });
        }).on('error', () => resolve(result)).end();
      });
    } catch (e) {
      return result;
    }
  }

  /**
   * Get all comments for an issue
   */
  async getIssueComments(issueKey) {
    try {
      const jiraUrl = process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
      const url = new URL(`/rest/api/2/issue/${issueKey}/comment`, jiraUrl);

      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.JIRA_API_TOKEN || ''}`
        },
        timeout: 10000
      };

      return new Promise((resolve) => {
        https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              const comments = response.comments || [];
              resolve(comments.map(c => c.body || ''));
            } catch (e) {
              resolve([]);
            }
          });
        }).on('error', () => resolve([])).end();
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Main function: Analyze issue for TAD/TS compliance
   */
  async analyzeIssue(issue) {
    const fields = issue.fields || {};
    const key = issue.key;
    const id = issue.id;
    const description = fields.description || '';
    const issueType = fields.issuetype?.name || 'Unknown';

    // Check PRs if Bug or Story
    let prResult = {
      tad_found: false,
      ts_found: false,
      tad_pr: null,
      ts_pr: null,
      total_prs: 0,
      tad_source: null,
      ts_source: null
    };

    if (issueType === 'Bug' || issueType === 'Story') {
      prResult = await this.checkDevStatusPRs(id);
    }

    // Check description for links
    const descResult = this.checkDescriptionForLinks(description);

    // Combine results
    const result = {
      key,
      type: issueType,
      tad_found: prResult.tad_found || descResult.tad_in_desc,
      ts_found: prResult.ts_found || descResult.ts_in_desc,
      tad_pr: prResult.tad_pr,
      ts_pr: prResult.ts_pr,
      total_prs: prResult.total_prs,
      tad_source: prResult.tad_source || (descResult.tad_in_desc ? 'Description' : null),
      ts_source: prResult.ts_source || (descResult.ts_in_desc ? 'Description' : null),
      tad_desc_links: descResult.tad_links,
      ts_desc_links: descResult.ts_links,
      tad_na: false,
      tad_na_comment: null,
      ts_na: false,
      ts_na_comment: null
    };

    // Check comments for N/A status if Story and TAD/TS not found
    if (issueType === 'Story' && (!result.tad_found || !result.ts_found)) {
      const comments = await this.getIssueComments(key);

      if (!result.tad_found) {
        const tadNA = this.checkCommentsForNA(comments, 'TAD');
        result.tad_na = tadNA.na_found;
        result.tad_na_comment = tadNA.na_comment;
        if (tadNA.na_found) {
          result.tad_source = 'Not Applicable (Comment)';
          // If TAD is N/A, TS is also N/A
          if (!result.ts_found) {
            result.ts_na = true;
            result.ts_na_comment = 'Test Strategy N/A because TAD is N/A';
            result.ts_source = 'Not Applicable (TAD N/A)';
          }
        }
      }

      if (!result.ts_found && !result.ts_na) {
        const tsNA = this.checkCommentsForNA(comments, 'TS');
        result.ts_na = tsNA.na_found;
        result.ts_na_comment = tsNA.na_comment;
        if (tsNA.na_found) {
          result.ts_source = 'Not Applicable (Comment)';
        }
      }
    }

    // Check bug-to-story links
    if (issueType === 'Bug' && (!result.tad_found || !result.ts_found)) {
      const sprint = fields.sprint?.name || fields.customfield_10004?.name || 'No Sprint';
      const storyLink = await this.checkBugLinkedToStory(key, sprint);

      if (storyLink.linked_to_story) {
        if (!result.tad_found) {
          result.tad_na = true;
          result.tad_na_comment = `Bug linked to story ${storyLink.linked_issue_key} in same sprint`;
          result.tad_source = 'Not Applicable (Linked to Story)';
        }
        if (!result.ts_found) {
          result.ts_na = true;
          result.ts_na_comment = `Bug linked to story ${storyLink.linked_issue_key} in same sprint`;
          result.ts_source = 'Not Applicable (Linked to Story)';
        }
      }
    }

    return result;
  }

  /**
   * Analyze sprint compliance
   */
  async analyzeSprintCompliance(sprintName) {
    try {
      const issues = await this.jiraService.getSprintIssues(sprintName);
      const analyzed = [];

      for (const issue of issues) {
        const analysis = await this.analyzeIssue(issue);
        analyzed.push(analysis);
      }

      // Calculate statistics
      const stats = this.calculateComplianceStats(analyzed);

      return {
        sprint: sprintName,
        timestamp: new Date().toISOString(),
        totalIssues: analyzed.length,
        stats,
        issues: analyzed
      };
    } catch (err) {
      throw new Error(`Error analyzing sprint: ${err.message}`);
    }
  }

  /**
   * Calculate compliance statistics
   */
  calculateComplianceStats(issues) {
    const total = issues.length;
    const tadComplete = issues.filter(i => i.tad_found).length;
    const tsComplete = issues.filter(i => i.ts_found).length;
    const bothComplete = issues.filter(i => i.tad_found && i.ts_found).length;
    const tadNA = issues.filter(i => i.tad_na).length;
    const tsNA = issues.filter(i => i.ts_na).length;
    const tadTrulyMissing = issues.filter(i => !i.tad_found && !i.tad_na).length;
    const tsTrulyMissing = issues.filter(i => !i.ts_found && !i.ts_na).length;

    const tadApplicable = total - tadNA;
    const tsApplicable = total - tsNA;
    const tadCompliancePct = tadApplicable > 0 ? (tadComplete / tadApplicable) * 100 : 0;
    const tsCompliancePct = tsApplicable > 0 ? (tsComplete / tsApplicable) * 100 : 0;

    return {
      total,
      tadComplete,
      tsComplete,
      bothComplete,
      tadNA,
      tsNA,
      tadTrulyMissing,
      tsTrulyMissing,
      tadApplicable,
      tsApplicable,
      tadCompliancePct: Math.round(tadCompliancePct * 10) / 10,
      tsCompliancePct: Math.round(tsCompliancePct * 10) / 10,
      bothCompliancePct: Math.round((bothComplete / total) * 100 * 10) / 10
    };
  }
}

export default TADTSService;
