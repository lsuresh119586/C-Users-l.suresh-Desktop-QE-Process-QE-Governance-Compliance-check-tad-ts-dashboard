/**
 * Azure Pipeline Integration — Azure DevOps REST API
 * 
 * Fetches pipeline build data from Azure DevOps for three Passport-related
 * project folders, filters to testing pipelines, and computes metrics.
 * 
 * Spec: specs/004-azure-pipeline-dashboard/spec.md
 */

import https from 'https';

// ─── Configuration ───────────────────────────────────────────────────────────

const AZURE_CONFIG = {
  pat: process.env.AZURE_DEVOPS_PAT || '',
  org: process.env.AZURE_DEVOPS_ORG || 'GRC-ELM',
  project: process.env.AZURE_DEVOPS_PROJECT || 'Passport',
  apiVersion: '7.1',
  get baseUrl() {
    return `https://dev.azure.com/${this.org}/${this.project}/_apis`;
  }
};

const PROJECT_FOLDERS = {
  passport:            { path: '\\Passport-CI\\CT-Pipeline',            label: 'Passport' },
  citi:                { path: '\\Passport-Client-Automation\\CITI',    label: 'CITI' },
  collaborationPortal: { path: '\\Collaboration Portal-CI',            label: 'Collaboration Portal' }
};

// ─── Testing Pipeline Detection ──────────────────────────────────────────────

const TESTING_PATTERNS = [
  /Tosca/i,
  /Aura/i,
  /Playwright/i,
  /^Preupgrade_/i,
  /^Postupgrade_/i,
  /-CT[- ]/i,
  /_CT[- _]/i,
  /CT[- ]Pipeline/i,
  /SmokeTest/i,
  /SmokeDataSetup/i,
];

function isTestingPipeline(name) {
  return TESTING_PATTERNS.some(p => p.test(name));
}

// ─── Classification ──────────────────────────────────────────────────────────

const CATEGORY_PATTERNS = [
  [/Invoice/i,      'Invoices'],
  [/Matter/i,       'Matter'],
  [/People/i,       'People'],
  [/Organization/i, 'Organization'],
  [/Integration/i,  'Integration'],
  [/Diversity/i,    'Diversity'],
  [/Tosca/i,        'Tosca'],
  [/Aura/i,         'Aura'],
  [/Playwright/i,   'Playwright'],
];

function classifyCategory(pipelineName) {
  for (const [regex, category] of CATEGORY_PATTERNS) {
    if (regex.test(pipelineName)) return category;
  }
  return 'Other';
}

