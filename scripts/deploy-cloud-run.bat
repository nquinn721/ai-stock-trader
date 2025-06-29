@echo off
REM Cloud Run Deployment Script for Stock Trading App - Windows Version
REM This script builds and deploys the application to Google Cloud Run

setlocal enabledelayedexpansion
set GOOGLE_CLOUD_PROJECT=heroic-footing-460117-k8
set GOOGLE_CLOUD_REGION=us-east1
set DB_HOST=/cloudsql/heroic-footing-460117-k8:us-central1:accountant
set DB_PASSWORD=Accountant1234
REM Configuration
if "%GOOGLE_CLOUD_PROJECT%"=="" (
    echo ❌ GOOGLE_CLOUD_PROJECT is not set. Please set it:
    echo set GOOGLE_CLOUD_PROJECT=your-project-id
    echo Or run: gcloud config set project your-project-id
    exit /b 1
)

if "%GOOGLE_CLOUD_REGION%"=="" (
    set REGION=us-central1
) else (
    set REGION=%GOOGLE_CLOUD_REGION%
)

set PROJECT_ID=%GOOGLE_CLOUD_PROJECT%
set SERVICE_NAME=stock-trading-app
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

REM Database configuration
if "%DB_HOST%"=="" set DB_HOST_STATUS=Not configured
if NOT "%DB_HOST%"=="" set DB_HOST_STATUS=%DB_HOST%
if "%DB_PASSWORD%"=="" set DB_PASSWORD_STATUS=Not configured
if NOT "%DB_PASSWORD%"=="" set DB_PASSWORD_STATUS=***

echo 🚀 Starting Cloud Run deployment for Stock Trading App

REM Check if gcloud is installed
gcloud version >nul 2>&1
if errorlevel 1 (
    echo ❌ gcloud CLI is not installed. Please install it first.
    exit /b 1
)

echo 📋 Configuration:
echo   Project ID: %PROJECT_ID%
echo   Region: %REGION%
echo   Service Name: %SERVICE_NAME%
echo   Image: %IMAGE_NAME%
echo   Database Host: %DB_HOST_STATUS%
echo   Database Password: %DB_PASSWORD_STATUS%
echo.

if "%DB_HOST%"=="" (
    echo ⚠️  Database configuration not complete.
    echo Please set the following environment variables:
    echo   set DB_HOST=/cloudsql/your-project:region:instance-name
    echo   set DB_USERNAME=stocktrader
    echo   set DB_PASSWORD=your-secure-password
    echo   set DB_NAME=stocktrading
    echo.
    echo Or update the substitution variables in cloudbuild.yaml
    echo.
)

REM Build and submit using Cloud Build
echo 🔨 Building application with Cloud Build...

if NOT "%DB_HOST%"=="" if NOT "%DB_PASSWORD%"=="" (
    echo Using provided database configuration...
    gcloud builds submit --config cloudbuild.yaml --substitutions _REGION="%REGION%",_DB_HOST="%DB_HOST%",_DB_USERNAME="%DB_USERNAME%",_DB_PASSWORD="%DB_PASSWORD%",_DB_NAME="%DB_NAME%" .
) else (
    echo Using default database configuration from cloudbuild.yaml...
    gcloud builds submit --config cloudbuild.yaml --substitutions _REGION="%REGION%" .
)

if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Deployment completed successfully!
echo.
echo 🌐 Service URL:
for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do echo %%i
echo.
echo 📊 Service Status:
gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="table(metadata.name,status.url,status.conditions.type,status.conditions.status)"
