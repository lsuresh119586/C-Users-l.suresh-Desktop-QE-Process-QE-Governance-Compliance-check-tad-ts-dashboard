param(
    [string]$Server = "zusscntssql19\sql2022",
    [string]$Database = "Polarisdashboard",
    [string]$Username = "sql-cs-user",
    [string]$Password = "***REMOVED_DB_PASSWORD***"
)

$connectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;TrustServerCertificate=true;"

Write-Host "Discovering table names in Polarisdashboard..."
$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    
    $query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
    $command = New-Object System.Data.SqlClient.SqlCommand
    $command.Connection = $connection
    $command.CommandText = $query
    
    $reader = $command.ExecuteReader()
    Write-Host "`nAvailable Tables:"
    while ($reader.Read()) {
        Write-Host "  - $($reader['TABLE_NAME'])"
    }
    $reader.Close()
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
finally {
    if ($connection.State -eq 'Open') {
        $connection.Close()
    }
}
