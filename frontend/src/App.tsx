const API_BASE_URL = 'http://localhost:3000/api';

let state = {
  products: [],
  teams: [],
  sprints: [],
  metrics: null,
  selectedProduct: '',
  selectedTeam: '',
  selectedSprint: '',
  loading: false,
  error: null,
  currentView: 'dashboard' // 'dashboard' or 'testsCovered'
};

const apiService = {
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    return response.json();
  },
  getTeams: async (product) => {
    const params = product ? `?product=${product}` : '';
    const response = await fetch(`${API_BASE_URL}/teams${params}`);
    return response.json();
  },
  getSprints: async (team, product) => {
    let params = [];
    if (team) params.push(`team=${team}`);
    if (product) params.push(`product=${product}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const response = await fetch(`${API_BASE_URL}/sprints${query}`);
    return response.json();
  },
  getMetrics: async (product, team, sprint) => {
    let params = [];
    if (product) params.push(`product=${product}`);
    if (team) params.push(`team=${team}`);
    if (sprint) params.push(`sprint=${sprint}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const response = await fetch(`${API_BASE_URL}/metrics${query}`);
    return response.json();
  }
};

async function loadProducts() {
  try {
    state.loading = true;
    state.products = await apiService.getProducts();
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load products: ' + err.message;
    console.error(err);
  } finally {
    state.loading = false;
  }
  render();
}

async function handleProductChange(e) {
  state.selectedProduct = e.target.value;
  if (!state.selectedProduct) {
    state.teams = [];
    state.sprints = [];
    state.selectedTeam = '';
    state.selectedSprint = '';
    state.metrics = null;
    render();
    return;
  }
  
  try {
    state.loading = true;
    state.teams = await apiService.getTeams(state.selectedProduct);
    state.selectedTeam = '';
    state.selectedSprint = '';
    state.sprints = [];
    state.metrics = null;
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load teams: ' + err.message;
  } finally {
    state.loading = false;
  }
  render();
}

async function handleTeamChange(e) {
  state.selectedTeam = e.target.value;
  if (!state.selectedTeam) {
    state.sprints = [];
    state.selectedSprint = '';
    loadMetrics(state.selectedProduct, null, null);
    return;
  }

  try {
    state.loading = true;
    state.sprints = await apiService.getSprints(state.selectedTeam, state.selectedProduct);
    state.selectedSprint = '';
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load sprints: ' + err.message;
  } finally {
    state.loading = false;
  }
  render();
}

async function handleSprintChange(e) {
  state.selectedSprint = e.target.value;
  await loadMetrics(state.selectedProduct, state.selectedTeam, state.selectedSprint);
}

async function loadMetrics(product, team, sprint) {
  if (!product) {
    state.metrics = null;
    render();
    return;
  }

  try {
    state.loading = true;
    state.metrics = await apiService.getMetrics(product, team, sprint);
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load metrics: ' + err.message;
  } finally {
    state.loading = false;
  }
  render();
}

