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
  // For demonstration purposes, this uses realistic per-sprint estimates.
  // To use ACTUAL JIRA data, call JiraMetricsCalculator.calculateSprintMetrics(sprint)
  // instead of this mock function

  let sprintNum = 1;
  const match = sprintName.match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    sprintNum = parseInt(match[3]); // Use last part (1-6)
  }

  // Per-sprint defect snapshots (realistic variation)
  // open = items in Open or In-Progress status (not closed/resolved)
  // closed = items in Closed or Resolved status
  const sprintSnapshots = {
    1: { open: 5, inProgress: 2, closed: 10, critical: 1, high: 2 },  // 26.1.1 - early sprint, more open
    2: { open: 3, inProgress: 3, closed: 14, critical: 0, high: 2 },  // 26.1.2 - teams fixing defects
    3: { open: 4, inProgress: 1, closed: 18, critical: 1, high: 1 },  // 26.1.3 - new defects found
    4: { open: 2, inProgress: 1, closed: 22, critical: 0, high: 1 },  // 26.1.4 - stabilizing
    5: { open: 1, inProgress: 1, closed: 24, critical: 0, high: 0 },  // 26.1.5 - mostly resolved
    6: { open: 3, inProgress: 2, closed: 27, critical: 0, high: 2 },  // 26.1.6 - regression found
  };

  // Team-specific overrides for team-scoped sprint names
  const teamDefects = {
    'vanguards': { open: 2, inProgress: 1, closed: 3, critical: 0, high: 1 },
    'athena':    { open: 1, inProgress: 1, closed: 2, critical: 0, high: 1 },
    'nexus':     { open: 1, inProgress: 0, closed: 1, critical: 0, high: 0 },
    'chubb':     { open: 1, inProgress: 0, closed: 1, critical: 0, high: 0 },
    'chargers':  { open: 1, inProgress: 0, closed: 1, critical: 0, high: 1 },
    'matrix':    { open: 0, inProgress: 1, closed: 1, critical: 0, high: 0 },
    'mavericks': { open: 0, inProgress: 0, closed: 1, critical: 0, high: 0 },
  };

  // Use team-specific data if sprint name contains a team, otherwise use snapshot
  let snapshot = sprintSnapshots[sprintNum] || sprintSnapshots[1];
  for (const [team, counts] of Object.entries(teamDefects)) {
    if (sprintName.includes(team)) {
      snapshot = counts;
      break;
    }
  }

  const { open: statusOpen, inProgress, closed: statusClosed, critical, high } = snapshot;
  const totalOpen = statusOpen + inProgress;  // everything not closed/resolved
  const total = totalOpen + statusClosed;

  // Severity distribution across open items
  const medium = Math.max(0, Math.ceil((totalOpen - critical - high) * 0.6));
  const low = Math.max(0, totalOpen - critical - high - medium);

  // Build module breakdown from current open + in-progress items
  const moduleNames = ['Auth Service', 'API Gateway', 'Dashboard', 'Database', 'Reporting'];
  const modules = [];
  let remaining = totalOpen;
  for (let i = 0; i < moduleNames.length && remaining > 0; i++) {
    const count = (i < moduleNames.length - 1) ? Math.ceil(remaining / (moduleNames.length - i)) : remaining;
    const sev = i === 0 ? 'high' : (i === 1 ? 'medium' : 'low');
    const st = (i % 2 === 0) ? 'open' : 'in-progress';
    modules.push({ module: moduleNames[i], defects: count, severity: sev, status: st });
    remaining -= count;
  }
  // Always show closed modules if there are closed defects
  if (statusClosed > 0) {
    modules.push({ module: 'Legacy Modules', defects: statusClosed, severity: 'low', status: 'closed' });
  }

  // Build mock teams data with individual bug entries
  // This matches the live Jira API response shape expected by the frontend
  const mockTeamNames = ['Vanguards', 'Athena', 'Nexus', 'Chubb', 'Chargers', 'Matrix', 'Mavericks'];
  const mockPriorities = ['Critical', 'High', 'Medium', 'Low'];
  const mockStatuses = { open: 'Open', inProgress: 'In Progress', closed: 'Closed' };
  const teams = {};
  let bugIndex = 1;

  // Distribute defects across teams proportionally
  let openRemaining = statusOpen;
  let inProgressRemaining = inProgress;
  let closedRemaining = statusClosed;
  let criticalRemaining = critical;
  let highRemaining = high;

  for (const teamName of mockTeamNames) {
    const teamBugs = [];
    // Assign open bugs
    const teamOpenCount = Math.min(openRemaining, Math.ceil(statusOpen / mockTeamNames.length));
    for (let i = 0; i < teamOpenCount && openRemaining > 0; i++) {
      let priority = 'Medium';
      if (criticalRemaining > 0) { priority = 'Critical'; criticalRemaining--; }
      else if (highRemaining > 0) { priority = 'High'; highRemaining--; }
      teamBugs.push({
        key: `MOCK-${sprintNum}${String(bugIndex++).padStart(3, '0')}`,
        summary: `[Mock] ${teamName} - Open defect in ${moduleNames[bugIndex % moduleNames.length]}`,
        status: 'Open',
        priority,
        created: new Date(Date.now() - (bugIndex * 86400000)).toISOString(),
        updated: new Date(Date.now() - (bugIndex * 3600000)).toISOString(),
        isOpen: true,
        reopened: false,
        reopenCount: 0
      });
      openRemaining--;
    }
    // Assign in-progress bugs
    const teamInProgCount = Math.min(inProgressRemaining, Math.ceil(inProgress / mockTeamNames.length));
    for (let i = 0; i < teamInProgCount && inProgressRemaining > 0; i++) {
      teamBugs.push({
        key: `MOCK-${sprintNum}${String(bugIndex++).padStart(3, '0')}`,
        summary: `[Mock] ${teamName} - In-progress fix for ${moduleNames[bugIndex % moduleNames.length]}`,
        status: 'In Progress',
        priority: 'Medium',
        created: new Date(Date.now() - (bugIndex * 86400000)).toISOString(),
        updated: new Date(Date.now() - (bugIndex * 3600000)).toISOString(),
        isOpen: true,
        reopened: false,
        reopenCount: 0
      });
      inProgressRemaining--;
    }
    // Assign closed bugs
    const teamClosedCount = Math.min(closedRemaining, Math.ceil(statusClosed / mockTeamNames.length));
    for (let i = 0; i < teamClosedCount && closedRemaining > 0; i++) {
      const isReopened = bugIndex % 7 === 0; // ~1 in 7 bugs was reopened
      teamBugs.push({
        key: `MOCK-${sprintNum}${String(bugIndex++).padStart(3, '0')}`,
        summary: `[Mock] ${teamName} - Resolved issue in ${moduleNames[bugIndex % moduleNames.length]}`,
        status: 'Closed',
        priority: 'Low',
        created: new Date(Date.now() - (bugIndex * 86400000 * 2)).toISOString(),
        updated: new Date(Date.now() - (bugIndex * 3600000)).toISOString(),
        isOpen: false,
        reopened: isReopened,
        reopenCount: isReopened ? 1 : 0
      });
      closedRemaining--;
    }

    if (teamBugs.length > 0) {
      const teamOpen = teamBugs.filter(b => b.isOpen).length;
      const teamClosed = teamBugs.filter(b => !b.isOpen).length;
      teams[teamName] = {
        open: teamOpen,
        closed: teamClosed,
        total: teamBugs.length,
        reopened: teamBugs.filter(b => b.reopened).length,
        bugs: teamBugs
      };
    }
  }

  return {
    sprint: sprintName,
    totals: {
      open: totalOpen,      // everything not closed/resolved
      closed: statusClosed,
      total: total,
      critical: critical,
      high: high
    },
    byModule: modules,
    bySeverity: {
      critical: critical,
      high: high,
      medium: medium,
      low: low
    },
    byStatus: {
      open: statusOpen,          // items in "Open" status
      'in-progress': inProgress, // items in "In Progress" status
      closed: statusClosed       // items in "Closed/Resolved" status
    },
    teams: teams
  };
}

export function getAllSprints() {
  return ['26.1.1', '26.1.2', '26.1.3'];
}
