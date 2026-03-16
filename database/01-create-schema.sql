-- Polaris ELM Dashboard Database Schema
-- Database: Polarisdashboard
-- Server: zusscntssql19\sql2022
-- Created: 2026-02-12
-- Updated: 2026-02-17 (Re-architected for live Jira + SQL persistence)

USE [Polarisdashboard]
GO

-- ============================================================================
-- Re-architect Metrics Table for Live Jira Data Persistence
-- Dashboard ALWAYS reads from live Jira API, then persists aggregated data here
-- ============================================================================

-- Add new columns to existing Metrics table if they don't already exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'Product')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [Product] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'OverallBugsCount')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [OverallBugsCount] INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'TotalOpenBugs')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [TotalOpenBugs] INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'TotalClosedBugs')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [TotalClosedBugs] INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'TotalReopenedBugs')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [TotalReopenedBugs] INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'ReopenedBugPercentage')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [ReopenedBugPercentage] DECIMAL(5,2) NOT NULL DEFAULT 0.00;
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'SyncSource')
BEGIN
    ALTER TABLE [dbo].[Metrics] ADD [SyncSource] NVARCHAR(50) NOT NULL DEFAULT 'jira-live-api';
END
GO

-- Add index on Product column
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Product' AND object_id = OBJECT_ID('Metrics'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Product] ON [dbo].[Metrics] ([Product]);
END
GO

-- Add composite index for common queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Product_Team_Sprint' AND object_id = OBJECT_ID('Metrics'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Product_Team_Sprint] ON [dbo].[Metrics] ([Product], [Team], [Sprint]);
END
GO

-- ============================================================================
-- Migrate existing data: Populate Product column from Team names
-- ============================================================================
UPDATE [dbo].[Metrics] SET [Product] = 'T360' WHERE [Product] IS NULL AND [Team] IN ('vanguards', 'chargers', 'chubb', 'matrix', 'mavericks', 'nexus');
UPDATE [dbo].[Metrics] SET [Product] = 'DnA' WHERE [Product] IS NULL AND [Team] IN ('minerva', 'guardians', 'athena');
GO

-- Migrate existing DefectsOpen/DefectsClosed to new columns
UPDATE [dbo].[Metrics] SET 
    [TotalOpenBugs] = [DefectsOpen],
    [TotalClosedBugs] = [DefectsClosed],
    [OverallBugsCount] = [DefectsOpen] + [DefectsClosed]
WHERE [OverallBugsCount] = 0;
GO

PRINT 'Metrics table re-architected successfully for live Jira data persistence.'
PRINT 'New columns: Product, OverallBugsCount, TotalOpenBugs, TotalClosedBugs, TotalReopenedBugs, ReopenedBugPercentage, SyncSource'
GO

-- ============================================================================
-- Reference: Final Metrics Table Schema
-- ============================================================================
-- [Metrics] table now has the following columns:
--   Id                    INT IDENTITY(1,1) PRIMARY KEY
--   Sprint                NVARCHAR(100) NOT NULL UNIQUE
--   Team                  NVARCHAR(100) NOT NULL
--   Product               NVARCHAR(100) NULL          -- NEW: Passport, DnA, T360, Collaboration Portal
--   DefectsOpen           INT NOT NULL DEFAULT 0       -- LEGACY: Kept for backward compatibility
--   DefectsClosed         INT NOT NULL DEFAULT 0       -- LEGACY: Kept for backward compatibility
--   OverallBugsCount      INT NOT NULL DEFAULT 0       -- NEW: Total bug count per sprint
--   TotalOpenBugs         INT NOT NULL DEFAULT 0       -- NEW: Total open bugs per sprint
--   TotalClosedBugs       INT NOT NULL DEFAULT 0       -- NEW: Total closed bugs per sprint
--   TotalReopenedBugs     INT NOT NULL DEFAULT 0       -- NEW: Reopened bugs (even if closed/open now)
--   ReopenedBugPercentage DECIMAL(5,2) DEFAULT 0.00    -- NEW: (Reopened / Overall) * 100
--   SyncSource            NVARCHAR(50) DEFAULT 'jira-live-api'  -- NEW: Data provenance
--   LastUpdated           DATETIME DEFAULT GETDATE()
-- ============================================================================

-- Create Defects Table for Detailed Defect Tracking
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Defects')
BEGIN
    CREATE TABLE [dbo].[Defects] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [DefectId] NVARCHAR(50) NOT NULL UNIQUE,
        [Sprint] NVARCHAR(100) NOT NULL,
        [Team] NVARCHAR(100) NOT NULL,
        [Status] NVARCHAR(50) NOT NULL,
        [Severity] NVARCHAR(50),
        [Module] NVARCHAR(100),
        [Title] NVARCHAR(255),
        [Description] NVARCHAR(MAX),
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [ResolvedDate] DATETIME,
        [LastUpdated] DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Foreign Key
        CONSTRAINT [FK_Defects_Metrics] FOREIGN KEY ([Sprint]) REFERENCES [Metrics]([Sprint]),
        
        -- Indexes
        INDEX [IX_Sprint] NONCLUSTERED ([Sprint]),
        INDEX [IX_Team] NONCLUSTERED ([Team]),
        INDEX [IX_Status] NONCLUSTERED ([Status]),
        INDEX [IX_DefectId] NONCLUSTERED ([DefectId])
    )
END
GO

-- Create TestCases Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TestCases')
BEGIN
    CREATE TABLE [dbo].[TestCases] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TestCaseId] NVARCHAR(50) NOT NULL UNIQUE,
        [Sprint] NVARCHAR(100) NOT NULL,
        [Team] NVARCHAR(100) NOT NULL,
        [Title] NVARCHAR(255),
        [Status] NVARCHAR(50) NOT NULL,
        [Module] NVARCHAR(100),
        [Automated] BIT NOT NULL DEFAULT 0,
        [WithAttachments] BIT NOT NULL DEFAULT 0,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [LastExecuted] DATETIME,
        [LastUpdated] DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Indexes
        INDEX [IX_Sprint] NONCLUSTERED ([Sprint]),
        INDEX [IX_Team] NONCLUSTERED ([Team]),
        INDEX [IX_Status] NONCLUSTERED ([Status]),
        INDEX [IX_Automated] NONCLUSTERED ([Automated])
    )
END
GO

-- Create SyncLog Table for tracking data synchronization
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SyncLog')
BEGIN
    CREATE TABLE [dbo].[SyncLog] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [SyncType] NVARCHAR(100) NOT NULL,
        [Source] NVARCHAR(100) NOT NULL,
        [RecordsAffected] INT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL,
        [ErrorMessage] NVARCHAR(MAX),
        [SyncDate] DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Index
        INDEX [IX_SyncType] NONCLUSTERED ([SyncType]),
        INDEX [IX_SyncDate] NONCLUSTERED ([SyncDate])
    )
END
GO

PRINT 'Schema creation completed successfully.'
