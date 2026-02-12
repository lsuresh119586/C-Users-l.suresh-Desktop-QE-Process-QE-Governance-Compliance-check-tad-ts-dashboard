// Sample TAD/TS Data Generator for Demo
// This provides mock compliance data when JIRA API is not available

export function getSampleSprintData(sprintName) {
  // Parse sprint to get variation factor
  // Examples: "team-a-25.1.1", "chargers-26.1.1", "26.1.2"
  let sprintNum = 1;
  let teamFactor = 1;
  
  // Extract sprint number from name
  const match = sprintName.match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    sprintNum = parseInt(match[3]); // Use last part (1-6)
  }
  
  // Determine team for variation
  const teamBaselines = {
    'team-a': { base: 95, var: 5 },
    'chargers': { base: 110, var: 10 },
    'chubb': { base: 100, var: 8 },
    'matrix': { base: 125, var: 12 },
    'mavericks': { base: 105, var: 9 },
    'nexus': { base: 85, var: 7 },
    'vanguards': { base: 95, var: 8 }
  };
  
  let baseTotal = 100;
  let baseVariance = 10;
  for (const [team, config] of Object.entries(teamBaselines)) {
    if (sprintName.includes(team)) {
      baseTotal = config.base;
      baseVariance = config.var;
      break;
    }
  }
  
  // Vary by sprint: early sprints have fewer tests, later sprints have more
  const totalVariation = (sprintNum - 1) * 3; // 0, 3, 6, 9, 12, 15 for sprints 1-6
  const totalTests = Math.floor(baseTotal + totalVariation);
  const automatedTests = Math.floor(totalTests * (0.65 + (sprintNum - 1) * 0.05)); // Increase from 65% to 90%
  const withAttachments = Math.floor(automatedTests * (0.55 + (sprintNum - 1) * 0.05)); // Increase from 55% to 80%
  const withoutAttachments = automatedTests - withAttachments;

  // Team-specific data
  const teamCounts = {
    'Chargers': { base: 28, auto: 0.68 },
    'Chubb': { base: 22, auto: 0.64 },
    'Matrix': { base: 35, auto: 0.70 },
    'Mavericks': { base: 28, auto: 0.62 },
    'Nexus': { base: 18, auto: 0.60 },
    'Team A': { base: 20, auto: 0.65 },
    'Team B': { base: 18, auto: 0.63 },
    'Team C': { base: 16, auto: 0.61 }
  };

  // Build teams object
  const teams = {};
  let totalCount = 0;
  let totalAuto = 0;
  let totalAttach = 0;

  for (const [teamName, config] of Object.entries(teamCounts)) {
    if (totalCount >= totalTests) break;
    
    const teamTotal = Math.floor(config.base + (sprintNum - 1) * 1.5);
    const teamAuto = Math.floor(teamTotal * config.auto);
    const teamAttach = Math.floor(teamAuto * 0.65);
    
    teams[teamName] = {
      total: teamTotal,
      automated: teamAuto,
      with_attachments: teamAttach,
      without_attachments: teamAuto - teamAttach,
      test_cases: []
    };
    
    totalCount += teamTotal;
    totalAuto += teamAuto;
    totalAttach += teamAttach;
  }

  const qtestData = {
    sprint_name: sprintName,
    module_id: 68209714,
    generated: new Date().toISOString(),
    totals: {
      total: totalCount,
      automated: totalAuto,
      with_attachments: totalAttach,
      without_attachments: totalAuto - totalAttach
    },
    teams: teams
  };

  return qtestData;
}

export function getSprintDefectsData(sprintName) {
  // CALCULATION METHOD: This generates DEMO/MOCK defect data
  // In production, this should query JIRA directly using the JiraMetricsCalculator
  // which counts actual bugs with type='Bug' and filters by status (Open/Closed)
  // 
  // For demonstration purposes, this uses conservative realistic estimates:
  // - Most sprints have 0-2 open defects (reflecting typical QA cycle)
  // - Closed defects accumulate as tests and fixes progress
  // - Sprint variation is minimal (only 1 per 3 sprints grows)
  // 
  // To use ACTUAL JIRA data, call JiraMetricsCalculator.calculateSprintMetrics(sprint)
  // instead of this mock function

  let sprintNum = 1;
  const match = sprintName.match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    sprintNum = parseInt(match[3]); // Use last part (1-6)
  }

  // Realistic defect baseline by team based on actual JIRA data
  // Sprint 26.1.1 total across all teams: 17 defects
  // Distribution: vanguards=5, athena=3, nexus=2, chubb=2, chargers=2, matrix=2, mavericks=1
  const teamDefects = {
    'vanguards': { open: 2, closed: 3 },       // vanguards-26.1.1: 5 total
    'athena': { open: 1, closed: 2 },          // athena-26.1.1: 3 total
    'nexus': { open: 1, closed: 1 },           // nexus-26.1.1: 2 total
    'chubb': { open: 1, closed: 1 },           // chubb-26.1.1: 2 total
    'chargers': { open: 1, closed: 1 },        // chargers-26.1.1: 2 total
    'matrix': { open: 1, closed: 1 },          // matrix-26.1.1: 2 total
    'mavericks': { open: 0, closed: 1 }        // mavericks-26.1.1: 1 total
  };

  // Find team and get base defects
  let baseOpen = 1, baseClosed = 2;
  for (const [team, counts] of Object.entries(teamDefects)) {
    if (sprintName.includes(team)) {
      baseOpen = counts.open;
      baseClosed = counts.closed;
      break;
    }
  }

  // Slight improvement over sprints: Open stays same, Closed accumulates
  // Only add 1 closed defect every 3 sprints for gradual improvement
  const closedProgression = Math.floor(sprintNum / 3);
  const openDefects = baseOpen;
  const closedDefects = baseClosed + closedProgression;

  // Severity distribution - most are low/medium with few high priority
  const criticalPct = openDefects > 1 ? 1 : 0;
  const highPct = Math.ceil(openDefects * 0.3);
  const mediumPct = Math.ceil(openDefects * 0.4);
  const lowPct = Math.max(0, openDefects - criticalPct - highPct - mediumPct);

  return {
    sprint: sprintName,
    totals: {
      open: openDefects,
      closed: closedDefects,
      total: openDefects + closedDefects,
      critical: criticalPct,
      high: highPct
    },
    byModule: [
      { module: 'Auth Service', defects: Math.ceil(openDefects * 0.3), severity: 'high', status: 'open' },
      { module: 'API Gateway', defects: Math.ceil(openDefects * 0.2), severity: 'medium', status: 'in-progress' },
      { module: 'Dashboard', defects: Math.ceil(openDefects * 0.25), severity: 'low', status: 'open' },
      { module: 'Database', defects: Math.ceil(openDefects * 0.25), severity: 'low', status: 'closed' }
    ],
    bySeverity: {
      critical: criticalPct,
      high: highPct,
      medium: mediumPct,
      low: lowPct
    },
    byStatus: {
      open: openDefects,
      'in-progress': Math.max(0, Math.ceil(openDefects * 0.2)),
      closed: closedDefects
    }
  };
}

export function getAllSprints() {
  return ['26.1.1', '26.1.2', '26.1.3'];
}
