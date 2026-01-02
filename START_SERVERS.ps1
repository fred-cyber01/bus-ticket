# START TICKETING SYSTEM
# This script starts both backend and frontend servers

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  TICKET BOOKING SYSTEM STARTUP" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if XAMPP MySQL is running
Write-Host "Checking MySQL connection..." -ForegroundColor Yellow
$mysqlRunning = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue

if ($mysqlRunning.TcpTestSucceeded) {
    Write-Host "✓ MySQL is running on port 3306" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL is NOT running!" -ForegroundColor Red
    Write-Host "  Please start XAMPP MySQL first" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Starting Backend Server...' -ForegroundColor Green; npm start"

Write-Host "✓ Backend server starting in new window" -ForegroundColor Green
Write-Host "  URL: http://localhost:3000" -ForegroundColor Cyan

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow

# Start frontend in new window  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Starting Frontend Server...' -ForegroundColor Green; npm run dev"

Write-Host "✓ Frontend server starting in new window" -ForegroundColor Green
Write-Host "  URL: http://localhost:5173" -ForegroundColor Cyan

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  BOTH SERVERS STARTED!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Yellow
Write-Host "  Admin: admin@ticketbus.rw / admin123" -ForegroundColor White
Write-Host "  Company: manager@rwandaexpress.rw / manager123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
pause
