-- Database Backup and Restoration Scripts
-- Polarisdashboard

USE [master]
GO

-- 1. Create backup directory if using local path
-- Note: Adjust path based on your SQL Server setup

-- 2. Backup Database
BACKUP DATABASE [Polarisdashboard]
TO DISK = 'C:\Backups\Polarisdashboard_$(ESCAPE_NONE(DATE))_$(ESCAPE_NONE(TIME)).bak'
WITH 
    DESCRIPTION = 'Polaris ELM Dashboard Database Backup',
    NAME = 'Polarisdashboard_Full_Backup',
    NOFORMAT,
    NOINIT,
    SKIP,
    NOREWIND,
    NOUNLOAD,
    COMPRESSION,
    STATS = 10;

GO

-- 3. Backup Transaction Log
BACKUP LOG [Polarisdashboard]
TO DISK = 'C:\Backups\Polarisdashboard_Log_$(ESCAPE_NONE(DATE))_$(ESCAPE_NONE(TIME)).trn'
WITH 
    NAME = 'Polarisdashboard_Log_Backup',
    NOFORMAT,
    NOINIT,
    SKIP,
    NOREWIND,
    NOUNLOAD,
    COMPRESSION,
    STATS = 10;

GO

-- 4. Verify Backup Set Information
RESTORE FILELISTONLY
FROM DISK = 'C:\Backups\Polarisdashboard_Full_Backup.bak';

GO

-- 5. Restore Database (Use with caution - modifies example path)
-- Uncomment and modify paths as needed for restore operations
/*
RESTORE DATABASE [Polarisdashboard]
FROM DISK = 'C:\Backups\Polarisdashboard_Full_Backup.bak'
WITH 
    FILE = 1,
    REPLACE,
    RECOVERY,
    STATS = 5;
GO
*/

-- 6. Check Database Integrity
DBCC CHECKDB ([Polarisdashboard], REPAIR_REBUILD);
GO

PRINT 'Backup and maintenance scripts completed.'
