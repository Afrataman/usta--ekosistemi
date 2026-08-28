[CmdletBinding(SupportsShouldProcess)]
param()

$ErrorActionPreference = 'Stop'
$ports = @(5028, 5173)
$processIds = foreach ($port in $ports) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
}

$processIds = $processIds | Sort-Object -Unique
if (-not $processIds) {
    Write-Host 'Durdurulacak yerel API veya PWA süreci bulunamadı.'
    return
}

foreach ($processId in $processIds) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) { continue }

    if ($PSCmdlet.ShouldProcess("$($process.ProcessName) (PID $processId)", 'Yerel geliştirme sürecini durdur')) {
        Stop-Process -Id $processId
        Write-Host "Durduruldu: $($process.ProcessName) (PID $processId)"
    }
}
