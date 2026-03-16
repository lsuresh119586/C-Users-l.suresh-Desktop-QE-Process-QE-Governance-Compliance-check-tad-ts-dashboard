export const PASSPORT_PRODUCT_ID = 'passport';
export const CPOD_TEAM_ID = 'cpod';

const CPOD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeIdentifier = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const isValidIsoDate = (value) => {
  if (!value || !CPOD_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const getTodayUtcIsoDate = () => new Date().toISOString().slice(0, 10);

export const isCpodCalendarMode = (product, team) => {
  return normalizeIdentifier(product) === PASSPORT_PRODUCT_ID
    && normalizeIdentifier(team) === CPOD_TEAM_ID;
};

export const resolveMetricsQueryMode = ({ product, team, sprint, startDate, endDate } = {}) => {
  const normalizedProduct = normalizeIdentifier(product);
  const normalizedTeam = normalizeIdentifier(team);
  const cpodMode = isCpodCalendarMode(product, team);

  if (!cpodMode) {
    return {
      mode: 'sprint',
      filters: {
        product: normalizedProduct,
        team: normalizedTeam,
        sprint,
        ignoredDateRange: Boolean(startDate || endDate)
      }
    };
  }

  const startDateIsValid = isValidIsoDate(startDate);
  const endDateIsValid = isValidIsoDate(endDate);

  let normalizedStartDate = startDate;
  let normalizedEndDate = endDate;
  let autoFilled = false;

  if (!startDateIsValid || !endDateIsValid) {
    const today = getTodayUtcIsoDate();
    normalizedStartDate = today;
    normalizedEndDate = today;
    autoFilled = true;
  }

  if (normalizedStartDate > normalizedEndDate) {
    return {
      mode: 'cpod-calendar',
      validationError: 'Invalid CPOD date range: startDate must be earlier than or equal to endDate'
    };
  }

  return {
    mode: 'cpod-calendar',
    filters: {
      product: normalizedProduct,
      team: normalizedTeam,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      autoFilled,
      ignoredSprint: Boolean(sprint)
    }
  };
};
