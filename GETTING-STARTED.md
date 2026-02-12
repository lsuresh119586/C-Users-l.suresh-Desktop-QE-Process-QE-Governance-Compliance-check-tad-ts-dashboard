# Getting Started with Polaris Development

**Welcome to the Polaris - ELM Metrics Dashboard project!**

This document guides you through the complete Specification-Driven Development workflow using GitHub Spec Kit.

---

## 🎯 Prerequisites

- VS Code with GitHub Copilot enabled
- Access to Jira MCP Server (jira-mcp-server)
- Access to QTest MCP Proxy (qtest-mcp-proxy)
- Basic understanding of SAFE framework
- Familiarity with Node.js, Python, React

---

## 📋 Spec Kit Workflow

### Phase 1: Constitution (Optional - Already Done!)

**Command:** `/speckit.constitution`

We've already established the project constitution in `.specify/memory/constitution.md`. You can update it anytime if needed.

---

### Phase 2: Specification (START HERE!)

**Command:** `/speckit.specify`

**What it does:** Creates the comprehensive specification (`spec.md`) that defines WHAT we're building and WHY.

**How to use:**

1. Open GitHub Copilot Chat in VS Code
2. Make sure you're in the project root directory
3. Run the command:

```
/speckit.specify Create a real-time metrics dashboard for ELM organization (11 teams, 4 products) that provides visibility into sprint/release readiness, TAD/TS completion, test coverage, and SAFE-SDLC quality metrics with drill-down from org → product → team → sprint → story level. Include all metrics from requirements questionnaire and reference provided screenshots for UI design.
```

**Expected Output:** Complete `spec.md` file with:
- User stories with acceptance criteria
- Detailed metric definitions
- Integration requirements
- Non-functional requirements
- Testing requirements

**Time:** 10-15 minutes for AI generation, 30 minutes for your review

---

### Phase 3: Technical Planning

**Command:** `/speckit.plan`

**What it does:** Creates the technical implementation plan (`plan.md`) that defines HOW we'll build it.

**How to use:**

1. Review and finalize `spec.md` first!
2. Run the command:

```
/speckit.plan Use React with Chart.js for frontend (rich visualizations), Node.js/TypeScript + Python/FastAPI for backend microservices, PostgreSQL with TimescaleDB for time-series metrics, Redis for caching, Docker deployment on internal VM. Integrate with existing Jira MCP Server and QTest MCP Proxy. Comprehensive Playwright E2E testing with MCP tools. Unit test coverage >80%.
```

**Expected Output:** Complete `plan.md` file with:
- System architecture
- Technology stack with rationale
- Complete project structure
- Component design
- Integration architecture
- Testing strategy
- Development phases

**Time:** 15-20 minutes for AI generation, 30-60 minutes for your review

---

### Phase 4: Task Breakdown

**Command:** `/speckit.tasks`

**What it does:** Breaks down the plan into granular, actionable development tasks.

**How to use:**

1. Review and finalize `plan.md` first!
2. Run the command:

```
/speckit.tasks
```

**Expected Output:** Complete `tasks.md` file with:
- 100-120 detailed tasks
- Task dependencies
- Effort estimates
- Phased implementation plan
- Testing tasks for every feature

**Time:** 20-30 minutes for AI generation, 1-2 hours for your review and prioritization

---

### Phase 5: Implementation

**Command:** `/speckit.implement [task-id or description]`

**What it does:** Executes implementation of specific tasks with full traceability.

**How to use:**

For a specific task:
```
/speckit.implement TASK-001
```

For a feature:
```
/speckit.implement Add TAD completion rate calculation with Jira MCP integration
```

**Expected Output:**
- Production code
- Comprehensive unit tests (>80% coverage)
- Integration tests (if applicable)
- E2E tests with Playwright MCP (if user-facing)
- Documentation updates
- Task marked complete in tasks.md

**Best Practice:** Implement one task at a time, verify it works, then move to the next!

---

## 🚀 Quick Start (First 30 Minutes)

### Step 1: Review Your Answers (5 min)
Open `requirements-questionnaire.md` and verify all your answers are complete and accurate.

### Step 2: Review Constitution (2 min)
Read `.specify/memory/constitution.md` - these are our guiding principles.

