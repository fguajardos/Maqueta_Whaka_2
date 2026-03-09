@echo off
title WhakaChile - Panel Admin
echo.
echo  ========================================
echo    WhakaChile - Iniciando servidor...
echo  ========================================
echo.
cd /d "c:\Users\the_r\Desktop\Maqueta_Whtspp_WhakaChile\whaka-app"
timeout /t 2 /nobreak >nul
start http://localhost:5173
npx vite --port 5173
