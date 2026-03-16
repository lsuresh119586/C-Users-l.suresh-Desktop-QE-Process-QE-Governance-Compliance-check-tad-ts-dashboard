// Mock data for T360 Vanguards team - Sprint 26.1.1
export const mockMetrics = {
  team: {
    id: 1,
    name: 'Vanguards',
    displayName: 'T360 Vanguards',
    product: 'T360'
  },
  sprint: {
    name: '26.1.1',
    startDate: '2026-01-01',
    endDate: '2026-01-14'
  },
  tadTsMetrics: {
    totalStories: 24,
    tadComplete: 18,
    tadNa: 3,
    tadMissing: 3,
    tsComplete: 20,
    tsNa: 2,
    tsMissing: 2,
    tadPct: 87.5,  // (18 + 3) / 24 * 100
    tsPct: 91.7    // (20 + 2) / 24 * 100
  },
  qtestMetrics: {
    totalTestRuns: 156,
    uniqueTestCases: 89,
    automatedTestCases: 72,
    manualTestCases: 17,
    automationPct: 80.9  // 72 / 89 * 100
  },
  defectMetrics: {
    totalDefects: 12,
    reopenedDefects: 2,
    reopenedPct: 16.7,
    bySeverity: {
      'Sev 1': 1,
      'Sev 2': 3,
      'Sev 3': 6,
      'Sev 4': 2
    },
    bySdlc: {
      'Design': 2,
      'Development': 5,
      'Testing': 3,
      'Deployment': 2
    }
  }
};

// Mock data for team list
export const mockTeams = [
  { id: 1, name: 'Vanguards', displayName: 'T360 Vanguards', product: 'T360' },
  { id: 2, name: 'Nexus', displayName: 'T360 Nexus', product: 'T360' },
  { id: 3, name: 'Mavericks', displayName: 'T360 Mavericks', product: 'T360' },
  { id: 4, name: 'Matrix', displayName: 'T360 Matrix', product: 'T360' },
  { id: 5, name: 'Chubb', displayName: 'T360 Chubb', product: 'T360' },
  { id: 6, name: 'Chargers', displayName: 'T360 Chargers', product: 'T360' }
];

// Mock sprint options
export const mockSprints = [
  '26.1.1',
  '26.1.2',
  '25.4.5',
  '25.4.4',
  '25.4.3'
];
