-- Update Sprint 26.1.1 metrics with QTest project information
-- Database: Polarisdashboard

USE [Polarisdashboard]
GO

-- Update test case counts from QTest for Sprint 26.1.1
-- Note: These should be populated by the QTest service or manual data entry
-- based on actual test design documents in QTest

UPDATE [Metrics]
SET 
  QTestProjectId = 68209713,
  QTestProjectUrl = 'https://wk.qtestnet.com/p/114345/portal/project#id=68209713&object=0&tab=testdesign'
WHERE Sprint = 't360-26.1.1';

UPDATE [Metrics]
SET 
  QTestProjectId = 68180756,
  QTestProjectUrl = 'https://wk.qtestnet.com/p/114345/portal/project#id=68180756&object=0&tab=testdesign'
WHERE Team IN ('chargers', 'matrix', 'vanguards', 'athena', 'nexus', 'chubb', 'mavericks')
  AND Sprint LIKE '%26.1.1%';

GO

-- Verify the updates
SELECT 
  Sprint,
  Team,
  TestCasesTotal,
  TestCasesAutomated,
  TestCasesWithAttachments,
  QTestProjectId,
  QTestProjectUrl
FROM [Metrics]
WHERE Sprint LIKE '%26.1.1%'
ORDER BY Team;

GO

PRINT 'QTest project links updated successfully.'
