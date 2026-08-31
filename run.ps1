# 1-Click Launch Script for LocalAI Studio (ChatGPT Web + Offline/Online Platform)
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "       ⚡ Starting LocalAI Studio Platform ⚡" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = Join-Path $CurrentDir "server"
$ClientDir = Join-Path $CurrentDir "client"
$VenvPython = Join-Path (Split-Path -Parent $CurrentDir) "venv\Scripts\python.exe"

# 1. Start Backend FastAPI Server
Write-Host "[1/2] Launching Backend Server on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath $VenvPython -ArgumentList "-m uvicorn app.main:app --port 8000 --host 127.0.0.1" -WorkingDirectory $ServerDir -PassThru

Start-Sleep -Seconds 2

# 2. Start Frontend Dev Server
Write-Host "[2/2] Launching Frontend UI on http://127.0.0.1:5173..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $ClientDir -PassThru

Start-Sleep -Seconds 3

# 3. Open in Default Browser
Write-Host "Opening LocalAI Studio in your browser..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "✨ LocalAI Studio is running!" -ForegroundColor Green
Write-Host "   • Web App: http://127.0.0.1:5173" -ForegroundColor White
Write-Host "   • Backend API: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in this window or close it to stop the platform." -ForegroundColor Yellow

# Wait for exit
try {
    Wait-Process -Id $FrontendProcess.Id
} finally {
    Stop-Process -Id $BackendProcess.Id -ErrorAction SilentlyContinue
}
