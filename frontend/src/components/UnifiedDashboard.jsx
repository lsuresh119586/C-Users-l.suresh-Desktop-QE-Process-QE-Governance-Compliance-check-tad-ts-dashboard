import React, { useState, useEffect } from 'react';
import './UnifiedDashboard.css';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sprint, setSprint] = useState('26.1.2');
  const [sprintData, setSprintData] = useState(null);
  const [defectData, setDefectData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  const API_BASE = 'http://localhost:3000';

  useEffect(() => {
    fetchAllData();
  }, [sprint]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch qTest data with attachments
      const qTestUrl = `${API_BASE}/api/qtest/sprint/${sprint}?attachments=true`;
      const qTestResponse = await fetch(qTestUrl);
      if (!qTestResponse.ok) throw new Error('Failed to fetch qTest data');
      const qTestJson = await qTestResponse.json();
      setSprintData(qTestJson);

      // Fetch defect data
      const defectUrl = `${API_BASE}/api/defects/by-module?sprint=${sprint}`;
      const defectResponse = await fetch(defectUrl);
      if (defectResponse.ok) {
        const defectJson = await defectResponse.json();
        setDefectData(defectJson);
      }
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorrelation = () => {
    if (!sprintData || !defectData) return [];

    return Object.entries(sprintData.teams).map(([teamName, teamData]) => {
      const defects = defectData.teams?.[teamName] || 0;
      const automationRate = (teamData.automated / teamData.total * 100).toFixed(1);
      const riskScore = calculateRiskScore(defects, automationRate);

      return {
        team: teamName,
        testCases: teamData.total,
        automated: teamData.automated,
        automationRate,
        defects,
        riskScore,
        recommendation: getRiskRecommendation(riskScore)
      };
    });
  };

  const calculateRiskScore = (defects, automationRate) => {
    const defectWeight = Math.min(defects * 15, 50);
    const automationWeight = (100 - automationRate) * 0.3;
    return Math.round(defectWeight + automationWeight);
  };

  const getRiskRecommendation = (score) => {
    if (score >= 70) return '🔴 High - Increase testing';
    if (score >= 40) return '🟡 Medium - Review coverage';
    return '🟢 Low - Maintain current pace';
  };

  return (
    <div className="unified-dashboard">
      <div className="unified-header">
        <h1>📊 TAD-TS Unified Dashboard</h1>
        <p>Test Metrics + Defect Analysis</p>
      </div>

      <div className="unified-controls">
        <div className="control-group">
          <label htmlFor="sprint-select">Sprint:</label>
          <select id="sprint-select" value={sprint} onChange={(e) => setSprint(e.target.value)} disabled={loading}>
            <option value="26.1.1">Sprint 26.1.1</option>
            <option value="26.1.2">Sprint 26.1.2</option>
            <option value="26.1.3">Sprint 26.1.3</option>
          </select>
        </div>
        <button className="refresh-btn" onClick={fetchAllData} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📈 Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'qtest' ? 'active' : ''}`}
              onClick={() => setActiveTab('qtest')}
            >
              🧪 Test Metrics
            </button>
            <button
              className={`tab-btn ${activeTab === 'defects' ? 'active' : ''}`}
              onClick={() => setActiveTab('defects')}
            >
              🐛 Defects
            </button>
            <button
              className={`tab-btn ${activeTab === 'correlation' ? 'active' : ''}`}
              onClick={() => setActiveTab('correlation')}
            >
              🔗 Correlation
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && sprintData && (
            <div className="tab-content overview-tab">
              <div className="overview-grid">
                <div className="overview-card card-blue">
                  <div className="card-icon">📊</div>
                  <div className="card-content">
                    <h3>Test Cases</h3>
                    <p className="card-value">{sprintData.totals.total}</p>
                    <p className="card-label">Total in Sprint</p>
                  </div>
                </div>

                <div className="overview-card card-green">
                  <div className="card-icon">✅</div>
                  <div className="card-content">
                    <h3>Automation</h3>
                    <p className="card-value">{sprintData.totals.automated}</p>
                    <p className="card-label">
                      {((sprintData.totals.automated / sprintData.totals.total) * 100).toFixed(1)}% Coverage
                    </p>
                  </div>
                </div>

                <div className="overview-card card-purple">
                  <div className="card-icon">📎</div>
                  <div className="card-content">
                    <h3>Attachments</h3>
                    <p className="card-value">{sprintData.totals.with_attachments}</p>
                    <p className="card-label">
                      {((sprintData.totals.with_attachments / sprintData.totals.total) * 100).toFixed(1)}% Documented
                    </p>
                  </div>
                </div>

                {defectData && (
                  <div className="overview-card card-red">
                    <div className="card-icon">🐛</div>
                    <div className="card-content">
                      <h3>Open Defects</h3>
                      <p className="card-value">{defectData.totals?.open || 0}</p>
                      <p className="card-label">
                        {defectData.totals?.critical || 0} Critical
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {defectData && (
                <div className="overview-sections">
                  <div className="section">
                    <h3>📊 Status Summary</h3>
                    <div className="status-grid">
                      <div className="status-item">
                        <span className="status-label">Backlog</span>
                        <span className="status-value">{defectData.totals?.backlog || 0}</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">In Progress</span>
                        <span className="status-value">{defectData.totals?.inProgress || 0}</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Complete</span>
                        <span className="status-value">{defectData.totals?.complete || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3>⚠️ Severity Distribution</h3>
                    <div className="severity-grid">
                      <div className="severity-item critical">
                        <span className="severity-label">SEV-1</span>
                        <span className="severity-value">{defectData.totals?.sev1 || 0}</span>
                      </div>
                      <div className="severity-item high">
                        <span className="severity-label">SEV-2</span>
                        <span className="severity-value">{defectData.totals?.sev2 || 0}</span>
                      </div>
                      <div className="severity-item medium">
                        <span className="severity-label">SEV-3</span>
                        <span className="severity-value">{defectData.totals?.sev3 || 0}</span>
                      </div>
                      <div className="severity-item low">
                        <span className="severity-label">SEV-4</span>
                        <span className="severity-value">{defectData.totals?.sev4 || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* qTest Tab */}
          {activeTab === 'qtest' && sprintData && (
            <div className="tab-content qtest-tab">
              <div className="summary-cards">
                <div className="metric-card">
                  <div className="metric-label">Total Test Cases</div>
                  <div className="metric-value">{sprintData.totals.total}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Automated</div>
                  <div className="metric-value">
                    {sprintData.totals.automated}
                    <span className="metric-percent">
                      ({((sprintData.totals.automated / sprintData.totals.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">With Attachments</div>
                  <div className="metric-value">
                    {sprintData.totals.with_attachments}
                    <span className="metric-percent">
                      ({sprintData.totals.automated > 0 ? ((sprintData.totals.with_attachments / sprintData.totals.automated) * 100).toFixed(1) : 0}% of automated)
                    </span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Without Attachments (Automated)</div>
                  <div className="metric-value">
                    {sprintData.totals.without_attachments}
                    <span className="metric-percent">
                      ({sprintData.totals.automated > 0 ? ((sprintData.totals.without_attachments / sprintData.totals.automated) * 100).toFixed(1) : 0}% of automated)
                    </span>
                  </div>
                </div>
              </div>

              <div className="teams-section">
                <h3>Team Breakdown</h3>
                <div className="teams-grid">
                  {Object.entries(sprintData.teams).map(([teamName, teamData]) => (
                    <div
                      key={teamName}
                      className={`team-card ${selectedModule === teamName ? 'active' : ''}`}
                      onClick={() => setSelectedModule(selectedModule === teamName ? null : teamName)}
                    >
                      <div className="team-name">{teamName}</div>
                      <div className="team-stat">
                        <span>Total: {teamData.total}</span>
                        <span>Auto: {teamData.automated} ({((teamData.automated/teamData.total)*100).toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedModule && sprintData.teams[selectedModule] && (
                <div className="team-details">
                  <h3>{selectedModule} - Details</h3>
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total Cases</td>
                        <td>{sprintData.teams[selectedModule].total}</td>
                        <td>100%</td>
                      </tr>
                      <tr>
                        <td>Automated</td>
                        <td>{sprintData.teams[selectedModule].automated}</td>
                        <td>{((sprintData.teams[selectedModule].automated / sprintData.teams[selectedModule].total) * 100).toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>With Attachments (Automated)</td>
                        <td>{sprintData.teams[selectedModule].with_attachments}</td>
                        <td>{sprintData.teams[selectedModule].automated > 0 ? ((sprintData.teams[selectedModule].with_attachments / sprintData.teams[selectedModule].automated) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr>
                        <td>Without Attachments (Automated)</td>
                        <td>{sprintData.teams[selectedModule].without_attachments}</td>
                        <td>{sprintData.teams[selectedModule].automated > 0 ? ((sprintData.teams[selectedModule].without_attachments / sprintData.teams[selectedModule].automated) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Defects Tab */}
          {activeTab === 'defects' && defectData && (
            <div className="tab-content defects-tab">
              <div className="defect-summary">
                <div className="defect-stat critical">
                  <span>Critical</span>
                  <span className="count">{defectData.totals?.critical || 0}</span>
                </div>
                <div className="defect-stat high">
                  <span>High</span>
                  <span className="count">{defectData.totals?.high || 0}</span>
                </div>
                <div className="defect-stat medium">
                  <span>Medium</span>
                  <span className="count">{defectData.totals?.medium || 0}</span>
                </div>
                <div className="defect-stat low">
                  <span>Low</span>
                  <span className="count">{defectData.totals?.low || 0}</span>
                </div>
              </div>

              <h3>Modules with Most Defects</h3>
              <div className="module-list">
                {defectData.modules && defectData.modules.map((module, idx) => (
                  <div key={idx} className="module-item">
                    <div className="module-name">{module.name}</div>
                    <div className="module-bar">
                      <div
                        className="module-bar-fill"
                        style={{ width: `${(module.count / (defectData.modules[0]?.count || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <div className="module-count">{module.count}</div>
                  </div>
                ))}
              </div>

              <h3>Status Distribution</h3>
              <div className="status-distribution">
                <div className="status-row">
                  <span>Backlog</span>
                  <div className="status-bar">
                    <div className="status-fill backlog" style={{ width: `${(defectData.totals?.backlog / defectData.totals?.total * 100) || 0}%` }}></div>
                  </div>
                  <span>{defectData.totals?.backlog || 0}</span>
                </div>
                <div className="status-row">
                  <span>In Progress</span>
                  <div className="status-bar">
                    <div className="status-fill inprogress" style={{ width: `${(defectData.totals?.inProgress / defectData.totals?.total * 100) || 0}%` }}></div>
                  </div>
                  <span>{defectData.totals?.inProgress || 0}</span>
                </div>
                <div className="status-row">
                  <span>Complete</span>
                  <div className="status-bar">
                    <div className="status-fill complete" style={{ width: `${(defectData.totals?.complete / defectData.totals?.total * 100) || 0}%` }}></div>
                  </div>
                  <span>{defectData.totals?.complete || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Correlation Tab */}
          {activeTab === 'correlation' && (
            <div className="tab-content correlation-tab">
              <h2>Test-Defect Correlation Analysis</h2>
              <p className="correlation-description">
                Shows the relationship between test automation coverage and defect density by team
              </p>

              <div className="correlation-grid">
                {calculateCorrelation().map((item, idx) => (
                  <div key={idx} className="correlation-card">
                    <div className="team-header">{item.team}</div>
                    <div className="correlation-metrics">
                      <div className="metric">
                        <span className="label">Test Cases</span>
                        <span className="value">{item.testCases}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Automated</span>
                        <span className="value">{item.automationRate}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Defects</span>
                        <span className="value">{item.defects}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Risk Score</span>
                        <span className={`value risk-${item.riskScore >= 70 ? 'high' : item.riskScore >= 40 ? 'medium' : 'low'}`}>
                          {item.riskScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="recommendation">{item.recommendation}</div>
                  </div>
                ))}
              </div>

              <div className="insights-section">
                <h3>💡 Insights & Recommendations</h3>
                <ul className="insights-list">
                  <li>
                    <strong>High Defect Teams:</strong> Teams with many defects should prioritize automation coverage increase
                  </li>
                  <li>
                    <strong>Low Automation Teams:</strong> Teams with low automation coverage tend to have higher defect rates
                  </li>
                  <li>
                    <strong>Risk Mitigation:</strong> Focus regression testing on high-risk modules
                  </li>
                  <li>
                    <strong>Resource Allocation:</strong> Allocate additional QA resources to high-risk areas
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
