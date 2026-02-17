# Test Production Backend (PowerShell)
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing Production Backend" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Testing Health Endpoint..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "https://bus-ticket-c8ld.onrender.com/health" -Method Get
$health | ConvertTo-Json -Depth 3
Write-Host ""

Write-Host "[2/3] Testing Company Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "manager@rwandaexpress.rw"
        password = "manager123"
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "https://bus-ticket-c8ld.onrender.com/api/auth/company/signin" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginBody

    if ($login.success) {
        Write-Host "✅ LOGIN SUCCESSFUL!" -ForegroundColor Green
        Write-Host "Token: $($login.data.token.Substring(0, 30))..." -ForegroundColor Green
    } else {
        Write-Host "❌ LOGIN FAILED: $($login.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[3/3] Testing Trips API..." -ForegroundColor Yellow
$trips = Invoke-RestMethod -Uri "https://bus-ticket-c8ld.onrender.com/api/trips" -Method Get
Write-Host "Trips found: $($trips.data.Count)" -ForegroundColor Cyan
if ($trips.data.Count -eq 0) {
    Write-Host "⚠️  No trips found - you need to create trips with future dates!" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If login works: Update CORS on Render" -ForegroundColor White
Write-Host "2. Create trips with future dates (after Feb 15, 2026)" -ForegroundColor White
Write-Host "3. Test frontend at: https://bus-ticket-theta.vercel.app" -ForegroundColor White
Write-Host ""
