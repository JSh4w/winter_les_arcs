# Clear Messages PowerShell Script
# Usage: .\clear-messages.ps1 [environment]
# environment: local (default) or production

param(
    [string]$Environment = "local"
)

if ($Environment -eq "production") {
    $ApiUrl = "https://winter-les-arcs.onrender.com"
    Write-Host "🚀 Clearing messages from PRODUCTION..." -ForegroundColor Yellow
} else {
    $ApiUrl = "http://localhost:3000"
    Write-Host "💻 Clearing messages from LOCAL..." -ForegroundColor Cyan
}

$AdminKey = "winter-party-admin-2025"

Write-Host "🗑️  Sending clear request..." -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/messages/clear" `
        -Method Delete `
        -Headers @{ "x-admin-key" = $AdminKey } `
        -ErrorAction Stop

    Write-Host "✅ Success! $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
