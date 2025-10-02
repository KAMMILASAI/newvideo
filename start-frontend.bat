@echo off
echo Installing frontend dependencies...
cd frontend
call npm install
echo.
echo Starting Video Call Frontend...
call npm run dev
