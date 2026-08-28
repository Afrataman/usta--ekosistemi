[CmdletBinding()]
param(
    [string]$ApiUrl = 'http://localhost:5028'
)

$ErrorActionPreference = 'Stop'
$healthUrl = "$($ApiUrl.TrimEnd('/'))/api/health"

try {
    $health = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
}
catch {
    throw "Yerel API veya SQL Server hazır değil. Önce .\scripts\start-local.ps1 komutunu çalıştırın. Denenen adres: $healthUrl"
}

if ($health.status -ne 'healthy' -or $health.database -ne 'connected') {
    throw "Sistem sağlıklı yanıt vermedi: $($health | ConvertTo-Json -Compress)"
}

Write-Host "Yerel sistem hazır: API=$($health.service), veritabanı=$($health.database)"
