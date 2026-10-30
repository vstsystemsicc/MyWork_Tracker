# Serves MyWork Tracker over http:// so the phone can reach it and the app can
# be installed to the home screen (service worker needs http, not file://).
param(
  [int]$Port = 5599,
  [switch]$Lan
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bind = if ($Lan) { '0.0.0.0' } else { '127.0.0.1' }

function Test-PortInUse([int]$p) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect('127.0.0.1', $p)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-PortInUse $Port)) {
  Write-Host "Starting server on port $Port ..." -ForegroundColor Magenta
  Start-Process -FilePath 'python' `
    -ArgumentList '-m', 'http.server', $Port, '--bind', $bind `
    -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Seconds 2
} else {
  Write-Host "Port $Port is already serving - opening it." -ForegroundColor DarkGray
}

if ($Lan) {
  $ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -ExpandProperty IPAddress
  Write-Host ""
  Write-Host "Open on your phone (same Wi-Fi):" -ForegroundColor Magenta
  foreach ($ip in $ips) { Write-Host "  http://${ip}:$Port" }
  Write-Host ""
  Write-Host "If the phone cannot connect, allow python through Windows Firewall" -ForegroundColor DarkGray
  Write-Host "for private networks, or use the plain local address below." -ForegroundColor DarkGray
}

Start-Process "http://127.0.0.1:$Port/"
Write-Host "Opened http://127.0.0.1:$Port/" -ForegroundColor Magenta
