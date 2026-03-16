import React, { useState, useEffect } from 'react';
import './QTestDashboard.css';

export default function QTestDashboard() {
  const [sprint, setSprint] = useState('26.1.2');
  const [sprintData, setSprintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [checkAttachments, setCheckAttachments] = useState(false);

  const API_BASE = 'http://localhost:8001';

  useEffect(() => {
    fetchSprintData();
  }, [sprint]);

  const fetchSprintData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/qtest/sprint/${sprint}${checkAttachments ? '?attachments=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSprintData(data);
      setSelectedTeam(null);
    } catch (err) {
      setError(`Failed to fetch sprint data: ${err.message}`);
      setSprintData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/qtest/sprint/${sprint}?refresh=true${checkAttachments ? '&attachments=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSprintData(data);
      setSelectedTeam(null);
    } catch (err) {
      setError(`Failed to refresh data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!sprintData && !loading && !error) {
    return (
      <div className="qtest-container">
        <div className="qtest-header">
          <h2>qTest Dashboard - TAD/TS Integration</h2>
          <p>Test Cases & Automation Coverage Analytics</p>
        </div>
        <div className="qtest-controls">
          <div className="qtest-control-group">
            <label htmlFor="sprint-select">Select Sprint:</label>
            <select id="sprint-select" value={sprint} onChange={(e) => setSprint(e.target.value)}>
              <option value="26.1.1">Sprint 26.1.1</option>
              <option value="26.1.2">Sprint 26.1.2</option>
              <option value="26.1.3">Sprint 26.1.3</option>
            </select>
          </div>
          <div className="qtest-control-group">
            <label htmlFor="attachments-check">
              <input
                id="attachments-check"
                type="checkbox"
                checked={checkAttachments}
                onChange={(e) => setCheckAttachments(e.target.checked)}
              />
              Check Attachments
            </label>
          </div>
        </div>
        <button className="qtest-load-btn" onClick={fetchSprintData} disabled={loading}>
          {loading ? 'Loading...' : 'Load Sprint Data'}
        </button>
      </div>
    );
  }

  return (
    <div className="qtest-container">
      <div className="qtest-header">
        <h2>qTest Dashboard - TAD/TS Integration</h2>
        <p>Test Cases & Automation Coverage Analytics</p>
      </div>

      <div className="qtest-controls">
        <div className="qtest-control-group">
          <label htmlFor="sprint-select">Select Sprint:</label>
          <select id="sprint-select" value={sprint} onChange={(e) => setSprint(e.target.value)} disabled={loading}>
            <option value="26.1.1">Sprint 26.1.1</option>
            <option value="26.1.2">Sprint 26.1.2</option>
            <option value="26.1.3">Sprint 26.1.3</option>
          </select>
        </div>
        <div className="qtest-control-group">
          <label htmlFor="attachments-check">
            <input
              id="attachments-check"
              type="checkbox"
              checked={checkAttachments}
              onChange={(e) => setCheckAttachments(e.target.checked)}
              disabled={loading}
            />
            Check Attachments
          </label>
        </div>
        <button className="qtest-refresh-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="qtest-error">{error}</div>}

      {loading && (
        <div className="qtest-loading">
          <div className="spinner"></div>
          <p>Fetching data from qTest...</p>
        </div>
      )}

      {sprintData && !loading && (
        <div className="qtest-content">
          <div className="qtest-meta">
            <span>Sprint: {sprintData.sprint_name}</span>
            <span>Generated: {new Date(sprintData.generated).toLocaleString()}</span>
          </div>

          {/* Summary Cards */}
          <div className="qtest-summary">
            <div className="qtest-card">
              <div className="qtest-card-label">Total Test Cases</div>
              <div className="qtest-card-value">{sprintData.totals.total}</div>
            </div>
            <div className="qtest-card">
              <div className="qtest-card-label">Automated</div>
              <div className="qtest-card-value">
                {sprintData.totals.automated}
                <span className="qtest-card-percent">
                  ({((sprintData.totals.automated / sprintData.totals.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="qtest-card">
              <div className="qtest-card-label">With Attachments</div>
              <div className="qtest-card-value">
                {sprintData.totals.with_attachments}
                <span className="qtest-card-percent">
                  ({((sprintData.totals.with_attachments / sprintData.totals.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="qtest-card">
              <div className="qtest-card-label">Without Attachments</div>
              <div className="qtest-card-value">
                {sprintData.totals.without_attachments}
              </div>
            </div>
          </div>

          {/* Teams Breakdown */}
          <div className="qtest-teams">
            <h3>Teams Breakdown</h3>
            <div className="qtest-teams-grid">
              {Object.entries(sprintData.teams).map(([teamName, teamData]) => (
                <div
                  key={teamName}
                  className={`qtest-team-card ${selectedTeam === teamName ? 'active' : ''}`}
                  onClick={() => setSelectedTeam(selectedTeam === teamName ? null : teamName)}
                >
                  <div className="qtest-team-name">{teamName}</div>
                  <div className="qtest-team-stats">
                    <div className="qtest-stat">
                      <span className="label">Total:</span>
                      <span className="value">{teamData.total}</span>
                    </div>
                    <div className="qtest-stat">
                      <span className="label">Automated:</span>
                      <span className="value">
                        {teamData.automated}
                        <span className="percent">
                          ({((teamData.automated / teamData.total || 0) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="qtest-stat">
                      <span className="label">With Attachments:</span>
                      <span className="value">{teamData.with_attachments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Team Details */}
          {selectedTeam && sprintData.teams[selectedTeam] && (
            <div className="qtest-team-details">
              <h3>{selectedTeam} - Test Cases</h3>
              <div className="qtest-table-container">
                <table className="qtest-table">
                  <thead>
                    <tr>
                      <th>TC ID</th>
                      <th>Name</th>
                      <th>Automated</th>
                      <th>Has Attachment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintData.teams[selectedTeam].test_cases.map((tc, idx) => (
                      <tr key={idx} className={tc.automated ? 'automated' : 'manual'}>
                        <td className="qtest-tc-id">{tc.id}</td>
                        <td className="qtest-tc-name">{tc.name}</td>
                        <td className="qtest-tc-auto">{tc.automated ? '✓ Yes' : '✗ No'}</td>
                        <td className="qtest-tc-attach">
                          {tc.has_attachment ? '✓ Yes' : tc.automated ? '✗ No' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
