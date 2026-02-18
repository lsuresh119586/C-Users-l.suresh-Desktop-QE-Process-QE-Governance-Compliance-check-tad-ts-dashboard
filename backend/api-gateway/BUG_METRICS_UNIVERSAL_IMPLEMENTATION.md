# Universal Bug Metrics Implementation - Multi-Product Support

## Current Status

### ✅ Completed: DnA Teams (Phase 1)
- **Teams**: Minerva, Guardians, Athena
- **Implementation**: Fully operational with production-quality code
- **Bug Classification**: Simplified logic - `Closed` status = closed, all others = open
- **Features**:
  * Cross-project bug queries (primary project + "ELM Tech Ops")
  * Safe-Team field post-retrieval filtering
  * Reopened bug detection via changelog analysis
  * 10-minute caching for performance
  * Comprehensive error handling with custom error classes
  * 72.94% test coverage

### 🔄 Required: T360, Passport, Collaboration Portal Teams (Phase 2-4)

## Universal Bug Status Classification Logic

**Applied to ALL products (DnA, T360, Passport, CP):**

```javascript
// Simplified classification - implemented for DnA, ready for all products
const isClosed = (status === 'Closed');  // Only 'Closed' status
const isOpen = !isClosed;                 // All other statuses

// This includes as "Open":
// - To Verify
// - In Progress  
// - To Do
// - Reopened
// - Open
// - Any other non-Closed status
```

**Rationale**: Ensures all active bugs are properly tracked regardless of product or team.

## Required Configuration Data

To extend bug tracking to all teams, we need the following information from Jira:

### T360 Teams (6 teams)
| Team | Jira Project | Board ID | Sprint Format | Safe-Team Value |
|------|--------------|----------|---------------|-----------------|
| Vanguards | GET | **?** | **?** | **?** ("Vanguards" OR "T360 Vanguards") |
| Chargers | GET | **?** | **?** | **?** |
| Chubb | GET | **?** | **?** | **?** |
| Matrix | GET | **?** | **?** | **?** |
| Mavericks | GET | **?** | **?** | **?** |
| Nexus | GET | **?** | **?** | **?** |

**Known Data Points**:
- Sprint 26.1.1 has bug data: Vanguards (5 bugs), Chargers (2), Chubb (2), Matrix (2), Mavericks (1), Nexus (2)
- Total: 14 bugs for T360 teams in Sprint 26.1.1

### Passport Teams (3 teams)
| Team | Jira Project | Board ID | Sprint Format | Safe-Team Value |
|------|--------------|----------|---------------|-----------------|
| Team A | ELM | **?** | **?** | **?** |
| Team B | ELM | **?** | **?** | **?** |
| Team C | ELM | **?** | **?** | **?** |

### Collaboration Portal
| Team | Jira Project | Board ID | Sprint Format | Safe-Team Value |
|------|--------------|----------|---------------|-----------------|
| **?** | **?** | **?** | **?** | **?** |

## Discovery Approach

### Step 1: Query Jira for Board IDs

```bash
# Get all boards for GET project (T360 teams)
curl -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
  "https://jira.wolterskluwer.io/jira/rest/agile/1.0/board?projectKeyOrId=GET"

# Get all boards for ELM project (Passport teams)
curl -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
  "https://jira.wolterskluwer.io/jira/rest/agile/1.0/board?projectKeyOrId=ELM"
```

### Step 2: Test with Known Sprint Data

**For T360 Vanguards (example)**:
```bash
# Query bugs for Sprint 26.1.1
# Try different sprint format patterns:
# - "Sprint 26.1.1"
# - "26.1.1"  
# - "Vanguards-26.1.1"
# - "T360 Vanguards-26.1.1"

curl -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -X POST "https://jira.wolterskluwer.io/jira/rest/api/2/search" \
  -d '{
    "jql": "project = GET AND type = Bug AND sprint = \"Sprint 26.1.1\"",
    "fields": ["key", "summary", "status", "customfield_13392", "sprint"]
  }'
```

### Step 3: Analyze Safe-Team Field Values

From the query results, check `customfield_13392` (Safe-Team field) structure:
```json
{
  "fields": {
    "customfield_13392": {
      "value": "Vanguards"  // OR "T360 Vanguards"?
    }
  }
}
```

**Expected Patterns**:
- Simple format: `"Vanguards"`, `"Chargers"`, etc.
- Prefixed format: `"T360 Vanguards"`, `"T360 Chargers"`, etc.

### Step 4: Verify Bug Counts

Compare API query results with known defect counts from Sprint 26.1.1:
- Expected: 14 total bugs for T360 teams
- Validate each team's count matches db.json/SQL Server data

## Implementation Plan

### Phase 2: T360 Teams Integration

**Tasks**:
1. ✅ Update documentation (spec.md, plan.md, tasks.md) with requirements
2. 🔄 Discover T360 team configurations via Jira API queries
3. 🔄 Update `jiraBugService.js` constructor with T360 team configs:
   ```javascript
   this.t360Teams = {
     vanguards: {
       name: 'Vanguards',
       jiraProject: 'GET',
       boardId: <DISCOVERED_BOARD_ID>,
       sprintFormat: '<DISCOVERED_FORMAT>',
       safeTeamValue: '<DISCOVERED_VALUE>'
     },
     // ... other T360 teams
   };
   ```
