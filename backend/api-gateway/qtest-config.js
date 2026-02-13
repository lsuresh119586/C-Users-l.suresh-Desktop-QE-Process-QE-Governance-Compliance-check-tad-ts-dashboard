// QTest Configuration - Sprint Test Design Integration
// Maps sprints to their corresponding QTest test design project IDs

module.exports = {
  // QTest Base URL
  qtest_base_url: 'https://wk.qtestnet.com/p/114345/portal/project',
  
  // Sprint Test Design Project Mappings
  // Format: "team-sprint" => { projectId, testDesignId }
  sprints: {
    // T360 Sprints
    't360-26.1.1': {
      projectId: 68209713,
      testDesignPath: '#id=68209713&object=0&tab=testdesign',
      team: 't360',
      sprint: '26.1.1',
      name: 'T360 Sprint 26.1.1'
    },
    
    // Other sprints (default project)
    'chargers-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'chargers',
      sprint: '26.1.1',
      name: 'Chargers Sprint 26.1.1'
    },
    'chargers-26.1.3': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'chargers',
      sprint: '26.1.3',
      name: 'Chargers Sprint 26.1.3'
    },
    'chargers-26.1.4': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'chargers',
      sprint: '26.1.4',
      name: 'Chargers Sprint 26.1.4'
    },
    'chargers-26.1.6': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'chargers',
      sprint: '26.1.6',
      name: 'Chargers Sprint 26.1.6'
    },
    
    // Matrix Sprints
    'matrix-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'matrix',
      sprint: '26.1.1',
      name: 'Matrix Sprint 26.1.1'
    },
    'matrix-26.1.4': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'matrix',
      sprint: '26.1.4',
      name: 'Matrix Sprint 26.1.4'
    },
    
    // Vanguards Sprints
    'vanguards-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'vanguards',
      sprint: '26.1.1',
      name: 'Vanguards Sprint 26.1.1'
    },
    
    // Athena Sprints
    'athena-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'athena',
      sprint: '26.1.1',
      name: 'Athena Sprint 26.1.1'
    },
    
    // Nexus Sprints
    'nexus-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'nexus',
      sprint: '26.1.1',
      name: 'Nexus Sprint 26.1.1'
    },
    
    // Chubb Sprints
    'chubb-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'chubb',
      sprint: '26.1.1',
      name: 'Chubb Sprint 26.1.1'
    },
    
    // Mavericks Sprints
    'mavericks-26.1.1': {
      projectId: 68180756,
      testDesignPath: '#id=68180756&object=0&tab=testdesign',
      team: 'mavericks',
      sprint: '26.1.1',
      name: 'Mavericks Sprint 26.1.1'
    }
  },
  
  // QTest API Configuration
  api: {
    base_url: 'https://wk.qtestnet.com/api/v3',
    project_id: 114345,
    timeout: 30000,
    retry_count: 3
  },
  
  // Test case status mapping
  test_case_status: {
    'Not Started': 'not_started',
    'In Progress': 'in_progress',
    'Ready for Execution': 'ready',
    'Passed': 'passed',
    'Failed': 'failed',
    'Blocked': 'blocked',
    'Skipped': 'skipped'
  }
};