### Step 3: Create Specification (15 min)
Run `/speckit.specify` command in Copilot Chat and review the generated spec.

### Step 4: Review Screenshots (8 min)
Compare generated spec with your provided dashboard screenshots to ensure alignment.

---

## 📚 Key Documents

### During Development, You'll Reference:

1. **requirements-questionnaire.md** - Your original requirements
2. **spec.md** - WHAT we're building (requirements & acceptance criteria)
3. **plan.md** - HOW we're building it (architecture & tech stack)
4. **tasks.md** - Breakdown of work (your development roadmap)
5. **.specify/memory/constitution.md** - Project principles

### Workflow:
```
Questionnaire → Constitution → Spec → Plan → Tasks → Implement → Test → Deploy
```

---

## 🧪 Testing Strategy

### Unit Tests
- **Coverage Goal:** >80%
- **Frameworks:** Jest (Node.js/React), Pytest (Python)
- **When:** Write for every service/component

### Integration Tests
- **What:** API endpoints, database interactions, MCP integrations
- **When:** After implementing backend services

### E2E Tests with Playwright MCP
- **What:** Complete user workflows, UI interactions, data accuracy
- **When:** After implementing user-facing features
- **Tools:** Playwright with MCP tools (browser_snapshot, verify_element_visible, etc.)

---

## 🐳 Development Environment

### Local Development Setup (After Implementation Starts)

```bash
# 1. Install dependencies
cd backend/api && npm install
cd backend/data-processor && pip install -r requirements.txt
cd frontend && npm install

# 2. Setup database
docker-compose up -d postgres redis

# 3. Run migrations
npm run migrate

# 4. Seed test data
npm run seed

# 5. Start services
npm run dev  # Backend API
python -m uvicorn main:app --reload  # Python data processor
npm start  # Frontend

# 6. Run tests
npm test  # Unit tests
npm run test:e2e  # Playwright E2E tests
```

---

## 🎯 Success Metrics

Track these throughout development:

### Development Metrics
- [ ] All tasks from tasks.md completed
- [ ] Unit test coverage >80%
- [ ] All E2E tests passing
- [ ] No critical bugs
- [ ] Performance targets met (dashboard load <3s)

### Product Metrics (After Launch)
- [ ] User adoption >80% within 2 weeks
- [ ] Time to assess release readiness reduced by 75%
- [ ] Data accuracy >99% vs source systems
- [ ] Dashboard uptime >99.5%

---

## 🤝 Best Practices

### DO:
✅ Follow the Spec Kit workflow in order (don't skip phases)  
✅ Review generated documents thoroughly before proceeding  
✅ Write tests for every feature  
✅ Commit frequently with clear traceability messages  
✅ Reference task IDs in all commits  
✅ Keep tasks small (<1 day ideally)  
✅ Use Playwright MCP for E2E testing  
✅ Document as you go  

### DON'T:
❌ Skip specification phase and jump to coding  
❌ Implement without tests  
❌ Hardcode configuration values  
❌ Use `any` types in TypeScript  
❌ Leave console.log in production code  
❌ Implement tasks out of dependency order  
❌ Skip code review (even if self-review)  

---

## 📞 Need Help?

### Common Questions

**Q: Can I modify the spec after starting implementation?**  
A: Yes! Specs are living documents. Update spec.md, then regenerate affected parts of plan.md and tasks.md.

**Q: What if I want to change the tech stack?**  
A: Update plan.md with rationale, regenerate tasks.md. Make sure it doesn't conflict with constitution principles.

**Q: How do I track my progress?**  
A: Use tasks.md as your checklist. Mark tasks complete as you finish them.

**Q: What if a task is too big?**  
A: Break it down into smaller sub-tasks. Add them to tasks.md with proper dependencies.

---

## 🎉 Ready to Start!

You have everything you need:
- ✅ Complete project structure
- ✅ Requirements gathered
- ✅ Constitution established
- ✅ Spec Kit workflow configured
- ✅ Testing strategy defined
- ✅ Best practices documented

**Next Action:** Open Copilot Chat and run `/speckit.specify` to create your specification!

Good luck! You're building something awesome! 🚀
