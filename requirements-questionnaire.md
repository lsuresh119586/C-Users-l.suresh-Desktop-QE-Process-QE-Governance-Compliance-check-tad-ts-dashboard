# Polaris - ELM Metrics Dashboard: Requirements Questionnaire

**Purpose:** Gather detailed requirements before writing the specification  
**Instructions:** Please answer each section below. Add as much detail as you'd like!  
**Date:** January 21, 2026

---

## 1. TEAM & PRODUCT STRUCTURE

### 1.1 Teams
**Q: How many teams are in the ELM organization?**  
A: Ok, total product areas 3:
1. T360
2. Passport
3. DnA (Data and Analytics)
4. Collaboration Potal

**Q: What are the team names?**  
A: 
For T360:
Chubb
Chargers
Matrix
Mavericks
Vanguards
Nexus

For Passport:
Spartacles
Genesis

For Collaboration Portal:
Pioneers

For DnA:
Guardians
Athena


---

### 1.2 Products
**Q: How many products do you track?**  
A: 4 product areas like I gave before 

**Q: What are the product names?**  
A: 3 products - T360, Passport and Collaboration portal. DnA is like a common layer for analytics for all products. Makes sense?

---

### 1.3 Team-Product Alignment
**Q: Do teams align to products 1:1, or do multiple teams work on one product?**  
A: i gave the teams alignment to the products

---

### 1.4 Release Cadence
**Q: What's your release cadence?**  
- [ ] Weekly
- [YES ] Bi-weekly (every 2 weeks)
- [ ] Monthly
- [ ] Per PI (Program Increment)
- [ ] Other: _________

A: bi-weekly

---

## 2. JIRA & SAFE STRUCTURE

### 2.1 Jira Project Structure
**Q: Do you use Jira Projects per product or per team?**  
A: yes, all teams use jira

**Q: What Jira project keys are relevant?**  
A: GET is for T360, ELM is for Passport. I'll let you know the others late

---

### 2.2 Program Increment (PI)
**Q: What's your PI duration?**  
- [ ] 8 weeks
- [ ] 10 weeks
- [ ] 12 weeks
- [ ] Other: _________

A: PIs are for 3 months

**Q: How many sprints per PI?**  
A: 6 sprints

---

### 2.3 Issue Hierarchy
**Q: Do you track Features/Epics/Stories hierarchy in Jira?**  
A: Yes, everything in Jira

**Q: What issue types matter for metrics?**  
- [ ] Story
- [ ] Bug
- [ ] Task
- [ ] Sub-task
- [ ] Epic
- [ ] Feature
- [ ] Other: _________

A: All of the above except Feature I think

---

### 2.4 Custom Fields
**Q: Do you have custom Jira fields we need to track?**  
Examples:
- TAD Document link/checkbox
- Test Strategy link/checkbox
- Release version
- Team field
- Component/Product field

A: I'll give you a screenshot of my Jira screen later. Please remind me. TADs and TSs are in the develoment area in Jira and are linked as PRs.  

---

## 3. METRICS - PRIORITY RANKING

**Instructions:** Rank these metrics from 1-10 (1 = highest priority, 10 = lowest priority)

| Priority (1-10) | Metric | Notes |
|-----------------|--------|-------|
| ___ | TAD Document completion rate | % of stories with TAD documents |
| ___ | Test Strategy completion rate | % of stories with test strategies |
| ___ | Unit test coverage % | Code coverage from SonarQube/other |
| ___ | Functional test coverage % | QTest test case coverage |
| ___ | Sprint velocity/completion rate | Stories completed vs. committed |
| ___ | Release readiness score | Comprehensive quality gate score |
| ___ | Code quality metrics | SonarQube violations, code smells |
| ___ | Defect density | Bugs per story or per release |
| ___ | Defect escape rate | Bugs found in prod vs. pre-prod |
| ___ | PI Objectives health | Are we on track for PI commitments? |

A: You help me with this, based on Industry standard.

**Q: Are there other metrics not listed that you need?**  
A: I'll give you a screenshot of a sample dashboard. remind me

---

## 4. USER ROLES & PERMISSIONS

**Q: Who will use this dashboard? Check all that apply:**

- [ ] **QE Leadership** (yourself)
  - What do they need to see? _[YOUR ANSWER]_
  
- [ ] **Dev Leadership**
  - What do they need to see? _[YOUR ANSWER]_
  
- [ ] **Product Managers**
  - What do they need to see? _[YOUR ANSWER]_
  
- [ ] **Individual Contributors** (Devs/QEs)
  - What do they need to see? _[YOUR ANSWER]_
  
- [ ] **Executive Leadership**
  - What do they need to see? _[YOUR ANSWER]_

**Q: Do different roles need different views/permissions?**  
A: All of the above

---

## 5. DASHBOARD VIEWS & FEATURES

### 5.1 Data Refresh
**Q: Real-time data or scheduled refresh?**
- [ ] Real-time (live updates)
- [ ] Hourly refresh
- [ ] Daily refresh (overnight batch)
- [ ] On-demand refresh button
- [ ] Other: _________

A: All real-time needed. Unless there is a strong reason not to. 

---

### 5.2 Drill-Down Capabilities
**Q: What levels of drill-down do you need?**
- [ ] Organization level (all teams/products)
- [ ] Product level
- [ ] Team level
- [ ] Sprint/PI level
- [ ] Individual story level

A: Yes, product level and team level and sprint level tracking needed

---

