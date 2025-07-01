@echo off
echo Starting MySQL database container...
docker run --name stocktrading-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=stocktrading_dev -p 3306:3306 -d mysql:8.0

echo Waiting for database to start...
timeout /t 10

echo Database container started!
echo Connection details:
echo   Host: localhost
echo   Port: 3306
echo   Username: root
echo   Password: password
echo   Database: stocktrading_dev
pause
