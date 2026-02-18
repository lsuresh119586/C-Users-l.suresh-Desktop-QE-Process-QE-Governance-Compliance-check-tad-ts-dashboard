/**
 * Defect Analysis Service
 * Provides endpoints for defect data analysis
 */

export const defectSampleData = {
  totals: {
    total: 28,
    open: 18,
    critical: 2,
    high: 5,
    medium: 12,
    low: 9,
    backlog: 8,
    inProgress: 7,
    complete: 13
  },
  modules: [
    { name: 'Invoicing', count: 8 },
    { name: 'Office Companion', count: 5 },
    { name: 'Payment Processing', count: 4 },
    { name: 'LSA', count: 3 },
    { name: 'Quick Search', count: 2 },
    { name: 'Dynamic Workflow', count: 2 },
    { name: 'Help', count: 1 },
    { name: 'Phoenix', count: 1 }
  ],
  teams: {
    'Chargers': 3,
    'Chubb': 4,
    'Matrix': 2,
    'Mavericks': 5,
    'Nexus': 6,
    'Vanguards': 2
  },
  severity: {
    'SEV-1': 2,
    'SEV-2': 5,
    'SEV-3': 12,
    'SEV-4': 9
  },
  status: {
    'Backlog': 8,
    'In Progress': 7,
    'Complete': 13
  },
  defects: [
    {
      id: 'TEC-416125',
      module: 'Office Companion',
      severity: 'SEV-3',
      status: 'Backlog',
      team: 'Chargers',
      automationStatus: 'Automated',
      issue: 'Error in Office Companion - Production Environment'
    },
    {
      id: 'TEC-416175',
      module: 'Invoicing',
      severity: 'SEV-3',
      status: 'Backlog',
      team: 'Mavericks',
      automationStatus: 'Automated',
      issue: 'T360 Performance Lag on Invoices Awaiting Review'
    },
    {
      id: 'TEC-416315',
      module: 'Invoicing',
      severity: 'SEV-3',
      status: 'Backlog',
      team: 'Mavericks',
      automationStatus: 'Automated',
      issue: 'Duplicated Appeal Amounts'
    },
    {
      id: 'TEC-416040',
      module: 'Payment Processing',
      severity: 'SEV-3',
      status: 'Backlog',
      team: 'Nexus',
      automationStatus: 'Manual',
      issue: 'Payment Processing Failing'
    },
    {
      id: 'TEC-418354',
      module: 'Invoicing',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Chubb',
      automationStatus: 'Automated',
      issue: 'Manual Invoices Submit as Paid Error'
    },
    {
      id: 'TEC-417484',
      module: 'Help',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Chargers',
      automationStatus: 'Manual',
      issue: 'Update T360 Help - Permissions Directory'
    },
    {
      id: 'TEC-419541',
      module: 'Office Companion',
      severity: 'SEV-4',
      status: 'Backlog',
      team: 'Mavericks',
      automationStatus: 'Automated',
      issue: 'Cancel All does not cancel uploads'
    },
    {
      id: 'TEC-420293',
      module: 'LSA',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Chubb',
      automationStatus: 'Automated',
      issue: 'LSA Functionality not working consistently'
    },
    {
      id: 'TEC-421827',
      module: 'Office Companion',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Nexus',
      automationStatus: 'Automated',
      issue: 'Outlook Office Companion Not Working'
    },
    {
      id: 'TEC-420007',
      module: 'Dynamic Workflow',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Matrix',
      automationStatus: 'Automated',
      issue: 'Workflow diagram on details page is unusable'
    },
    {
      id: 'TEC-421546',
      module: 'Quick Search',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Chargers',
      automationStatus: 'Automated',
      issue: 'Legal Entity Search Field Issue'
    },
    {
      id: 'TEC-420669',
      module: 'Phoenix',
      severity: 'SEV-3',
      status: 'Complete',
      team: 'Vanguards',
      automationStatus: 'Automated',
      issue: 'Phoenix Afternoon Run Failed to Start'
    },
    {
      id: 'TEC-420912',
      module: 'Invoicing',
      severity: 'SEV-1',
      status: 'Complete',
      team: 'Mavericks',
      automationStatus: 'Automated',
      issue: 'T360 NA - System Down - Production Outage'
    }
  ]
};

/**
 * Get defect data by module
 */
export const getDefectsByModule = (sprint = '26.1.2') => {
  return defectSampleData;
};

/**
 * Get defects by team
 */
export const getDefectsByTeam = (team, sprint = '26.1.2') => {
  const teamDefects = defectSampleData.defects.filter(d => d.team === team);
  return {
    team,
    total: teamDefects.length,
    defects: teamDefects,
    summary: {
      critical: teamDefects.filter(d => d.severity === 'SEV-1').length,
      high: teamDefects.filter(d => d.severity === 'SEV-2').length,
      medium: teamDefects.filter(d => d.severity === 'SEV-3').length,
      low: teamDefects.filter(d => d.severity === 'SEV-4').length
    }
  };
};

/**
 * Get defects by severity
 */
export const getDefectsBySeverity = (sprint = '26.1.2') => {
  return {
    sev1: defectSampleData.defects.filter(d => d.severity === 'SEV-1'),
    sev2: defectSampleData.defects.filter(d => d.severity === 'SEV-2'),
    sev3: defectSampleData.defects.filter(d => d.severity === 'SEV-3'),
    sev4: defectSampleData.defects.filter(d => d.severity === 'SEV-4')
  };
};

/**
 * Get defects by module
 */
export const getDefectsByModuleName = (module, sprint = '26.1.2') => {
  const moduleDefects = defectSampleData.defects.filter(d => d.module === module);
  return {
    module,
    total: moduleDefects.length,
    defects: moduleDefects
  };
};

/**
 * Get defects by status
 */
export const getDefectsByStatus = (sprint = '26.1.2') => {
  return {
    backlog: defectSampleData.defects.filter(d => d.status === 'Backlog'),
    inProgress: defectSampleData.defects.filter(d => d.status === 'In Progress'),
    complete: defectSampleData.defects.filter(d => d.status === 'Complete')
  };
};

export default {
  getDefectsByModule,
  getDefectsByTeam,
  getDefectsBySeverity,
  getDefectsByModuleName,
  getDefectsByStatus
};
