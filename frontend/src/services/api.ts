const API_BASE_URL = 'http://localhost:3000/api';

export const apiService = {
  // Products
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/products`);
    return response.json();
  },

  // Teams
  getTeams: async (product) => {
    const params = product ? `?product=${product}` : '';
    const response = await fetch(`${API_BASE_URL}/teams${params}`);
    return response.json();
  },

  // Sprints
  getSprints: async (team, product) => {
    let params = [];
    if (team) params.push(`team=${team}`);
    if (product) params.push(`product=${product}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const response = await fetch(`${API_BASE_URL}/sprints${query}`);
    return response.json();
  },

  // Metrics
  getMetrics: async (product, team, sprint) => {
    let params = [];
    if (product) params.push(`product=${product}`);
    if (team) params.push(`team=${team}`);
    if (sprint) params.push(`sprint=${sprint}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const response = await fetch(`${API_BASE_URL}/metrics${query}`);
    return response.json();
  },

  // Add metrics
  addMetrics: async (metricsData) => {
    const response = await fetch(`${API_BASE_URL}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metricsData)
    });
    return response.json();
  },

  // Azure Pipeline — get cached data
  getAzurePipelineData: async (productId: string, project?: string) => {
    let url = `${API_BASE_URL}/azure-pipeline/${productId}`;
    if (project && project !== 'all') url += `?project=${project}`;
    const response = await fetch(url);
    return response.json();
  },

  // Azure Pipeline — trigger sync
  syncAzurePipeline: async (productId: string) => {
    const response = await fetch(`${API_BASE_URL}/azure-pipeline/sync/${productId}`, {
      method: 'POST'
    });
    return response.json();
  },

  // Azure Pipeline — export CSV
  exportAzurePipelineCsv: async (productId: string, project?: string, filters?: Record<string, string>) => {
    let params: string[] = [];
    if (project && project !== 'all') params.push(`project=${project}`);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.push(`${k}=${v}`); });
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const response = await fetch(`${API_BASE_URL}/azure-pipeline/${productId}/export/csv${query}`);
    return response;
  }
};
