[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendProject = Join-Path $root 'src\backend\Host\UstaEkosistemi.Api\UstaEkosistemi.Api.csproj'
$pwaDirectory = Join-Path $root 'apps\usta-pwa'

function Wait-ForHttpEndpoint {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
            return
        }
        catch {
            Start-Sleep -Seconds 1
        }
    } while ((Get-Date) -lt $deadline)

    throw "$Name $TimeoutSeconds saniye içinde hazır olmadı. Terminal hata mesajlarını veya SQL Server bağlantısını kontrol edin."
}

if (-not (Test-Path -LiteralPath $backendProject -PathType Leaf)) { throw 'Backend proje dosyası bulunamadı.' }
if (-not (Test-Path -LiteralPath $pwaDirectory -PathType Container)) { throw 'PWA klasörü bulunamadı.' }
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { throw '.NET SDK bulunamadı.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js ve npm bulunamadı.' }
if (-not (Test-Path -LiteralPath (Join-Path $pwaDirectory 'node_modules') -PathType Container)) { throw 'Önce apps\usta-pwa klasöründe npm install komutunu çalıştırın.' }

$apiAlreadyRunning = Get-NetTCPConnection -LocalPort 5028 -State Listen -ErrorAction SilentlyContinue
$pwaAlreadyRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if (-not $apiAlreadyRunning) {
    Start-Process -FilePath 'dotnet' -ArgumentList @('run', '--project', $backendProject) -WorkingDirectory $root -WindowStyle Hidden
    Write-Host 'API hazırlanıyor...'
} else { Write-Host 'API zaten çalışıyor: http://localhost:5028' }

Wait-ForHttpEndpoint -Url 'http://localhost:5028/api/health' -Name 'API'
Write-Host 'API hazır: http://localhost:5028'

if (-not $pwaAlreadyRunning) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm run dev -- --host 127.0.0.1') -WorkingDirectory $pwaDirectory -WindowStyle Hidden
    Write-Host 'PWA hazırlanıyor...'
} else { Write-Host 'PWA zaten çalışıyor: http://127.0.0.1:5173' }

Wait-ForHttpEndpoint -Url 'http://127.0.0.1:5173' -Name 'PWA'
Write-Host 'PWA hazır: http://127.0.0.1:5173'
Write-Host 'Tarayıcıda http://127.0.0.1:5173 adresini açın.'
