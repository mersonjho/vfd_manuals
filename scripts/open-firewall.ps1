param(
  [int]$Port = 5137
)

Write-Host "Creating inbound firewall rule for TCP port $Port"
New-NetFirewallRule -DisplayName "Vite Dev $Port" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -ErrorAction SilentlyContinue
Write-Host "Done."
