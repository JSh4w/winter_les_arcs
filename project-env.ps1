# Load fnm
fnm env --use-on-cd | Out-String | Invoke-Expression

# Add project binaries to PATH
$env:PATH = "$PWD\node_modules\.bin;$env:PATH"

# Project specific environment variables
$env:NODE_ENV = "development"
$env:VITE_API_URL = "http://localhost:3000"

# Optional: Change to project directory
Set-Location (Split-Path $MyInvocation.MyCommand.Path)

# Optional: Start a new shell with these settings
# Uncomment the next line if you want a new shell
# Start-Process powershell 