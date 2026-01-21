# init-state.ps1 - Initialize campaign state directory
# Usage: .\init-state.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginRoot = Split-Path -Parent $ScriptDir
$StateDir = Join-Path $PluginRoot "state"

Write-Host "=== Campaign State Initialization ==="
Write-Host "Plugin root: $PluginRoot"
Write-Host "State directory: $StateDir"
Write-Host "====================================="

# Create state directory structure
if (-not (Test-Path "$StateDir/campaigns")) {
    New-Item -ItemType Directory -Force -Path "$StateDir/campaigns" | Out-Null
}

# Create .gitignore to exclude state from version control
$GitIgnoreContent = @'
# Campaign state is local and should not be committed
campaigns/
*.log
*.jsonl
'@

Set-Content -Path "$StateDir/.gitignore" -Value $GitIgnoreContent -Encoding UTF8

Write-Host "State directory initialized at: $StateDir"
Write-Host ""
Write-Host "Campaign data will be stored in: $StateDir/campaigns/<campaign-id>/"
Write-Host ""
Write-Host "Structure per campaign:"
Write-Host "  - campaign.json  (campaign metadata)"
Write-Host "  - tasks.json     (task board)"
Write-Host "  - logs/          (session logs)"
