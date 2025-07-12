@echo off
echo Starting LandKrypt Enhanced Platform...
echo.

echo Setting up environment...
set NEXT_PUBLIC_DEMO_MODE=true
set NEXT_PUBLIC_MOCK_DEPLOYMENT=true

echo Starting development server...
npm run dev

pause
