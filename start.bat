@echo off
setlocal enabledelayedexpansion
title "Glowvera Full-Stack Unisex Salon & Spa Platform"
echo ==========================================================
echo   GLOWVERA - Unisex Salon ^& Spa SaaS Platform
echo   Spring Boot Backend + Angular 20 Frontend + MySQL
echo ==========================================================
echo.

:: 1. Launch Spring Boot Backend
echo [1/3] Starting Spring Boot REST Backend on Port 8080...
start "Glowvera Spring Boot Backend" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"

:: 2. Launch Angular Frontend
echo [2/3] Starting Angular Development Server on Port 4200...
start "Glowvera Angular Frontend" cmd /k "cd frontend && npm run start"

:: 3. Warm-up time (cross-platform ping delay)
echo [3/3] Warming up services and database connections...
ping 127.0.0.1 -n 8 > nul

:: 4. Open browser
echo Launching storefront dashboard in default browser...
start "" "http://localhost:4200"

echo ==========================================================
echo Initialization completed.
echo.
echo  Access URL:     http://localhost:4200
echo  API Docs URL:   http://localhost:8080/api/services
echo  Default Client: client@glowvera.com / password123
echo  Default Admin:  admin@glowvera.com / password123
echo ==========================================================
echo Please keep backend and frontend console windows open.
echo ==========================================================
