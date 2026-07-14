@echo off
title Liga Paraguaya de Futbol - Panel de Control
color 0A

echo ================================================
echo    LIGA PARAGUAYA DE FUTBOL - Panel de Control
echo ================================================
echo.

cd /d "C:\Users\astur\Desktop\liga.paraguaya.futbol"
set PYTHONPATH=C:\Users\astur\Desktop\liga.paraguaya.futbol

where python >nul 2>nul
if errorlevel 1 (
    echo       ERROR: python no esta en el PATH. Instalalo o activa el entorno.
    pause
    exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo       ERROR: npm no esta en el PATH. Instala Node.js.
    pause
    exit /b 1
)

echo [1/4] Limpiando procesos anteriores...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Procesos limpiados.
echo.

echo [2/4] Verificando archivos del proyecto...
if not exist "backend\app\main.py" (
    echo       ERROR: No se encontro backend\app\main.py
    pause
    exit /b 1
)
if not exist "frontend\package.json" (
    echo       ERROR: No se encontro frontend\package.json
    pause
    exit /b 1
)
echo       Archivos OK.
echo.

echo [3/4] Arrancando Backend (puerto 8000)...
start "LigaBackend" cmd /c "title LigaBackend && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo       Backend iniciado en http://localhost:8000
) else (
    echo       Backend iniciando... (puede tardar unos segundos)
)
echo.

echo [4/4] Arrancando Frontend (puerto 3000)...
start "LigaFrontend" cmd /c "title LigaFrontend && cd frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo       Frontend iniciado en http://localhost:3000
echo.

echo ================================================
echo    TODO LISTO - Abriendo navegador...
echo ================================================
echo.
echo    Backend:  http://localhost:8000
echo    Frontend: http://localhost:3000
echo.
echo    Para cerrar: cierra las ventanas LigaBackend y LigaFrontend
echo ================================================
echo.

timeout /t 4 /nobreak >nul
start http://localhost:3000

pause
