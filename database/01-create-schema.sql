-- Polaris ELM Dashboard Database Schema
-- Database: Polarisdashboard
-- Created: 2026-02-12

USE [Polarisdashboard]
GO

-- Create Metrics Table for Sprint Defect Tracking
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Metrics')
BEGIN
    CREATE TABLE [dbo].[Metrics] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Sprint] NVARCHAR(100) NOT NULL UNIQUE,
        [Team] NVARCHAR(100) NOT NULL,
        [DefectsOpen] INT NOT NULL DEFAULT 0,
        [DefectsClosed] INT NOT NULL DEFAULT 0,
        [LastUpdated] DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Indexes
        INDEX [IX_Sprint] NONCLUSTERED ([Sprint]),
        INDEX [IX_Team] NONCLUSTERED ([Team]),
        INDEX [IX_LastUpdated] NONCLUSTERED ([LastUpdated])
    )
END
GO

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
