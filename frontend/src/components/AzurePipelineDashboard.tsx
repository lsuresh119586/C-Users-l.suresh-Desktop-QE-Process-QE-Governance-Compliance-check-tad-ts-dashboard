import React, { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import './AzurePipelineDashboard.css';

/* ── Types ──────────────────────────────────────────── */
interface Build {
  id: number;
  definitionId: number;
  definitionName: string;
  buildNumber: string;
  status: string;
  result: string;
  queueTime: string;
  startTime: string;
  finishTime: string;
  durationSec: number;
  projectFolder: string;
  category: string;
  upgradeType: string;
  sourceBranch: string;
  requestedFor: string;
  url: string;
}

interface PipelineInfo {
  definitionId: number;
  name: string;
  folder: string;
  category: string;
  upgradeType: string;
}

interface ProjectData {
  projectKey: string;
  projectLabel: string;
  builds: Build[];
  pipelines: PipelineInfo[];
  metrics: {
    totalRuns: number;
    succeeded: number;
    failed: number;
    partial: number;
    canceled: number;
    none: number;
    successRate: string;
    avgDurationSec: number;
    byCategory: Record<string, { total: number; succeeded: number; failed: number }>;
    byUpgrade: Record<string, { total: number; succeeded: number; failed: number }>;
  };
}

interface SyncResult {
  success: boolean;
  data?: Record<string, ProjectData>;
  errors?: string[];
  message?: string;
  error?: string;
}

/* ── Project mapping ────────────────────────────────── */
const PROJECT_OPTIONS = [
  { key: 'all',                  label: 'All Projects' },
  { key: 'passport',             label: 'Passport' },
  { key: 'citi',                 label: 'CITI' },
  { key: 'collaborationPortal',  label: 'Collaboration Portal' },
];

/* ── Tab definitions ────────────────────────────────── */
type SubTab = 'overview' | 'history' | 'category' | 'export';

/* ── Helpers ────────────────────────────────────────── */
const fmtDuration = (sec: number) => {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const resultBadge = (r: string) => {
  switch (r?.toLowerCase()) {
    case 'succeeded': return <span className="badge badge-success">Succeeded</span>;
    case 'failed': return <span className="badge badge-fail">Failed</span>;
    case 'partiallysucceeded': return <span className="badge badge-partial">Partial</span>;
    case 'canceled': return <span className="badge badge-cancel">Canceled</span>;
    default: return <span className="badge badge-none">{r || 'None'}</span>;
  }
};

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */
const AzurePipelineDashboard: React.FC = () => {
  /* state */
  const [project, setProject] = useState('all');
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [data, setData] = useState<Record<string, ProjectData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  /* ── Fetch cached data ──────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: SyncResult = await apiService.getAzurePipelineData('passport', project);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Sync from Azure DevOps ─────────────────────────── */
  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res: SyncResult = await apiService.syncAzurePipeline('passport');
      if (res.success && res.data) {
        setData(res.data);
        setLastSynced(new Date().toLocaleString());
      } else {
        setError(res.error || 'Sync returned no data');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  /* ── CSV export ─────────────────────────────────────── */
  const handleExport = async () => {
    try {
      const resp = await apiService.exportAzurePipelineCsv('passport', project);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `azure-pipeline-${project}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('CSV export failed');
    }
  };

  /* ── Aggregate helper ───────────────────────────────── */
  const aggregated = React.useMemo(() => {
    if (!data) return null;

    const projects = project === 'all'
      ? Object.values(data)
      : data[project] ? [data[project]] : [];

    const allBuilds: Build[] = [];
    let totalRuns = 0, succeeded = 0, failed = 0, partial = 0, canceled = 0;
    let totalDur = 0, durCount = 0;
    const byCategory: Record<string, { total: number; succeeded: number; failed: number }> = {};
    const byUpgrade: Record<string, { total: number; succeeded: number; failed: number }> = {};

    for (const p of projects) {
      if (!p?.metrics) continue;
      totalRuns += p.metrics.totalRuns;
      succeeded += p.metrics.succeeded;
      failed += p.metrics.failed;
      partial += p.metrics.partial;
      canceled += p.metrics.canceled;
      if (p.metrics.avgDurationSec > 0) {
        totalDur += p.metrics.avgDurationSec * p.metrics.totalRuns;
        durCount += p.metrics.totalRuns;
      }
      for (const [cat, v] of Object.entries(p.metrics.byCategory || {}) as [string, { total: number; succeeded: number; failed: number }][]) {
        if (!byCategory[cat]) byCategory[cat] = { total: 0, succeeded: 0, failed: 0 };
        byCategory[cat].total += v.total;
        byCategory[cat].succeeded += v.succeeded;
        byCategory[cat].failed += v.failed;
      }
      for (const [upg, v] of Object.entries(p.metrics.byUpgrade || {}) as [string, { total: number; succeeded: number; failed: number }][]) {
        if (!byUpgrade[upg]) byUpgrade[upg] = { total: 0, succeeded: 0, failed: 0 };
        byUpgrade[upg].total += v.total;
        byUpgrade[upg].succeeded += v.succeeded;
        byUpgrade[upg].failed += v.failed;
      }
      if (p.builds) allBuilds.push(...p.builds);
    }

    const successRate = totalRuns > 0 ? ((succeeded / totalRuns) * 100).toFixed(1) : '0.0';
    const avgDur = durCount > 0 ? totalDur / durCount : 0;

    // Sort builds newest first
    allBuilds.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return { totalRuns, succeeded, failed, partial, canceled, successRate, avgDur, byCategory, byUpgrade, allBuilds };
  }, [data, project]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="az-dashboard">
      {/* Header */}
      <div className="az-header">
        <div className="az-header-left">
          <h2>🔧 Azure Pipeline Dashboard</h2>
          {lastSynced && <span className="az-synced">Last synced: {lastSynced}</span>}
        </div>
        <div className="az-header-right">
          <select value={project} onChange={e => setProject(e.target.value)} className="az-select">
            {PROJECT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button onClick={handleSync} disabled={syncing} className="az-btn az-btn-primary">
            {syncing ? '⏳ Syncing…' : '🔄 Sync Now'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="az-error">{error}</div>}

      {/* Loading */}
      {(loading || syncing) && <div className="az-loading">Loading…</div>}

      {/* No data */}
      {!loading && !syncing && !data && (
        <div className="az-empty">
          <p>No pipeline data available yet.</p>
          <p>Click <strong>🔄 Sync Now</strong> to fetch data from Azure DevOps.</p>
        </div>
      )}

      {/* Tabs */}
      {aggregated && (
        <>
          <div className="az-tabs">
            {(['overview', 'history', 'category', 'export'] as SubTab[]).map(t => (
              <button key={t} className={`az-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
                {t === 'overview' && '📊 Overview'}
                {t === 'history' && '📋 Run History'}
                {t === 'category' && '📁 By Category'}
                {t === 'export' && '📥 Export'}
              </button>
            ))}
          </div>

          {/* ── Overview tab ─────────────────────── */}
          {subTab === 'overview' && (
            <div className="az-overview">
              <div className="az-cards">
                <div className="az-card">
                  <div className="az-card-value">{aggregated.totalRuns}</div>
                  <div className="az-card-label">Total Runs</div>
                </div>
                <div className="az-card card-success">
                  <div className="az-card-value">{aggregated.succeeded}</div>
                  <div className="az-card-label">Succeeded</div>
                </div>
                <div className="az-card card-fail">
                  <div className="az-card-value">{aggregated.failed}</div>
                  <div className="az-card-label">Failed</div>
                </div>
                <div className="az-card card-partial">
                  <div className="az-card-value">{aggregated.partial}</div>
                  <div className="az-card-label">Partial</div>
                </div>
                <div className="az-card">
                  <div className="az-card-value">{aggregated.successRate}%</div>
                  <div className="az-card-label">Success Rate</div>
                </div>
                <div className="az-card">
                  <div className="az-card-value">{fmtDuration(aggregated.avgDur)}</div>
                  <div className="az-card-label">Avg Duration</div>
                </div>
              </div>

              {/* Success-rate bar */}
              <div className="az-rate-bar-wrapper">
                <div className="az-rate-bar">
                  <div className="az-rate-bar-fill" style={{ width: `${aggregated.successRate}%` }} />
                </div>
                <span className="az-rate-bar-label">{aggregated.successRate}% success</span>
              </div>
            </div>
          )}

          {/* ── History tab ──────────────────────── */}
          {subTab === 'history' && (
            <div className="az-history">
              <table className="az-table">
                <thead>
                  <tr>
                    <th>Pipeline</th>
                    <th>Build #</th>
                    <th>Result</th>
                    <th>Duration</th>
                    <th>Started</th>
                    <th>Branch</th>
                    <th>Requested By</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregated.allBuilds.slice(0, 100).map(b => (
                    <tr key={`${b.definitionId}-${b.id}`}>
                      <td className="az-pipeline-name">{b.definitionName}</td>
                      <td>
                        <a href={b.url} target="_blank" rel="noreferrer">{b.buildNumber}</a>
                      </td>
                      <td>{resultBadge(b.result)}</td>
                      <td>{fmtDuration(b.durationSec)}</td>
                      <td>{b.startTime ? new Date(b.startTime).toLocaleString() : '—'}</td>
                      <td className="az-branch">{b.sourceBranch?.replace('refs/heads/', '')}</td>
                      <td>{b.requestedFor}</td>
                    </tr>
                  ))}
                  {aggregated.allBuilds.length === 0 && (
                    <tr><td colSpan={7} className="az-no-rows">No builds found</td></tr>
                  )}
                </tbody>
              </table>
              {aggregated.allBuilds.length > 100 && (
                <p className="az-truncation">Showing first 100 of {aggregated.allBuilds.length} builds</p>
              )}
            </div>
          )}

          {/* ── Category tab ─────────────────────── */}
          {subTab === 'category' && (
            <div className="az-category">
              <h3>By Test Category</h3>
              <table className="az-table">
                <thead>
                  <tr><th>Category</th><th>Total</th><th>Succeeded</th><th>Failed</th><th>Success %</th></tr>
                </thead>
                <tbody>
                  {Object.entries(aggregated.byCategory).map(([cat, v]) => (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td>{v.total}</td>
                      <td>{v.succeeded}</td>
                      <td>{v.failed}</td>
                      <td>{v.total > 0 ? ((v.succeeded / v.total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  {Object.keys(aggregated.byCategory).length === 0 && (
                    <tr><td colSpan={5} className="az-no-rows">No category data</td></tr>
                  )}
                </tbody>
              </table>

              <h3>By Upgrade Type</h3>
              <table className="az-table">
                <thead>
                  <tr><th>Upgrade Type</th><th>Total</th><th>Succeeded</th><th>Failed</th><th>Success %</th></tr>
                </thead>
                <tbody>
                  {Object.entries(aggregated.byUpgrade).map(([upg, v]) => (
                    <tr key={upg}>
                      <td>{upg}</td>
                      <td>{v.total}</td>
                      <td>{v.succeeded}</td>
                      <td>{v.failed}</td>
                      <td>{v.total > 0 ? ((v.succeeded / v.total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  {Object.keys(aggregated.byUpgrade).length === 0 && (
                    <tr><td colSpan={5} className="az-no-rows">No upgrade type data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Export tab ────────────────────────── */}
          {subTab === 'export' && (
            <div className="az-export">
              <p>Download the current pipeline data as a CSV file, filtered by the selected project.</p>
              <button onClick={handleExport} className="az-btn az-btn-primary">📥 Download CSV</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AzurePipelineDashboard;
