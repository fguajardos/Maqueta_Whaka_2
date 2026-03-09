@echo off
chcp 65001 >nul
title WhakaChile Orquestador - Maqueta v2

echo ╔═══════════════════════════════════════════════════╗
echo ║     WhakaChile Orquestador - Inicio de Maqueta   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM ── Verificar que estamos en el directorio correcto ──
cd /d "%~dp0"

REM ── 1. Verificar Docker ──
echo [1/5] Verificando Docker...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker no esta corriendo. Por favor inicia Docker Desktop y vuelve a intentar.
    echo.
    pause
    exit /b 1
)
echo       Docker OK

REM ── 2. Levantar contenedores (PostgreSQL + Redis) ──
echo [2/5] Levantando contenedores (PostgreSQL + Redis)...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] No se pudieron levantar los contenedores Docker.
    echo.
    pause
    exit /b 1
)
echo       Contenedores OK

REM ── 3. Esperar a que PostgreSQL esté listo ──
echo [3/5] Esperando a que PostgreSQL este listo...
set RETRIES=0
:wait_pg
docker exec whakachile_db pg_isready -U whakachile >nul 2>&1
if %ERRORLEVEL% neq 0 (
    set /a RETRIES+=1
    if %RETRIES% geq 30 (
        echo.
        echo [ERROR] PostgreSQL no respondio a tiempo.
        echo.
        pause
        exit /b 1
    )
    timeout /t 2 /nobreak >nul
    goto wait_pg
)
echo       PostgreSQL listo

REM ── 4. Instalar dependencias y preparar BD ──
echo [4/5] Instalando dependencias y preparando base de datos...

if not exist "node_modules" (
    echo       Ejecutando npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] Fallo npm install.
        echo.
        pause
        exit /b 1
    )
)
echo       Dependencias OK

echo       Generando cliente Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo prisma generate.
    echo.
    pause
    exit /b 1
)
echo       Prisma OK

echo       Aplicando schema a la base de datos...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo prisma db push.
    echo.
    pause
    exit /b 1
)
echo       Base de datos OK

REM ── 5. Levantar servidor de desarrollo ──
echo.
echo [5/5] Levantando servidor de desarrollo...
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║   Servidor corriendo en http://localhost:3000     ║
echo ║   Admin Panel en    http://localhost:3000/admin   ║
echo ║                                                   ║
echo ║   Presiona Ctrl+C para detener el servidor        ║
echo ╚═══════════════════════════════════════════════════╝
echo.

call npm run dev
