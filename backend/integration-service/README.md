# Polaris Data Integration Service

Python service that orchestrates data collection from Jira, QTest, and Bitbucket to populate the Polaris ELM Metrics Dashboard.

## Features

**Phase 1 Week 2 (Current)**:
- ✅ Fetch Jira stories via Jira MCP Server
- ✅ Extract TAD/TS status via Jira MCP tools
- ✅ Transform data to metrics format
- ✅ Push metrics to Polaris API Gateway
- ✅ Sync all teams for active sprint

**Phase 1 Week 3 (Upcoming)**:
- ⏳ QTest integration for test cases
- ⏳ Bitbucket PR parsing for TAD/TS
- ⏳ Defect fetching and classification
- ⏳ Scheduled periodic sync (every 15 minutes)

## Prerequisites

- Python 3.11+
- Jira MCP Server running (from `jira-mcp-server` project)
- Polaris API Gateway running (localhost:3000)
- Valid Jira API Token (PAT)

## Installation

### 1. Set up Python environment

```powershell
cd backend/integration-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and update values:

```powershell
cp .env.example .env
# Edit .env with your credentials
```

Required configuration:
```env
JIRA_MCP_SERVER_PATH=C:\\path\\to\\jira-mcp-server\\index.js
JIRA_API_TOKEN=your-jira-pat-token
JIRA_BASE_URL=https://jira.wolterskluwer.io/jira
POLARIS_API_URL=http://localhost:3000/api
```

## Usage

### Run once (manual sync)

```powershell
python integration_service.py
```

### Run with periodic sync (future)

```python
# In main():
schedule.every(15).minutes.do(service.sync_all_teams)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Data Integration Service (Python)                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  JiraMCPClient → Calls Jira MCP Server via stdio        ││
│  │    - get_my_issues: Fetch stories                       ││
│  │    - get_tad_document: Extract TAD status               ││
│  │    - get_test_strategy: Extract TS status               ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  DataIntegrationService                                  ││
│  │    - fetch_jira_stories()                                ││
│  │    - fetch_tad_ts_status()                               ││
│  │    - transform_to_metrics()                              ││
│  └─────────────────────────────────────────────────────────┘│
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  PolarisAPIClient → POST /api/metrics                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Fetch Teams & Sprints**: GET from Polaris API to know what to sync
2. **For each team**:
   - Fetch Jira stories via MCP (get_my_issues)
   - For each story: Fetch TAD/TS status via MCP
   - Fetch defects via MCP (future)
   - Fetch test cases via QTest MCP (future)
3. **Transform**: Aggregate into metrics format
4. **Push**: POST metrics to Polaris API

## Logging

Logs are written to:
- **Console**: Real-time output
- **File**: `integration_service.log` (rotating)

Log levels:
- INFO: Normal operations
- WARNING: Non-critical issues (e.g., feature not implemented)
- ERROR: Failures with stack traces
- DEBUG: Detailed MCP communication (set `LOG_LEVEL=DEBUG`)

## Troubleshooting

**Issue**: `JIRA_MCP_SERVER_PATH not configured`
- **Solution**: Create `.env` file with correct path to `jira-mcp-server/index.js`

**Issue**: `Jira MCP server not found`
- **Solution**: Verify path exists, use absolute path

**Issue**: `MCP server timeout`
- **Solution**: Ensure Jira MCP server is accessible, check credentials

**Issue**: `Failed to push metrics`
- **Solution**: Verify Polaris API Gateway is running on localhost:3000

**Issue**: `Story parsing not yet implemented`
- **Current**: Phase 1 Week 2 scope - full Jira parsing comes in Week 3
- **Workaround**: Service framework ready, parsing logic to be added

## Development

### Testing MCP communication

```python
from integration_service import JiraMCPClient

client = JiraMCPClient('/path/to/jira-mcp-server/index.js')
result = client.call_tool('get_my_issues', {'maxResults': 5})
print(result)
```

### Testing API push

```python
from integration_service import PolarisAPIClient

client = PolarisAPIClient('http://localhost:3000/api')
metrics = {
    'teamId': 5,
    'sprintId': 1,
    'tadTsMetrics': { ... }
}
result = client.push_metrics(metrics)
print(result)
```

## Next Steps (Phase 1 Week 3)

1. **Implement Jira JQL parsing**: Map teams to Jira custom fields
2. **Add QTest integration**: Fetch test cases and execution results
3. **Add Bitbucket TAD/TS**: Parse PRs for document links
4. **Implement scheduling**: Auto-sync every 15 minutes
5. **Add retry logic**: Exponential backoff for API failures
6. **Deploy as service**: Windows Service or Docker container

## License

Internal Wolters Kluwer project