4. 🔄 Add flexible Safe-Team matching to support both patterns:
   ```javascript
   // Match "Vanguards" OR "T360 Vanguards"
   const matches = safeTeamValue === team.safeTeamValue || 
                   safeTeamValue === `${product} ${team.safeTeamValue}`;
   ```
5. 🔄 Extend `formatSprintName()` to handle T360 sprint formats
6. 🔄 Extend `getAllTeamMetrics()` to include T360 teams
7. 🔄 Test with Sprint 26.1.1 data and verify bug counts
8. 🔄 Update API endpoints to support `product` parameter
9. 🔄 Update frontend to display bug metrics for T360 teams

### Phase 3: Passport Teams Integration

**Tasks**:
1. 🔄 Discover Passport team configurations (same approach as T360)
2. 🔄 Extend `jiraBugService.js` with Passport team configs
3. 🔄 Test and verify
4. 🔄 Update API and frontend

### Phase 4: Collaboration Portal Integration

**Tasks**:
1. 🔄 Identify CP teams and configurations
2. 🔄 Extend service
3. 🔄 Test and deploy

## Code Architecture

### Current Structure (DnA Only)
```javascript
class JiraBugService {
  constructor() {
    this.dnaTeams = {
      minerva: { /* config */ },
      guardians: { /* config */ },
      athena: { /* config */ }
    };
  }
  
  getBugsForSprint(teamId, sprintNumber) { /* ... */ }
  calculateBugMetrics(teamId, sprintNumber) { /* ... */ }
  getAllDnATeamMetrics(sprintNumber) { /* ... */ }
}
```

### Target Structure (Universal)
```javascript
class JiraBugService {
  constructor() {
    this.teams = {
      // DnA teams
      dna: {
        minerva: { product: 'dna', /* config */ },
        guardians: { product: 'dna', /* config */ },
        athena: { product: 'dna', /* config */ }
      },
      // T360 teams
      t360: {
        vanguards: { product: 't360', /* config */ },
        chargers: { product: 't360', /* config */ },
        chubb: { product: 't360', /* config */ },
        matrix: { product: 't360', /* config */ },
        mavericks: { product: 't360', /* config */ },
        nexus: { product: 't360', /* config */ }
      },
      // Passport teams
      passport: {
        teamA: { product: 'passport', /* config */ },
        teamB: { product: 'passport', /* config */ },
        teamC: { product: 'passport', /* config */ }
      },
      // Collaboration Portal teams
      cp: {
        // TBD
      }
    };
  }
  
  getBugsForSprint(product, teamId, sprintNumber) { /* ... */ }
  calculateBugMetrics(product, teamId, sprintNumber) { /* ... */ }
  getAllTeamMetrics(product, sprintNumber) { /* ... */ }
  getAllProductsMetrics(sprintNumber) { /* ... */ }
}
```

## API Endpoint Updates

### Current (DnA Only)
```
GET /api/bugs/dna?team=<teamId>&sprint=<sprint>
GET /api/bugs/dna/all?sprint=<sprint>
```

### Target (Universal)
```
GET /api/bugs?product=<product>&team=<teamId>&sprint=<sprint>
GET /api/bugs/all?product=<product>&sprint=<sprint>
GET /api/bugs/all?sprint=<sprint>  // All products
```

## Testing Strategy

### Unit Tests
- Extend existing test suite to cover all products
- Test Safe-Team matching for both simple and prefixed formats
- Test sprint format variations

### Integration Tests
```javascript
describe('Universal Bug Service', () => {
  it('should fetch bugs for DnA Minerva team', async () => { /* ... */ });
  it('should fetch bugs for T360 Vanguards team', async () => { /* ... */ });
  it('should fetch bugs for Passport Team A', async () => { /* ... */ });
  it('should handle Safe-Team variations (simple and prefixed)', async () => { /* ... */ });
});
```

### Verification Tests
- Sprint 26.1.1 T360 teams: Verify 14 total bugs
- Sprint 26.1.2 DnA teams: Verify existing counts
- Compare with defect data in db.json and SQL Server

## Next Steps

1. **Immediate**: Run Jira API queries to discover T360 team configurations
2. **Implementation**: Extend `jiraBugService.js` with discovered configurations
3. **Testing**: Verify with Sprint 26.1.1 data
4. **Deployment**: Roll out to T360 teams first, then Passport, then CP
5. **Documentation**: Update API docs and user guides

## Files to Modify

- ✅ `spec.md` - Requirements updated
- ✅ `plan.md` - Architecture documented
- ✅ `tasks.md` - Implementation roadmap updated
- 🔄 `backend/api-gateway/jiraBugService.js` - Add multi-product support
- 🔄 `backend/api-gateway/jiraBugService.test.js` - Extend tests
- 🔄 `backend/api-gateway/server.js` - Update API endpoints
- 🔄 `frontend/src/components/BugMetrics.tsx` - Support all products

## Success Criteria

- ✅ DnA teams working with simplified status classification
- 🔄 T360 teams displaying correct bug counts for Sprint 26.1.1
- 🔄 Passport teams integrated and tested
- 🔄 All teams using consistent "Closed vs Open" status logic
- 🔄 API endpoints support all products
- 🔄 Frontend displays bug metrics for all teams
- 🔄 Test coverage maintained above 70%

---

**Status**: Phase 1 (DnA) Complete ✅ | Phase 2 (T360) Configuration Discovery Required 🔄

**Last Updated**: February 16, 2026
