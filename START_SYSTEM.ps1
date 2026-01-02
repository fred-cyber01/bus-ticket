# Start Backend and Frontend for Bus Ticketing System

Write-Host "🚌 Starting Rwanda Bus Ticketing System..." -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is running
Write-Host "Checking MySQL service..." -ForegroundColor Yellow
$mysqlStatus = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlStatus) {
    if ($mysqlStatus.Status -eq "Running") {
        Write-Host "✅ MySQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MySQL is not running. Please start XAMPP MySQL" -ForegroundColor Red
        Start-Process "C:\xampp\xampp-control.exe"
        exit
    }
} else {
    Write-Host "⚠️  MySQL service not found. Please start XAMPP" -ForegroundColor Red
    exit
}

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\user\ticketbooking-system-master\backend; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\user\ticketbooking-system-master\frontend; npm run dev"

Write-Host ""
Write-Host "✅ System Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Logins:" -ForegroundColor Yellow
Write-Host "  Admin:    admin@ticketbus.rw / admin123" -ForegroundColor White
Write-Host "  Customer: customer@example.com / customer123" -ForegroundColor White
Write-Host "  Company:  manager@rwandaexpress.rw / manager123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (servers will keep running in separate windows)" -ForegroundColor Gray
Write-Host ""

# Keep the script running
while ($true) {
    Start-Sleep -Seconds 60
}
