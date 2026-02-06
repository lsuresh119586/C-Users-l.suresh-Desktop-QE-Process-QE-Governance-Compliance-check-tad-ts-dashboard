# ✅ TAD/TS Dashboard + Tests Covered - Setup Checklist

## 🎉 NEW: Tests Covered Dashboard Setup

### Quick Setup (5 minutes)
1. [ ] **Start Main API** (Port 3000):
   ```bash
   cd backend/api-gateway
   node server.js
   ```

2. [ ] **Start Tests Covered API** (Port 3001):
   ```bash
   cd backend/api-gateway
   node server-temp.js
   ```

3. [ ] **Start Frontend** (Port 5173):
   ```bash
   cd frontend
   node server.js
   ```

4. [ ] **Open Dashboard**:
   - Visit http://localhost:5173/
   - Select a Product
   - Click on "Tests Covered" metric card
   - ✅ Tests Covered dashboard loads!

### Verification Checklist
- [ ] Frontend loads: http://localhost:5173/
- [ ] Products dropdown shows data
- [ ] Tests Covered card is clickable
- [ ] Tests Covered dashboard displays
- [ ] Sprint selector works
- [ ] Back button returns to main dashboard
- [ ] Team data shows in table
- [ ] Progress bars render correctly

---

## Pre-Setup Requirements
- [ ] Node.js 18.0.0+ installed
- [ ] SQL Server (local, Express, or cloud) available
- [ ] JIRA account with API token access (optional for Tests Covered)
- [ ] Text editor or IDE (VS Code recommended)
- [ ] Git (for version control)

## Step 1: Preparation
- [ ] Navigate to `backend/api-gateway/` folder
- [ ] Read `TESTS_COVERED_IMPLEMENTATION.md` - NEW!
- [ ] Read `QUICK_REFERENCE.md` for overview
- [ ] Review `TAD_TS_README.md` for details
- [ ] Backup any existing `server.js` (done: server-backup.js)

