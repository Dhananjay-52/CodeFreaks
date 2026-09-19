@echo off
echo ====================================================
echo  Sovereign Autonomous AI Workbench — Backend
echo ====================================================
cd /d "%~dp0"
py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
