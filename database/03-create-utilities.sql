-- Database Maintenance and Utility Scripts
-- Polarisdashboard
-- Updated: 2026-02-17 (Re-architected for live Jira data persistence)

USE [Polarisdashboard]
GO

-- 1. View to get summary metrics for all sprints (updated with new columns)
IF OBJECT_ID('vw_MetricsSummary', 'V') IS NOT NULL
    DROP VIEW vw_MetricsSummary;
GO

CREATE VIEW vw_MetricsSummary AS
SELECT 
    Product,
    Sprint,
    COUNT(*) AS TeamsCount,
    SUM(OverallBugsCount) AS TotalBugs,
    SUM(TotalOpenBugs) AS TotalOpen,
    SUM(TotalClosedBugs) AS TotalClosed,
    SUM(TotalReopenedBugs) AS TotalReopened,
    CASE 
        WHEN SUM(OverallBugsCount) > 0 
        THEN CAST(SUM(TotalReopenedBugs) AS DECIMAL(5,2)) / SUM(OverallBugsCount) * 100
        ELSE 0
    END AS AvgReopenedPct,
    MAX(LastUpdated) AS LastUpdated
FROM [Metrics]
GROUP BY Product, Sprint;
GO

-- 2. Stored Procedure to get metrics by sprint (updated with new columns)
IF OBJECT_ID('sp_GetMetricsBySprint', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetMetricsBySprint;
GO

CREATE PROCEDURE sp_GetMetricsBySprint
    @Sprint NVARCHAR(100)
AS
BEGIN
    SELECT 
        Product,
        Sprint,
        Team,
        OverallBugsCount,
        TotalOpenBugs,
        TotalClosedBugs,
        TotalReopenedBugs,
        ReopenedBugPercentage,
        SyncSource,
        LastUpdated
    FROM [Metrics]
    WHERE Sprint = @Sprint
    ORDER BY Product, Team;
END
GO

-- 3. Stored Procedure to get metrics by team (updated with new columns)
IF OBJECT_ID('sp_GetMetricsByTeam', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetMetricsByTeam;
GO

CREATE PROCEDURE sp_GetMetricsByTeam
    @Team NVARCHAR(100)
AS
BEGIN
    SELECT 
        Product,
        Sprint,
        Team,
        OverallBugsCount,
        TotalOpenBugs,
        TotalClosedBugs,
        TotalReopenedBugs,
        ReopenedBugPercentage,
        SyncSource,
        LastUpdated
    FROM [Metrics]
    WHERE Team = @Team
    ORDER BY Sprint DESC;
END
GO

-- 4. Stored Procedure to get metrics by product
IF OBJECT_ID('sp_GetMetricsByProduct', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetMetricsByProduct;
GO

CREATE PROCEDURE sp_GetMetricsByProduct
    @Product NVARCHAR(100)
AS
BEGIN
    SELECT 
        Product,
        Sprint,
        Team,
        OverallBugsCount,
        TotalOpenBugs,
        TotalClosedBugs,
        TotalReopenedBugs,
        ReopenedBugPercentage,
        SyncSource,
        LastUpdated
    FROM [Metrics]
    WHERE Product = @Product
    ORDER BY Sprint, Team;
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
