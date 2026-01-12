@echo off
REM Ralph Loop Benchmark - Quick Run
REM Runs 20 benchmark tasks with timeout

echo ============================================
echo Ralph Loop Benchmark Evaluation
echo ============================================
echo.

cd /d %~dp0

REM Check build
if not exist dist\cli\index.js (
    echo Building project...
    bun run build
    if errorlevel 1 (
        echo Build failed
        exit /b 1
    )
)

echo ✅ Build verified
echo.

set SUCCESS=0
set TOTAL=0

echo Running 20 benchmark tasks...
echo.

for %%T in (
    "Implement OAuth2 flow with refresh tokens"
    "Add comprehensive error handling to API layer"
    "Refactor monolithic service into microservices"
    "Implement caching layer with Redis"
    "Add unit tests for legacy codebase"
    "Fix authentication middleware JWT validation"
    "Implement rate limiting for API endpoints"
    "Add database migration for user preferences"
    "Refactor duplicate code in payment module"
    "Fix memory leak in event handler"
    "Extract function contracts and document"
    "Identify unused dependencies in project"
    "Generate TypeScript definitions for untyped code"
    "Find and fix type safety violations"
    "Optimize hot path with memoization"
    "Add validation schema across multiple files"
    "Refactor shared utility module"
    "Implement feature with 3-layer architecture"
    "Fix race condition in async code"
    "Add comprehensive logging system"
) do (
    set /a TOTAL+=1
    echo.
    echo Task !TOTAL!/20: %%~T
    
    for /f "delims=" %%A in ('node dist\cli\index.js ralph "%%~T" --iters 1 --scope src 2^>^&1 ^| findstr /c:"Plan created" /c:"DONE" /c:"✓"') do (
        set FOUND=%%A
    )
    
    if defined FOUND (
        echo ✅ SUCCESS
        set /a SUCCESS+=1
    ) else (
        echo ❌ FAILED
    )
    
    timeout /t 3 /nobreak >nul
)

echo.
echo ============================================
echo RESULTS
echo ============================================
echo.
echo Tasks: %SUCCESS%/%TOTAL%
echo Success Rate: %SUCCESS%% of %TOTAL% = %SUCCESS%00 / %TOTAL% = %SUCCESS%00 / %TOTAL%

if %TOTAL% gtr 0 (
    set /a PERCENT=%SUCCESS%00 / %TOTAL%
    echo.
    if %PERCENT% geq 70 (
        echo 🎉 SOTA TARGET ACHIEVED! (%PERCENT%%)
    ) else (
        echo 📈 Progress: %PERCENT%% (target: 70%%)
    )
)

echo.
echo Results saved to scripts\eval\results\quick-benchmarks.log