function render() {
  const app = document.getElementById('app');
  
  // Show Tests Covered view if selected
  if (state.currentView === 'testsCovered') {
    let html = `
      <div class="dashboard">
        <header class="dashboard-header">
          <button class="back-btn" id="backBtn">← Back to Dashboard</button>
          <h1>📊 Tests Covered Dashboard</h1>
        </header>
        <div id="testsCoveredContainer"></div>
      </div>
    `;
    app.innerHTML = html;
    
    document.getElementById('backBtn')?.addEventListener('click', () => {
      state.currentView = 'dashboard';
      render();
    });
    
    loadTestsCoveredView();
    return;
  }

  // Show main dashboard view
  let html = `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>📊 Polaris ELM Metrics Dashboard</h1>
        <p>Hierarchical Metrics View: Product → Team → Sprint</p>
      </header>

      ${state.error ? `<div class="error-message">${state.error}</div>` : ''}

      <div class="controls">
        <div class="control-group">
          <label for="product">Product</label>
          <select id="product">
            <option value="">-- Select Product --</option>
            ${state.products.map(p => `
              <option value="${p.id}" ${p.id === state.selectedProduct ? 'selected' : ''}>
                ${p.name}
              </option>
            `).join('')}
          </select>
        </div>

        ${state.teams.length > 0 ? `
          <div class="control-group">
            <label for="team">Team</label>
            <select id="team">
              <option value="">-- All Teams --</option>
              ${state.teams.map(t => `
                <option value="${t.id}" ${t.id === state.selectedTeam ? 'selected' : ''}>
                  ${t.name}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}

        ${state.sprints.length > 0 ? `
          <div class="control-group">
            <label for="sprint">Sprint</label>
            <select id="sprint">
              <option value="">-- All Sprints --</option>
              ${state.sprints.map(s => `
                <option value="${s.id}" ${s.id === state.selectedSprint ? 'selected' : ''}>
                  ${s.name}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>

      ${state.loading ? '<div class="loading">Loading...</div>' : ''}

      ${state.metrics ? `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Requirements Covered</div>
            <div class="metric-value">${state.metrics.requirementsCovered}%</div>
          </div>
          <div class="metric-card clickable" id="testsCoveredCard">
            <div class="metric-label">Tests Covered</div>
            <div class="metric-value">${state.metrics.testsCovered}%</div>
            <div class="card-hint">Click to view details →</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Open Defects</div>
            <div class="metric-value">${state.metrics.defectsOpen}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Closed Defects</div>
            <div class="metric-value">${state.metrics.defectsClosed}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Deployment Readiness</div>
            <div class="metric-value">${state.metrics.deploymentReadiness}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Code Quality</div>
            <div class="metric-value">${state.metrics.codeQuality}%</div>
          </div>
        </div>
      ` : !state.loading && state.selectedProduct ? `
        <div class="no-data">No metrics available for selected combination</div>
      ` : !state.selectedProduct ? `
        <div class="placeholder">Select a product to view metrics</div>
      ` : ''}
    </div>
  `;

  app.innerHTML = html;

  // Attach event listeners
  document.getElementById('product')?.addEventListener('change', handleProductChange);
  if (state.teams.length > 0) {
    document.getElementById('team')?.addEventListener('change', handleTeamChange);
  }
  if (state.sprints.length > 0) {
    document.getElementById('sprint')?.addEventListener('change', handleSprintChange);
  }
  
  // Tests Covered card click handler
  document.getElementById('testsCoveredCard')?.addEventListener('click', () => {
    state.currentView = 'testsCovered';
    render();
  });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});

// Load and display Tests Covered dashboard
async function loadTestsCoveredView() {
  const container = document.getElementById('testsCoveredContainer');
  if (!container) return;

  try {
    const response = await fetch('http://localhost:3001/api/metrics/tests-covered');
    const allData = await response.json();
    const sprints = Object.keys(allData).filter(k => k !== '_updated');

    if (sprints.length === 0) {
      container.innerHTML = '<div class="no-data">No sprint data available</div>';
      return;
    }

    const selectedSprint = sprints[0];
    renderTestsCoveredDashboard(allData, sprints, selectedSprint);

    const selector = document.getElementById('testsCoveredSprintSelector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        renderTestsCoveredDashboard(allData, sprints, e.target.value);
      });
    }
  } catch (error) {
    console.error('Error loading tests covered:', error);
    container.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
  }
}

function renderTestsCoveredDashboard(allData, sprints, selectedSprint) {
  const container = document.getElementById('testsCoveredContainer');
  const data = allData[selectedSprint] || {};

  const totalTests = data.totalTests || 0;
  const automatedTests = data.automatedTests || 0;
  const manualTests = data.manualTests || 0;
  const coverage = totalTests > 0 ? Math.round((automatedTests / totalTests) * 100) : 0;
  const teams = data.teams || [];

  let html = `
    <div class="tests-covered-wrapper">
      <div class="sprint-selector-wrapper">
        <label for="testsCoveredSprintSelector">Sprint:</label>
        <select id="testsCoveredSprintSelector">
          ${sprints.map(s => `<option value="${s}" ${s === selectedSprint ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>

      <div class="metrics-grid">
        <div class="metric-card highlight">
          <div class="metric-label">Automation Coverage</div>
          <div class="metric-value">${coverage}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${coverage}%"></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Tests</div>
          <div class="metric-value">${totalTests}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Automated Tests</div>
          <div class="metric-value">${automatedTests}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Manual Tests</div>
          <div class="metric-value">${manualTests}</div>
        </div>
      </div>

      <div class="content-section">
        <h2>Team Breakdown</h2>
        ${teams.length > 0 ? `
          <table class="teams-table">
            <thead>
              <tr>
                <th>Team</th>
                <th class="numeric">Total Tests</th>
                <th class="numeric">Automated</th>
                <th class="numeric">Manual</th>
                <th class="numeric">Coverage</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map(team => {
                const teamCoverage = team.totalTests > 0 ? Math.round((team.automatedTests / team.totalTests) * 100) : 0;
                return `
                  <tr>
                    <td class="team-name">${team.name}</td>
                    <td class="numeric">${team.totalTests}</td>
                    <td class="numeric">${team.automatedTests}</td>
                    <td class="numeric">${team.manualTests}</td>
                    <td class="numeric">
                      ${teamCoverage}%
                      <div class="mini-progress">
                        <div class="mini-progress-fill" style="width: ${teamCoverage}%"></div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : '<div class="no-data">No team data available</div>'}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Reattach event listener
  const selector = document.getElementById('testsCoveredSprintSelector');
  if (selector) {
    selector.removeEventListener('change', null);
    selector.addEventListener('change', (e) => {
      renderTestsCoveredDashboard(allData, sprints, e.target.value);
    });
  }
}
