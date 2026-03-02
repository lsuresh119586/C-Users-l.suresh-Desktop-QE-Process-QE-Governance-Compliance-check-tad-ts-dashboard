import { processMetricsQuery } from './metricsQueryProcessor.js';

describe('processMetricsQuery', () => {
  const metrics = [
    {
      id: 'm1',
      product: 'passport',
      team: 'cpod',
      sprint: 'cpod-26.1.1',
      defectsClosed: 3,
      timestamp: '2026-02-01T10:00:00Z'
    },
    {
      id: 'm2',
      product: 'passport',
      team: 'cpod',
      sprint: 'cpod-26.1.2',
      defectsClosed: 5,
      timestamp: '2026-02-10T10:00:00Z'
    },
    {
      id: 'm3',
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-26.1.1',
      defectsClosed: 7,
      timestamp: '2026-02-03T10:00:00Z'
    }
  ];

  it('returns validation error when CPOD startDate is later than endDate', () => {
    const result = processMetricsQuery({
      metrics,
      query: {
        product: 'passport',
        team: 'cpod',
        startDate: '2026-02-20',
        endDate: '2026-02-01'
      }
    });

    expect(result.validationError).toContain('startDate');
    expect(result.modeResolution.mode).toBe('cpod-calendar');
    expect(result.filteredMetrics).toHaveLength(0);
  });

  it('ignores date-range params for non-CPOD flows and keeps sprint filtering', () => {
    const result = processMetricsQuery({
      metrics,
      query: {
        product: 'passport',
        team: 'team-a',
        sprint: 'team-a-26.1.1',
        startDate: '2026-02-01',
        endDate: '2026-02-28'
      }
    });

    expect(result.validationError).toBeNull();
    expect(result.modeResolution.mode).toBe('sprint');
    expect(result.modeResolution.filters.ignoredDateRange).toBe(true);
    expect(result.filteredMetrics).toHaveLength(1);
    expect(result.filteredMetrics[0].id).toBe('m3');
  });

  it('applies cpod calendar date-range filtering for Passport CPOD requests', () => {
    const result = processMetricsQuery({
      metrics,
      query: {
        product: 'passport',
        team: 'cpod',
        startDate: '2026-02-05',
        endDate: '2026-02-12',
        sprint: 'cpod-ignored'
      }
    });

    expect(result.validationError).toBeNull();
    expect(result.modeResolution.mode).toBe('cpod-calendar');
    expect(result.modeResolution.filters.ignoredSprint).toBe(true);
    expect(result.filteredMetrics).toHaveLength(1);
    expect(result.filteredMetrics[0].id).toBe('m2');
  });

  it('normalizes product/team values before filtering metrics', () => {
    const result = processMetricsQuery({
      metrics,
      query: {
        product: ' Passport ',
        team: ' CPOD ',
        startDate: '2026-02-01',
        endDate: '2026-02-28'
      }
    });

    expect(result.validationError).toBeNull();
    expect(result.modeResolution.mode).toBe('cpod-calendar');
    expect(result.filteredMetrics).toHaveLength(2);
    expect(result.filteredMetrics.map((item) => item.id).sort()).toEqual(['m1', 'm2']);
  });
});
