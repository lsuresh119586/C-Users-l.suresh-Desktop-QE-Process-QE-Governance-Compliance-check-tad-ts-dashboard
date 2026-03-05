#!/usr/bin/env node
/**
 * Smart Test Case Search Server
 * Standalone server for TF-IDF context matching across test cases
 * Runs on port 3002 (separate from the main API on 3000)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3002;
const dbFile = path.join(__dirname, 'db.json');

// ── Read database ──────────────────────────────────────────────────────
function readDatabase() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (err) {
    console.error('❌ Cannot read db.json:', err.message);
    return {};
  }
}

// ── NLP helpers ────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','shall',
  'should','may','might','must','can','could','and','but','or',
  'nor','not','so','yet','both','either','neither','each','every',
  'all','any','few','more','most','other','some','such','no',
  'only','own','same','than','too','very','just','because','as',
  'until','while','of','at','by','for','with','about','against',
  'between','through','during','before','after','above','below',
  'to','from','up','down','in','out','on','off','over','under',
  'again','further','then','once','here','there','when','where',
  'why','how','that','this','these','those','it','its','i','me',
  'my','we','our','you','your','he','him','his','she','her',
  'they','them','their','what','which','who','whom',
  'verify','check','test','ensure','validate','confirm'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function stem(word) {
  return word
    .replace(/ies$/, 'y')
    .replace(/tion$/, 't')
    .replace(/sion$/, 's')
    .replace(/ment$/, '')
    .replace(/ness$/, '')
    .replace(/ing$/, '')
    .replace(/ated$/, 'ate')
    .replace(/ed$/, '')
    .replace(/ly$/, '')
    .replace(/er$/, '')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

function getTokens(text) {
  return tokenize(text).map(stem);
}

// ── TF-IDF engine ──────────────────────────────────────────────────────
function buildCorpus(allTC) {
  const corpusDocs = allTC.map(tc => getTokens(tc.name));
  const df = {};
  const N = corpusDocs.length;
  for (const doc of corpusDocs) {
    const unique = new Set(doc);
    for (const t of unique) df[t] = (df[t] || 0) + 1;
  }
  return { corpusDocs, df, N };
}

function tfidfVector(tokens, df, N) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const vec = {};
  for (const t in tf) {
    const idf = Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
    vec[t] = tf[t] * idf;
  }
  return vec;
}

function cosineSim(v1, v2) {
  let dot = 0, mag1 = 0, mag2 = 0;
  for (const k in v1) { mag1 += v1[k] * v1[k]; if (v2[k]) dot += v1[k] * v2[k]; }
  for (const k in v2) mag2 += v2[k] * v2[k];
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// ── N-gram overlap ─────────────────────────────────────────────────────
function ngrams(tokens, n) {
  const grams = [];
  for (let i = 0; i <= tokens.length - n; i++) grams.push(tokens.slice(i, i + n).join(' '));
  return grams;
}

function ngramOverlap(queryTokens, docTokens) {
  let score = 0;
  for (const n of [2, 3]) {
    const qGrams = new Set(ngrams(queryTokens, n));
    const dGrams = new Set(ngrams(docTokens, n));
    if (qGrams.size === 0) continue;
    let overlap = 0;
    for (const g of qGrams) if (dGrams.has(g)) overlap++;
    score += overlap / qGrams.size;
  }
  return score / 2;
}

// ── Keyword scoring ────────────────────────────────────────────────────
function keywordScore(keywordTokens, docTokens, rawName) {
  if (keywordTokens.length === 0) return 0;
  const rawLower = (rawName || '').toLowerCase();
  let matches = 0;
  for (const kw of keywordTokens) {
    if (docTokens.includes(kw)) { matches += 1; continue; }
    if (rawLower.includes(kw)) { matches += 0.7; continue; }
    if (docTokens.some(dt => dt.startsWith(kw) || kw.startsWith(dt))) { matches += 0.5; }
  }
  return matches / keywordTokens.length;
}

// ── Search handler ─────────────────────────────────────────────────────
function handleSearch(reqBody) {
  const { context, keywords, sprint } = reqBody;

  const db = readDatabase();
  const testsCovered = db?.tests_covered || {};

  // Collect test cases
  const allTC = [];
  const sprintKeys = sprint ? [sprint] : Object.keys(testsCovered);
  for (const sk of sprintKeys) {
    const teams = testsCovered[sk]?.teams || {};
    for (const [teamName, teamData] of Object.entries(teams)) {
      for (const tc of (teamData.test_cases || [])) {
        allTC.push({ ...tc, team: teamName, sprint: sk });
      }
    }
  }

  if (allTC.length === 0) {
    return { results: [], totalCandidates: 0 };
  }

  // Build corpus
  const { corpusDocs, df, N } = buildCorpus(allTC);

  // Prepare query vectors
  const contextTokens = getTokens(context || '');
  const kwRawTokens = tokenize(keywords || '');
  const kwTokens = kwRawTokens.map(stem);
  const queryVec = tfidfVector(contextTokens, df, N);

  // Score each test case
  const scored = allTC.map((tc, idx) => {
    const docTokens = corpusDocs[idx];
    const docVec = tfidfVector(docTokens, df, N);

    const sim = context ? cosineSim(queryVec, docVec) : 0;
    const ngramSc = context ? ngramOverlap(contextTokens, docTokens) : 0;
    const kwSc = keywords ? keywordScore(kwTokens, docTokens, tc.name) : 0;

    let score;
    if (context && keywords) {
      score = sim * 0.45 + ngramSc * 0.15 + kwSc * 0.40;
    } else if (context) {
      score = sim * 0.70 + ngramSc * 0.30;
    } else {
      score = kwSc;
    }

    return {
      id: tc.id,
      qtest_id: tc.qtest_id,
      name: tc.name,
      team: tc.team,
      sprint: tc.sprint,
      automated: tc.automated,
      has_attachment: tc.has_attachment,
      matchPercent: Math.round(score * 100),
      scores: {
        tfidf: +(sim * 100).toFixed(1),
        ngram: +(ngramSc * 100).toFixed(1),
        keyword: +(kwSc * 100).toFixed(1)
      }
    };
  });

  scored.sort((a, b) => b.matchPercent - a.matchPercent);
  const results = scored.filter(r => r.matchPercent > 0).slice(0, 50);

  return {
    results,
    totalCandidates: allTC.length,
    query: { context: (context || '').substring(0, 200), keywords, sprint: sprint || 'all' }
  };
}

// ── HTTP Server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'test-case-search', port: PORT }));
    return;
  }

  // POST /api/tests/search
  if (pathname === '/api/tests/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.context && !payload.keywords) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Provide "context" and/or "keywords"' }));
          return;
        }
        const result = handleSearch(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('Search error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Search failed: ' + err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', available: ['POST /api/tests/search', 'GET /health'] }));
});

server.listen(PORT, () => {
  console.log(`\n🔍 Test Case Search Server running on http://localhost:${PORT}`);
  console.log(`   POST /api/tests/search  — context + keyword matching`);
  console.log(`   GET  /health            — health check\n`);
});
