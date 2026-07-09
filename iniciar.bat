@echo off
echo === Iniciando Backend (puerto 8001) y Frontend (puerto 3000) ===
echo.

cd /d "C:\Users\astur\Desktop\liga.paraguaya.futbol"
set PYTHONPATH=C:\Users\astur\Desktop\liga.paraguaya.futbol

echo [Backend] Arrancando...
start "Backend" cmd /c "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload"
echo [Backend] http://localhost:8001

echo [Frontend] Arrancando...
start "Frontend" cmd /c "cd frontend && npm run dev"
echo [Frontend] http://localhost:3000

echo [Navegador] Abriendo...
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo.
echo Cierra las ventanas para detener
PAUSE
