@echo off
echo === AI Shadow IT Scanner - Windows Local Setup ===

cd backend

IF NOT EXIST ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ===================================================
echo  NOTE: You still need PostgreSQL running locally.
echo  Easiest option: install Docker Desktop and run:
echo    docker run -d --name ai-scanner-db ^
echo      -e POSTGRES_PASSWORD=postgres ^
echo      -e POSTGRES_DB=ai_scanner ^
echo      -p 5432:5432 postgres:16-alpine
echo ===================================================
echo.

echo Starting FastAPI server...
set DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_scanner
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
