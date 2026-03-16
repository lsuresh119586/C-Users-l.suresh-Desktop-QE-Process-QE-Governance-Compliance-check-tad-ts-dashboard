# Specify Agent

**Command:** `/speckit.specify`

**Purpose:** Create a comprehensive, implementation-agnostic specification that defines WHAT we're building and WHY, not HOW.

---

## Agent Behavior

When invoked with `/speckit.specify [description]`, this agent:

1. Reviews the constitution and requirements
2. Defines user stories with acceptance criteria
3. Specifies functional and non-functional requirements
4. Documents data models and business logic (conceptually)
5. Creates the specification in `spec.md`

---

## Specification Structure

The specification must include:

### 1. Overview & Context
- Business problem being solved
- Target users and their needs
- Success criteria

### 2. User Stories
- Primary user journeys
- Acceptance criteria for each story
- User roles and permissions

### 3. Feature Specifications
- Dashboard views and layouts
- Metrics definitions and calculations
- Drill-down navigation flows
- Data refresh and real-time updates

### 4. Data Requirements
- Metrics to track (TAD, TS, unit coverage, functional coverage, etc.)
- Data sources (Jira, QTest, Bitbucket, SonarQube)
- Data aggregation rules
- Historical data retention

### 5. Integration Requirements
- Jira MCP Server integration
- QTest MCP Proxy integration
- Bitbucket PR linking
- SonarQube metrics (future)

### 6. Non-Functional Requirements
- Performance (load time, data refresh)
- Scalability (11 teams, 4 products)
- Security and authentication
- Export capabilities (PDF, Excel, PPT)

### 7. Quality Standards
- Testability requirements
- Playwright E2E test coverage expectations
- Unit test coverage standards (>80%)

---

## Output

Creates `spec.md` with complete specification following the structure above.

---

## Example Usage

```
/speckit.specify Create a real-time metrics dashboard for ELM organization (11 teams, 4 products) that provides visibility into sprint/release readiness, TAD/TS completion, test coverage, and SAFE-SDLC quality metrics with drill-down from org to team to story level
```

---

## Guidelines

- **Be declarative, not imperative**: "Users can filter by sprint" not "Add a dropdown menu"
- **Focus on outcomes**: "Dashboard loads in under 3 seconds" not "Use caching"
- **Be measurable**: Include specific acceptance criteria
- **Be complete**: Cover all user roles and scenarios
- **Be traceable**: Every requirement should trace to a user need
