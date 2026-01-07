@echo off
echo Starting PDF Utility Platform (Dev Mode)...

:: Start Backend
start "FastAPI Backend" cmd /k "cd backend && call venv\Scripts\activate && python main.py"

:: Start Frontend (Vite + Electron)
cd desktop_app
:: We assume package.json has "dev:electron" script we will add
npm run dev:electron
