$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resultsDir = Join-Path $root "results"
$logPath = Join-Path $resultsDir "agentic-smoke-$timestamp.log"

if (-not (Test-Path $resultsDir)) {
  New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

Write-Host "Running agentic smoke tests (Claude, Gemini, pk-puzldai)"
Write-Host "Log: $logPath"
Start-Transcript -Path $logPath | Out-Null

$harnesses = @(
  "run-claude.ps1",
  "run-gemini.ps1",
  "run-pk-puzldai.ps1"
)

foreach ($harness in $harnesses) {
  $scriptPath = Join-Path $root $harness
  if (Test-Path $scriptPath) {
    Write-Host "\n--- Running $harness ---"
    & powershell -ExecutionPolicy Bypass -File $scriptPath
  } else {
    Write-Host "Missing harness: $scriptPath"
  }
}

Stop-Transcript | Out-Null
Write-Host "\nDone. Results saved to $logPath"
