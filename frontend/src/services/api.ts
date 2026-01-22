import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Team {
  id: number;
  name: string;
  displayName: string;
  product: string;
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

  async getTeams(): Promise<Team[]> {
    const response = await api.get<Team[]>('/teams');
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

  async createMetrics(metrics: Omit<Metrics, 'id' | 'timestamp'>): Promise<Metrics> {
    const response = await api.post<Metrics>('/metrics', metrics);
    return response.data;
  },
};
