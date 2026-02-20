# Quick Reference - TAD/TS Dashboard Integration

## 📁 Project Structure
```
spec-kit-template-claude-ps-v0.0.90/
├── backend/api-gateway/
│   ├── server.js (NEW - SQL Server + JIRA endpoints)
│   ├── jiraService.js (NEW - TAD/TS logic)
│   ├── .env (NEW - Configuration)
│   ├── .env.example (NEW - Template)
│   ├── TAD_TS_README.md (NEW - Implementation guide)
│   ├── SQL_SERVER_SETUP.md (SQL Server setup)
│   ├── package.json (Updated - Added mssql, dotenv)
│   ├── server-backup.js (Backup of old version)
│   └── db.json (Legacy - no longer used)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── services/api.ts (To be updated)
│   │   └── components/
│   │       └── (TAD/TS components - to be created)
│   └── package.json
├── INTEGRATION_SUMMARY.md (NEW - This project overview)
└── TAD_TS_INTEGRATION_PLAN.md (NEW - Architecture)
```

## 🔧 Setup Checklist

- [ ] Install Node.js dependencies: `npm install` (in backend/api-gateway)
- [ ] Create `.env` file from `.env.example`
- [ ] Get JIRA API token from https://jira.wolterskluwer.io/secure/ViewProfile.jspa
- [ ] Add JIRA token to `.env`: `JIRA_API_TOKEN=token_here`
- [ ] Set up SQL Server (Docker, Express, or Azure)
- [ ] Update SQL Server credentials in `.env`
- [ ] Test connection: `npm start`
- [ ] Test endpoints: `curl http://localhost:3000/health`

## 🚀 Running the Dashboard

### Development Mode
```powershell
cd backend/api-gateway
npm install
npm start
```

### Testing TAD/TS Endpoints
```bash
# Current sprint compliance
curl http://localhost:3000/api/tadts/compliance

# Specific sprint
curl "http://localhost:3000/api/tadts/compliance?sprint=Sprint%2026.1.1"

# Issues for a team
curl "http://localhost:3000/api/tadts/issues?team=T360%20Vanguards"
```

## 📊 Key Metrics Tracked

### TAD (Technical Architecture Document)
- ✅ Found: Has TAD/Technical Architecture documentation
- ❌ Missing: No TAD documentation
- Source: PR name or Description field

### TS (Test Strategy)
- ✅ Found: Has Test Strategy documentation
- ❌ Missing: No Test Strategy
- Source: PR name or Description field

### Statistics Calculated
- **Total Issues:** Count of all bugs and stories in sprint
- **TAD Complete:** Issues with TAD documentation (%)
- **TS Complete:** Issues with TS documentation (%)
- **Both Complete:** Issues with both TAD and TS (%)
- **Team Breakdown:** Statistics per team

## 🔑 JIRA Integration

### Supported Fields
- Issue Key (GET-12345)
- Summary
- Description
- Issue Type (Bug, Story only)
- Status
- Team (customfield_13392)
- Sprint
- PR Links (Development tab)

### Keywords Detected
**TAD:** TAD, TECHNICAL ARCHITECTURE, TECHNICAL DESIGN, ADR, ARCHITECTURE DECISION  
**TS:** TS FOR, TEST STRATEGY, TEST PLAN, TESTING STRATEGY, QA STRATEGY  
**Exclusion:** "TS FILE" (to avoid false positives)

## 📡 API Response Examples

### GET /api/tadts/compliance
```json
{
  "total": 23,
  "tadComplete": 21,
  "tsComplete": 19,
  "bothComplete": 19,
  "tadPct": "100.00",
  "tsPct": "82.61",
  "bothPct": "82.61",
  "teamBreakdown": {
    "T360 Vanguards": {
      "total": 5,
      "tadComplete": 5,
      "tsComplete": 4,
      "bothComplete": 4
    }
  },
  "issues": [
    {
      "key": "GET-12345",
      "summary": "Issue title",
      "team": "T360 Vanguards",
      "tad": {"found": true, "source": "PR"},
      "ts": {"found": true, "source": "Description"}
    }
  ]
}
```

### GET /api/tadts/issues
```json
[
  {
    "jiraKey": "GET-12345",
    "summary": "Issue title",
    "team": "T360 Vanguards",
    "tadFound": 1,
    "tadSource": "PR",
    "tsFound": 1,
    "tsSource": "Description"
  }
]
```

## 🗄️ Database Schema

### TADTSCompliance Table
| Column | Type | Purpose |
|--------|------|---------|
| id | NVARCHAR(100) | Primary key |
| sprintName | NVARCHAR(100) | Sprint identifier |
| total | INT | Total issues |
| tadComplete | INT | Issues with TAD |
| tsComplete | INT | Issues with TS |
| tadPct | FLOAT | TAD percentage |
| tsPct | FLOAT | TS percentage |
| bothPct | FLOAT | Both TAD & TS percentage |
| generatedAt | DATETIME | Analysis timestamp |

### TADTSIssues Table
| Column | Type | Purpose |
|--------|------|---------|
| id | NVARCHAR(50) | Primary key |
| jiraKey | NVARCHAR(20) | JIRA issue key |
| sprintName | NVARCHAR(100) | Sprint |
| team | NVARCHAR(100) | Team name |
| tadFound | BIT | TAD found flag |
| tadSource | NVARCHAR(50) | PR or Description |
| tsFound | BIT | TS found flag |
| tsSource | NVARCHAR(50) | PR or Description |

## 🔐 Configuration Template

```env
# SQL Server
DB_SERVER=localhost
DB_NAME=ELMDashboard
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true

# JIRA
JIRA_URL=https://jira.wolterskluwer.io/jira
JIRA_API_TOKEN=your_api_token_here
JIRA_PROJECT_KEY=GET
```

## 🐛 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| JIRA 401 Error | Regenerate API token, update .env |
| JIRA 403 Error | Check JIRA user permissions |
| SQL Connection Failed | Start SQL Server, check credentials |
| "JIRA_API_TOKEN not configured" | Add token to .env file |
| Empty results | Verify sprint name format, check JIRA project |
| Slow response | JIRA server slow, increase timeout in jiraService.js |

## 📞 Support Resources

- **Implementation Guide:** `backend/api-gateway/TAD_TS_README.md`
- **Architecture:** `TAD_TS_INTEGRATION_PLAN.md`
- **SQL Setup:** `backend/api-gateway/SQL_SERVER_SETUP.md`
- **Original Project:** `../Compliance check/tad-ts-dashboard/`
- **JIRA API Docs:** https://developer.atlassian.com/cloud/jira/rest/

## ✅ Verification Checklist

After setup, verify:
- [ ] Server starts without errors: `npm start`
- [ ] Health check works: `curl http://localhost:3000/health`
- [ ] Products endpoint works: `curl http://localhost:3000/api/products`
- [ ] TAD/TS endpoint accessible: `curl http://localhost:3000/api/tadts/compliance`
- [ ] Response includes proper data with percentages
- [ ] Database tables created in SQL Server
- [ ] No "JIRA_API_TOKEN not configured" in logs

## 📈 Next Steps (Frontend)

1. Create TAD/TS components in React
2. Add to navigation/menu
3. Connect to `/api/tadts/*` endpoints
4. Build dashboard UI
5. Add charts and visualizations
6. Implement filters and drill-down

---

**Quick Command Reference:**
```bash
# Install
npm install

# Start server
npm start

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/tadts/compliance

# View logs
tail -f server.log
```

**Important Files:**
- Configuration: `.env`
- Main API: `server.js`
- JIRA Logic: `jiraService.js`
- Docs: `TAD_TS_README.md`
