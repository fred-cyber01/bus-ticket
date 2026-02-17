@echo off
echo =========================================
echo Testing Production Backend
echo =========================================
echo.

echo [1/3] Testing Health Endpoint...
curl -s https://bus-ticket-c8ld.onrender.com/health
echo.
echo.

echo [2/3] Testing Company Login...
curl -s -X POST https://bus-ticket-c8ld.onrender.com/api/auth/company/signin ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"manager@rwandaexpress.rw\",\"password\":\"manager123\"}"
echo.
echo.

echo [3/3] Testing Trips API...
curl -s https://bus-ticket-c8ld.onrender.com/api/trips
echo.
echo.

echo =========================================
echo Tests Complete!
echo =========================================
echo.
echo Expected Results:
echo [1] Health: Should return success: true
echo [2] Login: Should return token (not 503 error!)
echo [3] Trips: Should return array (may be empty)
echo.
pause
