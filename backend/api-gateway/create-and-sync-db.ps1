param(
    [string]$Server = "zusscntssql19\sql2022",
    [string]$Database = "Polarisdashboard",
    [string]$Username = "sql-cs-user",
    [string]$Password = "***REMOVED_DB_PASSWORD***"
)

$defectDistribution = @{
    'vanguards' = @{ 'open' = 2; 'closed' = 3; 'total' = 5 }
    'athena'    = @{ 'open' = 1; 'closed' = 2; 'total' = 3 }
    'nexus'     = @{ 'open' = 1; 'closed' = 1; 'total' = 2 }
    'chubb'     = @{ 'open' = 1; 'closed' = 1; 'total' = 2 }
    'chargers'  = @{ 'open' = 1; 'closed' = 1; 'total' = 2 }
    'matrix'    = @{ 'open' = 1; 'closed' = 1; 'total' = 2 }
    'mavericks' = @{ 'open' = 0; 'closed' = 1; 'total' = 1 }
}

$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Setting up Polarisdashboard with defect data..."
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString
$successCount = 0
$errorCount = 0

try {
    $connection.Open()
    Write-Host "Connected to SQL Server`n"
    
    # Create Metrics table
    Write-Host "Creating Metrics table..."
    $createTableQuery = @"
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Metrics')
    CREATE TABLE Metrics (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Sprint VARCHAR(100) UNIQUE,
        Team VARCHAR(50),
        DefectsOpen INT,
        DefectsClosed INT,
        LastUpdated DATETIME DEFAULT GETDATE()
    )
"@
    
    $createCommand = New-Object System.Data.SqlClient.SqlCommand
    $createCommand.Connection = $connection
    $createCommand.CommandText = $createTableQuery
    $createCommand.ExecuteNonQuery()
    Write-Host "OK: Metrics table ready`n"
    
    # Insert defect data for sprint 26.1.1
    Write-Host "Processing Sprint 26.1.1 Defects...`n"
    
    foreach ($team in $defectDistribution.Keys) {
        $sprintId = "$team-26.1.1"
        $defects = $defectDistribution[$team]
        
        try {
            $insertQuery = @"
            IF NOT EXISTS (SELECT 1 FROM Metrics WHERE Sprint = @sprint)
                INSERT INTO Metrics (Sprint, Team, DefectsOpen, DefectsClosed, LastUpdated)
                VALUES (@sprint, @team, @defectsOpen, @defectsClosed, GETDATE())
            ELSE
                UPDATE Metrics 
                SET DefectsOpen = @defectsOpen, DefectsClosed = @defectsClosed, LastUpdated = GETDATE()
                WHERE Sprint = @sprint
"@
            
            $insertCommand = New-Object System.Data.SqlClient.SqlCommand
            $insertCommand.Connection = $connection
            $insertCommand.CommandText = $insertQuery
            
            [void]$insertCommand.Parameters.AddWithValue("@sprint", $sprintId)
            [void]$insertCommand.Parameters.AddWithValue("@team", $team)
            [void]$insertCommand.Parameters.AddWithValue("@defectsOpen", [int]$defects['open'])
            [void]$insertCommand.Parameters.AddWithValue("@defectsClosed", [int]$defects['closed'])
            
            $insertCommand.ExecuteNonQuery()
            Write-Host "OK: $($team.PadRight(12)) | Open: $($defects['open']) | Closed: $($defects['closed']) | Total: $($defects['total'])"
            $successCount++
        }
        catch {
            Write-Host "ERROR: $($team.PadRight(12)) | $($_.Exception.Message)"
            $errorCount++
        }
    }
    
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "SUMMARY:"
    Write-Host "Inserted/Updated: $successCount metrics"
    if ($errorCount -gt 0) {
        Write-Host "Errors: $errorCount"
    }
    Write-Host "Total Defects: 17 (7 open + 10 closed)"
    Write-Host "============================================================"
    
    # Verify data
    Write-Host "`nVerifying data in database..."
    $verifyQuery = "SELECT Team, Sprint, DefectsOpen, DefectsClosed FROM Metrics WHERE Sprint LIKE '%-26.1.1' ORDER BY Team"
    $verifyCommand = New-Object System.Data.SqlClient.SqlCommand
    $verifyCommand.Connection = $connection
    $verifyCommand.CommandText = $verifyQuery
    
    $reader = $verifyCommand.ExecuteReader()
    $totalOpen = 0
    $totalClosed = 0
    Write-Host "`nDatabase Contents:"
    while ($reader.Read()) {
        $open = [int]$reader['DefectsOpen']
        $closed = [int]$reader['DefectsClosed']
        Write-Host "  $($reader['Team']) - Open: $open | Closed: $closed | Total: $($open + $closed)"
        $totalOpen += $open
        $totalClosed += $closed
    }
    $reader.Close()
    
    Write-Host "`nTotals: Open: $totalOpen | Closed: $totalClosed | Grand Total: $($totalOpen + $totalClosed)"
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
finally {
    if ($connection.State -eq 'Open') {
        $connection.Close()
        Write-Host "`nDisconnected from SQL Server"
    }
}
