# Polaris ELM Dashboard Database Documentation

## Database: Polarisdashboard

### Overview
The Polarisdashboard database stores metrics and test data for the Polaris ELM Dashboard project. It contains information about defects, test cases, and metrics across multiple sprints and teams.

### Tables

#### 1. Metrics Table
**Purpose**: Stores aggregated defect metrics per sprint and team

**Schema**:
```sql
- Id (INT, PK, IDENTITY)
- Sprint (NVARCHAR(100), NOT NULL, UNIQUE) - Format: "{Team}-{Sprint}"
- Team (NVARCHAR(100), NOT NULL) - Team name
- DefectsOpen (INT, DEFAULT 0) - Count of open defects
- DefectsClosed (INT, DEFAULT 0) - Count of closed defects
- LastUpdated (DATETIME, DEFAULT GETDATE()) - Last sync timestamp
```

**Indexes**:
- IX_Sprint (Sprint)
- IX_Team (Team)
- IX_LastUpdated (LastUpdated)

**Example Data** (Sprint 26.1.1):
```
vanguards-26.1.1 | vanguards | 2 | 3 | 5 total
athena-26.1.1    | athena    | 1 | 2 | 3 total
nexus-26.1.1     | nexus     | 1 | 1 | 2 total
chubb-26.1.1     | chubb     | 1 | 1 | 2 total
chargers-26.1.1  | chargers  | 1 | 1 | 2 total
matrix-26.1.1    | matrix    | 1 | 1 | 2 total
mavericks-26.1.1 | mavericks | 0 | 1 | 1 total
---                          7 open | 10 closed | 17 total
```

#### 2. Defects Table
**Purpose**: Stores detailed defect information with tracking and history

**Schema**:
```sql
- Id (INT, PK, IDENTITY)
- DefectId (NVARCHAR(50), NOT NULL, UNIQUE) - Unique defect identifier
- Sprint (NVARCHAR(100), NOT NULL, FK to Metrics)
- Team (NVARCHAR(100), NOT NULL)
- Status (NVARCHAR(50), NOT NULL) - Open, Closed, In Progress, etc.
- Severity (NVARCHAR(50)) - Critical, High, Medium, Low
- Module (NVARCHAR(100)) - Module/component where defect exists
- Title (NVARCHAR(255)) - Defect title/summary
- Description (NVARCHAR(MAX)) - Detailed description
- CreatedDate (DATETIME, DEFAULT GETDATE())
- ResolvedDate (DATETIME) - Date defect was resolved
- LastUpdated (DATETIME, DEFAULT GETDATE())
```

#### 3. TestCases Table
**Purpose**: Stores test case metrics and execution data

**Schema**:
```sql
- Id (INT, PK, IDENTITY)
- TestCaseId (NVARCHAR(50), NOT NULL, UNIQUE)
- Sprint (NVARCHAR(100), NOT NULL)
- Team (NVARCHAR(100), NOT NULL)
- Title (NVARCHAR(255))
- Status (NVARCHAR(50), NOT NULL)
- Module (NVARCHAR(100))
- Automated (BIT, DEFAULT 0) - Whether test is automated
- WithAttachments (BIT, DEFAULT 0) - Whether test has attachments
- CreatedDate (DATETIME, DEFAULT GETDATE())
- LastExecuted (DATETIME)
- LastUpdated (DATETIME, DEFAULT GETDATE())
```

#### 4. SyncLog Table
**Purpose**: Tracks all data synchronization events for audit and debugging

**Schema**:
```sql
- Id (INT, PK, IDENTITY)
- SyncType (NVARCHAR(100), NOT NULL) - Type of sync (e.g., 'Metrics', 'Defects')
- Source (NVARCHAR(100), NOT NULL) - Source system (e.g., 'JIRA', 'QTest', 'Local')
- RecordsAffected (INT, DEFAULT 0) - Number of records affected
- Status (NVARCHAR(50), NOT NULL) - Success, Failed, Partial
- ErrorMessage (NVARCHAR(MAX)) - Error details if applicable
- SyncDate (DATETIME, DEFAULT GETDATE())
```

### Views

#### vw_MetricsSummary
Provides summary statistics per sprint with totals and team counts.

**Query**:
```sql
SELECT * FROM vw_MetricsSummary;
```

### Stored Procedures

#### sp_GetMetricsBySprint
Retrieves all metrics for a specific sprint.

**Usage**:
```sql
EXEC sp_GetMetricsBySprint @Sprint = 'chargers-26.1.1';
```

#### sp_GetMetricsByTeam
Retrieves all metrics for a specific team across all sprints.

**Usage**:
```sql
EXEC sp_GetMetricsByTeam @Team = 'chargers';
```

#### sp_LogSync
Logs synchronization events for auditing.

**Usage**:
```sql
EXEC sp_LogSync 
    @SyncType = 'Metrics',
    @Source = 'API',
    @RecordsAffected = 7,
    @Status = 'Success',
    @ErrorMessage = NULL;
```

### Setup Instructions

1. **Create Database Schema**:
   ```
   sqlcmd -S "zusscntssql19\sql2022" -U "sql-cs-user" -P "***REMOVED_DB_PASSWORD***" -i "01-create-schema.sql"
   ```

2. **Insert Sprint Data**:
   ```
   sqlcmd -S "zusscntssql19\sql2022" -U "sql-cs-user" -P "***REMOVED_DB_PASSWORD***" -i "02-insert-sprint-26-1-1-data.sql"
   ```

3. **Create Utilities**:
   ```
   sqlcmd -S "zusscntssql19\sql2022" -U "sql-cs-user" -P "***REMOVED_DB_PASSWORD***" -i "03-create-utilities.sql"
   ```

### Connection Details

- **Server**: zusscntssql19\sql2022
- **Database**: Polarisdashboard
- **Authentication**: SQL Server Authentication
- **Username**: sql-cs-user
- **Port**: Default (1433)

### Current Data Status

**Sprint 26.1.1** (February 12, 2026):
- Teams: 7 (vanguards, athena, nexus, chubb, chargers, matrix, mavericks)
- Total Defects: 17
- Open Defects: 7
- Closed Defects: 10
- Last Updated: 2026-02-12

### API Integration

The backend API (`backend/api-gateway/server.js`) connects to this database via:
- Endpoint: `/api/metrics?sprint={sprint-name}`
- Endpoint: `/api/defects/by-module?sprint={sprint-name}`

### Maintenance

- **Backup**: Recommended weekly backups of Polarisdashboard
- **Index Maintenance**: Monitor index fragmentation and rebuild as needed
- **Sync Auditing**: Review SyncLog table regularly for failed or partial syncs
- **Data Archival**: Archive data older than 12 months to maintain performance

### Contact & Support

For database-related issues:
1. Check SyncLog for recent errors
2. Review connection credentials
3. Verify network connectivity to SQL Server
4. Check API logs for synchronization failures

---
**Last Updated**: February 12, 2026
**Version**: 1.0
