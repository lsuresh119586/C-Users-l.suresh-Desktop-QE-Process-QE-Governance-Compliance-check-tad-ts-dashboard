param(
    [string]$Server = "zusscntssql19\sql2022",
    [string]$Database = "Polarisdashboard",
    [string]$Username = "sql-cs-user",
    [string]$Password = "***REMOVED_DB_PASSWORD***"
)

$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Checking database..."
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    
    # Check all tables and views
    $query = "SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME"
    $command = New-Object System.Data.SqlClient.SqlCommand
    $command.Connection = $connection
    $command.CommandText = $query
    
    $reader = $command.ExecuteReader()
    Write-Host "`nAll Tables and Views:"
    $count = 0
    while ($reader.Read()) {
        Write-Host "  - $($reader['TABLE_NAME']) ($($reader['TABLE_TYPE']))"
        $count++
    }
    $reader.Close()
    
    if ($count -eq 0) {
        Write-Host "`nNo tables found. Checking database size..."
        $query2 = "SELECT DB_NAME() as DatabaseName, COUNT(*) as ObjectCount FROM sys.objects WHERE type IN ('U', 'V')"
        $command2 = New-Object System.Data.SqlClient.SqlCommand
        $command2.Connection = $connection
        $command2.CommandText = $query2
        $reader2 = $command2.ExecuteReader()
        while ($reader2.Read()) {
            Write-Host "Database: $($reader2['DatabaseName'])"
            Write-Host "Object Count: $($reader2['ObjectCount'])"
        }
        $reader2.Close()
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
