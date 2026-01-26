import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  id: number;
  code: string;
  name: string;
  displayName: string;
}

export interface Team {
  id: number;
  name: string;
  displayName: string;
  productId: number;
}

export interface Sprint {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface Metrics {
  id: number;
  teamId: number;
  sprintId: number;
  timestamp: string;
  tadTsMetrics: {
    totalStories: number;
    tadComplete: number;
    tadNa: number;
    tadMissing: number;
    tadPct: number;
    tsComplete: number;
    tsNa: number;
    tsMissing: number;
    tsPct: number;
  };
  qtestMetrics: {
    uniqueTestCases: number;
    automatedTestCases: number;
    manualTestCases: number;
    automationPct: number;
    totalTestRuns: number;
  };
  defectMetrics: {
    totalDefects: number;
    reopenedDefects: number;
    reopenedPct: number;
    bySeverity: Record<string, number>;
    bySdlc: Record<string, number>;
  };
}

export const apiService = {
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  async getProducts(): Promise<Product[]> {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  async getTeams(productId?: number): Promise<Team[]> {
    const response = await api.get<Team[]>('/teams', {
      params: productId ? { productId } : {}
    });
    return response.data;
  },

  async getSprints(): Promise<Sprint[]> {
    const response = await api.get<Sprint[]>('/sprints');
    return response.data;
  },

  async getMetrics(teamId: number, sprintId: number): Promise<Metrics> {
    const response = await api.get<Metrics>(`/metrics/${teamId}/${sprintId}`);
    return response.data;
  },

  async getProductMetrics(productId: number): Promise<Metrics> {
    const response = await api.get<Metrics>(`/metrics/product/${productId}`);
    return response.data;
  },

  async getTeamMetrics(teamId: number): Promise<Metrics> {
    const response = await api.get<Metrics>(`/metrics/team/${teamId}`);
    return response.data;
  },

  async createMetrics(metrics: Omit<Metrics, 'id' | 'timestamp'>): Promise<Metrics> {
    const response = await api.post<Metrics>('/metrics', metrics);
    return response.data;
  },
};
