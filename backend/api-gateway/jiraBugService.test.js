/**
 * Unit Tests for JiraBugService
 * Tests bug retrieval, Safe-Team filtering, reopened bug detection, and metrics calculation
 */

import { jest } from '@jest/globals';

// Set required environment variables before importing service
process.env.JIRA_API_TOKEN = 'test-token-123';
process.env.JIRA_BASE_URL = 'https://jira.test.com/jira';

// Import service after setting env vars
import JiraBugService from './jiraBugService.js';

describe('JiraBugService', () => {
  let service;

  beforeEach(() => {
    service = new JiraBugService();
    service.cache.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with environment variables', () => {
      expect(service.jiraUrl).toBe('https://jira.test.com/jira');
      expect(service.apiToken).toBe('test-token-123');
      expect(service.safeTeamField).toBe('customfield_13392');
    });

    it('should throw error if JIRA_API_TOKEN is missing', () => {
      const oldToken = process.env.JIRA_API_TOKEN;
      delete process.env.JIRA_API_TOKEN;
      
      expect(() => new JiraBugService()).toThrow('JIRA_API_TOKEN environment variable is required');
      
      process.env.JIRA_API_TOKEN = oldToken;
    });

    it('should have correct DnA team configurations', () => {
      expect(service.dnaTeams.minerva).toEqual({
        name: 'Minerva',
        jiraProject: 'ELM',
        boardId: 7437,
        sprintFormat: 'Passport D&A Minerva-{sprint}',
        safeTeamValue: 'Minerva'
      });

      expect(service.dnaTeams.guardians).toEqual({
        name: 'Guardians',
        jiraProject: 'ELM',
        boardId: 6704,
        sprintFormat: 'Passport D&A Guardians-{sprint}',
        safeTeamValue: 'Guardians'
      });

      expect(service.dnaTeams.athena).toEqual({
        name: 'Athena',
        jiraProject: 'GET',
        boardId: 6798,
        sprintFormat: 'T360 D&A Athena-{sprint}',
        safeTeamValue: 'Athena'
      });
    });

    it('should have correct T360 team configurations', () => {
      expect(service.t360Teams.vanguards).toEqual({
        name: 'Vanguards',
        jiraProject: 'GET',
        boardId: 6794,
        sprintFormat: 'T360 Vanguards-{sprint}',
        safeTeamValues: ['Vanguards', 'T360 Vanguards']
      });

      expect(service.t360Teams.chargers).toEqual({
        name: 'Chargers',
        jiraProject: 'GET',
        boardId: 6784,
        sprintFormat: 'T360 Chargers-{sprint}',
        safeTeamValues: ['Chargers', 'T360 Chargers']
      });

      expect(service.t360Teams.chubb).toEqual({
        name: 'Chubb',
        jiraProject: 'GET',
        boardId: 6793,
        sprintFormat: 'T360 ICD CHUBB-{sprint}',
        safeTeamValues: ['CHUBB', 'T360 CHUBB', 'Chubb', 'T360 Chubb']
      });

      expect(service.t360Teams.matrix).toEqual({
        name: 'Matrix',
        jiraProject: 'GET',
        boardId: 6710,
        sprintFormat: 'T360 MATRIX-{sprint}',
        safeTeamValues: ['MATRIX', 'T360 MATRIX', 'Matrix', 'T360 Matrix']
      });

      expect(service.t360Teams.mavericks).toEqual({
        name: 'Mavericks',
        jiraProject: 'GET',
        boardId: 6457,
        sprintFormat: 'T360 Mavericks-{sprint}',
        safeTeamValues: ['Maverics', 'T360 Maverics', 'Mavericks', 'T360 Mavericks']
      });

      expect(service.t360Teams.nexus).toEqual({
        name: 'Nexus',
        jiraProject: 'GET',
        boardId: 6795,
        sprintFormat: 'T360 Nexus-{sprint}',
        safeTeamValues: ['Nexus', 'T360 Nexus']
      });
    });

    it('should initialize cache with correct TTL', () => {
      expect(service.cache).toBeInstanceOf(Map);
      expect(service.cacheTTL).toBe(600000); // 10 minutes in milliseconds
    });
  });

  describe('getHeaders()', () => {
    it('should return correct authentication headers', () => {
      const headers = service.getHeaders();
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-123'
      });
    });
  });

  describe('formatSprintName()', () => {
    it('should format Minerva sprint name correctly', () => {
      expect(service.formatSprintName('minerva', '26.1.2'))
        .toBe('Passport D&A Minerva-26.1.2');
    });

    it('should format Guardians sprint name correctly', () => {
      expect(service.formatSprintName('guardians', '26.1.2'))
        .toBe('Passport D&A Guardians-26.1.2');
    });

    it('should format Athena sprint name correctly', () => {
      expect(service.formatSprintName('athena', '26.1.2'))
        .toBe('T360 D&A Athena-26.1.2');
    });

    it('should format Vanguards sprint name correctly', () => {
      expect(service.formatSprintName('vanguards', '26.1.1'))
        .toBe('T360 Vanguards-26.1.1');
    });

    it('should format Chargers sprint name correctly', () => {
      expect(service.formatSprintName('chargers', '26.1.1'))
        .toBe('T360 Chargers-26.1.1');
    });

    it('should format Chubb sprint name correctly', () => {
      expect(service.formatSprintName('chubb', '26.1.1'))
        .toBe('T360 ICD CHUBB-26.1.1');
    });

    it('should format Matrix sprint name correctly', () => {
      expect(service.formatSprintName('matrix', '26.1.1'))
        .toBe('T360 MATRIX-26.1.1');
    });

    it('should format Mavericks sprint name correctly', () => {
      expect(service.formatSprintName('mavericks', '26.1.1'))
        .toBe('T360 Mavericks-26.1.1');
    });

    it('should format Nexus sprint name correctly', () => {
      expect(service.formatSprintName('nexus', '26.1.1'))
        .toBe('T360 Nexus-26.1.1');
    });

    it('should throw error for unknown team', () => {
      expect(() => service.formatSprintName('unknown', '26.1.2'))
        .toThrow('Unknown team: unknown');
    });
  });

  describe('makeRequest()', () => {
    it('should not retry authentication errors', async () => {
      const { JiraAuthenticationError } = await import('./jiraErrors.js');
      
      jest.spyOn(service, '_makeRequestInternal')
        .mockRejectedValue(new JiraAuthenticationError());

      await expect(service.makeRequest('/test'))
        .rejects.toThrow(JiraAuthenticationError);
      
      // Should only attempt once (no retries for auth errors)
      expect(service._makeRequestInternal).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBugsForSprint()', () => {
    it('should throw error for unknown team', async () => {
      const { UnknownTeamError } = await import('./jiraErrors.js');
      
      await expect(service.getBugsForSprint('unknown', '26.1.2'))
        .rejects.toThrow(UnknownTeamError);
    });

    it('should use cache for repeated requests', async () => {
      const mockBugs = [{ 
        key: 'ELM-123',
        fields: {
          status: { name: 'Open' },
          customfield_13392: { value: 'Minerva' }
        }
      }];
      
      // Mock makeRequest to return test data
      jest.spyOn(service, 'makeRequest').mockResolvedValue({
        issues: mockBugs
      });

      // First call
      const bugs1 = await service.getBugsForSprint('minerva', '26.1.2');
      expect(service.makeRequest).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const bugs2 = await service.getBugsForSprint('minerva', '26.1.2');
      expect(service.makeRequest).toHaveBeenCalledTimes(1); // No additional call
      expect(bugs1).toEqual(bugs2);
    });

    it('should build correct JQL query for ELM teams (Minerva)', async () => {
      jest.spyOn(service, 'makeRequest').mockResolvedValue({ issues: [] });

      await service.getBugsForSprint('minerva', '26.1.2');
      
      const call = service.makeRequest.mock.calls[0];
      const payload = call[2]; // body parameter
      
      expect(payload.jql).toContain('(project = ELM OR project = "ELM Tech Ops")');
      expect(payload.jql).toContain('type = Bug');
      expect(payload.jql).toContain('sprint = "Passport D&A Minerva-26.1.2"');
    });

    it('should build correct JQL query for GET teams (Athena)', async () => {
      jest.spyOn(service, 'makeRequest').mockResolvedValue({ issues: [] });

      await service.getBugsForSprint('athena', '26.1.2');
      
      const call = service.makeRequest.mock.calls[0];
      const payload = call[2];
      
      expect(payload.jql).toContain('(project = GET OR project = "ELM Tech Ops")');
      expect(payload.jql).toContain('type = Bug');
      expect(payload.jql).toContain('sprint = "T360 D&A Athena-26.1.2"');
    });

    it('should filter bugs by Safe-Team value', async () => {
      const mockIssues = [
        {
          key: 'ELM-123',
          fields: {
            summary: 'Minerva bug',
            customfield_13392: { value: 'Minerva' }
          }
        },
        {
          key: 'ELM-456',
          fields: {
            summary: 'Guardians bug',
            customfield_13392: { value: 'Guardians' }
          }
        },
        {
          key: 'TO-789',
          fields: {
            summary: 'TO bug',
            customfield_13392: null
          }
        }
      ];

      jest.spyOn(service, 'makeRequest').mockResolvedValue({
        issues: mockIssues
      });

      const bugs = await service.getBugsForSprint('minerva', '26.1.2');
      
      // Should include Minerva bug and TO bug (null Safe-Team)
      expect(bugs).toHaveLength(2);
      expect(bugs[0].key).toBe('ELM-123');
      expect(bugs[1].key).toBe('TO-789');
    });

    it('should handle pagination correctly', async () => {
      jest.spyOn(service, 'makeRequest')
        .mockResolvedValueOnce({
          issues: Array(50).fill(null).map((_, i) => ({
            key: `ELM-${i}`,
            fields: { customfield_13392: { value: 'Minerva' } }
          }))
        })
        .mockResolvedValueOnce({
          issues: Array(10).fill(null).map((_, i) => ({
            key: `ELM-${i + 50}`,
            fields: { customfield_13392: { value: 'Minerva' } }
          }))
        });

      const bugs = await service.getBugsForSprint('minerva', '26.1.2');
      expect(bugs).toHaveLength(60); // 50 + 10
    });
  });

  describe('detectReopenedBug()', () => {
    it('should detect reopened bug', async () => {
      const mockChangelog = {
        values: [
          {
            created: '2024-01-15T10:00:00Z',
            author: { displayName: 'John Doe' },
            items: [
              {
                field: 'status',
                fromString: 'Closed',
                toString: 'Reopened'
              }
            ]
          }
        ]
      };

      jest.spyOn(service, 'makeRequest').mockResolvedValue(mockChangelog);

      const result = await service.detectReopenedBug('ELM-123');
      
      expect(result.reopened).toBe(true);
      expect(result.reopenCount).toBe(1);
      expect(result.reopenHistory).toHaveLength(1);
      expect(result.reopenHistory[0]).toEqual({
        date: '2024-01-15T10:00:00Z',
        from: 'Closed',
        to: 'Reopened',
        author: 'John Doe'
      });
    });

    it('should handle bug that was never reopened', async () => {
      const mockChangelog = {
        values: [
          {
            created: '2024-01-15T10:00:00Z',
            items: [
              {
                field: 'status',
                fromString: 'Open',
                toString: 'In Progress'
              }
            ]
          }
        ]
      };

      jest.spyOn(service, 'makeRequest').mockResolvedValue(mockChangelog);

      const result = await service.detectReopenedBug('ELM-123');
      
      expect(result.reopened).toBe(false);
      expect(result.reopenCount).toBe(0);
      expect(result.reopenHistory).toHaveLength(0);
    });

    it('should detect multiple reopens', async () => {
      const mockChangelog = {
        values: [
          {
            created: '2024-01-15T10:00:00Z',
            author: { displayName: 'John Doe' },
            items: [{ field: 'status', fromString: 'Closed', toString: 'Reopened' }]
          },
          {
            created: '2024-01-20T10:00:00Z',
            author: { displayName: 'Jane Smith' },
            items: [{ field: 'status', fromString: 'Done', toString: 'In Progress' }]
          }
        ]
      };

      jest.spyOn(service, 'makeRequest').mockResolvedValue(mockChangelog);

      const result = await service.detectReopenedBug('ELM-123');
      
      expect(result.reopened).toBe(true);
      expect(result.reopenCount).toBe(2);
      expect(result.reopenHistory).toHaveLength(2);
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(service, 'makeRequest').mockRejectedValue(new Error('API Error'));

      const result = await service.detectReopenedBug('ELM-123');
      
      expect(result.reopened).toBe(false);
      expect(result.reopenCount).toBe(0);
      expect(result.reopenHistory).toHaveLength(0);
    });
  });

  describe('calculateBugMetrics()', () => {
    beforeEach(() => {
      // Mock getBugsForSprint
      jest.spyOn(service, 'getBugsForSprint').mockResolvedValue([
        {
          key: 'ELM-123',
          fields: {
            summary: 'Bug 1',
            status: { name: 'Open' },
            priority: { name: 'High' },
            created: '2024-01-01T10:00:00Z',
            updated: '2024-01-02T10:00:00Z'
          }
        },
        {
          key: 'ELM-456',
          fields: {
            summary: 'Bug 2',
            status: { name: 'Closed' },
            priority: { name: 'Medium' },
            created: '2024-01-01T11:00:00Z',
            updated: '2024-01-03T10:00:00Z'
          }
        }
      ]);

      // Mock detectReopenedBug
      jest.spyOn(service, 'detectReopenedBug').mockImplementation(async (key) => {
        if (key === 'ELM-123') {
          return {
            reopened: true,
            reopenCount: 1,
            reopenHistory: [{ date: '2024-01-15', from: 'Closed', to: 'Reopened' }]
          };
        }
        return { reopened: false, reopenCount: 0, reopenHistory: [] };
      });
    });

    it('should calculate metrics correctly', async () => {
      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');

      expect(metrics.teamId).toBe('minerva');
      expect(metrics.sprintNumber).toBe('26.1.2');
      expect(metrics.totalBugs).toBe(2);
      expect(metrics.openBugs).toBe(1);
      expect(metrics.closedBugs).toBe(1);
      expect(metrics.reopenedBugs).toBe(1);
      expect(metrics.reopenedRate).toBe(50.0); // 1 out of 2 = 50%
      expect(metrics.qualityIndicator).toBe('Poor'); // >15%
      expect(metrics.bugDetails).toHaveLength(2);
    });

    it('should categorize quality indicator as Excellent', async () => {
      jest.spyOn(service, 'getBugsForSprint').mockResolvedValue(
        Array(20).fill(null).map((_, i) => ({
          key: `ELM-${i}`,
          fields: {
            summary: `Bug ${i}`,
            status: { name: 'Open' },
            priority: { name: 'Medium' },
            created: '2024-01-01',
            updated: '2024-01-01'
          }
        }))
      );

      jest.spyOn(service, 'detectReopenedBug').mockResolvedValue({
        reopened: false,
        reopenCount: 0,
        reopenHistory: []
      });

      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');
      expect(metrics.qualityIndicator).toBe('Excellent'); // 0%
    });

    it('should categorize quality indicator as Good', async () => {
      jest.spyOn(service, 'getBugsForSprint').mockResolvedValue(
        Array(20).fill(null).map((_, i) => ({
          key: `ELM-${i}`,
          fields: {
            summary: `Bug ${i}`,
            status: { name: 'Open' },
            priority: { name: 'Medium' },
            created: '2024-01-01',
            updated: '2024-01-01'
          }
        }))
      );

      jest.spyOn(service, 'detectReopenedBug').mockImplementation(async (key) => {
        return key === 'ELM-1' 
          ? { reopened: true, reopenCount: 1, reopenHistory: [] }
          : { reopened: false, reopenCount: 0, reopenHistory: [] };
      });

      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');
      expect(metrics.reopenedRate).toBe(5.0); // 1 out of 20 = 5%
      expect(metrics.qualityIndicator).toBe('Excellent'); // ≤5%
    });

    it('should categorize quality indicator as Needs Improvement', async () => {
      jest.spyOn(service, 'getBugsForSprint').mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          key: `ELM-${i}`,
          fields: {
            summary: `Bug ${i}`,
            status: { name: 'Open' },
            priority: { name: 'Medium' },
            created: '2024-01-01',
            updated: '2024-01-01'
          }
        }))
      );

      jest.spyOn(service, 'detectReopenedBug').mockImplementation(async (key) => {
        return key === 'ELM-1' || key === 'ELM-2'
          ? { reopened: true, reopenCount: 1, reopenHistory: [] }
          : { reopened: false, reopenCount: 0, reopenHistory: [] };
      });

      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');
      expect(metrics.reopenedRate).toBe(20.0); // 2 out of 10 = 20%
      expect(metrics.qualityIndicator).toBe('Poor'); // >15%
    });

    it('should include bug details with reopened information', async () => {
      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');

      expect(metrics.bugDetails[0]).toMatchObject({
        key: 'ELM-123',
        summary: 'Bug 1',
        status: 'Open',
        priority: 'High',
        reopened: true,
        reopenCount: 1
      });

      expect(metrics.bugDetails[1]).toMatchObject({
        key: 'ELM-456',
        summary: 'Bug 2',
        status: 'Closed',
        priority: 'Medium',
        reopened: false,
        reopenCount: 0
      });
    });

    it('should handle zero bugs gracefully', async () => {
      jest.spyOn(service, 'getBugsForSprint').mockResolvedValue([]);

      const metrics = await service.calculateBugMetrics('minerva', '26.1.2');

      expect(metrics.totalBugs).toBe(0);
      expect(metrics.reopenedRate).toBe(0);
      expect(metrics.qualityIndicator).toBe('Excellent');
    });
  });

  describe('getAllDnATeamMetrics()', () => {
    beforeEach(() => {
      jest.spyOn(service, 'calculateBugMetrics').mockImplementation(async (teamId) => ({
        teamId: teamId,
        totalBugs: 5,
        reopenedRate: 10
      }));
    });

    it('should fetch metrics for all teams', async () => {
      const results = await service.getAllDnATeamMetrics('26.1.2');

      expect(results).toHaveLength(3);
      expect(results[0].teamId).toBe('minerva');
      expect(results[1].teamId).toBe('guardians');
      expect(results[2].teamId).toBe('athena');
    });

    it('should handle errors from individual teams', async () => {
      jest.spyOn(service, 'calculateBugMetrics').mockRejectedValue(
        new Error('API Error')
      );

      await expect(service.getAllDnATeamMetrics('26.1.2'))
        .rejects.toThrow('API Error');
    });
  });

  describe('clearCache()', () => {
    it('should clear all cached data', () => {
      service.cache.set('test-key', { data: 'test' });
      expect(service.cache.size).toBe(1);

      service.clearCache();
      expect(service.cache.size).toBe(0);
    });
  });

  describe('getTeamConfig()', () => {
    it('should return DnA team config', () => {
      const config = service.getTeamConfig('minerva');
      expect(config.name).toBe('Minerva');
      expect(config.jiraProject).toBe('ELM');
    });

    it('should return T360 team config', () => {
      const config = service.getTeamConfig('vanguards');
      expect(config.name).toBe('Vanguards');
      expect(config.jiraProject).toBe('GET');
      expect(config.safeTeamValues).toEqual(['Vanguards', 'T360 Vanguards']);
    });

    it('should return null for unknown team', () => {
      const config = service.getTeamConfig('unknown');
      expect(config).toBeNull();
    });
  });

  describe('isDnaTeam()', () => {
    it('should return true for DnA teams', () => {
      expect(service.isDnaTeam('minerva')).toBe(true);
      expect(service.isDnaTeam('guardians')).toBe(true);
      expect(service.isDnaTeam('athena')).toBe(true);
    });

    it('should return false for T360 teams', () => {
      expect(service.isDnaTeam('vanguards')).toBe(false);
      expect(service.isDnaTeam('chargers')).toBe(false);
      expect(service.isDnaTeam('chubb')).toBe(false);
    });

    it('should return false for unknown teams', () => {
      expect(service.isDnaTeam('unknown')).toBe(false);
    });
  });

  describe('matchesSafeTeam()', () => {
    it('should match DnA teams with simple string', () => {
      expect(service.matchesSafeTeam('Minerva', 'Minerva')).toBe(true);
      expect(service.matchesSafeTeam('Guardians', 'Guardians')).toBe(true);
      expect(service.matchesSafeTeam('Athena', 'Athena')).toBe(true);
    });

    it('should match T360 teams without prefix', () => {
      expect(service.matchesSafeTeam('Vanguards', ['Vanguards', 'T360 Vanguards'])).toBe(true);
      expect(service.matchesSafeTeam('Chargers', ['Chargers', 'T360 Chargers'])).toBe(true);
    });

    it('should match T360 teams with prefix', () => {
      expect(service.matchesSafeTeam('T360 Vanguards', ['Vanguards', 'T360 Vanguards'])).toBe(true);
      expect(service.matchesSafeTeam('T360 Chargers', ['Chargers', 'T360 Chargers'])).toBe(true);
    });

    it('should match case-insensitively', () => {
      expect(service.matchesSafeTeam('CHUBB', ['CHUBB', 'T360 CHUBB'])).toBe(true);
      expect(service.matchesSafeTeam('chubb', ['CHUBB', 'T360 CHUBB'])).toBe(true);
      expect(service.matchesSafeTeam('T360 MATRIX', ['MATRIX', 'T360 MATRIX'])).toBe(true);
    });

    it('should handle spelling variations', () => {
      expect(service.matchesSafeTeam('Maverics', ['Maverics', 'T360 Maverics', 'Mavericks', 'T360 Mavericks'])).toBe(true);
      expect(service.matchesSafeTeam('Mavericks', ['Maverics', 'T360 Maverics', 'Mavericks', 'T360 Mavericks'])).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(service.matchesSafeTeam(null, 'Minerva')).toBe(false);
      expect(service.matchesSafeTeam(undefined, ['Vanguards', 'T360 Vanguards'])).toBe(false);
    });

    it('should return false for non-matching values', () => {
      expect(service.matchesSafeTeam('Minerva', 'Guardians')).toBe(false);
      expect(service.matchesSafeTeam('Vanguards', ['Chargers', 'T360 Chargers'])).toBe(false);
    });
  });

  describe('getAllT360TeamMetrics()', () => {
    beforeEach(() => {
      jest.spyOn(service, 'calculateBugMetrics').mockImplementation(async (teamId) => ({
        teamId: teamId,
        totalBugs: 2,
        reopenedRate: 0
      }));
    });

    it('should fetch metrics for all T360 teams', async () => {
      const results = await service.getAllT360TeamMetrics('26.1.1');

      expect(results).toHaveLength(6);
      expect(results[0].teamId).toBe('vanguards');
      expect(results[1].teamId).toBe('chargers');
      expect(results[2].teamId).toBe('chubb');
      expect(results[3].teamId).toBe('matrix');
      expect(results[4].teamId).toBe('mavericks');
      expect(results[5].teamId).toBe('nexus');
    });

    it('should handle errors from individual teams', async () => {
      jest.spyOn(service, 'calculateBugMetrics').mockRejectedValue(
        new Error('API Error')
      );

      await expect(service.getAllT360TeamMetrics('26.1.1'))
        .rejects.toThrow('API Error');
    });
  });
});