## Step 2: JIRA Configuration (Optional - for real qTest data)
- [ ] Go to https://jira.wolterskluwer.io/secure/ViewProfile.jspa
- [ ] Navigate to "API tokens" section
- [ ] Click "Create API token"
- [ ] Copy the generated token (long string starting with eyJ...)
- [ ] Save token safely (you'll need it next)

## Step 3: Environment Setup (Optional - uses sample data by default)
- [ ] Copy `.env.example` to `.env`
  ```bash
  cp .env.example .env
  ```
- [ ] Edit `.env` with your settings:
  - [ ] Add `JIRA_API_TOKEN=your_token_here` (if using qTest)
  - [ ] Verify SQL Server settings (localhost, sa user, etc.)
  - [ ] Adjust DB password if needed
- [ ] Save `.env` file

## Step 4: Dependencies Installation
- [ ] Open PowerShell/Terminal in `backend/api-gateway/`
- [ ] Run: `npm install`
- [ ] Wait for all packages to download
  - [ ] mssql (SQL Server driver)
  - [ ] dotenv (environment variables)
- [ ] Verify no errors in output

## Step 5: SQL Server Startup (Optional - database is JSON-based)
- [ ] Choose your SQL Server setup option:

### Option A: Docker
- [ ] Install Docker Desktop
- [ ] Run Docker command from `SQL_SERVER_SETUP.md`
- [ ] Wait for container to start
- [ ] Verify connection: `sqlcmd -S localhost -U sa -P YourPassword123!`

### Option B: SQL Server Express
- [ ] Download from Microsoft website
- [ ] Install SQL Server Express
- [ ] Create database: `ELMDashboard`
- [ ] Create user: `sa` with password
- [ ] Verify connection in SSMS

### Option C: Azure SQL Database
- [ ] Create Azure SQL Database instance
- [ ] Update `.env` with Azure credentials
- [ ] Test connection from Azure portal

## Step 6: Backend Testing
- [ ] Start API server: `npm start`
- [ ] Verify output shows:
  - [ ] "✅ Connected to SQL Server database"
  - [ ] "✅ Database tables initialized"
  - [ ] "🚀 API Server running on http://localhost:3000"
  - [ ] "📋 JIRA Integration: ✅ Enabled"
- [ ] Server should be listening on port 3000

## Step 7: API Endpoint Testing
Open a new terminal/PowerShell and test:

- [ ] **Health Check:**
  ```bash
  curl http://localhost:3000/health
  ```
  Expected: `{"status":"ok","database":"SQL Server","jiraConnected":true}`

- [ ] **Get Products:**
  ```bash
  curl http://localhost:3000/api/products
  ```
  Expected: Returns product list

- [ ] **TAD/TS Compliance (Current Sprint):**
  ```bash
  curl http://localhost:3000/api/tadts/compliance
  ```
  Expected: Returns compliance analysis with percentages

- [ ] **TAD/TS Compliance (Specific Sprint):**
  ```bash
  curl "http://localhost:3000/api/tadts/compliance?sprint=Sprint%2026.1.1"
  ```
  Expected: Returns analysis for that sprint

- [ ] **TAD/TS Issues:**
  ```bash
  curl http://localhost:3000/api/tadts/issues
  ```
  Expected: Returns list of issues with TAD/TS status

## Step 8: Database Verification
- [ ] Open SQL Server Management Studio
- [ ] Connect to your SQL Server instance
- [ ] Expand Databases → ELMDashboard
- [ ] Verify tables created:
  - [ ] Products
  - [ ] Teams
  - [ ] Sprints
  - [ ] Metrics
  - [ ] TADTSCompliance
  - [ ] TADTSIssues

- [ ] Query TADTSCompliance table:
  ```sql
  SELECT * FROM TADTSCompliance ORDER BY generatedAt DESC;
  ```
  Should show compliance data

## Step 9: Documentation Review
- [ ] Read `backend/api-gateway/TAD_TS_README.md`
- [ ] Read `backend/api-gateway/QUICK_REFERENCE.md`
- [ ] Read project-level `IMPLEMENTATION_COMPLETE.md`
- [ ] Review response examples
- [ ] Understand API structure

## Step 10: Troubleshooting Checks
If any step fails:

- [ ] **Server won't start:**
  - Check `.env` file syntax
  - Verify SQL Server is running
  - Check port 3000 not in use
  - Review server.js for errors

- [ ] **JIRA connection fails:**
  - Verify token is set in `.env`
  - Check JIRA URL is accessible
  - Verify token is still valid
  - Check internet connection

- [ ] **Database tables not created:**
  - Verify SQL Server connection
  - Check database exists
  - Check user has create table permissions
  - Review server logs for SQL errors

- [ ] **Empty TAD/TS results:**
  - Verify sprint name format matches JIRA
  - Check JIRA project is "GET"
  - Verify issues exist in sprint
  - Check issue type is Bug or Story

## Step 11: Next Steps
- [ ] Read `TAD_TS_INTEGRATION_PLAN.md` for frontend planning
- [ ] Review data structures in `TAD_TS_README.md`
- [ ] Plan React components to be built
- [ ] Consider caching strategy
- [ ] Plan deployment approach

## Step 12: Production Readiness
- [ ] Store JIRA token securely (Azure Key Vault, AWS Secrets)
- [ ] Set up environment-specific `.env` files
- [ ] Configure error logging
- [ ] Set up database backups
- [ ] Add rate limiting to JIRA API calls
- [ ] Set up monitoring and alerts

## Verification Checklist (All Systems Go)
- [ ] ✅ npm install completed successfully
- [ ] ✅ .env file configured with JIRA token
- [ ] ✅ SQL Server running and accessible
- [ ] ✅ npm start shows all success messages
- [ ] ✅ Health endpoint returns correct response
- [ ] ✅ TAD/TS compliance endpoint returns data
- [ ] ✅ Database tables visible in SQL Server
- [ ] ✅ Documentation reviewed and understood
- [ ] ✅ No error messages in console

## Command Reference
```powershell
# Setup
cd backend/api-gateway
npm install

# Configuration
Copy-Item .env.example .env
notepad .env

# Running
npm start

# Testing (in another terminal)
curl http://localhost:3000/health
curl http://localhost:3000/api/tadts/compliance

# Stopping
# Press Ctrl+C in terminal

# Logs
Get-Content server.log -Tail 20
```

## Support Documents
| Document | Location | Purpose |
|----------|----------|---------|
| QUICK_REFERENCE.md | backend/api-gateway/ | Quick answers & commands |
| TAD_TS_README.md | backend/api-gateway/ | Full implementation guide |
| SQL_SERVER_SETUP.md | backend/api-gateway/ | Database setup options |
| TAD_TS_INTEGRATION_PLAN.md | Project root | Architecture overview |
| IMPLEMENTATION_COMPLETE.md | Project root | Project summary |
| INTEGRATION_SUMMARY.md | Project root | What was built |

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `npm install` fails | Check Node.js version (need 18+), clear npm cache |
| JIRA 401 error | Token invalid, regenerate from JIRA profile |
| SQL connection error | Verify server running, credentials correct |
| Port 3000 in use | Find what's using port, or change PORT in server.js |
| Empty compliance data | Check sprint name format, verify JIRA access |
| Tables not created | Check SQL Server permissions, database exists |

## Progress Tracking
- [ ] Pre-Setup Requirements: __/__
- [ ] Steps 1-5 (Setup): __/5
- [ ] Step 6 (Backend): __/1
- [ ] Step 7 (Testing): __/4 endpoints
- [ ] Step 8 (Database): __/6 tables
- [ ] Steps 9-12 (Finalization): __/4
- [ ] **Overall:** __/100%

## Final Sign-Off
- [ ] All steps completed successfully
- [ ] All endpoints responding correctly
- [ ] Database tables created and populated
- [ ] Team ready to build frontend components
- [ ] Documentation reviewed
- [ ] Ready to deploy

---

**Date Started:** __________  
**Date Completed:** __________  
**Completed By:** __________  
**Notes:** ___________________________________________________________________

---

**Need Help?**
1. Check `QUICK_REFERENCE.md`
2. Review `TAD_TS_README.md`
3. Check troubleshooting section above
4. Review original dashboard: `../Compliance check/tad-ts-dashboard/`
