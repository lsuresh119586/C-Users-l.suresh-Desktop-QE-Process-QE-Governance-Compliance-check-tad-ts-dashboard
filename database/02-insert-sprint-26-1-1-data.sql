-- Sprint 26.1.1 Defect Metrics Data
-- Database: Polarisdashboard
-- Table: Metrics
-- Purpose: Insert/Update sprint 26.1.1 defect data for all 7 teams

USE [Polarisdashboard]
GO

-- Sprint 26.1.1 Metrics (7 Teams: 17 Total Defects)
-- vanguards: 5 (2 open, 3 closed)
-- athena: 3 (1 open, 2 closed)
-- nexus: 2 (1 open, 1 closed)
-- chubb: 2 (1 open, 1 closed)
-- chargers: 2 (1 open, 1 closed)
-- matrix: 2 (1 open, 1 closed)
-- mavericks: 1 (0 open, 1 closed)

MERGE INTO [Metrics] AS target
USING (
    VALUES
        ('vanguards-26.1.1', 'vanguards', 2, 3),
        ('athena-26.1.1', 'athena', 1, 2),
        ('nexus-26.1.1', 'nexus', 1, 1),
        ('chubb-26.1.1', 'chubb', 1, 1),
        ('chargers-26.1.1', 'chargers', 1, 1),
        ('matrix-26.1.1', 'matrix', 1, 1),
        ('mavericks-26.1.1', 'mavericks', 0, 1)
) AS source (Sprint, Team, DefectsOpen, DefectsClosed)
ON target.Sprint = source.Sprint

WHEN MATCHED THEN
    UPDATE SET
        Team = source.Team,
        DefectsOpen = source.DefectsOpen,
        DefectsClosed = source.DefectsClosed,
        LastUpdated = GETDATE()

WHEN NOT MATCHED THEN
    INSERT (Sprint, Team, DefectsOpen, DefectsClosed, LastUpdated)
    VALUES (source.Sprint, source.Team, source.DefectsOpen, source.DefectsClosed, GETDATE());

GO

-- Verify data insertion
SELECT 
    Sprint,
    Team,
    DefectsOpen,
    DefectsClosed,
    (DefectsOpen + DefectsClosed) AS TotalDefects,
    LastUpdated
FROM [Metrics]
WHERE Sprint LIKE '%26.1.1%'
ORDER BY Team;

GO

-- Summary statistics
SELECT 
    'Sprint 26.1.1' AS Sprint,
    COUNT(*) AS TeamsCount,
    SUM(DefectsOpen) AS TotalOpen,
    SUM(DefectsClosed) AS TotalClosed,
    SUM(DefectsOpen + DefectsClosed) AS GrandTotal
FROM [Metrics]
WHERE Sprint LIKE '%26.1.1%';

GO

PRINT 'Sprint 26.1.1 data inserted/updated successfully.'
