# Instalador del hook de pre-push
# Ejecutar este script para configurar el hook automatico de versiones

Write-Host "Instalando hook de pre-push..." -ForegroundColor Cyan

$hookPath = ".git\hooks\pre-push"

# Crear el contenido del hook como array de lineas
$lines = @(
    "#!/bin/sh",
    "# Pre-push hook - Actualiza la version automaticamente",
    "",
    "echo 'Actualizando version del sistema...'",
    "",
    "# Ejecutar el script de actualizacion",
    "node scripts/update-version.js",
    "",
    "exit 0"
)

# Escribir el hook
$lines | Out-File -FilePath $hookPath -Encoding UTF8

Write-Host "Hook instalado correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora cada vez que hagas git push, la version se actualizara automaticamente." -ForegroundColor Yellow
Write-Host ""
Write-Host "Si prefieres actualizar manualmente desde /frontend ejecuta: npm run version:bump" -ForegroundColor Gray
