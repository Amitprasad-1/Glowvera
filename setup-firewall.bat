@echo off
setlocal enabledelayedexpansion
title Glowvera Mobile Port Configurator
echo ==========================================================
echo   GLOWVERA - Opening Ports for Mobile Testing
echo   Requires Administrator Privileges
echo ==========================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [1/2] Adding Firewall rule for Angular Frontend Port 4200...
    netsh advfirewall firewall add rule name="Glowvera Frontend" dir=in action=allow protocol=TCP localport=4200
    
    echo [2/2] Adding Firewall rule for Spring Boot Backend Port 8080...
    netsh advfirewall firewall add rule name="Glowvera Backend" dir=in action=allow protocol=TCP localport=8080
    
    echo.
    echo ==========================================================
    echo  SUCCESS: Ports 4200 and 8080 are now open.
    echo.
    echo  Access the app on your phone browser using this exact URL:
    echo  http://192.168.31.103:4200
    echo ==========================================================
    echo.
) else (
    echo ==========================================================
    echo  ERROR: Administrator Privileges Required
    echo.
    echo  Please do the following:
    echo  1. Go to your project folder: c:\My Work\Project\Glowvera
    echo  2. Right-click on setup-firewall.bat
    echo  3. Select Run as administrator
    echo ==========================================================
    echo.
)
pause
