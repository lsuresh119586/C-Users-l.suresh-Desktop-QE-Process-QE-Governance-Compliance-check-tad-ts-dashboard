-- Database Maintenance and Utility Scripts
-- Polarisdashboard

USE [Polarisdashboard]
GO

-- 1. View to get summary metrics for all sprints
IF OBJECT_ID('vw_MetricsSummary', 'V') IS NOT NULL
    DROP VIEW vw_MetricsSummary;
GO

CREATE VIEW vw_MetricsSummary AS
SELECT 
    Sprint,
    COUNT(*) AS TeamsCount,
    SUM(DefectsOpen) AS TotalOpen,
    SUM(DefectsClosed) AS TotalClosed,
    SUM(DefectsOpen + DefectsClosed) AS GrandTotal,
    MAX(LastUpdated) AS LastUpdated
FROM [Metrics]
GROUP BY Sprint;
GO

-- 2. Stored Procedure to get metrics by sprint
IF OBJECT_ID('sp_GetMetricsBySprint', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetMetricsBySprint;
GO

CREATE PROCEDURE sp_GetMetricsBySprint
    @Sprint NVARCHAR(100)
AS
BEGIN
    SELECT 
        Sprint,
        Team,
        DefectsOpen,
        DefectsClosed,
        (DefectsOpen + DefectsClosed) AS TotalDefects,
        LastUpdated
    FROM [Metrics]
    WHERE Sprint = @Sprint
    ORDER BY Team;
END
GO

-- 3. Stored Procedure to get metrics by team
IF OBJECT_ID('sp_GetMetricsByTeam', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetMetricsByTeam;
GO

CREATE PROCEDURE sp_GetMetricsByTeam
    @Team NVARCHAR(100)
AS
BEGIN
    SELECT 
        Sprint,
        Team,
        DefectsOpen,
        DefectsClosed,
        (DefectsOpen + DefectsClosed) AS TotalDefects,
        LastUpdated
    FROM [Metrics]
    WHERE Team = @Team
    ORDER BY Sprint DESC;
END
GO

-- 4. Stored Procedure to log synchronization events
IF OBJECT_ID('sp_LogSync', 'P') IS NOT NULL
    DROP PROCEDURE sp_LogSync;
GO

CREATE PROCEDURE sp_LogSync
    @SyncType NVARCHAR(100),
    @Source NVARCHAR(100),
    @RecordsAffected INT,
    @Status NVARCHAR(50),
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO [SyncLog] (SyncType, Source, RecordsAffected, Status, ErrorMessage, SyncDate)
    VALUES (@SyncType, @Source, @RecordsAffected, @Status, @ErrorMessage, GETDATE());
END
GO

PRINT 'Database utilities created successfully.'
