#!/usr/bin/env node
/**
 * Sample React Components for Tests Covered Visualization
 * This file shows how to integrate the test metrics API with your dashboard
 */

// ============================================================================
// Component 1: Tests Covered Summary Card
// ============================================================================
/*
import React, { useEffect, useState } from 'react';

export function TestsCoveredSummary({ sprint = '26.1.2' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/metrics/tests-covered/${sprint}`);
        const result = await response.json();
        if (result.status === 'success') {
          setData(result.data);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sprint]);

  if (loading) return <div className="loading">Loading tests data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="no-data">No data available</div>;

  const summary = data.summary;

  return (
    <div className="tests-covered-card">
      <h2>Tests Covered - {sprint}</h2>
      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-label">Total Test Cases</div>
          <div className="metric-value">{summary.total_test_cases}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Automated</div>
          <div className="metric-value">{summary.total_automated}</div>
        </div>
        <div className="metric highlight">
          <div className="metric-label">Automation Coverage</div>
          <div className="metric-value">{summary.automation_coverage_percent}%</div>
        </div>
        <div className="metric">
          <div className="metric-label">With Scripts</div>
          <div className="metric-value">{summary.total_with_attachments}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Teams</div>
          <div className="metric-value">{summary.teams_count}</div>
        </div>
      </div>
    </div>
  );
}
*/

// ============================================================================
// Component 2: Team Breakdown Table
// ============================================================================
/*
export function TestsCoveredTeamBreakdown({ sprint = '26.1.2' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/metrics/tests-covered/${sprint}/teams`);
        const result = await response.json();
        if (result.status === 'success') {
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sprint]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  const teams = data.teams;

  return (
    <div className="team-breakdown">
      <h3>Team Test Coverage</h3>
      <table className="metrics-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Total Tests</th>
            <th>Automated</th>
            <th>Coverage %</th>
            <th>With Scripts</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(teams).map(([teamName, teamData]) => (
            <tr key={teamName}>
              <td className="team-name">{teamName}</td>
              <td>{teamData.total_test_cases}</td>
              <td>{teamData.automated_test_cases}</td>
              <td className="coverage-percent">
                {teamData.automation_coverage_percent}%
              </td>
              <td>{teamData.with_attachments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
*/

// ============================================================================
// Component 3: Automation Coverage Chart
// ============================================================================
/*
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function AutomationCoverageChart({ sprint = '26.1.2' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/metrics/tests-covered/${sprint}/teams`);
        const result = await response.json();
        
        if (result.status === 'success') {
          const chartData = Object.entries(result.teams).map(([teamName, teamData]) => ({
            team: teamName,
            automated: teamData.automated_test_cases,
            manual: teamData.total_test_cases - teamData.automated_test_cases,
            coverage: teamData.automation_coverage_percent
          }));
          setData(chartData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sprint]);

  if (loading) return <div>Loading chart...</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="chart-container">
      <h3>Automation Coverage by Team</h3>
      <BarChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="team" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="automated" stackId="a" fill="#8884d8" name="Automated" />
        <Bar dataKey="manual" stackId="a" fill="#82ca9d" name="Manual" />
      </BarChart>
    </div>
  );
}
*/

// ============================================================================
// Component 4: Sprint Comparison
// ============================================================================
/*
export function SprintComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/metrics/tests-covered-summary');
        const result = await response.json();
        if (result.status === 'success') {
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  const sprints = data.sprints;
  const aggregate = data.aggregate;

  return (
    <div className="sprint-comparison">
      <h2>Sprint Comparison</h2>
      
      <div className="aggregate-stats">
        <h3>Aggregate Stats</h3>
        <div className="stat-box">
          <span>Total Tests:</span>
          <strong>{aggregate.total_test_cases}</strong>
        </div>
        <div className="stat-box">
          <span>Total Automated:</span>
          <strong>{aggregate.total_automated}</strong>
        </div>
        <div className="stat-box">
          <span>Overall Coverage:</span>
          <strong>{aggregate.automation_coverage_percent}%</strong>
        </div>
      </div>

      <table className="sprints-table">
        <thead>
          <tr>
            <th>Sprint</th>
            <th>Total Tests</th>
            <th>Automated</th>
            <th>Coverage %</th>
            <th>Teams</th>
          </tr>
        </thead>
        <tbody>
          {sprints.map((sprint) => (
            <tr key={sprint.sprint}>
              <td className="sprint-name">{sprint.sprint}</td>
              <td>{sprint.total_test_cases}</td>
              <td>{sprint.total_automated}</td>
              <td className="coverage-percent">
                {sprint.automation_coverage_percent}%
              </td>
              <td>{sprint.teams_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
*/