### 5.3 Historical Trends
**Q: Do you need historical trend analysis?**  
- [ ] Yes - show trends over time (sprints, PIs, quarters)
- [ ] No - just current state

A: Yes_

---

### 5.4 Alerts & Notifications
**Q: Do you want alerts/notifications when metrics fall below thresholds?**  
Examples:
- TAD completion < 80% for upcoming sprint
- Unit test coverage drops below 70%
- Release readiness score < 85%

A: No alerts sent out yet, but it must show as red in the report. We'll think of alerts later

---

### 5.5 Export & Reporting
**Q: Do you need to export data?**
- [ ] PDF reports
- [ ] Excel/CSV exports
- [ ] PowerPoint slides
- [ ] API access for other tools
- [ ] Other: _________

A: yes, into pdf, excel and ppt. yes, API access points for other tools possibly

---

## 6. TECHNICAL PREFERENCES

### 6.1 Frontend Stack
**Q: Frontend technology preference?**
- [ ] React (modern, component-based)
- [ ] Vue.js (lightweight, progressive)
- [ ] Angular (enterprise, full-featured)
- [ ] Vanilla JS (simple, no framework)
- [ ] Your choice (let architect decide)

A: I don't know. Help me decide, but It's a dashboard. It needs a lot of graphs, visuals, tables , charts etc. 

---

### 6.2 Backend Stack
**Q: Backend technology preference?**
- [ ] Node.js (JavaScript/TypeScript)
- [ ] Python (Flask/FastAPI)
- [ ] .NET (C#)
- [ ] Your choice (let architect decide)

A: Node.js and Python

---

### 6.3 Database
**Q: Data storage approach?**
- [ ] SQL database (PostgreSQL, MySQL)
- [ ] NoSQL database (MongoDB)
- [ ] Cache only (Redis - no persistence)
- [ ] No database (query Jira/QTest APIs directly)
- [ ] Your choice (let architect decide)

A: maybe let's us postgreSQL

---

### 6.4 Deployment
**Q: Where/how will this be deployed?**
- [ ] Docker containers
- [ ] Cloud (AWS, Azure, GCP)
- [ ] Internal server (on-premises)
- [ ] Localhost development only (for now)
- [ ] Your choice (let architect decide)

A: Docker deployment on an internal server (VM)

---

### 6.5 Authentication
**Q: How should users authenticate?**
- [ ] Jira SSO (use Jira credentials)
- [ ] Active Directory/LDAP
- [ ] Simple login (username/password)
- [ ] No authentication (internal network only)
- [ ] Your choice (let architect decide)

A: _[YOUR ANSWER]_

---

## 7. INTEGRATION DETAILS

### 7.1 Jira MCP Server
**Q: Is your jira-mcp-server already configured and running?**  
A: _[YOUR ANSWER]_

**Q: What tools/endpoints are available in your jira-mcp-server?**  
A: _[List the tools from your server, or say "all tools from jira-mcp-server folder"]_

---

### 7.2 QTest MCP Proxy
**Q: Is your qtest-mcp-proxy configured and running?**  
A: _[YOUR ANSWER]_

**Q: What QTest projects/data can we access?**  
A: _[YOUR ANSWER]_

---

### 7.3 Other Integrations
**Q: Are there other tools/systems we need to integrate with?**
Examples:
- SonarQube (code quality)
- Azure DevOps (pipelines, repos)
- Bitbucket (code repositories)
- Confluence (documentation)
- Slack/Teams (notifications)

A: _[YOUR ANSWER - list all relevant integrations]_

---

## 8. SUCCESS CRITERIA

**Q: How will you know this dashboard is successful?**

Example criteria:
- Reduces time to assess release readiness from X hours to Y minutes
- Provides visibility into quality gaps 2 weeks before release
- Eliminates manual spreadsheet tracking
- Drives team behavior (increases TAD/TS completion rates)

A: _[YOUR ANSWER - be specific!]_

---

## 9. CONSTRAINTS & CONSIDERATIONS

**Q: Are there any constraints we should know about?**
- Budget limitations
- Timeline requirements (need it by specific date?)
- Technology restrictions (must use certain tools)
- Performance requirements (must load in < X seconds)
- Accessibility requirements (WCAG compliance)
- Browser support requirements

A: _[YOUR ANSWER]_

---

## 10. INSPIRATION & EXAMPLES

**Q: Are there existing dashboards or tools you like that we should use as inspiration?**

Examples:
- Jira dashboards you currently use
- Other metrics tools (Grafana, Tableau, Power BI)
- Screenshots or links to examples

A: _[YOUR ANSWER]_

---

## 11. PHASED APPROACH

**Q: Do you want to build this all at once, or in phases?**

Suggested phases:
- **Phase 1 (MVP)**: Basic dashboard with top 3-5 metrics, single product/team
- **Phase 2**: All metrics, all products/teams, drill-down capability
- **Phase 3**: Historical trends, alerts, exports
- **Phase 4**: Advanced features (ML predictions, recommendations)

A: _[YOUR ANSWER - how would you like to phase this?]_

---

## 12. ANYTHING ELSE?

**Q: Anything else we should know? Any special requirements, concerns, or ideas?**

A: _[YOUR ANSWER]_

---

## ✅ NEXT STEPS

Once you complete this questionnaire:
1. Save this file
2. Let me know you're done
3. I'll review your answers and ask any clarifying questions
4. We'll create the specification (`spec.md`) together
5. Then move to technical planning and implementation!

**Ready to build something awesome! 🚀**
