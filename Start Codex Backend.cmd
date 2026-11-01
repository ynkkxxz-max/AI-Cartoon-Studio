@echo off
cd /d "%~dp0backend"
python -m uvicorn codex_app.main:app --host 127.0.0.1 --port 8000
pause
