---
description: Execute the implementation planning workflow using the plan template to generate design artifacts. Includes Tests Covered architecture.
handoffs: 
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## ✅ Tests Covered Architecture (COMPLETED)

**System Design**: 3-layer Node.js API + HTML/React Frontend

**Layer 1: Main API (Port 3000)**
- Server: `backend/api-gateway/server.js`
- Endpoints: `/api/products`, `/api/teams`, `/api/sprints`, `/api/metrics`
- Database: JSON file (`db.json`)
- Response: Products, teams, sprints, baseline metrics

**Layer 2: Tests Covered API (Port 3001)**
- Server: `backend/api-gateway/server-temp.js`
- Endpoints: 
  - GET `/api/metrics/tests-covered` - Overall metrics
  - GET `/api/metrics/tests-covered/:sprint` - Sprint metrics
  - GET `/api/metrics/tests-covered/:sprint/teams` - Team breakdown
- Data Source: Sample generator or qTest API
- Response: Test counts, automation %, team breakdown

**Layer 3: Frontend (Port 5173)**
- Server: `frontend/server.js`
- Main Dashboard: `frontend/index.html`
- Tests Covered Dashboard: Embedded or `frontend/tests-covered.html`
- Navigation: Clickable Tests Covered card → dedicated dashboard
- Framework: Vanilla HTML/CSS/JavaScript or React component

**Data Model - Tests Covered**:
```json
{
  "sprint": "26.1.1",
  "total_tests": 345,
  "automated_tests": 287,
  "manual_tests": 58,
  "coverage_percentage": 83.2,
  "teams": [
    {
      "name": "Chubb",
      "total": 69,
      "automated": 58,
      "manual": 11,
      "coverage": 84.1
    }
  ]
}
```

**Integration Points**:
1. Main dashboard loads Tests Covered metrics
2. Click "Tests Covered" card → opens dedicated dashboard
3. Sprint selector filters data
4. Team table shows breakdown
5. Back button returns to main dashboard

**qTest Integration** (`backend/api-gateway/qtest-service.js`):
- Requires valid qTest API token
- Methods: fetch test cases, calculate coverage, format response
- Fallback: Sample data generator when token unavailable

**Sample Data Generator**:
- Creates 345 test cases across 5 teams (Chubb, Matrix, Mavericks, Nexus, Vanguards)
- 3 sprints (26.1.1, 26.1.2, 26.1.3)
- Average automation coverage: 83.2%
- Location: `backend/api-gateway/generate-sample-data.js`

---

## Outline (Standard Planning Process)

1. **Setup**: Run `.specify/scripts/powershell/setup-plan.ps1 -Json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file

### Phase 2: Validation & Gate

1. **Validate Phase 1 outputs**: Ensure all artifacts exist and match template format
2. **Re-check constitution**: No violations introduced by design
3. **Report status**: PASS (proceed to tasks phase) or FAIL (list violations)

**OUTPUT**: All design artifacts ready for task generation
