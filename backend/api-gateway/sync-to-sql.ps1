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

$dbJsonPath = Join-Path (Get-Location) "db.json"
if (-not (Test-Path $dbJsonPath)) {
    Write-Host "ERROR: db.json not found at $dbJsonPath"
    exit 1
}

$dbContent = Get-Content $dbJsonPath -Raw | ConvertFrom-Json
$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Connecting to SQL Server..."
Write-Host "Server: $Server"
Write-Host "Database: $Database"
Write-Host ""

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString
$updateCount = 0
$errorCount = 0

try {
    $connection.Open()
    Write-Host "SUCCESS: Connected to SQL Server`n"
    Write-Host "Processing Sprint 26.1.1 Defects...`n"
    
    foreach ($team in $defectDistribution.Keys) {
        $sprintId = "$team-26.1.1"
        $defects = $defectDistribution[$team]
        
        $metric = $dbContent.metrics | Where-Object { $_.sprint -eq $sprintId }
        if (-not $metric) {
            Write-Host "WARN: $($team.PadRight(12)) | Metric not found in db.json"
            continue
        }
        
        try {
            $query = "UPDATE Metrics SET DefectsOpen = @defectsOpen, DefectsClosed = @defectsClosed, LastUpdated = GETDATE() WHERE Sprint = @sprint OR (Team = @team AND Sprint LIKE @sprintPattern)"
            $command = New-Object System.Data.SqlClient.SqlCommand
            $command.Connection = $connection
            $command.CommandText = $query
            
            [void]$command.Parameters.AddWithValue("@sprint", $sprintId)
            [void]$command.Parameters.AddWithValue("@team", $team)
            [void]$command.Parameters.AddWithValue("@sprintPattern", "$team-26.1.1")
            [void]$command.Parameters.AddWithValue("@defectsOpen", [int]$defects['open'])
            [void]$command.Parameters.AddWithValue("@defectsClosed", [int]$defects['closed'])
            
            $rowsAffected = $command.ExecuteNonQuery()
            
            if ($rowsAffected -gt 0) {
                Write-Host "OK: $($team.PadRight(12)) | Open: $($defects['open']) | Closed: $($defects['closed']) | Total: $($defects['total'])"
                $updateCount++
            } else {
                Write-Host "WARN: $($team.PadRight(12)) | No rows updated"
            }
        } 
        catch {
            Write-Host "ERROR: $($team.PadRight(12)) | $($_.Exception.Message)"
            $errorCount++
        }
    }
    
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "SUMMARY:"
    Write-Host "Updated: $updateCount metrics"
    if ($errorCount -gt 0) {
        Write-Host "Errors: $errorCount"
    }
    Write-Host "Total Defects: 17 (7 open + 10 closed)"
    Write-Host "============================================================"
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
