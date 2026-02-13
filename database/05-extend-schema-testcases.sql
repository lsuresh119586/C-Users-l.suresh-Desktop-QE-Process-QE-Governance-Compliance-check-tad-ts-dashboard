-- Extend Metrics table to include test case counts
-- Database: Polarisdashboard

USE [Polarisdashboard]
GO

-- Alter Metrics table to add test case columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Metrics' AND COLUMN_NAME = 'TestCasesTotal')
BEGIN
    ALTER TABLE [Metrics] ADD 
        TestCasesTotal INT DEFAULT 0,
        TestCasesAutomated INT DEFAULT 0,
        TestCasesWithAttachments INT DEFAULT 0,
        QTestProjectId INT,
        QTestProjectUrl NVARCHAR(500);
END
GO

-- Create index on QTest Project ID for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QTestProjectId')
BEGIN
    CREATE INDEX [IX_QTestProjectId] ON [Metrics] ([QTestProjectId]);
END
GO

PRINT 'Metrics table extended with test case columns successfully.'
