# SQL Server Data Sync Instructions

## Connection Details
- **Server**: zusscntssql19\sql2022
- **Database**: Polarisdashboard
- **Username**: sa
- **Password**: ***REMOVED_DB_PASSWORD*** (verify this is current)

## Database Update Summary

The following defect data has been prepared for sprint 26.1.1 and needs to be synced to SQL Server:

| Team | Open | Closed | Total |
|------|------|--------|-------|
| vanguards | 2 | 3 | 5 |
| athena | 1 | 2 | 3 |
| nexus | 1 | 1 | 2 |
| chubb | 1 | 1 | 2 |
| chargers | 1 | 1 | 2 |
| matrix | 1 | 1 | 2 |
| mavericks | 0 | 1 | 1 |
| **TOTAL** | **7** | **10** | **17** |

## SQL Update Statements

Execute the following SQL queries on the Polarisdashboard database:

```sql
-- Update vanguards-26.1.1
UPDATE Metrics 
SET DefectsOpen = 2, DefectsClosed = 3, LastUpdated = GETDATE() 
WHERE Sprint = 'vanguards-26.1.1' OR (Team = 'vanguards' AND Sprint LIKE '%26.1.1%');

-- Update athena-26.1.1
UPDATE Metrics 
SET DefectsOpen = 1, DefectsClosed = 2, LastUpdated = GETDATE() 
WHERE Sprint = 'athena-26.1.1' OR (Team = 'athena' AND Sprint LIKE '%26.1.1%');

-- Update nexus-26.1.1
UPDATE Metrics 
SET DefectsOpen = 1, DefectsClosed = 1, LastUpdated = GETDATE() 
WHERE Sprint = 'nexus-26.1.1' OR (Team = 'nexus' AND Sprint LIKE '%26.1.1%');

-- Update chubb-26.1.1
UPDATE Metrics 
SET DefectsOpen = 1, DefectsClosed = 1, LastUpdated = GETDATE() 
WHERE Sprint = 'chubb-26.1.1' OR (Team = 'chubb' AND Sprint LIKE '%26.1.1%');

-- Update chargers-26.1.1
UPDATE Metrics 
SET DefectsOpen = 1, DefectsClosed = 1, LastUpdated = GETDATE() 
WHERE Sprint = 'chargers-26.1.1' OR (Team = 'chargers' AND Sprint LIKE '%26.1.1%');

-- Update matrix-26.1.1
UPDATE Metrics 
SET DefectsOpen = 1, DefectsClosed = 1, LastUpdated = GETDATE() 
WHERE Sprint = 'matrix-26.1.1' OR (Team = 'matrix' AND Sprint LIKE '%26.1.1%');

-- Update mavericks-26.1.1
UPDATE Metrics 
SET DefectsOpen = 0, DefectsClosed = 1, LastUpdated = GETDATE() 
WHERE Sprint = 'mavericks-26.1.1' OR (Team = 'mavericks' AND Sprint LIKE '%26.1.1%');

-- Verify the updates
SELECT Team, Sprint, DefectsOpen, DefectsClosed, (DefectsOpen + DefectsClosed) as Total
FROM Metrics 
WHERE Sprint LIKE '%-26.1.1'
ORDER BY Team;
```

## Data Source Files

- **db.json**: Persistent database file with updated metrics (✅ Already synced)
- **sample-tadts-data.js**: Mock data generator with correct distribution (✅ Already updated)
- **server.js**: API gateway with /api/defects/by-module endpoint (✅ Already updated)

## Next Steps

1. Connect to SQL Server using SQL Server Management Studio or Query Window
2. Use the Polarisdashboard database
3. Run the SQL update statements above
4. Verify with the SELECT query

## PowerShell Migration Script

If you have the SqlClient library available, you can also use: `sync-to-sql.ps1`

```powershell
powershell -ExecutionPolicy Bypass -File sync-to-sql.ps1
```

**Note**: The script requires valid SQL Server credentials.

## Troubleshooting

- **Login failed**: Verify sa password is correct (***REMOVED_DB_PASSWORD***)
- **Database not found**: Check database name is Polarisdashboard
- **Network connection**: Ensure SQL Server instance zusscntssql19\sql2022 is accessible

## Files Included

1. `sync-to-sql.ps1` - PowerShell migration script
2. `sync-to-sql.js` - Node.js migration script (requires mssql package)
3. `SQL_SERVER_SYNC.md` - This file
