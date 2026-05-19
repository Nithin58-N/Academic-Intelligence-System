@echo off
echo ========================================
echo  Academic AI - Frontend Startup
echo ========================================
echo.

cd frontend

if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)

echo.
echo Starting Next.js frontend on http://localhost:3000
echo.
npm run dev

pause
