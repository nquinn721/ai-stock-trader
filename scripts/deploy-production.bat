@echo off
REM Production deployment script for Windows

echo 🚀 Starting production deployment...

REM Build and start production containers
echo 📦 Building production containers...
docker-compose -f docker-compose.prod.yml build --no-cache

echo 🔄 Stopping existing production containers...
docker-compose -f docker-compose.prod.yml down

echo 🚀 Starting production environment...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak > nul

REM Health checks
echo 🏥 Running health checks...

REM Check backend health
curl -f http://localhost:8080/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
    exit /b 1
)

REM Check frontend health
curl -f http://localhost:3080/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
    exit /b 1
)

echo 🎉 Production deployment completed successfully!
echo.
echo 📍 Production URLs:
echo    Frontend: http://localhost:3080
echo    Backend:  http://localhost:8080
echo    API Docs: http://localhost:8080/api/docs
echo.
echo 📊 Monitoring:
echo    Logs: docker-compose -f docker-compose.prod.yml logs -f
echo    Status: docker-compose -f docker-compose.prod.yml ps
