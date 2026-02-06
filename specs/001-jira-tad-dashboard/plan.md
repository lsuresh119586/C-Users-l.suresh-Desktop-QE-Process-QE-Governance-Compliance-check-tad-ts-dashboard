# Implementation Plan: Jira TAD & Test Strategy Compliance Dashboard

**Branch**: `001-jira-tad-dashboard` | **Date**: 2026-01-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-jira-tad-dashboard/spec.md`

**Status**: Implementation Already Exists - This plan documents the current architecture

## Summary

A Python-based HTTP dashboard server that monitors Jira sprint issues for TAD (Technical Architecture Document) and Test Strategy compliance. The system auto-refreshes from Jira every 30 minutes, generates multiple dashboard types (main, team, sprint-specific, quality analysis), and serves them as standalone HTML/Markdown files accessible via network URL for team collaboration.

**Core Value**: Reduces manual compliance checking from 2 hours/week to 15 minutes/week by providing real-time visibility into documentation completeness across all sprint issues.

## Technical Context

**Language/Version**: Python 3.x (standard library only for core server)  
**Primary Dependencies**: 
- **Core Server**: `http.server`, `socketserver`, `threading`, `subprocess`, `pathlib` (Python stdlib)
- **JIRA Integration**: Jira REST API client (in supporting scripts)
- **Report Generation**: HTML/Markdown templating (in supporting scripts)

**Storage**: File-based (HTML and Markdown dashboards stored on filesystem, no database)  
**Testing**: Python `unittest` or `pytest` (to be defined in tasks phase)  
**Target Platform**: Windows/Linux/Mac desktop machines with Python 3.x, internal network deployment  
**Project Type**: Single project - standalone Python server with supporting scripts  
**Performance Goals**: 
- Server startup with initial JIRA refresh: < 5 seconds
- Dashboard file serving: < 100ms per request
- Auto-refresh cycle: complete within 2 minutes
- Support 10-50 concurrent dashboard viewers

**Constraints**: 
- Must work with existing Jira API rate limits (graceful degradation)
- Must run on local networks without external dependencies
- No database setup required (file-based storage only)
- Port 8080 must be available (or user-configurable)

**Scale/Scope**: 
- Monitor 5-20 Jira projects/sprints simultaneously
- Handle 100-500 issues per sprint refresh
- Support 10-50 COP team members as dashboard users
- Retain latest version only (no historical archive beyond current cycle)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: No constitution file has been defined for this project yet. The following checks represent recommended practices:

### ✅ Recommended Practices (No Violations)

1. **Simplicity**: ✅ PASS
   - Uses Python standard library for core functionality
   - File-based storage (no database complexity)
   - Standalone HTML dashboards (no frontend framework required)

2. **Observability**: ✅ PASS
   - Structured logging with timestamps (YYYY-MM-DD HH:MM:SS format)
   - Clear error messages for common failures (port conflicts, missing scripts, JIRA errors)
   - Console output shows refresh status and next refresh time

3. **Modularity**: ✅ PASS
   - Core server (`dashboard_server.py`) orchestrates but delegates generation
   - Supporting scripts handle specific tasks (sprint report, quality analysis, HTML generation, cleanup)
   - Each script independently executable via subprocess

4. **Deployment Simplicity**: ✅ PASS
   - Single command to start: `python dashboard_server.py`
   - Configuration via code constants (PORT, REFRESH_INTERVAL_MINUTES)
   - No external service dependencies (runs standalone)

## Project Structure

### Documentation (this feature)

```text
specs/001-jira-tad-dashboard/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file - implementation plan
├── research.md          # Technical decisions (to be created if needed)
├── data-model.md        # Data entities (to be created if needed)
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (current implementation)

**Structure Decision**: Single project structure - all Python scripts in the same directory with generated dashboard files.

