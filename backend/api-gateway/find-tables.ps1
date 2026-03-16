param(
    [string]$Server = "zusscntssql19\sql2022",
    [string]$Database = "Polarisdashboard",
    [string]$Username = "sql-cs-user",
    [string]$Password = "***REMOVED_DB_PASSWORD***"
)

$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Discovering Polarisdashboard schema..."
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    Write-Host "Connected`n"
    
    # Find all tables
    $query = @"
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = TABLES.TABLE_NAME) as ColumnCount
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME
"@
    
    $command = New-Object System.Data.SqlClient.SqlCommand
    $command.Connection = $connection
    $command.CommandText = $query
    
    $reader = $command.ExecuteReader()
    Write-Host "Tables Found:"
    $count = 0
    while ($reader.Read()) {
        $schema = $reader['TABLE_SCHEMA']
        $table = $reader['TABLE_NAME']
        $cols = $reader['ColumnCount']
        Write-Host "  [$schema].[$table] - $cols columns"
        $count++
    }
    $reader.Close()
    
    if ($count -eq 0) {
        Write-Host "  (No tables found)"
        
        # List all views
        Write-Host "`nViews Found:"
        $viewQuery = "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'VIEW' ORDER BY TABLE_SCHEMA, TABLE_NAME"
        $viewCommand = New-Object System.Data.SqlClient.SqlCommand
        $viewCommand.Connection = $connection
        $viewCommand.CommandText = $viewQuery
        
        $viewReader = $viewCommand.ExecuteReader()
        $viewCount = 0
        while ($viewReader.Read()) {
            Write-Host "  [$($viewReader['TABLE_SCHEMA'])].[$($viewReader['TABLE_NAME'])]"
            $viewCount++
        }
        $viewReader.Close()
        
        if ($viewCount -eq 0) {
            Write-Host "  (No views found)"
        }
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
finally {
    if ($connection.State -eq 'Open') {
        $connection.Close()
    }
}
