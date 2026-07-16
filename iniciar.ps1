$host.UI.RawUI.WindowTitle = "Liga Paraguaya de Futbol"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   LIGA PARAGUAYA DE FUTBOL - Panel Control" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$root = "C:\Users\astur\Desktop\liga.paraguaya.futbol"
$env:PYTHONPATH = $root

# Verificar que python y npm existan
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "       ERROR: python no esta en el PATH. Instalalo o activa el entorno." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"; exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "       ERROR: npm no esta en el PATH. Instala Node.js." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"; exit 1
}

Write-Host "[1/4] Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2
Write-Host "       Procesos limpiados." -ForegroundColor DarkGray
Write-Host ""

Write-Host "[2/4] Verificando archivos del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path "$root\backend\app\main.py")) {
    Write-Host "       ERROR: No se encontro backend\app\main.py" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"; exit 1
}
if (-not (Test-Path "$root\frontend\package.json")) {
    Write-Host "       ERROR: No se encontro frontend\package.json" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"; exit 1
}
Write-Host "       Archivos OK." -ForegroundColor DarkGray
Write-Host ""

Write-Host "[3/4] Arrancando Backend (puerto 8000)..." -ForegroundColor Yellow
# Sin -NoNewWindow: cada servicio abre su propia ventana de consola (experiencia natural)
Start-Process "cmd.exe" -ArgumentList "/c", "title LigaBackend && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $root
Start-Sleep 3
$backendUp = netstat -ano | Select-String ":8000" | Select-String "LISTENING"
if ($backendUp) {
    Write-Host "       Backend iniciado en http://localhost:8000" -ForegroundColor Cyan
} else {
    Write-Host "       Backend iniciando... (puede tardar unos segundos)" -ForegroundColor DarkYellow
}
Write-Host ""

Write-Host "[4/4] Arrancando Frontend (puerto 3000)..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/c", "title LigaFrontend && cd frontend && npm run dev" -WorkingDirectory $root
Start-Sleep 3
Write-Host "       Frontend iniciado en http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "=============================================" -ForegroundColor Green
Write-Host "   TODO LISTO - Abriendo navegador..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "   Para cerrar: cierra las ventanas LigaBackend y LigaFrontend" -ForegroundColor DarkGray
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Start-Sleep 4
Start-Process "http://localhost:3000"

Read-Host "Presiona Enter para cerrar esta ventana (los servidores siguen corriendo)"
