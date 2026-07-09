Write-Host "=== Iniciando Backend (puerto 8001) y Frontend (puerto 3000) ===" -ForegroundColor Green

$root = "C:\Users\astur\Desktop\liga.paraguaya.futbol"
$env:PYTHONPATH = $root

# Mata procesos viejos si los hay
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 1

# Backend
$job1 = Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload" -WorkingDirectory $root -PassThru
Write-Host "[Backend] Iniciado en http://localhost:8001" -ForegroundColor Cyan

# Frontend
$job2 = Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$root\frontend" -PassThru
Write-Host "[Frontend] Iniciado en http://localhost:3000" -ForegroundColor Cyan

Write-Host ""
Write-Host "Abre http://localhost:3000 en tu navegador" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C en cada terminal para detener" -ForegroundColor DarkGray
