import React, { useState } from 'react';
import './BugMetrics.css';

interface BugDetail {
  key: string;
  summary: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  isOpen: boolean;
  isClosed: boolean;
  reopened: boolean;
  reopenCount: number;
  reopenHistory: Array<{
    date: string;
    from: string;
    to: string;
    author: string;
  }>;
}

interface BugMetrics {
  teamId: string;
  sprintNumber: string;
  totalBugs: number;
  openBugs: number;
  closedBugs: number;
  reopenedBugs: number;
  reopenedRate: number;
  qualityIndicator: string;
  bugDetails: BugDetail[];
  fetchedAt: string;
  processingTimeSeconds: number;
}

interface BugMetricsCardProps {
  metrics: BugMetrics;
  teamName: string;
}

const BugMetricsCard: React.FC<BugMetricsCardProps> = ({ metrics, teamName }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReopenedOnly, setShowReopenedOnly] = useState(false);

  const getQualityBadgeClass = (indicator: string): string => {
    switch (indicator) {
      case 'Excellent':
        return 'badge-excellent';
      case 'Good':
        return 'badge-good';
      case 'Needs Improvement':
        return 'badge-needs-improvement';
      case 'Poor':
        return 'badge-poor';
      default:
        return 'badge-unknown';
    }
  };

  const getQualityColor = (indicator: string): string => {
    switch (indicator) {
      case 'Excellent':
        return '#4caf50'; // Green
      case 'Good':
        return '#ffc107'; // Yellow
      case 'Needs Improvement':
        return '#ff9800'; // Orange
      case 'Poor':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };

  const filteredBugs = showReopenedOnly
    ? metrics.bugDetails.filter(bug => bug.reopened)
    : metrics.bugDetails;

  return (
    <div className="bug-metrics-card">
      <div className="bug-metrics-header">
        <h3>{teamName} - Sprint {metrics.sprintNumber}</h3>
        <div className={`quality-badge ${getQualityBadgeClass(metrics.qualityIndicator)}`}>
          {metrics.qualityIndicator}
        </div>
      </div>

      <div className="bug-metrics-summary">
        <div className="metric-item">
          <span className="metric-label">Total Bugs</span>
          <span className="metric-value">{metrics.totalBugs}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Open</span>
          <span className="metric-value open">{metrics.openBugs}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Closed</span>
          <span className="metric-value closed">{metrics.closedBugs}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Reopened</span>
          <span className="metric-value reopened">{metrics.reopenedBugs}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Reopened Rate</span>
          <span 
            className="metric-value rate"
            style={{ color: getQualityColor(metrics.qualityIndicator) }}
          >
            {metrics.reopenedRate}%
          </span>
        </div>
      </div>

      <div className="bug-metrics-actions">
        <button 
          className="btn-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        {metrics.reopenedBugs > 0 && (
          <button 
            className="btn-filter"
            onClick={() => setShowReopenedOnly(!showReopenedOnly)}
          >
            {showReopenedOnly ? 'Show All' : 'Reopened Only'}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="bug-details">
          <div className="bug-details-header">
            <h4>Bug Details ({filteredBugs.length})</h4>
          </div>
          <div className="bug-list">
            {filteredBugs.map((bug) => (
              <div key={bug.key} className={`bug-item ${bug.reopened ? 'reopened' : ''}`}>
                <div className="bug-main">
                  <a 
                    href={`https://jira.wolterskluwer.io/jira/browse/${bug.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bug-key"
                  >
                    {bug.key}
                  </a>
                  <span className="bug-summary">{bug.summary}</span>
                </div>
                <div className="bug-meta">
                  <span className={`bug-status status-${bug.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {bug.status}
                  </span>
                  <span className={`bug-priority priority-${bug.priority.toLowerCase()}`}>
                    {bug.priority}
                  </span>
                  {bug.reopened && (
                    <span className="bug-reopened-badge" title={`Reopened ${bug.reopenCount} time(s)`}>
                      🔄 Reopened ({bug.reopenCount})
                    </span>
                  )}
                </div>
                {bug.reopened && bug.reopenHistory.length > 0 && (
                  <div className="reopen-history">
                    <strong>Reopen History:</strong>
                    <ul>
                      {bug.reopenHistory.map((history, idx) => (
                        <li key={idx}>
                          {new Date(history.date).toLocaleDateString()} - 
                          {history.from} → {history.to} 
                          (by {history.author})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bug-metrics-footer">
        <small>
          Fetched: {new Date(metrics.fetchedAt).toLocaleString()} 
          ({metrics.processingTimeSeconds}s)
        </small>
      </div>
    </div>
  );
};

const QualityGuidelinesLegend: React.FC = () => {
  return (
    <div className="quality-guidelines">
      <h4>Reopened Bugs Quality Indicators</h4>
      <div className="guidelines-list">
        <div className="guideline-item">
          <span className="guideline-badge badge-excellent">Excellent</span>
          <span className="guideline-range">0-5%</span>
          <span className="guideline-desc">Very low reopening rate</span>
        </div>
        <div className="guideline-item">
          <span className="guideline-badge badge-good">Good</span>
          <span className="guideline-range">6-10%</span>
          <span className="guideline-desc">Acceptable reopening rate</span>
        </div>
        <div className="guideline-item">
          <span className="guideline-badge badge-needs-improvement">Needs Improvement</span>
          <span className="guideline-range">11-15%</span>
          <span className="guideline-desc">Higher than expected</span>
        </div>
        <div className="guideline-item">
          <span className="guideline-badge badge-poor">Poor</span>
          <span className="guideline-range">&gt;15%</span>
          <span className="guideline-desc">Requires immediate attention</span>
        </div>
      </div>
    </div>
  );
};

export { BugMetricsCard, QualityGuidelinesLegend };
export type { BugMetrics, BugDetail };
