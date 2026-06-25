@echo off
cd /d "%~dp0"
title HN Handicraft Server
echo ============================================
echo   HN Handicraft - Account + Website Server
echo ============================================
echo.
echo Stopping any old server on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo.
echo Starting server with shared login database...
echo.
python server.py
echo.
pause
