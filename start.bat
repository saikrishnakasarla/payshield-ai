@echo off
echo ========================================================
echo   Starting PayShield AI (Backend & Frontend)
echo ========================================================

echo [1/2] Starting FastAPI Backend on port 8000...
start "PayShield Backend" cmd /k "cd backend && venv\Scripts\python.exe run.py"

echo [2/2] Starting Vite Frontend on port 5173...
start "PayShield Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers have been launched!
echo - Web Dashboard:  http://localhost:5173
echo - API Backend:    http://127.0.0.1:8000
echo - API Docs:       http://127.0.0.1:8000/docs
echo ========================================================
pause