// ============================================================================
// Component 5: Tests Covered Dashboard (Full Integration)
// ============================================================================
/*
export function TestsCoveredDashboard() {
  const [selectedSprint, setSelectedSprint] = useState('26.1.2');
  const [availableSprints, setAvailableSprints] = useState([]);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await fetch('/api/metrics/tests-covered');
        const result = await response.json();
        if (result.status === 'success') {
          setAvailableSprints(result.available_sprints);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSprints();
  }, []);

  return (
    <div className="tests-covered-dashboard">
      <h1>Tests Covered Dashboard</h1>
      
      <div className="controls">
        <label>
          Select Sprint:
          <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
            {availableSprints.map((sprint) => (
              <option key={sprint} value={sprint}>
                {sprint}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dashboard-grid">
        <div className="section">
          <TestsCoveredSummary sprint={selectedSprint} />
        </div>
        
        <div className="section">
          <TestsCoveredTeamBreakdown sprint={selectedSprint} />
        </div>
        
        <div className="section full-width">
          <AutomationCoverageChart sprint={selectedSprint} />
        </div>
        
        <div className="section full-width">
          <SprintComparison />
        </div>
      </div>
    </div>
  );
}
*/

// ============================================================================
// Styling Guide (CSS)
// ============================================================================
/*
.tests-covered-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.metric {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}

.metric.highlight {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.metrics-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.metrics-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.coverage-percent {
  font-weight: bold;
  color: #2196f3;
}

.team-name {
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.section.full-width {
  grid-column: 1 / -1;
}

.controls {
  margin: 20px 0;
  display: flex;
  gap: 15px;
}

.controls select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 14px;
}
*/

// ============================================================================
// Usage Instructions
// ============================================================================
/*
SETUP INSTRUCTIONS:

1. Copy this file to your React components folder
2. Import the components in your dashboard:
   import { TestsCoveredDashboard } from './TestsCovered';

3. Add to your dashboard page:
   <TestsCoveredDashboard />

4. Make sure the API server is running:
   node server-temp.js

5. Ensure your API endpoint is accessible:
   http://localhost:3001/api/metrics/tests-covered

COMPONENT DESCRIPTIONS:

- TestsCoveredSummary: Displays key metrics in card format
- TestsCoveredTeamBreakdown: Shows detailed team statistics in table
- AutomationCoverageChart: Bar chart showing team automation distribution
- SprintComparison: Compares metrics across all sprints
- TestsCoveredDashboard: Full-featured dashboard combining all components

CUSTOMIZATION:

1. Modify colors by updating CSS classes
2. Change sprint default: sprint = '26.1.3'
3. Add filters for specific teams
4. Integrate with your existing dashboard theme
5. Add export/download functionality
6. Create custom chart types

DATA AVAILABLE:

- Total test cases
- Automated test cases count
- Automation coverage percentage
- Tests with attachments
- Team breakdown
- Historical sprint data
- Per-team statistics

API ENDPOINTS USED:

- /api/metrics/tests-covered - All sprints data
- /api/metrics/tests-covered/:sprint - Specific sprint
- /api/metrics/tests-covered-summary - Aggregated stats
- /api/metrics/tests-covered/:sprint/teams - Team breakdown
*/
