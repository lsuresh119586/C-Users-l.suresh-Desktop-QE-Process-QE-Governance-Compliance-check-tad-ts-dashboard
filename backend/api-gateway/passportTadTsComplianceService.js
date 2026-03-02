/**
 * Passport TAD/TS Compliance Service
 * 
 * Analyzes JIRA ELM project issues for TAD (Technical Architecture Document) and
 * TS (Test Strategy) compliance by checking PRs, descriptions, and comments.
 * 
 * Key differences from T360:
 * - Project: ELM (not GET)
 * - Sprint field: customfield_10292 (not Agile board API)
 * - SAFe Product filter: customfield_13790 = "Passport"
 * - SAFe Team field: customfield_13392
 * - Teams: PP Genesis, PP Pioneers, PP Spartacles
 * - Excludes status: "New"
 * - Sprints: 26.1.1–26.1.5, 26.1.IP
 */

import https from 'https';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const JIRA_URL = process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN_PASSPORT || process.env.JIRA_API_TOKEN || '';
const PROJECT_KEY = 'ELM';

// Passport Team mapping (from customfield_13392)
const TEAM_MAPPING = {
  'PP Genesis': 'PP Genesis',
  'PP Pioneers': 'PP Pioneers',
  'PP Spartacles': 'PP Spartacles',
  'CPOD': 'CPOD',
};

// Safe-SDLC activities to exclude for bugs
const EXCLUDED_ACTIVITIES = ['QE FEATURE TESTING', 'QE INTEGRATION TESTING', 'QE REGRESSION TESTING'];

// N/A keywords
const NA_KEYWORDS = [
  'NOT APPLICABLE', 'N/A', 'NA', 'NOT REQUIRED', 'NOT NEEDED',
  'DOES NOT APPLY', "DOESN'T APPLY", 'NOT APPLY', 'NO NEED',
  'NOT NECESSARY', 'IS NOT APPLICABLE', 'ARE NOT APPLICABLE',
  'NO TAD AND TS IS REQUIRED', 'NO TAD AND TS REQUIRED',
  'NO TAD AND TS ARE REQUIRED', 'TAD AND TS NOT REQUIRED',
  'TAD AND TS ARE NOT REQUIRED'
];

// Manual overrides for Passport issues
const MANUAL_OVERRIDES = {};

// Known Passport sprints (includes IP sprint)
const KNOWN_SPRINTS = ['26.1.1', '26.1.2', '26.1.3', '26.1.4', '26.1.5', '26.1.IP'];

// In-memory cache
const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function mapTeamName(original) {
  return TEAM_MAPPING[original] || original;
}

/**
 * Make an HTTPS request to JIRA
 */
function jiraRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const baseUrl = JIRA_URL.endsWith('/') ? JIRA_URL.slice(0, -1) : JIRA_URL;
    const apiPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    const fullUrl = urlPath.startsWith('http') ? urlPath : `${baseUrl}${apiPath}`;
    const parsed = new URL(fullUrl);

    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + (parsed.search || ''),
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JIRA_API_TOKEN}`
      },
      timeout: 60000,
      rejectUnauthorized: false
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`JIRA API ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('JIRA request timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Get available sprints for Passport
 * Uses hardcoded known sprints since Passport uses customfield_10292 (not Agile board)
 */
async function getPassportAvailableSprints() {
  const cacheKey = 'passport_available_sprints';
  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  // Passport sprints are known; sort descending (IP sprint treated as higher than numeric)
  const sorted = [...KNOWN_SPRINTS].sort((a, b) => {
    // IP sprint sorts first (highest)
    if (a.includes('IP') && !b.includes('IP')) return -1;
    if (!a.includes('IP') && b.includes('IP')) return 1;
    const pa = a.split('.').map(s => isNaN(s) ? 999 : Number(s));
    const pb = b.split('.').map(s => isNaN(s) ? 999 : Number(s));
    for (let i = 0; i < 3; i++) {
      if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
    }
    return 0;
  });

  const result = sorted.map(num => ({ id: num, name: `Sprint ${num}` }));
  cache[cacheKey] = { data: result, ts: Date.now() };
  return result;
}

/**
 * Build JQL for Passport sprint issues
 * Uses built-in Sprint field and customfield_13392 for SAFe Team filtering
 */
function buildPassportJql(sprintNumber) {
  const teamNames = Object.keys(TEAM_MAPPING).map(t => `'${t}'`).join(', ');
  
  return `project = ${PROJECT_KEY} ` +
    `AND cf[13392] in (${teamNames}) ` +
    `AND Sprint in ('${sprintNumber}') ` +
    `AND issuetype in (Bug, Story) ` +
    `AND status NOT IN ('New') ` +
    `ORDER BY updated DESC`;
}

/**
 * Fetch all Passport issues for a sprint number using JQL
 */
async function getSprintIssues(sprintNumber) {
  const jql = buildPassportJql(sprintNumber);

  console.log(`  [Passport] JQL: ${jql}`);

  const allIssues = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const payload = {
      jql,
      startAt,
      maxResults,
      fields: [
        'key', 'summary', 'description', 'issuetype', 'status', 'assignee',
        'customfield_13392',  // SAFe Team
        'customfield_14391',  // SAFe SDLC Activity
        'customfield_13790',  // SAFe Product
        'issuelinks'
      ]
    };

    try {
      const data = await jiraRequest('POST', '/rest/api/2/search', payload);
      const issues = data.issues || [];
      allIssues.push(...issues);

      if (issues.length < maxResults || allIssues.length >= (data.total || 0)) break;
      startAt += maxResults;
    } catch (err) {
      console.error(`[Passport] Error fetching sprint ${sprintNumber} issues:`, err.message);
      break;
    }
  }

  return allIssues;
}

