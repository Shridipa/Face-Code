@echo off
title FaceCode Quick Launcher
echo Starting FaceCode: Adaptive AI Coding Platform...
echo.

:: Start Backend
echo [1/2] Launching FastAPI Backend (Port 8000)...
start "FaceCode Backend" cmd /k ".\venv\Scripts\python.exe main.py"

:: Buffer to let backend start initializing
timeout /t 2 >nul

:: Start Frontend
echo [2/2] Launching React Frontend (Port 5173)...
start "FaceCode Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================
echo  READY! Both servers are starting in separate windows.
echo.
echo  1. Wait for Backend to say "Application startup complete"
echo  2. Wait for Frontend to show "http://localhost:5173/"
echo  3. Open Browser to: http://localhost:5173/
echo ======================================================
echo.
echo Press any key to close this launcher shell...
pause >nul
