@echo off
echo ========================================
echo  Academic AI - Backend Startup
echo ========================================
echo.

cd backend

if not exist ".env" (
    echo Creating .env from example...
    copy .env.example .env
)

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r ..\requirements.txt --quiet

echo.
echo Starting FastAPI backend on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
python main.py

pause
