@echo off
echo Installing Backend Dependencies...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo Installing Frontend Dependencies...
cd ..\desktop_app
call npm install
call npm install electron electron-builder concurrently wait-on cross-env --save-dev

echo.
echo All dependencies installed.
pause
