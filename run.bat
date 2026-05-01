@echo off
REM ─────────────────────────────────────────────────────────────
REM  BLOOP Interpreter — Quick Start (Windows)
REM  Double-click this file, or run it from Command Prompt.
REM ─────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════╗
echo ║     BLOOP Interpreter — Starting Up      ║
echo ╚══════════════════════════════════════════╝
echo.

REM Check Java
java -version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java not found. Please install Java 11+ and add it to your PATH.
    pause
    exit /b 1
)
echo [OK] Java found.

REM Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found. Please install Python 3.8+.
    pause
    exit /b 1
)
echo [OK] Python found.

REM Move to backend folder
cd /d "%~dp0backend"

REM Install dependencies
echo.
echo [*] Installing Python dependencies...
python -m pip install -r requirements.txt --quiet

REM Start Flask
echo.
echo [*] Starting Flask server...
echo     Open your browser: http://localhost:5000
echo.
python app.py

pause
