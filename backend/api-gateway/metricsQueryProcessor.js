import { resolveMetricsQueryMode } from './cpodQueryMode.js';

export const processMetricsQuery = ({ metrics = [], query = {} } = {}) => {
  const { product, team, sprint, startDate, endDate } = query;
  const modeResolution = resolveMetricsQueryMode({ product, team, sprint, startDate, endDate });

  if (modeResolution.validationError) {
    return {
      validationError: modeResolution.validationError,
      modeResolution,
      filteredMetrics: []
    };
  }

  let filteredMetrics = Array.isArray(metrics) ? [...metrics] : [];
  const normalizedProduct = modeResolution.filters?.product;
  const normalizedTeam = modeResolution.filters?.team;

  if (normalizedProduct) {
    filteredMetrics = filteredMetrics.filter(
      (metric) => String(metric.product || '').trim().toLowerCase() === normalizedProduct
    );
  }

  if (normalizedTeam) {
    filteredMetrics = filteredMetrics.filter(
      (metric) => String(metric.team || '').trim().toLowerCase() === normalizedTeam
    );
  }

  if (modeResolution.mode === 'cpod-calendar') {
    const { startDate: resolvedStartDate, endDate: resolvedEndDate } = modeResolution.filters;
    filteredMetrics = filteredMetrics.filter((metric) => {
      const metricDate = metric.timestamp ? String(metric.timestamp).slice(0, 10) : '';
      return metricDate >= resolvedStartDate && metricDate <= resolvedEndDate;
    });
  } else if (sprint) {
    filteredMetrics = filteredMetrics.filter((metric) => metric.sprint === sprint);
  }

  return {
    validationError: null,
    modeResolution,
    filteredMetrics
  };
};