/**
 * Check issue comments for N/A status
 */
async function getIssueComments(issueKey) {
  try {
    const data = await jiraRequest('GET', `/rest/api/2/issue/${issueKey}/comment`);
    return (data.comments || []).map(c => c.body || '');
  } catch (err) {
    console.warn(`[Passport] Warning: Could not fetch comments for ${issueKey}`);
    return [];
  }
}

/**
 * Check comments for N/A keywords for a deliverable type
 */
function checkCommentsForNA(comments, deliverableType) {
  const deliverableKeywords = deliverableType === 'TAD' ? ['TAD'] : ['TS', 'TEST STRATEGY'];

  for (const comment of comments) {
    if (!comment) continue;
    const upper = comment.toUpperCase();
    const hasDeliverable = deliverableKeywords.some(k => upper.includes(k));
    const hasNA = NA_KEYWORDS.some(k => upper.includes(k));
    if (hasDeliverable && hasNA) {
      return { naFound: true, naComment: comment.substring(0, 200) };
    }
  }
  return { naFound: false, naComment: null };
}

/**
 * Check description for TAD/TS documentation links
 */
function checkDescriptionForLinks(description) {
  const result = { tadInDesc: false, tsInDesc: false, tadLinks: [], tsLinks: [] };
  if (!description) return result;

  const upper = description.toUpperCase();
  const tadKeywords = ['TECHNICAL ARCHITECTURE', 'TAD DOCUMENT', 'ADR', 'ARCHITECTURE DECISION', 'DESIGN DOCUMENT', 'TECHNICAL DESIGN'];
  const tsKeywords = ['TEST STRATEGY', 'TS FOR', 'TEST PLAN', 'TESTING STRATEGY', 'QA STRATEGY'];

  for (const kw of tadKeywords) {
    if (upper.includes(kw)) {
      result.tadInDesc = true;
      const urls = description.match(/https?:\/\/[^\s\]\)]+/g) || [];
      result.tadLinks = urls.slice(0, 5);
      break;
    }
  }

  for (const kw of tsKeywords) {
    if (upper.includes(kw) && !upper.includes('TS FILE') && !upper.includes('TYPESCRIPT')) {
      result.tsInDesc = true;
      const urls = description.match(/https?:\/\/[^\s\]\)]+/g) || [];
      result.tsLinks = urls.slice(0, 5);
      break;
    }
  }

  return result;
}

/**
 * Check PR/dev status for TAD and TS deliverables
 */
