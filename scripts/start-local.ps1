[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendProject = Join-Path $root 'src\backend\Host\UstaEkosistemi.Api\UstaEkosistemi.Api.csproj'
$pwaDirectory = Join-Path $root 'apps\usta-pwa'

if (-not (Test-Path -LiteralPath $backendProject -PathType Leaf)) { throw 'Backend proje dosyası bulunamadı.' }
if (-not (Test-Path -LiteralPath $pwaDirectory -PathType Container)) { throw 'PWA klasörü bulunamadı.' }
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { throw '.NET SDK bulunamadı.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'Node.js ve npm bulunamadı.' }
if (-not (Test-Path -LiteralPath (Join-Path $pwaDirectory 'node_modules') -PathType Container)) { throw 'Önce apps\usta-pwa klasöründe npm install komutunu çalıştırın.' }

$apiAlreadyRunning = Get-NetTCPConnection -LocalPort 5028 -State Listen -ErrorAction SilentlyContinue
$pwaAlreadyRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue

if (-not $apiAlreadyRunning) {
    Start-Process -FilePath 'dotnet' -ArgumentList @('run', '--project', $backendProject) -WorkingDirectory $root -WindowStyle Hidden
    Write-Host 'API başlatıldı: http://localhost:5028'
} else { Write-Host 'API zaten çalışıyor: http://localhost:5028' }

if (-not $pwaAlreadyRunning) {
    Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm run dev -- --host 127.0.0.1') -WorkingDirectory $pwaDirectory -WindowStyle Hidden
    Write-Host 'PWA başlatıldı: http://127.0.0.1:5173'
} else { Write-Host 'PWA zaten çalışıyor: http://127.0.0.1:5173' }

Write-Host 'Tarayıcıda http://127.0.0.1:5173 adresini açın.'
