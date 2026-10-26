Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Starting PayShield AI (Backend & Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Check if Backend is running
$backendConn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if (-not $backendConn) {
    Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python run.py"
} else {
    Write-Host "[1/2] FastAPI Backend is already running on port 8000." -ForegroundColor Green
}

# Check if Frontend is running
$frontendConn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $frontendConn) {
    Write-Host "[2/2] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
} else {
    Write-Host "[2/2] Vite Frontend is already running on port 5173." -ForegroundColor Green
}

Write-Host ""
Write-Host "PayShield AI is ready!" -ForegroundColor Green
Write-Host "Dashboard:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
