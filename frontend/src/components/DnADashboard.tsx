import React, { useState, useEffect } from 'react';
import { BugMetricsCard, QualityGuidelinesLegend, BugMetrics } from './BugMetrics';
import './DnADashboard.css';

interface Team {
  id: string;
  name: string;
  product: string;
  jiraProject?: string;
  boardId?: number;
  sprintFormat?: string;
}

interface Sprint {
  id: string;
  name: string;
  team: string;
}

interface Metric {
  id: string;
  product: string;
  team: string;
  sprint: string;
  requirementsCovered: number;
  testsCovered: number;
  defectsOpen: number;
  defectsClosed: number;
  totalBugs?: number;
  reopenedBugs?: number;
  reopenedRate?: number;
  qualityIndicator?: string;
  deploymentReadiness: number;
  codeQuality: number;
  timestamp: string;
  updatedFromJiraBugs?: boolean;
}

const API_BASE_URL = 'http://localhost:3000/api';

const DnADashboard: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [bugMetrics, setBugMetrics] = useState<BugMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);

  // Fetch DnA and T360 teams on mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch sprints when team changes
  useEffect(() => {
    if (selectedTeam) {
      fetchSprints(selectedTeam);
    }
  }, [selectedTeam]);

  // Fetch metrics when sprint changes
  useEffect(() => {
    if (selectedSprint) {
      fetchMetrics();
    }
  }, [selectedSprint]);

  const fetchTeams = async () => {
    try {
      // Fetch both DnA and T360 teams
      const [dnaResponse, t360Response] = await Promise.all([
        fetch(`${API_BASE_URL}/teams?product=dna`),
        fetch(`${API_BASE_URL}/teams?product=t360`)
      ]);
      const dnaTeams = await dnaResponse.json();
      const t360Teams = await t360Response.json();
      const allTeams = [...dnaTeams, ...t360Teams];
      setTeams(allTeams);
      if (allTeams.length > 0) {
        setSelectedTeam(allTeams[0].id);
      }
    } catch (err) {
      setError('Failed to fetch teams');
      console.error(err);
    }
  };

  const fetchSprints = async (teamId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sprints?team=${teamId}`);
      const data = await response.json();
      setSprints(data);
      if (data.length > 0) {
        // Default to sprint 26.1.2 if available
        const sprint2612 = data.find((s: Sprint) => s.id.includes('26.1.2'));
        setSelectedSprint(sprint2612 ? sprint2612.id : data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch sprints');
      console.error(err);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Determine the product for the selected team
      const currentTeam = teams.find(t => t.id === selectedTeam);
      const product = currentTeam?.product || 'dna';
      
      // Fetch ONLY live bug data from Jira API (NOT from SQL database or db.json)
      const sprintNumber = selectedSprint.split('-').pop();
      const bugEndpoint = product === 't360' 
        ? `${API_BASE_URL}/bugs/t360?team=${selectedTeam}&sprint=${sprintNumber}`
        : `${API_BASE_URL}/bugs/dna?team=${selectedTeam}&sprint=${sprintNumber}`;
      
      const bugResponse = await fetch(bugEndpoint);
      const liveBugData = await bugResponse.json();
      setBugMetrics([liveBugData]);
    } catch (err) {
      setError('Failed to fetch metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeamsBugMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const sprintNumber = selectedSprint.split('-').pop();
      // Fetch bug metrics for both DnA and T360 teams in parallel
      const [dnaResponse, t360Response] = await Promise.all([
        fetch(`${API_BASE_URL}/bugs/dna/all?sprint=${sprintNumber}`),
        fetch(`${API_BASE_URL}/bugs/t360/all?sprint=${sprintNumber}`)
      ]);
      const dnaData = await dnaResponse.json();
      const t360Data = await t360Response.json();
      const allData = [...(Array.isArray(dnaData) ? dnaData : []), ...(Array.isArray(t360Data) ? t360Data : [])];
      setBugMetrics(allData);
    } catch (err) {
      setError('Failed to fetch bug metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleTeamBugMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const sprintNumber = selectedSprint.split('-').pop();
      const currentTeam = teams.find(t => t.id === selectedTeam);
      const product = currentTeam?.product || 'dna';
      const bugEndpoint = product === 't360'
        ? `${API_BASE_URL}/bugs/t360?team=${selectedTeam}&sprint=${sprintNumber}`
        : `${API_BASE_URL}/bugs/dna?team=${selectedTeam}&sprint=${sprintNumber}`;
      
      const response = await fetch(bugEndpoint);
      const data = await response.json();
      setBugMetrics([data]);
    } catch (err) {
      setError('Failed to fetch bug metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : teamId;
  };

  return (
    <div className="dna-dashboard">
      <header className="dashboard-header">
        <h1>🧬 DnA Teams - Bug Metrics Dashboard</h1>
        <p>Real-time bug tracking with reopened bug detection from Jira</p>
      </header>

      <div className="dashboard-controls">
        <div className="control-group">
          <label htmlFor="team-select">Team:</label>
          <select
            id="team-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sprint-select">Sprint:</label>
          <select
            id="sprint-select"
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-actions">
          <button 
            className="btn-refresh"
            onClick={fetchMetrics}
            disabled={loading || !selectedSprint}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh Metrics'}
          </button>
          <button 
            className="btn-fetch-all"
            onClick={fetchAllTeamsBugMetrics}
            disabled={loading || !selectedSprint}
          >
            📊 All Teams Bug Data
          </button>
          <button 
            className="btn-fetch-single"
            onClick={fetchSingleTeamBugMetrics}
            disabled={loading || !selectedSprint || !selectedTeam}
          >
            🔍 Single Team Details
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {showGuidelines && (
        <div className="guidelines-section">
          <button 
            className="btn-toggle-guidelines"
            onClick={() => setShowGuidelines(false)}
          >
            ✕ Hide Guidelines
          </button>
          <QualityGuidelinesLegend />
        </div>
      )}

      {!showGuidelines && (
        <button 
          className="btn-show-guidelines"
          onClick={() => setShowGuidelines(true)}
        >
          📖 Show Quality Guidelines
        </button>
      )}

      <div className="metrics-overview">
        {metrics.length > 0 && (
          <div className="overview-cards">
            <div className="overview-card">
              <h4>Requirements Coverage</h4>
              <div className="overview-value">
                {metrics[0].requirementsCovered}%
              </div>
            </div>
            <div className="overview-card">
              <h4>Tests Coverage</h4>
              <div className="overview-value">
                {metrics[0].testsCovered}%
              </div>
            </div>
            <div className="overview-card">
              <h4>Deployment Readiness</h4>
              <div className="overview-value">
                {metrics[0].deploymentReadiness}%
              </div>
            </div>
            <div className="overview-card">
              <h4>Code Quality</h4>
              <div className="overview-value">
                {metrics[0].codeQuality}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bug-metrics-section">
        <h2>Bug Metrics</h2>
        {loading && <div className="loading-spinner">Loading bug data from Jira...</div>}
        
        {!loading && bugMetrics.length === 0 && (
          <div className="no-data-message">
            <p>No bug metrics available. Click "Refresh Metrics" to fetch data from Jira.</p>
          </div>
        )}

        {!loading && bugMetrics.length > 0 && (
          <div className="bug-metrics-grid">
            {bugMetrics.map((metric) => (
              <BugMetricsCard
                key={`${metric.teamId}-${metric.sprintNumber}`}
                metrics={metric}
                teamName={getTeamName(metric.teamId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DnADashboard;
