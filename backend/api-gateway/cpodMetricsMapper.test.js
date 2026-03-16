import { applyCpodBugMetrics, applyCpodFallbackMetrics } from './cpodMetricsMapper.js';

describe('cpodMetricsMapper', () => {
  const baseMetrics = [
    {
      id: 'metric-1',
      product: 'passport',
      team: 'cpod',
      sprint: 'cpod-ignored',
      requirementsCovered: 90,
      testsCovered: 88,
      defectsOpen: 1,
      defectsClosed: 2
    }
  ];

  it('maps CPOD date-range response with integer closedCardsCount semantics', () => {
    const bugMetrics = {
      closedCardsCount: 7,
      openCardsCount: 4,
      openCardsFallbackApplied: false,
      reOpenedCardsCount: 2,
      reOpenedCardsFallbackApplied: false,
      closedBugs: 999,
      openBugs: 3,
      totalBugs: 10,
      safeTeamFilterApplied: true,
      safeProductFilterApplied: false,
      cpodFilterMode: 'fallback_without_safe_product',
      reopenedBugs: 1,
      reopenedRate: 10,
      qualityIndicator: 'Fair',
      bugDetails: [{ key: 'ELM-1' }],
      fetchedAt: '2026-03-04T12:00:00.000Z'
    };

    const result = applyCpodBugMetrics(baseMetrics, bugMetrics, '2026-03-01', '2026-03-04');

    expect(result).toHaveLength(1);
    expect(result[0].closedCardsCount).toBe(7);
    expect(Number.isInteger(result[0].closedCardsCount)).toBe(true);
    expect(result[0].openCardsCount).toBe(4);
    expect(Number.isInteger(result[0].openCardsCount)).toBe(true);
    expect(result[0].openCardsFallbackApplied).toBe(false);
    expect(result[0].reOpenedCardsCount).toBe(2);
    expect(Number.isInteger(result[0].reOpenedCardsCount)).toBe(true);
    expect(result[0].reOpenedCardsFallbackApplied).toBe(false);
    expect(result[0].defectsClosed).toBe(7);
    expect(result[0].defectsOpen).toBe(3);
    expect(result[0].safeTeamFilterApplied).toBe(true);
    expect(result[0].safeProductFilterApplied).toBe(false);
    expect(result[0].cpodFilterMode).toBe('fallback_without_safe_product');
    expect(result[0].dateRange).toEqual({ startDate: '2026-03-01', endDate: '2026-03-04' });
    expect(result[0].updatedFromJiraBugs).toBe(true);
    expect(result[0].requirementsCovered).toBe(90);
    expect(result[0].testsCovered).toBe(88);
  });

  it('returns fallback-compatible values on CPOD data source failures', () => {
    const result = applyCpodFallbackMetrics(baseMetrics, '2026-03-01', '2026-03-04');

    expect(result).toHaveLength(1);
    expect(result[0].closedCardsCount).toBe(0);
    expect(result[0].openCardsCount).toBe(0);
    expect(Number.isInteger(result[0].openCardsCount)).toBe(true);
    expect(result[0].openCardsFallbackApplied).toBe(true);
    expect(result[0].reOpenedCardsCount).toBe(0);
    expect(Number.isInteger(result[0].reOpenedCardsCount)).toBe(true);
    expect(result[0].reOpenedCardsFallbackApplied).toBe(true);
    expect(result[0].defectsClosed).toBe(0);
    expect(result[0].cpodDataUnavailable).toBe(true);
    expect(result[0].safeTeamFilterApplied).toBe(false);
    expect(result[0].safeProductFilterApplied).toBe(false);
    expect(result[0].cpodFilterMode).toBe('unavailable');
    expect(result[0].dateRange).toEqual({ startDate: '2026-03-01', endDate: '2026-03-04' });
    expect(result[0].requirementsCovered).toBe(90);
    expect(result[0].testsCovered).toBe(88);
  });

  it('preserves deterministic openCardsCount=0 for no-match CPOD responses', () => {
    const bugMetrics = {
      closedCardsCount: 2,
      openCardsCount: 0,
      openCardsFallbackApplied: false,
      reOpenedCardsCount: 0,
      reOpenedCardsFallbackApplied: false,
      openBugs: 1,
      closedBugs: 2,
      totalBugs: 3,
      fetchedAt: '2026-03-04T12:00:00.000Z'
    };

    const result = applyCpodBugMetrics(baseMetrics, bugMetrics, '2026-03-01', '2026-03-04');

    expect(result).toHaveLength(1);
    expect(result[0].openCardsCount).toBe(0);
    expect(Number.isInteger(result[0].openCardsCount)).toBe(true);
    expect(result[0].openCardsFallbackApplied).toBe(false);
    expect(result[0].reOpenedCardsCount).toBe(0);
    expect(Number.isInteger(result[0].reOpenedCardsCount)).toBe(true);
    expect(result[0].reOpenedCardsFallbackApplied).toBe(false);
  });
});
