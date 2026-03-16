import { test, expect } from '@playwright/test';
import {
  buildMetricsQuery,
  CPOD_TEAM_ID,
  getTeamOptionsForProduct,
  isCpodSelection,
  normalizeCpodDateRange,
  PASSPORT_PRODUCT_ID
} from '../../frontend/src/services/api';

test.describe('CPOD Logic - T071 to T074', () => {
  test('T071: Passport team options include CPOD only for Passport', async () => {
    const passportTeams = getTeamOptionsForProduct(PASSPORT_PRODUCT_ID, [
      { id: 'team-a', name: 'Team A' }
    ]);
    const t360Teams = getTeamOptionsForProduct('t360', [
      { id: 'vanguards', name: 'Vanguards' }
    ]);

    expect(passportTeams.some((team) => team.id === CPOD_TEAM_ID)).toBeTruthy();
    expect(t360Teams.some((team) => team.id === CPOD_TEAM_ID)).toBeFalsy();
  });

  test('T072: CPOD mode detection works only for Passport + CPOD', async () => {
    expect(isCpodSelection('passport', 'cpod')).toBeTruthy();
    expect(isCpodSelection('t360', 'cpod')).toBeFalsy();
    expect(isCpodSelection('passport', 'team-a')).toBeFalsy();
  });

  test('T073: CPOD date validation auto-fills Today-Today for missing values', async () => {
    const normalized = normalizeCpodDateRange({ startDate: '', endDate: '' });
    const today = new Date().toISOString().slice(0, 10);

    expect(normalized.startDate).toBe(today);
    expect(normalized.endDate).toBe(today);
  });

  test('T074: CPOD request query includes startDate/endDate and omits sprint', async () => {
    const query = buildMetricsQuery('passport', 'cpod', '26.1.2', {
      startDate: '2026-02-01',
      endDate: '2026-02-15'
    });

    expect(query).toContain('product=passport');
    expect(query).toContain('team=cpod');
    expect(query).toContain('startDate=2026-02-01');
    expect(query).toContain('endDate=2026-02-15');
    expect(query).not.toContain('sprint=');
  });

  test('T082: Non-CPOD request keeps sprint and ignores date-range params', async () => {
    const query = buildMetricsQuery('passport', 'team-a', '25.1.2', {
      startDate: '2026-02-01',
      endDate: '2026-02-15'
    });

    expect(query).toContain('product=passport');
    expect(query).toContain('team=team-a');
    expect(query).toContain('sprint=25.1.2');
    expect(query).not.toContain('startDate=');
    expect(query).not.toContain('endDate=');
  });
});
