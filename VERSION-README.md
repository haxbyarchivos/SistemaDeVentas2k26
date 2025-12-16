# Sistema de Versionado Automático

Este sistema actualiza automáticamente la versión del sistema.

## 🚀 Uso Recomendado (Windows)

### Opción 1: Script Todo-en-Uno (Más Fácil)

Usa el script que actualiza versión y hace push automáticamente:

```powershell
# Desde la raíz del proyecto
.\update-and-push.ps1 "tu mensaje de commit"

# Ejemplo:
.\update-and-push.ps1 "feat: agregar nueva funcionalidad"
```

Este script:
1. ✅ Actualiza la versión automáticamente
2. ✅ Hace git add de todos los cambios
3. ✅ Hace commit con tu mensaje
4. ✅ Hace push a origin main

### Opción 2: Manual Paso a Paso

Si prefieres control total:

```powershell
# 1. Actualizar versión
cd frontend
npm run version:bump

# 2. Commit normal
cd ..
git add -A
git commit -m "tu mensaje"
git push origin main
```

## 📊 Cómo Funciona

1. **Archivo de versión**: `frontend/src/version.json`
   - `version`: Versión principal (actualizar manualmente para releases)
   - `build`: Número de build (se incrementa automáticamente)
   - `date`: Fecha de la última actualización

2. **Visualización**:
   - **Sidebar**: Muestra `v{version}.{build}`
   - **Configuración**: Muestra versión completa con fecha de build

3. **Script de actualización**: `scripts/update-version.js`
   - Incrementa el número de build
   - Actualiza la fecha
   - Se ejecuta automáticamente en cada push (si instalaste el hook)

## 🔄 Actualizar Versión Principal

Para acAtajos Útiles

### Crear Alias (Opcional)

Para no escribir tanto, puedes crear un alias en PowerShell:

```powershell
# Agregar al perfil de PowerShell
notepad $PROFILE

# Agregar esta línea:
function gp { & "V:\AA SISTEMA DE VENTAS 2K26\SISTEMA VENTAS\update-and-push.ps1" @args }

# Luego usar simplemente:
gp "mensaje de commit"
```

1. Haz un cambio en cualquier archivo
2. Haz commit: `git commit -am "test"`
3. Haz push: `git push`
4. Verifica que `frontend/src/version.json` se haya actualizado

## 🛠️ Solución de Problemas

Si el hook no funciona:

1. Verifica que el archivo `.git/hooks/pre-push` existe
2. Actualiza manualmente: `npm run version:bump` (desde /frontend)
3. En Windows, asegúrate de tener permisos de ejecución
