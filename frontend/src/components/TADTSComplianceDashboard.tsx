import React, { useState, useEffect } from 'react';
import './TADTSComplianceDashboard.css';

interface ComplianceStatus {
  tad?: boolean;
  ts?: boolean;
  na?: boolean;
}

interface Issue {
  key: string;
  summary: string;
  type: string;
  assignee?: string;
  status: string;
  compliance?: {
    tad: {
      status: boolean;
      source?: string;
    };
    ts: {
      status: boolean;
      source?: string;
    };
    na?: boolean;
  };
}

interface TeamStats {
  team: string;
  tad: {
    count: number;
    percentage: number;
  };
  ts: {
    count: number;
    percentage: number;
  };
  na: {
    count: number;
    percentage: number;
  };
  total: number;
}

interface SprintCompliance {
  sprint: string;
  totalIssues: number;
  complianceStats: {
    tad: {
      compliant: number;
      missing: number;
      na: number;
      percentage: number;
    };
    ts: {
      compliant: number;
      missing: number;
      na: number;
      percentage: number;
    };
  };
  teamMatrix: TeamStats[];
  issues: Issue[];
}

const TADTSComplianceDashboard: React.FC = () => {
  const [sprints, setSprints] = useState<string[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [complianceData, setComplianceData] = useState<SprintCompliance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'teams' | 'issues'>('overview');
  const [filterIssueType, setFilterIssueType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch available sprints
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/tad-ts/sprints');
        if (!response.ok) throw new Error('Failed to fetch sprints');
        const data = await response.json();
        setSprints(data.sprints || []);
        if (data.sprints && data.sprints.length > 0) {
          setSelectedSprint(data.sprints[0]);
        }
      } catch (err) {
        setError(`Failed to load sprints: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    fetchSprints();
  }, []);

  // Fetch compliance data when sprint changes
  useEffect(() => {
    if (!selectedSprint) return;

    const fetchComplianceData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:3000/api/tad-ts/sprint/${selectedSprint}`);
        if (!response.ok) throw new Error('Failed to fetch compliance data');
        const data: SprintCompliance = await response.json();
        setComplianceData(data);
        setSelectedTab('overview');
      } catch (err) {
        setError(`Failed to load compliance data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setComplianceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComplianceData();
  }, [selectedSprint]);

  // Filter issues based on selected filters
  const getFilteredIssues = () => {
    if (!complianceData?.issues) return [];
    
    return complianceData.issues.filter((issue) => {
      const typeMatch = filterIssueType === 'all' || issue.type === filterIssueType;
      const statusMatch = filterStatus === 'all' || issue.status === filterStatus;
      return typeMatch && statusMatch;
    });
  };

  // Get unique issue types and statuses
  const getUniqueValues = (key: keyof Issue) => {
    if (!complianceData?.issues) return [];
    const values = new Set<string>();
    complianceData.issues.forEach((issue) => {
      const value = issue[key];
      if (value) values.add(String(value));
    });
    return Array.from(values).sort();
  };

  const renderComplianceStatus = (compliant: boolean, na: boolean) => {
    if (na) return <span className="status-badge status-na">N/A</span>;
    if (compliant) return <span className="status-badge status-compliant">✓ Compliant</span>;
    return <span className="status-badge status-missing">✗ Missing</span>;
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#ef5350';
    return '#d32f2f';
  };

  return (
    <div className="tadts-dashboard">
      <div className="dashboard-header">
        <h1>TAD/TS Compliance Analysis</h1>
        <p className="header-subtitle">Technical Architecture Document & Test Strategy Compliance</p>
      </div>

      {/* Sprint Selector */}
      <div className="sprint-selector-section">
        <label htmlFor="sprint-select">Select Sprint:</label>
        <select
          id="sprint-select"
          value={selectedSprint}
          onChange={(e) => setSelectedSprint(e.target.value)}
          className="sprint-selector"
        >
          {sprints.map((sprint) => (
            <option key={sprint} value={sprint}>
              {sprint}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && <div className="loading-state">Loading compliance data...</div>}

      {/* Error State */}
      {error && <div className="error-state">{error}</div>}

      {/* Main Content */}
      {complianceData && !loading && (
        <div className="dashboard-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
              onClick={() => setSelectedTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${selectedTab === 'teams' ? 'active' : ''}`}
              onClick={() => setSelectedTab('teams')}
            >
              Team Matrix
            </button>
            <button
              className={`tab-button ${selectedTab === 'issues' ? 'active' : ''}`}
              onClick={() => setSelectedTab('issues')}
            >
              Issue Details
            </button>
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="tab-content overview-tab">
              <div className="sprint-info">
                <p>
                  <strong>Sprint:</strong> {complianceData.sprint}
                </p>
                <p>
                  <strong>Total Issues:</strong> {complianceData.totalIssues}
                </p>
              </div>

              <div className="compliance-cards-grid">
                {/* TAD Card */}
                <div className="compliance-card">
                  <div className="card-header">
                    <h3>TAD (Technical Architecture Document)</h3>
                  </div>
                  <div className="card-body">
                    <div className="compliance-stat">
                      <div className="stat-value">{complianceData.complianceStats.tad.percentage}%</div>
                      <div className="stat-label">Compliance Rate</div>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${complianceData.complianceStats.tad.percentage}%`,
                          backgroundColor: getComplianceColor(complianceData.complianceStats.tad.percentage),
                        }}
                      />
                    </div>
                    <div className="stat-breakdown">
                      <div className="breakdown-item compliant">
                        <span className="badge">✓</span>
                        <span>{complianceData.complianceStats.tad.compliant} Compliant</span>
                      </div>
                      <div className="breakdown-item missing">
                        <span className="badge">✗</span>
                        <span>{complianceData.complianceStats.tad.missing} Missing</span>
                      </div>
                      <div className="breakdown-item na">
                        <span className="badge">N/A</span>
                        <span>{complianceData.complianceStats.tad.na} Not Applicable</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TS Card */}
                <div className="compliance-card">
                  <div className="card-header">
                    <h3>TS (Test Strategy)</h3>
                  </div>
                  <div className="card-body">
                    <div className="compliance-stat">
                      <div className="stat-value">{complianceData.complianceStats.ts.percentage}%</div>
                      <div className="stat-label">Compliance Rate</div>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${complianceData.complianceStats.ts.percentage}%`,
                          backgroundColor: getComplianceColor(complianceData.complianceStats.ts.percentage),
                        }}
                      />
                    </div>
                    <div className="stat-breakdown">
                      <div className="breakdown-item compliant">
                        <span className="badge">✓</span>
                        <span>{complianceData.complianceStats.ts.compliant} Compliant</span>
                      </div>
                      <div className="breakdown-item missing">
                        <span className="badge">✗</span>
                        <span>{complianceData.complianceStats.ts.missing} Missing</span>
                      </div>
                      <div className="breakdown-item na">
                        <span className="badge">N/A</span>
                        <span>{complianceData.complianceStats.ts.na} Not Applicable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="summary-stats">
                <div className="stat-box">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-number">{complianceData.totalIssues}</div>
                    <div className="stat-text">Total Issues</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <div className="stat-number">{complianceData.teamMatrix?.length || 0}</div>
                    <div className="stat-text">Teams</div>
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <div className="stat-number">
                      {(
                        (complianceData.complianceStats.tad.percentage +
                          complianceData.complianceStats.ts.percentage) /
                        2
                      ).toFixed(0)}
                      %
                    </div>
                    <div className="stat-text">Avg Compliance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Matrix Tab */}
          {selectedTab === 'teams' && (
            <div className="tab-content teams-tab">
              <div className="team-matrix-container">
                <table className="team-matrix-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th colSpan={2}>TAD</th>
                      <th colSpan={2}>TS</th>
                      <th colSpan={2}>N/A</th>
                      <th>Total</th>
                    </tr>
                    <tr className="subheader">
                      <th></th>
                      <th>Count</th>
                      <th>%</th>
                      <th>Count</th>
                      <th>%</th>
                      <th>Count</th>
                      <th>%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceData.teamMatrix?.map((team) => (
                      <tr key={team.team} className="team-row">
                        <td className="team-name">{team.team}</td>
                        <td className="team-stat">{team.tad.count}</td>
                        <td className="team-percentage">
                          <span style={{ color: getComplianceColor(team.tad.percentage) }}>
                            {team.tad.percentage}%
                          </span>
                        </td>
                        <td className="team-stat">{team.ts.count}</td>
                        <td className="team-percentage">
                          <span style={{ color: getComplianceColor(team.ts.percentage) }}>
                            {team.ts.percentage}%
                          </span>
                        </td>
                        <td className="team-stat">{team.na.count}</td>
                        <td className="team-percentage">{team.na.percentage}%</td>
                        <td className="team-total">{team.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {selectedTab === 'issues' && (
            <div className="tab-content issues-tab">
              {/* Filters */}
              <div className="filters-section">
                <div className="filter-group">
                  <label htmlFor="type-filter">Issue Type:</label>
                  <select
                    id="type-filter"
                    value={filterIssueType}
                    onChange={(e) => setFilterIssueType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Types</option>
                    {getUniqueValues('type').map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    {getUniqueValues('status').map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issues List */}
              <div className="issues-list">
                {getFilteredIssues().length > 0 ? (
                  getFilteredIssues().map((issue) => (
                    <div key={issue.key} className="issue-card">
                      <div className="issue-header">
                        <div className="issue-key-type">
                          <span className="issue-key">{issue.key}</span>
                          <span className={`issue-type issue-type-${issue.type.toLowerCase()}`}>
                            {issue.type}
                          </span>
                        </div>
                        <span className={`issue-status issue-status-${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {issue.status}
                        </span>
                      </div>
                      <div className="issue-summary">{issue.summary}</div>
                      <div className="issue-compliance">
                        <div className="compliance-item">
                          <span className="compliance-label">TAD:</span>
                          {renderComplianceStatus(
                            issue.compliance?.tad?.status ?? false,
                            false
                          )}
                          {issue.compliance?.tad?.source && (
                            <span className="compliance-source">({issue.compliance.tad.source})</span>
                          )}
                        </div>
                        <div className="compliance-item">
                          <span className="compliance-label">TS:</span>
                          {renderComplianceStatus(
                            issue.compliance?.ts?.status ?? false,
                            false
                          )}
                          {issue.compliance?.ts?.source && (
                            <span className="compliance-source">({issue.compliance.ts.source})</span>
                          )}
                        </div>
                      </div>
                      {issue.assignee && <div className="issue-assignee">Assigned to: {issue.assignee}</div>}
                    </div>
                  ))
                ) : (
                  <div className="no-issues">No issues match the selected filters</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TADTSComplianceDashboard;