function classifyUpgradeType(pipelineName) {
  if (/^Preupgrade_/i.test(pipelineName)) return 'Preupgrade';
  if (/^Postupgrade_/i.test(pipelineName)) return 'Postupgrade';
  return 'Other';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function getAuthHeader() {
  return 'Basic ' + Buffer.from(':' + AZURE_CONFIG.pat).toString('base64');
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function azureGet(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, `https://dev.azure.com`);
    const options = {
      hostname: fullUrl.hostname,
      path: fullUrl.pathname + fullUrl.search,
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const continuationToken = res.headers['x-ms-continuationtoken'] || null;
            resolve({ body: JSON.parse(data), continuationToken });
          } catch {
            reject(new Error(`JSON parse error from ${urlPath}`));
          }
        } else {
          reject(new Error(`Azure API ${res.statusCode}: ${data.substring(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Azure API request timed out')); });
    req.end();
  });
}

// ─── Fetch pipeline definitions ──────────────────────────────────────────────

async function fetchAllDefinitions(folderPath) {
  const definitions = [];
  let continuationToken = null;
  const { org, project, apiVersion } = AZURE_CONFIG;

  do {
    let apiUrl = `/${org}/${project}/_apis/build/definitions?$top=1000&api-version=${apiVersion}`;
    if (continuationToken) apiUrl += `&continuationToken=${continuationToken}`;

    const result = await azureGet(apiUrl);
    const allDefs = result.body.value || [];

    // Client-side filter by folder path prefix
    const filtered = allDefs.filter(d => d.path && d.path.startsWith(folderPath));
    definitions.push(...filtered);

    continuationToken = result.continuationToken;
  } while (continuationToken);

  return definitions;
}

// ─── Playwright YAML Detection ──────────────────────────────────────────────────────

const PLAYWRIGHT_YAML_PATTERNS = [
  /playwright/i,
  /npx\s+playwright/i,
  /@playwright\/test/i,
  /playwright\.config/i,
  /PlaywrightTest/i,
  /Playwright tests passed/i,
  /playwright.*test/i,
];

/**
 * Detect if a pipeline definition uses Playwright by inspecting its YAML file.
 * The list-definitions API returns minimal data, so we first fetch the full
 * definition detail to get process.yamlFilename and repository.id.
 * 
 * YAML files may live on a team branch (e.g. Spartacles, Genesis) rather than
 * the repo default branch (master). When the default-branch fetch fails with a
 * GitItemNotFoundException, we discover the pipeline's actual source branch by
 * fetching its most recent build's sourceBranch, then retry on that branch.
 * 
 * Returns true if the YAML references Playwright, false otherwise.
 */
async function detectPlaywrightFromYaml(definition) {
  try {
    const { org, project, apiVersion } = AZURE_CONFIG;

    // Step 1: Fetch full definition detail (list API doesn't include process/repository)
    let yamlFilename = definition.process?.yamlFilename;
    let repoId = definition.repository?.id;

    if (!yamlFilename || !repoId) {
      const detailUrl = `/${org}/${project}/_apis/build/definitions/${definition.id}?api-version=${apiVersion}`;
      const detailResult = await azureGet(detailUrl);
      const fullDef = detailResult.body;
      yamlFilename = fullDef?.process?.yamlFilename;
      repoId = fullDef?.repository?.id;
    }

    if (!yamlFilename || !repoId) return false;

    console.log(`     Checking YAML: ${yamlFilename} in repo ${repoId} for pipeline "${definition.name}"`);

    // Step 2: Try fetching YAML from repo default branch first
    const encodedPath = encodeURIComponent(yamlFilename);
    try {
      const apiUrl = `/${org}/${project}/_apis/git/repositories/${repoId}/items?path=${encodedPath}&includeContent=true&api-version=${apiVersion}`;
      const result = await azureGet(apiUrl);
      const content = typeof result.body === 'string' ? result.body : (result.body?.content || JSON.stringify(result.body));
      return PLAYWRIGHT_YAML_PATTERNS.some(p => p.test(content));
    } catch (defaultBranchErr) {
      // If file not found on default branch, try the pipeline's actual source branch
      if (!defaultBranchErr.message.includes('TF401174') && !defaultBranchErr.message.includes('404')) {
        throw defaultBranchErr;
      }
    }

    // Step 3: YAML not on default branch — discover the actual source branch
    //   from the most recent build for this pipeline definition
    console.log(`       YAML not on default branch, checking most recent build for source branch...`);
    try {
      const buildsUrl = `/${org}/${project}/_apis/build/builds?definitions=${definition.id}&$top=1&api-version=${apiVersion}`;
      const buildsResult = await azureGet(buildsUrl);
      const recentBuild = (buildsResult.body.value || [])[0];
      if (recentBuild?.sourceBranch) {
        const sourceBranch = recentBuild.sourceBranch.replace('refs/heads/', '');
        if (sourceBranch && sourceBranch !== 'master' && sourceBranch !== 'main') {
          console.log(`       Retrying YAML fetch on branch "${sourceBranch}"...`);
          const branchUrl = `/${org}/${project}/_apis/git/repositories/${repoId}/items?path=${encodedPath}&includeContent=true&versionDescriptor.version=${encodeURIComponent(sourceBranch)}&versionDescriptor.versionType=branch&api-version=${apiVersion}`;
          const branchResult = await azureGet(branchUrl);
          const content = typeof branchResult.body === 'string' ? branchResult.body : (branchResult.body?.content || JSON.stringify(branchResult.body));
          const found = PLAYWRIGHT_YAML_PATTERNS.some(p => p.test(content));
          console.log(`       (fetched from branch "${sourceBranch}" → Playwright: ${found})`);
          return found;
        }
      }
    } catch (branchErr) {
      console.log(`       ⚠️ Branch-aware YAML fetch failed: ${branchErr.message}`);
    }

    console.log(`     ⚠️ YAML file "${yamlFilename}" not found on any branch for "${definition.name}"`);
    return false;
  } catch (err) {
    // YAML fetch may fail (e.g., classic pipeline, repo permissions); silently skip
    console.log(`     ⚠️ YAML detection skipped for "${definition.name}": ${err.message}`);
    return false;
  }
}

// ─── Map a single Azure build to our structure ──────────────────────────────

function mapBuild(b, defName, yamlPlaywright = false) {
  const startTime = b.startTime || b.queueTime;
  const finishTime = b.finishTime;
  let duration = 0;
  if (startTime && finishTime) {
    duration = Math.round(((new Date(finishTime) - new Date(startTime)) / 60000) * 10) / 10;
  }

  const { org, project } = AZURE_CONFIG;
  let category = classifyCategory(defName);
  // If name-based classification returns 'Other', check YAML detection
  if (category === 'Other' && yamlPlaywright) {
    category = 'Playwright';
  }

  return {
    id: b.id,
    buildNumber: b.buildNumber || String(b.id),
    pipelineName: defName,
    category,
    upgradeType: classifyUpgradeType(defName),
    status: b.status || 'unknown',
    result: b.result || 'unknown',
    startTime: startTime || null,
    finishTime: finishTime || null,
    duration,
    url: `https://dev.azure.com/${org}/${project}/_build/results?buildId=${b.id}`,
  };
}

// ─── Fetch builds for a single pipeline definition ──────────────────────────

async function fetchBuildsForPipeline(definitionId, defName, yamlPlaywright = false) {
  const { org, project, apiVersion } = AZURE_CONFIG;

  try {
    const apiUrl = `/${org}/${project}/_apis/build/builds?definitions=${definitionId}&$top=50&statusFilter=completed&api-version=${apiVersion}`;
    const result = await azureGet(apiUrl);
    const builds = result.body.value || [];
    return builds.map(b => mapBuild(b, defName, yamlPlaywright));
  } catch (err) {
    console.warn(`⚠️  Failed to fetch builds for pipeline ${defName} (${definitionId}): ${err.message}`);
    return [];
  }
}

// ─── Fetch all testing pipeline runs for a folder ───────────────────────────

async function fetchPipelineRuns(folderPath) {
  // 1. Get all definitions in the folder
  const allDefs = await fetchAllDefinitions(folderPath);

  // 2. Filter to testing pipelines
  //    - Pipelines in SUBFOLDERS of the configured path are always included
  //      (they're organized into test-category folders like Genesis, Spartacles, etc.)
  //    - Pipelines at the ROOT of the configured path use name-based detection
  //      (to exclude non-testing items like "PPOD Train Release", "demo-delete later")
  const testingDefs = allDefs.filter(d => {
    const isInSubfolder = d.path && d.path !== folderPath;
    return isInSubfolder || isTestingPipeline(d.name);
  });
  console.log(`   Found ${testingDefs.length} testing pipelines (out of ${allDefs.length} total) in ${folderPath}`);
  const subfolderCount = testingDefs.filter(d => d.path !== folderPath && !isTestingPipeline(d.name)).length;
  if (subfolderCount > 0) console.log(`     (${subfolderCount} included via subfolder detection)`);

  // 2.5 Detect Playwright from YAML for defs whose name doesn't already match a known category
  const yamlDetectionMap = new Map(); // defId -> boolean
  const defsNeedingYamlCheck = testingDefs.filter(d => classifyCategory(d.name) === 'Other');
  if (defsNeedingYamlCheck.length > 0) {
    console.log(`   Checking ${defsNeedingYamlCheck.length} 'Other' pipelines for Playwright YAML references...`);
    const YAML_BATCH = 5;
    for (let i = 0; i < defsNeedingYamlCheck.length; i += YAML_BATCH) {
      const batch = defsNeedingYamlCheck.slice(i, i + YAML_BATCH);
      const results = await Promise.all(batch.map(d => detectPlaywrightFromYaml(d)));
      batch.forEach((d, idx) => {
        if (results[idx]) {
          yamlDetectionMap.set(d.id, true);
          console.log(`     → ${d.name}: Playwright detected via YAML`);
        }
      });
    }
  }

  // 3. Fetch builds in parallel batches of 10
  const BATCH_SIZE = 10;
  const allRuns = [];

  for (let i = 0; i < testingDefs.length; i += BATCH_SIZE) {
    const batch = testingDefs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(d => fetchBuildsForPipeline(d.id, d.name, yamlDetectionMap.get(d.id) || false))
    );
    for (const runs of batchResults) {
      allRuns.push(...runs);
    }
  }

  // 4. Collect unique pipeline names
  const pipelineNames = [...new Set(testingDefs.map(d => d.name))];

  return { runs: allRuns, pipelineNames, pipelineCount: testingDefs.length };
}

// ─── Compute aggregated metrics ─────────────────────────────────────────────

function computeMetrics(runs) {
  const total_runs = runs.length;
  const succeeded = runs.filter(r => r.result === 'succeeded').length;
  const failed = runs.filter(r => r.result === 'failed').length;
  const canceled = runs.filter(r => r.result === 'canceled').length;
  const partially_succeeded = runs.filter(r => r.result === 'partiallySucceeded').length;

  const denominator = succeeded + failed;
  const success_rate = denominator > 0 ? Math.round((succeeded / denominator) * 1000) / 10 : 0;
  const failure_rate = denominator > 0 ? Math.round((failed / denominator) * 1000) / 10 : 0;

  const durations = runs.filter(r => r.duration > 0).map(r => r.duration);
  const avg_duration_minutes = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  return {
    total_runs,
    succeeded,
    failed,
    canceled,
    partially_succeeded,
    success_rate,
    failure_rate,
    avg_duration_minutes,
  };
}

// ─── Fetch all three projects ───────────────────────────────────────────────

async function fetchAllProjects() {
  const results = {};
  const errors = [];

  for (const [projectKey, config] of Object.entries(PROJECT_FOLDERS)) {
    try {
      console.log(`[Azure Pipeline] Fetching ${config.label} (${config.path})...`);
      const { runs, pipelineNames, pipelineCount } = await fetchPipelineRuns(config.path);
      const metrics = computeMetrics(runs);

      // Sort recent runs by start time descending
      const recent_runs = runs
        .filter(r => r.startTime)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      results[projectKey] = {
        metrics,
        recent_runs,
        pipeline_names: pipelineNames,
        pipeline_count: pipelineCount,
      };

      console.log(`   ✅ ${config.label}: ${metrics.total_runs} runs, ${metrics.success_rate}% success`);
    } catch (err) {
      console.error(`   ❌ ${config.label}: ${err.message}`);
      errors.push({ project: projectKey, label: config.label, message: err.message });
    }
  }

  return { results, errors };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  AZURE_CONFIG,
  PROJECT_FOLDERS,
  fetchAllProjects,
  fetchPipelineRuns,
  computeMetrics,
  isTestingPipeline,
  classifyCategory,
  classifyUpgradeType,
  detectPlaywrightFromYaml,
};
