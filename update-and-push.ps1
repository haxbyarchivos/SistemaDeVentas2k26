# Script para actualizar version y hacer push
# Uso: .\update-and-push.ps1 "mensaje de commit"

param(
    [string]$mensaje = "update"
)

Write-Host "Actualizando version..." -ForegroundColor Cyan
node scripts/update-version.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "Version actualizada correctamente" -ForegroundColor Green
    
    # Agregar el archivo de version
    git add frontend/src/version.json
    
    # Agregar todos los cambios si los hay
    git add -A
    
    # Commit
    git commit -m $mensaje
    
    # Push
    Write-Host "Haciendo push..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Push exitoso!" -ForegroundColor Green
    } else {
        Write-Host "Error en push" -ForegroundColor Red
    }
} else {
    Write-Host "Error actualizando version" -ForegroundColor Red
}
