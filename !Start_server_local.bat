@echo off
REM Batch file to run no_cache_server.py

REM Ensure Python is available in PATH
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH. Please install Python or add it to PATH.
    pause
    exit /b
)

REM Run the Python script
python !no_cache_server.py --port 8000
pause