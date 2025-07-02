@echo off
REM AutoM8 School Management System - GitHub Deployment Script
REM Run this script after installing Git and creating a GitHub repository

echo.
echo ===================================================
echo   AutoM8 School Management System
echo   GitHub Deployment Script
echo ===================================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git first from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [INFO] Git is installed and ready
echo.

REM Get repository URL from user
set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/yourusername/autom8-school-management-system.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] Repository URL is required
    pause
    exit /b 1
)

echo.
echo [INFO] Initializing Git repository...
git init

echo [INFO] Adding all files to staging...
git add .

echo [INFO] Creating initial commit...
git commit -m "Initial commit: AutoM8 School Management System v1.0 - Production Ready"

echo [INFO] Adding remote origin...
git remote add origin "%REPO_URL%"

echo [INFO] Setting main branch...
git branch -M main

echo [INFO] Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo   SUCCESS! Your project is now on GitHub
    echo ===================================================
    echo.
    echo Repository URL: %REPO_URL%
    echo.
    echo Next steps:
    echo 1. Visit your GitHub repository
    echo 2. Add repository description and topics
    echo 3. Configure branch protection rules
    echo 4. Enable GitHub Issues and Discussions
    echo 5. Set up GitHub Actions for CI/CD (optional)
    echo.
    echo For deployment instructions, see:
    echo - FINAL-DEPLOYMENT-GUIDE.md
    echo - GITHUB-DEPLOYMENT-INSTRUCTIONS.md
    echo.
) else (
    echo.
    echo [ERROR] Failed to push to GitHub
    echo Please check your repository URL and GitHub credentials
    echo.
)

pause
