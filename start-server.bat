@echo off
cd /d "%~dp0"
title HN Handicraft Server
echo ============================================
echo   HN Handicraft - Account + Website Server
echo ============================================
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  set PY=python
) else (
  where py >nul 2>&1
  if %errorlevel%==0 (
    set PY=py -3
  ) else (
    echo Python is not installed. Install Python 3 from https://python.org
    echo Then run this file again.
    pause
    exit /b 1
  )
)

echo Stopping any old server on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo.
echo Starting server with shared login database...
echo Open in browser: http://localhost:8080
echo.
%PY% server.py
echo.
if errorlevel 1 (
  echo Server exited with an error.
)
pause
