import React, { useEffect, useState } from 'react';
import './TestsCovered.css';

interface TeamStats {
  total_test_cases: number;
  automated_test_cases: number;
  automation_coverage_percent: number;
  with_attachments: number;
  without_attachments: number;
}

interface TestsData {
  sprint: string;
  generated: string;
  summary: {
    total_test_cases: number;
    total_automated: number;
    automation_coverage_percent: number;
    total_with_attachments: number;
    teams_count: number;
  };
  teams: Record<string, TeamStats>;
}

export function TestsCovered() {
  const [data, setData] = useState<TestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSprint, setSelectedSprint] = useState('26.1.1');
  const [availableSprints, setAvailableSprints] = useState<string[]>([]);

  // Fetch available sprints on mount
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/metrics/tests-covered');
        if (response.ok) {
          const result = await response.json();
          const sprints = result.available_sprints || [];
          setAvailableSprints(sprints);
          if (sprints.length > 0 && !sprints.includes(selectedSprint)) {
            setSelectedSprint(sprints[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch available sprints:', err);
        // Fallback to default list
        setAvailableSprints(['26.1.1', '26.1.2', '26.1.3', '26.1.4', '26.1.6']);
      }
    };
    fetchSprints();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/metrics/tests-covered/${selectedSprint}`
        );
        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          throw new Error(errBody?.error || 'Failed to fetch test data');
        }
        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSprint) {
      fetchData();
    }
  }, [selectedSprint]);

  if (loading) {
    return <div className="tests-covered-container"><div className="loading">Loading test data...</div></div>;
  }

  if (error) {
    return (
      <div className="tests-covered-container">
        <div className="error">Error: {error}</div>
        <p>Make sure the backend API server is running on port 3001</p>
      </div>
    );
  }

  if (!data) {
    return <div className="tests-covered-container"><div className="no-data">No data available</div></div>;
  }

  const summary = data.summary;

  return (
    <div className="tests-covered-container">
      <div className="tests-covered-header">
        <h1>🧪 Tests Covered</h1>
        <div className="sprint-selector">
          <label>Sprint: </label>
          <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
            {availableSprints.map(sprint => (
              <option key={sprint} value={sprint}>{sprint}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tests-covered-summary">
        <div className="summary-card">
          <div className="card-label">Total Test Cases</div>
          <div className="card-value">{summary.total_test_cases}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Automated</div>
          <div className="card-value">{summary.total_automated}</div>
        </div>

        <div className="summary-card highlight">
          <div className="card-label">Automation Coverage</div>
          <div className="card-value">{summary.automation_coverage_percent}%</div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${summary.automation_coverage_percent}%` }}
            ></div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-label">With Scripts</div>
          <div className="card-value">{summary.total_with_attachments}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Teams</div>
          <div className="card-value">{summary.teams_count}</div>
        </div>
      </div>

      <div className="tests-covered-content">
        <h2>👥 Team Breakdown</h2>
        <table className="teams-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Total Tests</th>
              <th>Automated</th>
              <th>Coverage %</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.teams).map(([teamName, teamData]) => (
              <tr key={teamName}>
                <td className="team-name">{teamName}</td>
                <td className="numeric">{teamData.total_test_cases}</td>
                <td className="numeric">{teamData.automated_test_cases}</td>
                <td className="numeric coverage-cell">
                  {teamData.automation_coverage_percent.toFixed(1)}%
                </td>
                <td>
                  <div className="mini-progress">
                    <div 
                      className="mini-progress-fill" 
                      style={{ width: `${teamData.automation_coverage_percent}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tests-covered-footer">
        <p>Generated: {data.generated}</p>
        <p>Sprint: {data.sprint}</p>
      </div>
    </div>
  );
}

export default TestsCovered;
