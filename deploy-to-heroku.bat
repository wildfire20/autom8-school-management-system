@echo off
REM AutoM8 School Management System - Heroku Deployment Script

echo.
echo ===================================================
echo   AutoM8 School Management System
echo   Heroku Deployment Script
echo ===================================================
echo.

REM Check if Heroku CLI is installed
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Heroku CLI is not installed
    echo Please install from: https://devcenter.heroku.com/articles/heroku-cli
    echo.
    pause
    exit /b 1
)

echo [INFO] Heroku CLI is installed and ready
echo.

REM Login to Heroku
echo [INFO] Please login to Heroku...
heroku login

REM Get app name from user
set /p APP_NAME="Enter your Heroku app name (e.g., my-school-management): "

if "%APP_NAME%"=="" (
    echo [ERROR] App name is required
    pause
    exit /b 1
)

echo.
echo [INFO] Creating Heroku app: %APP_NAME%
heroku create %APP_NAME%

echo [INFO] Adding PostgreSQL database...
heroku addons:create heroku-postgresql:essential-0 --app %APP_NAME%

echo [INFO] Setting environment variables...
heroku config:set NODE_ENV=production --app %APP_NAME%
heroku config:set JWT_SECRET=super-secure-jwt-secret-key-for-autom8-school-management-system-production --app %APP_NAME%
heroku config:set BCRYPT_ROUNDS=12 --app %APP_NAME%

echo [INFO] Deploying to Heroku...
git push heroku main

echo [INFO] Setting up database schema...
heroku run node setup-enhanced-schema.js --app %APP_NAME%

echo [INFO] Opening your deployed app...
heroku open --app %APP_NAME%

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS! Your app is now live on Heroku
    echo ===================================================
    echo.
    echo App URL: https://%APP_NAME%.herokuapp.com
    echo.
    echo Demo Credentials:
    echo Admin: admin@demo-academy.eud.co
    echo Password: admin123
    echo.
    echo Teacher: teacher@demo-academy.eud.co  
    echo Password: teacher123
    echo.
    echo Next steps:
    echo 1. Test the demo credentials
    echo 2. Share the URL with potential schools
    echo 3. Monitor usage in Heroku dashboard
    echo.
) else (
    echo.
    echo [ERROR] Deployment failed
    echo Please check the error messages above
    echo.
)

pause
