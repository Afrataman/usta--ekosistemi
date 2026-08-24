[CmdletBinding()]
param(
    [string]$ServerInstance = '.\SQLEXPRESS',
    [string]$BackupDirectory = (Join-Path $PSScriptRoot '..\backups'),
    [string]$BackupFile
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw 'sqlcmd bulunamadı. SSMS kurulumundan SQL Server Command Line Utilities bileşenini ekleyin.'
}

if ([string]::IsNullOrWhiteSpace($BackupFile)) {
    $resolvedDirectory = [System.IO.Path]::GetFullPath($BackupDirectory)
    $BackupFile = Get-ChildItem -LiteralPath $resolvedDirectory -Filter '*.bak' -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}

if ([string]::IsNullOrWhiteSpace($BackupFile) -or -not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) {
    throw 'Doğrulanacak .bak yedek dosyası bulunamadı.'
}

$sqlPath = [System.IO.Path]::GetFullPath($BackupFile).Replace("'", "''")
& sqlcmd -S $ServerInstance -E -b -Q "RESTORE VERIFYONLY FROM DISK = N'$sqlPath' WITH CHECKSUM;"
if ($LASTEXITCODE -ne 0) { throw 'Yedek doğrulaması başarısız oldu.' }

Write-Host "Yedek doğrulandı: $BackupFile"
