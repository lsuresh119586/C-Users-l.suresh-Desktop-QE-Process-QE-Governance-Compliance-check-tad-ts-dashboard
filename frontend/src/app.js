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
  error: null
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
          <div class="metric-card">
            <div class="metric-label">Tests Covered</div>
            <div class="metric-value">${state.metrics.testsCovered}%</div>
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
  const productSelect = document.getElementById('product');
  const teamSelect = document.getElementById('team');
  const sprintSelect = document.getElementById('sprint');
  
  if (productSelect) productSelect.addEventListener('change', handleProductChange);
  if (teamSelect) teamSelect.addEventListener('change', handleTeamChange);
  if (sprintSelect) sprintSelect.addEventListener('change', handleSprintChange);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});
