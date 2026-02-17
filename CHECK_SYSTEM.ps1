# Quick System Verification Script
Write-Host "🚌 TICKET BOOKING SYSTEM - QUICK VERIFICATION" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

# Check if servers are running
Write-Host "1️⃣  Checking Server Status..." -ForegroundColor Yellow
Write-Host ""

$backendPort = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue

if ($backendPort) {
    Write-Host "✅ Backend Server Running (Port 3000)" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Server NOT Running" -ForegroundColor Red
    Write-Host "   Start with: cd backend; npm start" -ForegroundColor Gray
}

if ($frontendPort) {
    Write-Host "✅ Frontend Server Running (Port 5173)" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend Server NOT Running" -ForegroundColor Red
    Write-Host "   Start with: cd frontend; npm run dev" -ForegroundColor Gray
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

if ($backendPort -and $frontendPort) {
    Write-Host "🎉 SYSTEM IS READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access the system at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 LOGIN CREDENTIALS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🎫 CUSTOMER (For Buying Tickets):" -ForegroundColor Cyan
    Write-Host "      Email:    customer@example.com" -ForegroundColor White
    Write-Host "      Password: customer123" -ForegroundColor White
    Write-Host ""
    Write-Host "   🏢 COMPANY MANAGER:" -ForegroundColor Cyan
    Write-Host "      Email:    manager@rwandaexpress.rw" -ForegroundColor White
    Write-Host "      Password: manager123" -ForegroundColor White
    Write-Host ""
    Write-Host "   👨‍💼 ADMIN:" -ForegroundColor Cyan
    Write-Host "      Email:    admin@ticketbus.rw" -ForegroundColor White
    Write-Host "      Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ All features are available!" -ForegroundColor Green
} else {
    Write-Host "⚠️  SYSTEM NOT FULLY RUNNING" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start the system, run:" -ForegroundColor Cyan
    Write-Host "   .\START_SYSTEM.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually:" -ForegroundColor Cyan
    Write-Host "   Terminal 1: cd backend; npm start" -ForegroundColor White
    Write-Host "   Terminal 2: cd frontend; npm run dev" -ForegroundColor White
}

Write-Host ""
Write-Host "📖 For complete guide, see: CREDENTIALS_AND_TICKET_BUYING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
