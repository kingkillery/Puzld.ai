@echo off
REM Ralph Loop Benchmark Evaluation
REM Run incremental benchmarks and track results

echo ============================================
echo Ralph Wiggum Loop Benchmark Evaluation
echo ============================================
echo.

cd /d %~dp0

REM Check build
if not exist dist\cli\index.js (
    echo ❌ Build not found. Running build...
    bun run build
    if errorlevel 1 (
        echo ❌ Build failed
        exit /b 1
    )
)

echo ✅ Build verified
echo.

REM Initialize results
set RESULTS_FILE=benchmark-results.txt
echo Ralph Benchmark Results > %RESULTS_FILE%
echo ====================== >> %RESULTS_FILE%
echo Generated: %date% %time% >> %RESULTS_FILE%
echo. >> %RESULTS_FILE%

set SUCCESS_COUNT=0
set TOTAL_COUNT=0

REM Quick benchmark (1 task per category)
echo Running quick benchmarks...
echo.

set CATEGORIES=Simple-Analysis SWE-Bench-Pro CoreCodeBench Agentic-Multi-File

for %%C in (%CATEGORIES%) do (
    echo.
    echo ============================================
    echo 📁 %%C
    echo ============================================
    
    if "%%C"=="Simple-Analysis" (
        set TASK=List all TypeScript files in src
    )
    if "%%C"=="SWE-Bench-Pro" (
        set TASK=Implement OAuth2 flow with refresh tokens
    )
    if "%%C"=="CoreCodeBench" (
        set TASK=Extract function contracts in src/adapters
    )
    if "%%C"=="Agentic-Multi-File" (
        set TASK=Add validation schema across files
    )
    
    echo 🎯 Task: %TASK%
    echo Running Ralph loop...
    
    for /f "delims=" %%A in ('node dist\cli\index.js ralph "%TASK%" --iters 2 --scope src 2^>^&1 ^| findstr /c:"Plan created" /c:"DONE" /c:"✓"') do set RESULT=%%A
    
    set /a TOTAL_COUNT+=1
    echo %RESULT%
    
    if not "%RESULT%"=="" (
        set /a SUCCESS_COUNT+=1
        echo ✅ SUCCESS
        echo %%C: ✅ SUCCESS >> %RESULTS_FILE%
    ) else (
        echo ❌ FAILED
        echo %%C: ❌ FAILED >> %RESULTS_FILE%
    )
    
    timeout /t 5 /nobreak >nul
)

echo.
echo ============================================
echo 📊 SUMMARY
echo ============================================
echo.
echo Tasks Completed: %SUCCESS_COUNT%/%TOTAL_COUNT%
echo Success Rate: %SUCCESS_COUNT%/%TOTAL_COUNT% * 100 = %SUCCESS_COUNT%00 / %TOTAL_COUNT% = %SUCCESS_COUNT%00 / %TOTAL_COUNT%
if %TOTAL_COUNT% gtr 0 (
    set /a PERCENT=%SUCCESS_COUNT%00 / %TOTAL_COUNT%
    echo Success Rate: %PERCENT%00 / %TOTAL_COUNT% = %PERCENT%00 / %TOTAL_COUNT%
)

echo.
if %PERCENT% geq 70 (
    echo 🎉 SOTA TARGET ACHIEVED! (>= 70%%)
) else (
    echo 📈 Progress: %PERCENT%% (target: 70%%)
)

echo.
echo Full benchmark suite: bun run scripts/eval/benchmark-harness.ts
echo Results saved to: %RESULTS_FILE%