```text
tad-ts-dashboard/          # Root directory (already exists)
├── dashboard_server.py    # Main HTTP server (ALREADY IMPLEMENTED)
├── sprint-tad-ts-report.py # Generate sprint compliance data (dependency)
├── analyze-ts-quality.py   # Analyze test strategy quality (dependency)
├── generate-standalone-html.py # Create standalone HTML dashboards (dependency)
├── cleanup_old_files.py    # Remove old file versions (dependency)
│
├── tad-ts-dashboard.html   # Generated: Main dashboard
├── team-dashboard.html     # Generated: Team dashboard
├── sprint-*-standalone.html # Generated: Sprint-specific reports
├── ts_quality_analysis_*.html # Generated: Quality analysis HTML
├── ts_quality_analysis_*.md   # Generated: Quality analysis Markdown
├── team_reports_*.md       # Generated: Detailed team reports
│
├── .env or config.py       # Jira API credentials (to be created)
└── requirements.txt        # Python dependencies (to be created)
```

**Note**: The core `dashboard_server.py` already implements the full HTTP server architecture. Supporting scripts exist but may need documentation/testing.

**Proposed Repository Integration**:
If integrating into a larger repository structure:

```text
project-root/
├── tools/
│   └── compliance-dashboard/  # Move tad-ts-dashboard here
│       ├── dashboard_server.py
│       ├── [other scripts]
│       └── dashboards/        # Generated files subdirectory
│           ├── html/
│           └── markdown/
├── docs/
│   └── specs/
│       └── 001-jira-tad-dashboard/  # This feature spec
└── tests/
    └── tools/
        └── compliance-dashboard/    # Tests for dashboard scripts
```

## Complexity Tracking

> **No violations found** - System follows simplicity principles

The current implementation is intentionally simple:
- **No frameworks**: Uses Python stdlib only for server (http.server, socketserver, threading)
- **No database**: File-based storage with automatic cleanup
- **No authentication layer**: Relies on network-level access control (internal deployment assumption)
- **No frontend framework**: Generates static HTML that works without JavaScript dependencies

All design choices optimize for maintainability and ease of deployment.

---

## Implementation Phases

### Phase 0: Documentation & Validation (Already Complete)

**Status**: ✅ Complete

The following already exist:
- ✅ Core server implementation (`dashboard_server.py`)
- ✅ Supporting Python scripts for report generation
- ✅ Multi-threaded auto-refresh mechanism
- ✅ HTTP file serving with cache control headers
- ✅ Error handling for port conflicts and missing dependencies

**Remaining Documentation Needs**:
- [ ] Create `research.md` documenting technical decisions (optional)
- [ ] Create `data-model.md` if data structures need clarification (optional)
- [ ] Document JIRA API integration patterns in supporting scripts

### Phase 1: Testing & Quality Assurance

**Goal**: Add comprehensive tests for the existing implementation

**Deliverables**:
1. **Unit Tests** (tests/unit/):
   - `test_dashboard_server.py`: Server initialization, configuration, path resolution
   - `test_refresh_job.py`: Background refresh logic, error handling
   - `test_file_discovery.py`: Latest file detection, sorting, filtering

2. **Integration Tests** (tests/integration/):
   - `test_server_lifecycle.py`: Startup, refresh cycle, shutdown
   - `test_http_serving.py`: File serving, cache headers, 404 handling
   - `test_subprocess_execution.py`: Script execution, error propagation

3. **Contract Tests** (tests/contract/):
   - `test_jira_api.py`: Mock JIRA responses, API contract validation
   - `test_generated_files.py`: Validate structure of generated HTML/MD files

**Testing Approach**:
- Use `pytest` with fixtures for server setup/teardown
- Mock subprocess calls to avoid running actual JIRA queries in tests
- Use temporary directories for file generation tests
- Test both success and failure paths (port conflicts, missing scripts, JIRA errors)

### Phase 2: Enhancement & Configuration

**Goal**: Improve configurability and deployment flexibility

**Deliverables**:
1. **Configuration File** (`config.py` or `.env`):
   ```python
   # Jira Configuration
   JIRA_URL = "https://your-jira-instance.atlassian.net"
   JIRA_EMAIL = "your-email@domain.com"
   JIRA_API_TOKEN = "your-api-token"
   
   # Server Configuration
   SERVER_PORT = 8080
   REFRESH_INTERVAL_MINUTES = 30
   
   # Dashboard Configuration
   MONITORED_PROJECTS = ["PROJ1", "PROJ2"]
   SPRINT_NAME_PATTERN = "Sprint *"
   ```

