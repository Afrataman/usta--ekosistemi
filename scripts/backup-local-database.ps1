[CmdletBinding()]
param(
    [string]$ServerInstance = '.\SQLEXPRESS',
    [string]$Database = 'UstaEkosistemiDev',
    [string]$BackupDirectory = (Join-Path $PSScriptRoot '..\backups')
)

$ErrorActionPreference = 'Stop'

if ($Database -notmatch '^[A-Za-z0-9_]+$') {
    throw 'Veritabanı adı yalnızca harf, rakam ve alt çizgi içermelidir.'
}

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw 'sqlcmd bulunamadı. SSMS kurulumundan SQL Server Command Line Utilities bileşenini ekleyin.'
}

$resolvedDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
New-Item -ItemType Directory -Force -Path $resolvedDirectory | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $resolvedDirectory "$Database-$timestamp.bak"
$sqlPath = $backupFile.Replace("'", "''")
$query = "BACKUP DATABASE [$Database] TO DISK = N'$sqlPath' WITH CHECKSUM, STATS = 10;"

& sqlcmd -S $ServerInstance -E -b -Q $query
if ($LASTEXITCODE -ne 0) { throw 'SQL Server yedekleme işlemi başarısız oldu.' }

Get-Item -LiteralPath $backupFile | Select-Object FullName, Length, LastWriteTime
