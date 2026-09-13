@echo off
title Grants Crosswalk PWA Launcher
cd /d "%~dp0"

echo ========================================================
echo   Starting Grants Crosswalk PWA...
echo ========================================================

:: Start local node server in background if port 8000 not listening
netstat -ano | findstr :8000 >nul 2>&1
if %errorlevel% neq 0 (
    start "Grants Crosswalk Server" /min node server.js
    timeout /t 1 /nobreak >nul
)

:: Launch in native Standalone App Window mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:8000
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:8000
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:8000
) else (
    start http://localhost:8000
)

echo App window launched!
