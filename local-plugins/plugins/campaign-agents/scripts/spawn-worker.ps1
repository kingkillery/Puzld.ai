# spawn-worker.ps1 - Droid worker invocation wrapper
# Usage: .\spawn-worker.ps1 <task_spec_file> <project_path> [model]
#
# Environment variables:
#   CAMPAIGN_SANDBOX_MODE - "docker" | "host" | "auto" (default: auto)
#   CAMPAIGN_ALLOW_HOST   - "true" to allow host execution without Docker

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskSpecFile,

    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [string]$Model = "minimax-m2.1"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginRoot = Split-Path -Parent $ScriptDir
$ConfigFile = Join-Path $PluginRoot "config\worker-config.json"
$SecurityPolicy = Join-Path $PluginRoot "config\security-policy.json"

# Sandbox configuration
$SandboxMode = $env:CAMPAIGN_SANDBOX_MODE
if ([string]::IsNullOrEmpty($SandboxMode)) { $SandboxMode = "auto" }

$AllowHost = $env:CAMPAIGN_ALLOW_HOST
if ([string]::IsNullOrEmpty($AllowHost)) { $AllowHost = "false" }

if (-not (Test-Path $TaskSpecFile)) {
    Write-Error "Task spec file not found: $TaskSpecFile"
    exit 1
}

# Read task spec
$TaskSpecContent = Get-Content -Raw $TaskSpecFile
$TaskSpec = $TaskSpecContent | ConvertFrom-Json
$TaskId = $TaskSpec.id
$TaskTitle = $TaskSpec.title

Write-Host "=== Campaign Worker Spawn ==="
Write-Host "Task ID: $TaskId"
Write-Host "Task: $TaskTitle"
Write-Host "Model: $Model"
Write-Host "Project: $ProjectPath"
Write-Host "============================"

# Create task branch
$CampaignId = if ($TaskSpec.campaign_id) { $TaskSpec.campaign_id } else { "default" }
# Using campaigns/<id>/<taskId> convention
$BranchName = "campaigns/${CampaignId}/${TaskId}"

Push-Location $ProjectPath

# Check if branch exists
# Note: git show-ref might fail if branch doesn't exist, which is expected.
# We redirect stderr to null to avoid noise.
git show-ref --verify --quiet "refs/heads/$BranchName" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Switching to existing branch: $BranchName"
    git checkout "$BranchName"
} else {
    Write-Host "Creating new branch: $BranchName"
    git checkout -b "$BranchName"
}

# ===========================================
# SANDBOX ENFORCEMENT (HAWK Resource Layer)
# ===========================================

# Check security policy
$DockerRequired = $false
$DockerImage = "campaign-worker:latest"

if (Test-Path $SecurityPolicy) {
    try {
        $PolicyJson = Get-Content -Raw $SecurityPolicy | ConvertFrom-Json
        if ($PolicyJson.sandbox.runtime -eq "docker") {
            $DockerRequired = $true
        }
        if ($PolicyJson.sandbox.image) {
            $DockerImage = $PolicyJson.sandbox.image
        }
    } catch {
        Write-Warning "Failed to parse security policy. Defaulting to safe settings."
    }
}

# Determine execution mode
$UseDocker = $false

if ($SandboxMode -eq "docker") {
    $UseDocker = $true
} elseif ($SandboxMode -eq "host") {
    $UseDocker = $false
} elseif ($SandboxMode -eq "auto") {
    # Auto mode: use Docker if required by policy and available
    if ($DockerRequired) {
        if (Get-Command docker -ErrorAction SilentlyContinue) {
            $UseDocker = $true
        } else {
            Write-Warning "Security policy requires Docker but docker is not available."
            if ($AllowHost -ne "true") {
                Write-Error "Set CAMPAIGN_ALLOW_HOST=true to proceed without Docker sandbox."
                Write-Error "       This is a security risk for autonomous code execution."
                exit 1
            }
            Write-Host "Proceeding with host execution (CAMPAIGN_ALLOW_HOST=true)..."
        }
    }
}

# Invoke droid worker
Write-Host ""
Write-Host "Invoking pk-puzldai worker..."
if ($UseDocker) { Write-Host "Sandbox mode: Docker ($DockerImage)" } else { Write-Host "Sandbox mode: Host" }
Write-Host ""

# Set environment variables from config
if (-not $env:DROID_LOG_LEVEL) { $env:DROID_LOG_LEVEL = "info" }
if (-not $env:DROID_TIMEOUT) { $env:DROID_TIMEOUT = "300" }

$WorkerExitCode = 0

if ($UseDocker) {
    Write-Host "Running in Docker sandbox..."
    
    # Resolve absolute paths for Docker volumes
    $AbsProjectPath = Convert-Path $ProjectPath
    $AbsTaskSpecFile = Convert-Path $TaskSpecFile

    docker run --rm `
        --security-opt no-new-privileges:true `
        --cap-drop ALL `
        -v "${AbsProjectPath}:/workspace:rw" `
        -v "${AbsTaskSpecFile}:/task-spec.json:ro" `
        -w /workspace `
        -e "DROID_LOG_LEVEL=$env:DROID_LOG_LEVEL" `
        -e "DROID_TIMEOUT=$env:DROID_TIMEOUT" `
        "$DockerImage" `
        pk-puzldai run --model "$Model" --task "$(Get-Content $AbsTaskSpecFile -Raw)" --cwd /workspace

    $WorkerExitCode = $LASTEXITCODE
} else {
    # Host execution (no sandbox)
    # Note: We need to be careful with argument passing in PowerShell.
    # Passing the raw JSON content can be tricky. 
    # If pk-puzldai supports file path for --task, that would be better.
    # Assuming it accepts the JSON string as per bash script.
    
    # We escape double quotes in the JSON for the shell argument
    $TaskArg = $TaskSpecContent.Replace('"', '\"')
    
    pk-puzldai run `
        --model "$Model" `
        --task "$TaskSpecContent" `
        --cwd "$ProjectPath"

    $WorkerExitCode = $LASTEXITCODE
}

# Check result
if ($WorkerExitCode -eq 0) {
    Write-Host ""
    Write-Host "=== Worker completed successfully ==="

    # Run tests if configured
    if (Test-Path "package.json") {
        Write-Host "Running tests..."
        npm test
    }

    # Run linter if configured
    if (Test-Path "package.json") {
        Write-Host "Running linter..."
        npm run lint
    }

    Write-Host "Task $TaskId completed on branch $BranchName"
} else {
    Write-Host ""
    Write-Host "=== Worker failed with exit code $WorkerExitCode ==="
    Write-Host "Consider retrying with alternate model: glm-4.7"
}

Pop-Location
exit $WorkerExitCode
