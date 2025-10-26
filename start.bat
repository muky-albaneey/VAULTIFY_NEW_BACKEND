@echo off
REM Vaultify Backend Startup Script for Windows

echo 🚀 Starting Vaultify Backend...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    copy env.example .env
    echo 📝 Please update .env file with your configuration before running again.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if PostgreSQL is running
echo 🔍 Checking PostgreSQL connection...
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not running. Please start PostgreSQL first.
    echo 💡 You can start it with: net start postgresql-x64-15
    pause
    exit /b 1
)

REM Run migrations
echo 🔄 Running database migrations...
npm run migration:run

REM Run seeds
echo 🌱 Running database seeds...
npm run seed:run

REM Start the application
echo 🎯 Starting Vaultify Backend...
npm run start:dev
