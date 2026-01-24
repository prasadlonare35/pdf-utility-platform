@echo off
echo Building backend executable with PyInstaller...
pyinstaller --noconfirm --onefile --add-data "modules;modules" main.py
echo Backend build complete.
