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
  }
};