async function checkDeliverables(issueKey, issueId, description) {
  const result = {
    tadFound: false, tsFound: false,
    tadPr: null, tsPr: null,
    totalPrs: 0,
    tadSource: null, tsSource: null,
    tadDescLinks: [], tsDescLinks: [],
    tadNA: false, tadNAComment: null,
    tsNA: false, tsNAComment: null
  };

  // Check dev-status API for PRs
  for (const appType of ['stash', 'github', 'gitlab']) {
    try {
      const devData = await jiraRequest('GET',
        `/rest/dev-status/1.0/issue/detail?issueId=${issueId}&applicationType=${appType}&dataType=pullrequest`
      );

      const details = devData.detail || [];
      for (const detail of details) {
        const prs = detail.pullRequests || [];
        result.totalPrs += prs.length;

        for (const pr of prs) {
          const prName = (pr.name || '').toUpperCase();
          const prUrl = pr.url || '';
          const prStatus = pr.status || 'Unknown';

          // TAD detection in PR name
          if (prName.includes('TAD') || prName.includes('TECHNICAL ARCHITECTURE') || prName.includes('ARCHITECTURE DOCUMENT')) {
            result.tadFound = true;
            result.tadPr = { name: pr.name, status: prStatus, url: prUrl };
          }

          // TS detection in PR name (with exclusions for TypeScript false positives)
          if ((prName.includes('[TS]') || prName.includes('TS FOR') || prName.includes('TEST STRATEGY') || prName.includes('TESTING STRATEGY'))
              && !prName.includes('TS FILE') && !prName.includes('TYPESCRIPT')) {
            result.tsFound = true;
            result.tsPr = { name: pr.name, status: prStatus, url: prUrl };
          }
        }
      }
    } catch (err) {
      // Dev-status may not be available for all app types
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  if (result.tadFound) result.tadSource = 'PR';
  if (result.tsFound) result.tsSource = 'PR';

  // Fallback: Check description for links
  if (description) {
    const descResult = checkDescriptionForLinks(description);
    if (!result.tadFound && descResult.tadInDesc) {
      result.tadFound = true;
      result.tadSource = 'Description';
      result.tadDescLinks = descResult.tadLinks;
    }
    if (!result.tsFound && descResult.tsInDesc) {
      result.tsFound = true;
      result.tsSource = 'Description';
      result.tsDescLinks = descResult.tsLinks;
    }
  }

  return result;
}

/**
 * Check if a bug is linked to a story (for N/A determination)
 */
async function checkBugLinkedToStory(issueKey) {
  try {
    const data = await jiraRequest('GET',
      `/rest/api/2/issue/${issueKey}?fields=issuelinks`
    );
    const links = (data.fields || {}).issuelinks || [];

    for (const link of links) {
      const linked = link.inwardIssue || link.outwardIssue;
      if (!linked) continue;

      const linkedType = (linked.fields || {}).issuetype?.name || '';
      if (linkedType === 'Story') {
        return { linkedToStory: true, linkedIssueKey: linked.key };
      }
    }
  } catch (err) {
    console.warn(`[Passport] Warning: Could not check links for ${issueKey}`);
  }
  return { linkedToStory: false, linkedIssueKey: null };
}

/**
 * Check N/A status for filtered issues (Stories via comments, Bugs via story links)
 */
async function checkNAStatus(issuesData) {
  for (const issue of issuesData) {
    // Bugs: check if linked to a story
    if (issue.type === 'Bug' && (!issue.tadFound || !issue.tsFound)) {
      const linkResult = await checkBugLinkedToStory(issue.key);
      if (linkResult.linkedToStory) {
        if (!issue.tadFound) {
          issue.tadNA = true;
          issue.tadNAComment = `Bug linked to story ${linkResult.linkedIssueKey}`;
          issue.tadSource = 'Not Applicable (Linked to Story)';
        }
        if (!issue.tsFound) {
          issue.tsNA = true;
          issue.tsNAComment = `Bug linked to story ${linkResult.linkedIssueKey}`;
          issue.tsSource = 'Not Applicable (Linked to Story)';
        }
        continue;
      }
    }

    // Stories: check comments for N/A keywords
    if (issue.type !== 'Story') continue;
    if (issue.tadFound && issue.tsFound) continue;

    const comments = await getIssueComments(issue.key);

    if (!issue.tadFound) {
      const tadNA = checkCommentsForNA(comments, 'TAD');
      issue.tadNA = tadNA.naFound;
      issue.tadNAComment = tadNA.naComment;
      if (tadNA.naFound) {
        issue.tadSource = 'Not Applicable (Comment)';
        // If TAD is N/A, TS is also N/A
        if (!issue.tsFound) {
          issue.tsNA = true;
          issue.tsNAComment = 'Test Strategy N/A because TAD is N/A';
          issue.tsSource = 'Not Applicable (TAD N/A)';
        }
      }
    }

    if (!issue.tsFound && !issue.tsNA) {
      const tsNA = checkCommentsForNA(comments, 'TS');
      issue.tsNA = tsNA.naFound;
      issue.tsNAComment = tsNA.naComment;
      if (tsNA.naFound) {
        issue.tsSource = 'Not Applicable (Comment)';
      }
    }
  }

  return issuesData;
}

/**
 * Main function: Get Passport TAD/TS compliance data for a sprint
 */
async function getPassportSprintCompliance(sprintNumber) {
  const cacheKey = `passport_compliance_${sprintNumber}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  console.log(`[Passport] Fetching TAD/TS compliance for sprint ${sprintNumber}...`);

  // 1. Get all issues
  const rawIssues = await getSprintIssues(sprintNumber);
  console.log(`  [Passport] Found ${rawIssues.length} raw issues`);

  if (rawIssues.length === 0) {
    return { sprint: sprintNumber, product: 'passport', summary: {}, teams: {}, issues: [] };
  }

  // 2. Filter: only Bug/Story, exclude certain SDLC activities, only Passport teams
  const targetTeams = new Set(Object.values(TEAM_MAPPING));
  const filteredIssues = [];

  for (const issue of rawIssues) {
    const fields = issue.fields || {};
    if (!fields) continue;

    const issueType = fields.issuetype?.name || 'Unknown';
    if (issueType !== 'Bug' && issueType !== 'Story') continue;

    // Extract team from customfield_13392
    let team = 'Unknown Team';
    const teamField = fields.customfield_13392;
    if (teamField) {
      team = typeof teamField === 'object' ? (teamField.value || 'Unknown Team') : String(teamField);
    }
    team = mapTeamName(team);
    if (!targetTeams.has(team)) continue;

    // For bugs, check excluded SDLC activities
    if (issueType === 'Bug') {
      const sdlcField = fields.customfield_14391;
      if (sdlcField) {
        const activityValue = (typeof sdlcField === 'object' ? sdlcField.value : sdlcField) || '';
        if (EXCLUDED_ACTIVITIES.some(ex => activityValue.toUpperCase().includes(ex))) {
          continue;
        }
      }
    }

    filteredIssues.push({ issue, fields, issueType, team });
  }

  console.log(`  [Passport] Filtered to ${filteredIssues.length} Bug/Story issues from Passport teams`);

  // 3. Check deliverables (PRs + description) for each issue
  const issuesData = [];
  for (let i = 0; i < filteredIssues.length; i++) {
    const { issue, fields, issueType, team } = filteredIssues[i];
    const key = issue.key;

    console.log(`  [Passport] [${i + 1}/${filteredIssues.length}] Checking ${key}...`);

    const description = fields.description || '';
    const deliverables = await checkDeliverables(key, issue.id, description);

    // Apply manual overrides
    const override = MANUAL_OVERRIDES[key];
    if (override) {
      if (override.tadFound && !deliverables.tadFound) {
        deliverables.tadFound = true;
        deliverables.tadSource = override.tadSource || 'Manual Override';
      }
      if (override.tsFound && !deliverables.tsFound) {
        deliverables.tsFound = true;
        deliverables.tsSource = override.tsSource || 'Manual Override';
      }
    }

    issuesData.push({
      key,
      summary: fields.summary || 'No summary',
      type: issueType,
      team,
      status: fields.status?.name || 'Unknown',
      assignee: fields.assignee?.displayName || 'Unassigned',
      tadFound: deliverables.tadFound,
      tsFound: deliverables.tsFound,
      tadPr: deliverables.tadPr,
      tsPr: deliverables.tsPr,
      totalPrs: deliverables.totalPrs,
      tadSource: deliverables.tadSource,
      tsSource: deliverables.tsSource,
      tadDescLinks: deliverables.tadDescLinks,
      tsDescLinks: deliverables.tsDescLinks,
      tadNA: deliverables.tadNA || false,
      tadNAComment: deliverables.tadNAComment || null,
      tsNA: deliverables.tsNA || false,
      tsNAComment: deliverables.tsNAComment || null
    });
  }

  // 4. Check N/A status
  console.log(`  [Passport] Checking N/A status...`);
  await checkNAStatus(issuesData);

  // 5. Build summary and team data
  const total = issuesData.length;
  const tadComplete = issuesData.filter(i => i.tadFound).length;
  const tsComplete = issuesData.filter(i => i.tsFound).length;
  const bothComplete = issuesData.filter(i => i.tadFound && i.tsFound).length;
  const tadNA = issuesData.filter(i => i.tadNA).length;
  const tsNA = issuesData.filter(i => i.tsNA).length;
  const tadApplicable = total - tadNA;
  const tsApplicable = total - tsNA;
  const tadTrulyMissing = issuesData.filter(i => !i.tadFound && !i.tadNA).length;
  const tsTrulyMissing = issuesData.filter(i => !i.tsFound && !i.tsNA).length;
  // When all issues are N/A (applicable=0), treat as 100% compliant
  const tadPct = tadApplicable > 0 ? (tadComplete / tadApplicable * 100) : (total > 0 ? 100 : 0);
  const tsPct = tsApplicable > 0 ? (tsComplete / tsApplicable * 100) : (total > 0 ? 100 : 0);

  // Group by team
  const teams = {};
  for (const issue of issuesData) {
    if (!teams[issue.team]) teams[issue.team] = [];
    teams[issue.team].push(issue);
  }

  const teamData = {};
  for (const [teamName, teamIssues] of Object.entries(teams)) {
    const tTotal = teamIssues.length;
    const tTad = teamIssues.filter(i => i.tadFound).length;
    const tTs = teamIssues.filter(i => i.tsFound).length;
    const tBoth = teamIssues.filter(i => i.tadFound && i.tsFound).length;
    const tTadNA = teamIssues.filter(i => i.tadNA).length;
    const tTsNA = teamIssues.filter(i => i.tsNA).length;
    const tTadApplicable = tTotal - tTadNA;
    const tTsApplicable = tTotal - tTsNA;
    const tTadMissing = teamIssues.filter(i => !i.tadFound && !i.tadNA).length;
    const tTsMissing = teamIssues.filter(i => !i.tsFound && !i.tsNA).length;

    teamData[teamName] = {
      total: tTotal,
      tadComplete: tTad,
      tsComplete: tTs,
      bothComplete: tBoth,
      tadNA: tTadNA,
      tsNA: tTsNA,
      tadApplicable: tTadApplicable,
      tsApplicable: tTsApplicable,
      missingTad: tTadMissing,
      missingTs: tTsMissing,
      tadPct: tTadApplicable > 0 ? (tTad / tTadApplicable * 100) : (tTotal > 0 ? 100 : 0),
      tsPct: tTsApplicable > 0 ? (tTs / tTsApplicable * 100) : (tTotal > 0 ? 100 : 0),
      issues: teamIssues.map(i => ({
        key: i.key,
        summary: i.summary,
        type: i.type,
        status: i.status,
        assignee: i.assignee,
        tadFound: i.tadFound,
        tsFound: i.tsFound,
        totalPrs: i.totalPrs,
        tadNA: i.tadNA,
        tadNAComment: i.tadNAComment,
        tsNA: i.tsNA,
        tsNAComment: i.tsNAComment,
        tadSource: i.tadSource,
        tsSource: i.tsSource
      }))
    };
  }

  const result = {
    sprint: sprintNumber,
    product: 'passport',
    generated: new Date().toISOString(),
    summary: {
      total,
      tadComplete,
      tsComplete,
      bothComplete,
      missingTad: tadTrulyMissing,
      missingTs: tsTrulyMissing,
      tadNA,
      tsNA,
      tadApplicable,
      tsApplicable,
      tadPct: Math.round(tadPct * 10) / 10,
      tsPct: Math.round(tsPct * 10) / 10,
      bothPct: total > 0 ? Math.round(bothComplete / total * 1000) / 10 : 0,
      missingTadPct: total > 0 ? Math.round(tadTrulyMissing / total * 1000) / 10 : 0,
      missingTsPct: total > 0 ? Math.round(tsTrulyMissing / total * 1000) / 10 : 0,
      tadNAPct: total > 0 ? Math.round(tadNA / total * 1000) / 10 : 0,
      tsNAPct: total > 0 ? Math.round(tsNA / total * 1000) / 10 : 0,
    },
    teams: teamData
  };

  cache[cacheKey] = { data: result, ts: Date.now() };
  console.log(`  [Passport] Sprint ${sprintNumber} compliance complete: ${total} issues, TAD ${tadPct.toFixed(1)}%, TS ${tsPct.toFixed(1)}%`);
  return result;
}

export { getPassportAvailableSprints, getPassportSprintCompliance };
