$Server = "zusscntssql19\sql2022"
$Database = "Polarisdashboard"
$Username = "sa"
$Password = "***REMOVED_DB_PASSWORD***"

$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Testing SQL Connection..."
Write-Host "Server: $Server"
Write-Host "Database: $Database"

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    Write-Host "✅ Successfully connected to SQL Server!"
    
    $query = "SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES"
    $command = New-Object System.Data.SqlClient.SqlCommand
    $command.Connection = $connection
    $command.CommandText = $query
    
    $reader = $command.ExecuteReader()
    Write-Host "`nTables in database:"
    while ($reader.Read()) {
        Write-Host "  - $($reader['TABLE_NAME'])"
    }
    $reader.Close()
}
catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)"
}
finally {
    if ($connection.State -eq 'Open') {
        $connection.Close()
    }
}
