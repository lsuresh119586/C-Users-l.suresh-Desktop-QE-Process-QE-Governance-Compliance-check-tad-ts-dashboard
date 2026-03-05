export function applyCpodBugMetrics(metrics, bugMetrics, startDate, endDate) {
  return metrics.map(metric => ({
    ...metric,
    closedCardsCount: bugMetrics.closedCardsCount ?? 0,
    openCardsCount: bugMetrics.openCardsCount ?? 0,
    openCardsFallbackApplied: bugMetrics.openCardsFallbackApplied ?? false,
    reOpenedCardsCount: bugMetrics.reOpenedCardsCount ?? 0,
    reOpenedCardsFallbackApplied: bugMetrics.reOpenedCardsFallbackApplied ?? false,
    totalBugs: bugMetrics.totalBugs,
    defectsOpen: bugMetrics.openBugs,
    defectsClosed: bugMetrics.closedCardsCount ?? bugMetrics.closedBugs,
    reopenedBugs: bugMetrics.reopenedBugs,
    reopenedRate: bugMetrics.reopenedRate,
    qualityIndicator: bugMetrics.qualityIndicator,
    bugDetails: bugMetrics.bugDetails,
    safeTeamFilterApplied: bugMetrics.safeTeamFilterApplied ?? null,
    safeProductFilterApplied: bugMetrics.safeProductFilterApplied ?? null,
    cpodFilterMode: bugMetrics.cpodFilterMode ?? null,
    updatedFromJiraBugs: true,
    jiraBugsFetchedAt: bugMetrics.fetchedAt,
    dateRange: { startDate, endDate }
  }));
}

export function applyCpodFallbackMetrics(metrics, startDate, endDate) {
  return metrics.map(metric => ({
    ...metric,
    closedCardsCount: 0,
    openCardsCount: 0,
    openCardsFallbackApplied: true,
    reOpenedCardsCount: 0,
    reOpenedCardsFallbackApplied: true,
    defectsClosed: 0,
    cpodDataUnavailable: true,
    safeTeamFilterApplied: false,
    safeProductFilterApplied: false,
    cpodFilterMode: 'unavailable',
    dateRange: { startDate, endDate }
  }));
}
