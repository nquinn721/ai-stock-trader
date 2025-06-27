@echo off
echo 🚀 Setting up Local Production Environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if .env.local-prod exists
if not exist ".env.local-prod" (
    echo 📋 Creating .env.local-prod from example...
    copy .env.local-prod.example .env.local-prod
    echo ⚠️  Please edit .env.local-prod with your actual API keys before proceeding.
    echo    Then run this script again.
    exit /b 1
)

echo 🔧 Building local production images...
call npm run local-prod:build

echo 🗄️ Setting up database...
echo ⏳ Starting services...
call npm run local-prod:start

echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

echo 🏥 Checking service health...
call npm run local-prod:health

echo ✅ Local Production Environment is ready!
echo.
echo 📊 Access your application:
echo    Frontend: http://localhost:3100
echo    Backend API: http://localhost:8100
echo    Database: localhost:5500
echo    Redis: localhost:6400
echo    Production-like (with Nginx): http://localhost:80
echo.
echo 🔧 Useful commands:
echo    npm run local-prod:logs    - View logs
echo    npm run local-prod:stop    - Stop services
echo    npm run local-prod:status  - Check status
echo    npm run local-prod:reset   - Reset everything

pause
