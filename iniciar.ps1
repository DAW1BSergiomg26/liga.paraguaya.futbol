$host.UI.RawUI.WindowTitle = "Liga Paraguaya de Futbol"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   LIGA PARAGUAYA DE FUTBOL - Panel Control" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$root = "C:\Users\astur\Desktop\liga.paraguaya.futbol"
$env:PYTHONPATH = $root

Write-Host "[1/4] Limpiando procesos anteriores..." -ForegroundColor Yellow
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2
Write-Host "       Procesos limpiados." -ForegroundColor DarkGray
Write-Host ""

Write-Host "[2/4] Verificando archivos del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path "$root\backend\app\main.py")) {
    Write-Host "       ERROR: No se encontro backend\app\main.py" -ForegroundColor Red
    pause; exit 1
}
if (-not (Test-Path "$root\frontend\package.json")) {
    Write-Host "       ERROR: No se encontro frontend\package.json" -ForegroundColor Red
    pause; exit 1
}
Write-Host "       Archivos OK." -ForegroundColor DarkGray
Write-Host ""

Write-Host "[3/4] Arrancando Backend (puerto 8000)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $root
Start-Sleep 3
$backendUp = netstat -ano | Select-String ":8000" | Select-String "LISTENING"
if ($backendUp) {
    Write-Host "       Backend iniciado en http://localhost:8000" -ForegroundColor Cyan
} else {
    Write-Host "       Backend iniciando... (puede tardar unos segundos)" -ForegroundColor DarkYellow
}
Write-Host ""

Write-Host "[4/4] Arrancando Frontend (puerto 3000)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$root\frontend"
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
Write-Host "   Para cerrar: cierra las ventanas Backend y Frontend" -ForegroundColor DarkGray
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Start-Sleep 4
Start-Process "http://localhost:3000"
