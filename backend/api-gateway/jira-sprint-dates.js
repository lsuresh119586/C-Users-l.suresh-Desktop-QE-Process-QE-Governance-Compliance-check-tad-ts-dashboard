/**
 * JIRA Sprint Date Service
 *
 * Fetches sprint start/end dates from JIRA Agile REST API for Passport teams.
 * Used by the Azure Pipeline tile to filter pipeline runs by sprint window.
 *
 * JIRA Agile endpoint: GET /rest/agile/1.0/board/{boardId}/sprint
 * Returns: { startDate, endDate } for each sprint matched by name pattern.
 */

import https from 'https';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Load .env ──────────────────────────────────────────────────────────────

function loadEnvVars() {
  try {
    const envPath = join(__dirname, '.env');
    const content = readFileSync(envPath, 'utf8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
    return vars;
  } catch {
    return {};
  }
}

const envVars = loadEnvVars();

// ─── Configuration ──────────────────────────────────────────────────────────

const JIRA_URL = envVars.JIRA_URL || process.env.JIRA_URL || 'https://jira.wolterskluwer.io/jira';
const JIRA_TOKEN = envVars.JIRA_API_TOKEN_PASSPORT || process.env.JIRA_API_TOKEN_PASSPORT
                || envVars.JIRA_API_TOKEN || process.env.JIRA_API_TOKEN;

/**
 * Passport team board IDs (discovered from JIRA Agile API)
 * Sprint name patterns:
 *   - Passport Genesis-26.1.1
 *   - Passport Pioneers-26.1.2
 *   - Passport Spartacles-26.1.3
 */
const PASSPORT_BOARDS = {
  'pp-genesis':    { boardId: 5414, sprintPrefix: 'Passport Genesis-' },
  'pp-pioneers':   { boardId: 5812, sprintPrefix: 'Passport Pioneers-' },
  'pp-spartacles': { boardId: 7916, sprintPrefix: 'Passport Spartacles-' },
};

// ─── In-memory cache (TTL: 30 min) ─────────────────────────────────────────

const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

// ─── JIRA HTTP helper ───────────────────────────────────────────────────────

function jiraGet(path) {
  return new Promise((resolve, reject) => {
    const baseUrl = JIRA_URL.endsWith('/') ? JIRA_URL.slice(0, -1) : JIRA_URL;
    const fullUrl = new URL(baseUrl + path);
    const req = https.request(
      {
        hostname: fullUrl.hostname,
        port: 443,
        path: fullUrl.pathname + fullUrl.search,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${JIRA_TOKEN}`,
        },
        timeout: 30000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON from JIRA')); }
          } else {
            reject(new Error(`JIRA ${res.statusCode}: ${body.slice(0, 300)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('JIRA request timeout')); });
    req.end();
  });
}

// ─── Fetch all sprints for a board (paginated) ─────────────────────────────

async function fetchBoardSprints(boardId) {
  const cacheKey = `board-sprints-${boardId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const all = [];
  let startAt = 0;
  while (true) {
    const data = await jiraGet(
      `/rest/agile/1.0/board/${boardId}/sprint?state=active,closed,future&startAt=${startAt}&maxResults=50`
    );
    const values = data.values || [];
    all.push(...values);
    if (data.isLast !== false || values.length === 0) break;
    startAt += values.length;
  }

  setCache(cacheKey, all);
  return all;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get sprint dates for a specific team and sprint number.
 *
 * @param {string} teamId   e.g. 'pp-spartacles'
 * @param {string} sprintId e.g. 'pp-spartacles-26.1.3' or '26.1.3'
 * @returns {Promise<{startDate: string, endDate: string, name: string} | null>}
 */
export async function getSprintDates(teamId, sprintId) {
  const board = PASSPORT_BOARDS[teamId];
  if (!board || !JIRA_TOKEN) return null;

  // Extract sprint number: "pp-spartacles-26.1.3" → "26.1.3", or "26.1.3" as-is
  const sprintNumber = sprintId.replace(/^[a-z-]+-(\d)/, '$1');

  // Expected JIRA sprint name: "Passport Spartacles-26.1.3"
  const expectedName = board.sprintPrefix + sprintNumber;

  try {
    const sprints = await fetchBoardSprints(board.boardId);
    const match = sprints.find(s => s.name === expectedName);
    if (match) {
      return {
        name: match.name,
        startDate: match.startDate,   // ISO 8601
        endDate: match.endDate,       // ISO 8601
        state: match.state,
      };
    }
    // Fuzzy fallback: case-insensitive, trim whitespace
    const fuzzy = sprints.find(s => s.name.trim().toLowerCase() === expectedName.trim().toLowerCase());
    if (fuzzy) {
      return {
        name: fuzzy.name,
        startDate: fuzzy.startDate,
        endDate: fuzzy.endDate,
        state: fuzzy.state,
      };
    }
    console.warn(`[JIRA Sprint] No match for "${expectedName}" on board ${board.boardId}`);
    return null;
  } catch (err) {
    console.error(`[JIRA Sprint] Error fetching sprint dates for ${teamId}/${sprintId}:`, err.message);
    return null;
  }
}

/**
 * Get all sprint dates for a team (all sprints on the board matching prefix).
 *
 * @param {string} teamId  e.g. 'pp-genesis'
 * @returns {Promise<Array<{sprintNumber: string, name: string, startDate: string, endDate: string, state: string}>>}
 */
export async function getAllSprintDates(teamId) {
  const board = PASSPORT_BOARDS[teamId];
  if (!board || !JIRA_TOKEN) return [];

  try {
    const sprints = await fetchBoardSprints(board.boardId);
    return sprints
      .filter(s => s.name.startsWith(board.sprintPrefix))
      .map(s => ({
        sprintNumber: s.name.replace(board.sprintPrefix, ''),
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        state: s.state,
      }))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  } catch (err) {
    console.error(`[JIRA Sprint] Error fetching all sprints for ${teamId}:`, err.message);
    return [];
  }
}

/**
 * Team-to-Azure-folder mapping.
 * Maps dashboard team IDs to regex patterns that match Azure DevOps pipeline folder paths.
 */
export const TEAM_FOLDER_PATTERNS = {
  'pp-spartacles': /spartacles/i,
  'pp-genesis':    /genesis/i,
  'pp-pioneers':   /pioneers/i,
};

export { PASSPORT_BOARDS };