2. **Requirements File** (`requirements.txt`):
   ```text
   jira==3.5.0
   python-dotenv==1.0.0
   pytest==7.4.0
   pytest-mock==3.12.0
   ```

3. **Setup Script** (`setup.py` or `install.sh`):
   - Install dependencies
   - Validate JIRA credentials
   - Create necessary directories
   - Set file permissions

4. **README.md**:
   - Installation instructions
   - Configuration guide
   - Usage examples
   - Troubleshooting guide

### Phase 3: Deployment & Operations

**Goal**: Production-ready deployment

**Deliverables**:
1. **Deployment Guide** (`docs/deployment.md`):
   - System requirements
   - Installation steps
   - Network configuration
   - Security considerations

2. **Monitoring & Alerts** (optional enhancement):
   - Log rotation configuration
   - Health check endpoint
   - Prometheus metrics export (if needed)

3. **CI/CD Pipeline** (if applicable):
   - Automated testing on commit
   - Linting (flake8, black)
   - Security scanning

---

## Technical Decisions

### Decision 1: File-Based Storage vs Database

**Choice**: File-based storage  
**Rationale**:
- Dashboard data is ephemeral (regenerated every 30 minutes)
- No need for historical queries or complex relationships
- Simplifies deployment (no database setup required)
- Standalone HTML files can be shared independently

**Trade-off**: Cannot query historical compliance trends without manual archiving

### Decision 2: Python stdlib vs Web Framework (FastAPI/Flask)

**Choice**: Python stdlib (`http.server`)  
**Rationale**:
- Dashboard is read-only (no API endpoints needed)
- No authentication/session management required
- Minimizes dependencies
- Sufficient for internal network deployment with <50 concurrent users

**Trade-off**: Cannot easily add REST API endpoints if needed in future

### Decision 3: Background Thread vs Scheduled Task (cron)

**Choice**: Background thread (daemon)  
**Rationale**:
- Single process simplicity (no external scheduler needed)
- Automatic refresh without additional setup
- Clean shutdown with server stop

**Trade-off**: Refresh stops when server is not running (vs cron which runs independently)

### Decision 4: Subprocess Execution vs Direct Integration

**Choice**: Subprocess execution for report generation  
**Rationale**:
- Decouples server from report generation logic
- Supporting scripts can be developed/tested independently
- Easy to swap implementations or add new report types
- Clear separation of concerns

**Trade-off**: Slight performance overhead from process spawning (negligible for 30-minute intervals)

---

## Dependencies & Integration Points

### External Services
1. **Jira REST API**
   - Authentication: API token or OAuth
   - Rate limits: Respect API throttling
   - Endpoints: Issue search, attachment retrieval, custom fields

### Supporting Scripts (Required)
1. **sprint-tad-ts-report.py**
   - Fetches sprint issues from JIRA
   - Checks TAD and Test Strategy presence
   - Generates compliance data structures

2. **analyze-ts-quality.py**
   - Analyzes test strategy completeness
   - Scores documentation quality
   - Generates recommendations

3. **generate-standalone-html.py**
   - Converts data to standalone HTML
   - Embeds CSS and minimal JavaScript (if any)
   - Creates shareable dashboard files

4. **cleanup_old_files.py**
   - Identifies old timestamped files
   - Preserves latest version
   - Removes outdated files

### File Outputs
- **HTML Dashboards**: Standalone files with embedded styling
- **Markdown Reports**: Text-based reports for documentation
- **Timestamp Convention**: `YYYYMMDD_HHMMSS` for version tracking

---

## Next Steps

1. ✅ **Specification Complete** - [spec.md](spec.md)
2. ✅ **Implementation Plan Complete** - This document
3. **Next Command**: `/speckit.tasks` - Generate task breakdown
4. **Then**: `/speckit.implement` - Begin implementation (or document existing implementation)
