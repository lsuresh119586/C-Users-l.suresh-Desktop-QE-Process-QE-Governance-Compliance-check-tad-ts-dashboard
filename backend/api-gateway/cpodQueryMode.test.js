import { isCpodCalendarMode, resolveMetricsQueryMode } from './cpodQueryMode.js';

describe('isCpodCalendarMode', () => {
  it('returns true for Passport + CPOD regardless of case and whitespace', () => {
    expect(isCpodCalendarMode(' Passport ', ' CPOD ')).toBe(true);
  });

  it('returns false for non-passport or non-cpod values', () => {
    expect(isCpodCalendarMode('passport', 'team-a')).toBe(false);
    expect(isCpodCalendarMode('t360', 'cpod')).toBe(false);
  });
});

describe('resolveMetricsQueryMode', () => {
  it('defaults to sprint mode when called without params', () => {
    const result = resolveMetricsQueryMode();

    expect(result.mode).toBe('sprint');
    expect(result.validationError).toBeUndefined();
    expect(result.filters.ignoredDateRange).toBe(false);
  });

  it('uses calendar mode and ignores sprint for Passport CPOD', () => {
    const result = resolveMetricsQueryMode({
      product: ' Passport ',
      team: 'CPOD ',
      sprint: 'team-a-25.1.1',
      startDate: '2026-02-01',
      endDate: '2026-02-10'
    });

    expect(result.mode).toBe('cpod-calendar');
    expect(result.validationError).toBeUndefined();
    expect(result.filters.ignoredSprint).toBe(true);
    expect(result.filters.product).toBe('passport');
    expect(result.filters.team).toBe('cpod');
    expect(result.filters.startDate).toBe('2026-02-01');
    expect(result.filters.endDate).toBe('2026-02-10');
  });

  it('rejects CPOD requests when startDate is later than endDate', () => {
    const result = resolveMetricsQueryMode({
      product: 'passport',
      team: 'cpod',
      startDate: '2026-02-15',
      endDate: '2026-02-01'
    });

    expect(result.mode).toBe('cpod-calendar');
    expect(result.validationError).toContain('startDate');
  });

  it('auto-fills CPOD dates when missing or invalid', () => {
    const result = resolveMetricsQueryMode({
      product: 'passport',
      team: 'cpod',
      startDate: '',
      endDate: 'invalid-date'
    });

    expect(result.mode).toBe('cpod-calendar');
    expect(result.validationError).toBeUndefined();
    expect(result.filters.autoFilled).toBe(true);
    expect(result.filters.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.filters.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps sprint mode and ignores date range for non-CPOD requests', () => {
    const result = resolveMetricsQueryMode({
      product: 'passport',
      team: 'team-a',
      sprint: 'team-a-25.1.2',
      startDate: '2026-02-01',
      endDate: '2026-02-03'
    });

    expect(result.mode).toBe('sprint');
    expect(result.validationError).toBeUndefined();
    expect(result.filters.sprint).toBe('team-a-25.1.2');
    expect(result.filters.ignoredDateRange).toBe(true);
  });
});
