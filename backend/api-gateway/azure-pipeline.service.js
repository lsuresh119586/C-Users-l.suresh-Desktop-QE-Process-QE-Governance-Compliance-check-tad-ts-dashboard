/**
 * Azure Pipeline Service — Sync, Cache, CSV Export
 * 
 * Orchestrates Azure DevOps pipeline data: syncs from live API,
 * caches in db.json (LowDB), and exports filtered CSV.
 * 
 * Spec: specs/004-azure-pipeline-dashboard/spec.md
 */

import { AZURE_CONFIG, PROJECT_FOLDERS, fetchAllProjects } from './azure-pipeline.integration.js';

// ─── Sync all projects from Azure DevOps ────────────────────────────────────

export async function syncAzurePipeline(db, productId) {
  if (!AZURE_CONFIG.pat) {
    throw new Error('AZURE_DEVOPS_PAT is not set in .env');
  }

  console.log(`[Azure Pipeline] Syncing pipeline data for product: ${productId}`);
  const { results, errors } = await fetchAllProjects();

  // Initialize azurePipeline key if it doesn't exist
  if (!db.azurePipeline) {
    db.azurePipeline = {};
  }

  const syncedAt = new Date().toISOString();

  // Store each project result
  for (const [projectKey, data] of Object.entries(results)) {
    const config = PROJECT_FOLDERS[projectKey];
    const { org, project } = AZURE_CONFIG;

    db.azurePipeline[projectKey] = {
      productId,
      projectKey,
      label: config.label,
      syncedAt,
      folderPath: config.path,
      buildUrl: `https://dev.azure.com/${org}/${project}/_build?definitionScope=${encodeURIComponent(config.path)}`,
      metrics: data.metrics,
      recent_runs: data.recent_runs,
      pipeline_names: data.pipeline_names,
      pipeline_count: data.pipeline_count,
    };
  }

  return { data: results, errors };
}

// ─── Get cached pipeline data ───────────────────────────────────────────────

export function getAzurePipelineData(db, productId, projectKey) {
  const cached = db.azurePipeline;
  if (!cached) return null;

  if (projectKey && cached[projectKey]) {
    return cached[projectKey];
  }

  if (!projectKey) {
    // Return all projects
    const all = {};
    for (const key of Object.keys(PROJECT_FOLDERS)) {
      if (cached[key]) {
        all[key] = cached[key];
      }
    }
    return Object.keys(all).length > 0 ? all : null;
  }

  return null;
}

// ─── Export filtered CSV ────────────────────────────────────────────────────

export function exportAzurePipelineCsv(db, productId, projectKey, filters = {}) {
  const cached = db.azurePipeline;
  if (!cached) return null;

  // Collect runs from relevant project(s)
  let allRuns = [];
  const projectKeys = projectKey ? [projectKey] : Object.keys(PROJECT_FOLDERS);

  for (const key of projectKeys) {
    if (cached[key] && cached[key].recent_runs) {
      allRuns.push(...cached[key].recent_runs);
    }
  }

  // Apply filters
  if (filters.category) {
    allRuns = allRuns.filter(r => r.category === filters.category);
  }
  if (filters.upgradeType) {
    allRuns = allRuns.filter(r => r.upgradeType === filters.upgradeType);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    allRuns = allRuns.filter(r => r.startTime && new Date(r.startTime) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    allRuns = allRuns.filter(r => r.startTime && new Date(r.startTime) <= to);
  }

  // Sort by start time descending
  allRuns.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

  // Generate CSV
  const headers = 'Build #,Pipeline Name,Category,Upgrade Type,Status,Result,Start Time,Finish Time,Duration (min),URL';
  const rows = allRuns.map(r => [
    r.buildNumber,
    `"${(r.pipelineName || '').replace(/"/g, '""')}"`,
    r.category,
    r.upgradeType,
    r.status,
    r.result,
    r.startTime || '',
    r.finishTime || '',
    r.duration,
    r.url || '',
  ].join(','));

  return [headers, ...rows].join('\n');
}
