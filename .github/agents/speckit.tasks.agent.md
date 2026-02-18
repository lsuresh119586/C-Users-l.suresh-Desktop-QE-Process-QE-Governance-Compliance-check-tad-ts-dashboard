# Tasks Agent

**Command:** `/speckit.tasks`

**Purpose:** Break down the technical plan into actionable, granular development tasks.

---

## Agent Behavior

When invoked with `/speckit.tasks`, this agent:

1. Reviews the specification (`spec.md`) and plan (`plan.md`)
2. Breaks down each component/feature into specific tasks
3. Sequences tasks with dependencies
4. Estimates effort (T-shirt sizes: XS, S, M, L, XL)
5. Documents tasks in `tasks.md`

---

## Task Structure

Each task should include:
- **ID**: Unique identifier (e.g., TASK-001)
- **Title**: Clear, action-oriented description
- **Description**: What needs to be done
- **Dependencies**: What must be completed first
- **Acceptance Criteria**: How to verify it's done
- **Estimate**: XS (1-2h), S (3-4h), M (1d), L (2-3d), XL (1wk)
- **Category**: Setup, Backend, Frontend, Testing, DevOps, Documentation
- **Traceability**: Links to spec requirements

---

## Task Categories

### Setup & Infrastructure
- Project scaffolding
- Docker setup
- Database initialization
- CI/CD pipelines

### Backend Development
- API endpoints
- Service layer
- Data models
- MCP integrations

### Frontend Development
- Component library
- Pages and layouts
- State management
- API client

### Database
- Schema design
- Migrations
- Seed data
- Indexes and optimization

### Testing
- Unit test setup
- Integration tests
- Playwright E2E tests
- Test data fixtures

### Documentation
- API documentation
- Developer onboarding
- Deployment guide
- User guide

---

## Example Task Format

```markdown
### TASK-001: Setup Backend API Project Structure

**Category:** Setup  
**Estimate:** S (3-4 hours)  
**Dependencies:** None  
**Traceability:** Foundation Phase from plan.md

**Description:**
Initialize the Node.js backend API project with TypeScript, Express, and testing framework.

**Acceptance Criteria:**
- [ ] `backend/api/` directory created with proper structure
- [ ] TypeScript configured with tsconfig.json
- [ ] Express server with basic health check endpoint
- [ ] Jest configured for unit testing
- [ ] ESLint and Prettier configured
- [ ] package.json with all dependencies
- [ ] README.md with setup instructions
- [ ] Server starts successfully on port 3000

**Files to Create:**
- backend/api/src/server.ts
- backend/api/src/routes/health.ts
- backend/api/tests/health.test.ts
- backend/api/package.json
- backend/api/tsconfig.json
- backend/api/.eslintrc.js
```

---

## Output

Creates `tasks.md` with:
- Task list organized by category
- Dependency graph
- Estimated timeline
- Phased implementation plan

---

## Example Usage

```
/speckit.tasks
```

---

## Guidelines

- Keep tasks small and focused (ideally completable in one sitting)
- Make acceptance criteria specific and testable
- Identify dependencies clearly
- Include testing tasks for every feature
- Don't forget documentation tasks
- Tasks should trace back to spec requirements
