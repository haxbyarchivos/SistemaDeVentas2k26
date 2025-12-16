# Sistema de Versionado Automático

Este sistema actualiza automáticamente la versión del sistema cada vez que haces un `git push`.

## 🚀 Configuración Inicial

### Opción 1: Hook Automático (Recomendado)

Ejecuta el instalador desde la raíz del proyecto:

```powershell
.\install-hook.ps1
```

Esto instalará un hook de git que actualizará la versión automáticamente en cada push.

### Opción 2: Manual

Si prefieres actualizar la versión manualmente antes de cada commit:

```bash
cd frontend
npm run version:bump
git add src/version.json
git commit -m "chore: actualizar versión"
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

Para actualizar la versión principal (ej: de 1.0.0 a 1.1.0):

1. Edita `frontend/src/version.json`
2. Cambia el campo `version` al nuevo número
3. El `build` se seguirá incrementando automáticamente

## ✅ Verificar que Funciona

1. Haz un cambio en cualquier archivo
2. Haz commit: `git commit -am "test"`
3. Haz push: `git push`
4. Verifica que `frontend/src/version.json` se haya actualizado

## 🛠️ Solución de Problemas

Si el hook no funciona:

1. Verifica que el archivo `.git/hooks/pre-push` existe
2. Actualiza manualmente: `npm run version:bump` (desde /frontend)
3. En Windows, asegúrate de tener permisos de ejecución
