# 🔧 Reparación: Módulo de Movimientos de Cuenta Corriente

## 📋 Problema Identificado

El módulo de **Movimientos** no mostraba datos (mensaje: "No hay movimientos registrados") a pesar de que el **historial individual de clientes** sí contenía información. Además, el botón **"Aplicar Filtros"** no ejecutaba ninguna acción efectiva.

---

## ✅ Cambios Implementados

### 1. **Sincronización de Consultas de Datos**

#### Archivo: `cuentaCorrienteService.js`

**Problema:** No había suficiente información de debug para identificar si la consulta funcionaba correctamente.

**Solución:** Agregamos console.log en la función `obtenerMovimientos()`:

```javascript
console.log('✅ obtenerMovimientos - Datos obtenidos:', data?.length || 0, 'movimientos');
console.log('Filtros aplicados:', filtros);
```

Esto permite verificar en la consola del navegador:
- Cuántos movimientos se obtienen de la base de datos
- Qué filtros se están aplicando

---

### 2. **Corrección de la Carga Inicial**

#### Archivo: `CuentasMovimientos.jsx`

**Problema:** La función `cargarMovimientos()` aplicaba filtros incluso en la carga inicial, lo que podría resultar en una consulta vacía si los estados de los filtros tenían valores residuales.

**Solución:** Modificamos la función para que acepte un parámetro:

```javascript
async function cargarMovimientos(aplicarFiltrosActivos = false) {
  const filtros = {};
  
  // Solo aplicar filtros si se pide explícitamente
  if (aplicarFiltrosActivos) {
    if (filtroCliente) filtros.cliente_id = filtroCliente;
    if (filtroTipo) filtros.tipo = filtroTipo;
    if (filtroFechaDesde) filtros.fecha_desde = filtroFechaDesde;
    if (filtroFechaHasta) filtros.fecha_hasta = filtroFechaHasta;
  }

  console.log('🔍 Cargando movimientos con filtros:', filtros);
  
  const { data, error } = await obtenerMovimientos(filtros);
  if (!error && data) {
    console.log('✅ Movimientos cargados:', data.length);
    setMovimientos(data);
  } else {
    console.error('❌ Error cargando movimientos:', error);
    setMovimientos([]);
  }
}
```

**Comportamiento:**
- **Carga inicial** (`aplicarFiltrosActivos = false`): Trae **TODOS** los movimientos sin filtros
- **Al aplicar filtros** (`aplicarFiltrosActivos = true`): Aplica los filtros seleccionados

---

### 3. **Reparación del Botón "Aplicar Filtros"**

**Problema:** El botón existía pero no ejecutaba correctamente la acción de filtrado.

**Solución:** Modificamos la función `aplicarFiltros()`:

```javascript
function aplicarFiltros() {
  console.log('🔍 Aplicando filtros...');
  cargarMovimientos(true); // ← Pasa true para aplicar filtros
}
```

---

### 4. **Mejora de "Limpiar Filtros"**

**Solución:** Actualizamos la función para que realmente limpie y recargue:

```javascript
function limpiarFiltros() {
  console.log('🗑️ Limpiando filtros...');
  setFiltroCliente('');
  setFiltroTipo('');
  setFiltroFechaDesde('');
  setFiltroFechaHasta('');
  // Cargar todos los movimientos sin filtros
  setTimeout(() => cargarMovimientos(false), 100);
}
```

---

### 5. **Mejora del Estado de Carga y Mensajes Vacíos**

**Problema:** El mensaje "No hay movimientos registrados" aparecía incluso durante la carga, y no daba contexto sobre si era por filtros o falta de datos.

**Solución:** Mejoramos la UI del estado de carga:

```jsx
{loading ? (
  <div style={{ 
    textAlign: 'center', 
    padding: '60px 20px',
    backgroundColor: '#2d2d2d',
    borderRadius: '10px',
    border: '1px solid #444'
  }}>
    <p style={{ color: '#999', fontSize: '16px', marginBottom: '10px' }}>
      ⏳ Cargando movimientos...
    </p>
    <p style={{ color: '#666', fontSize: '13px' }}>
      Consultando base de datos...
    </p>
  </div>
) : (
  // Tabla de movimientos
)}
```

Y el mensaje de "sin datos":

```jsx
{movimientos.length === 0 ? (
  <tr>
    <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div>
        <p style={{ color: '#999', fontSize: '16px', marginBottom: '10px' }}>
          📭 No hay movimientos registrados
        </p>
        <p style={{ color: '#666', fontSize: '13px' }}>
          {(filtroCliente || filtroTipo || filtroFechaDesde || filtroFechaHasta) 
            ? 'Intenta modificar los filtros para ver más resultados'
            : 'Aún no se han registrado movimientos en el sistema'}
        </p>
      </div>
    </td>
  </tr>
) : (
  // Renderizar movimientos
)}
```

---

## 🗄️ Verificación de Base de Datos

### Archivo: `DIAGNOSTICO_MOVIMIENTOS.sql`

Creamos un script SQL completo que:

1. ✅ Verifica la estructura de la tabla `cuenta_corriente_movimientos`
2. ✅ Verifica las relaciones (Foreign Keys) con `clientes` y `ventas`
3. ✅ Crea Foreign Keys si no existen
4. ✅ Crea índices para optimizar consultas
5. ✅ Crea una vista mejorada `vista_movimientos_completa` que incluye:
   - Información completa del cliente
   - Información de la venta (si existe)
   - Saldo acumulado por cliente
   - Indicador de origen (Manual/Automático)

**Uso:**
```bash
# Ejecutar en Supabase SQL Editor o desde CLI
psql -U postgres -d tu_base_datos -f DIAGNOSTICO_MOVIMIENTOS.sql
```

---

## 🧪 Cómo Probar los Cambios

### 1. Abrir la Consola del Navegador
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña **Console**

### 2. Navegar al Módulo de Movimientos
- Abre el módulo **"Movimientos de Cuenta Corriente"**

### 3. Verificar los Logs
Deberías ver:
```
🔍 Cargando movimientos con filtros: {}
✅ obtenerMovimientos - Datos obtenidos: 25 movimientos
Filtros aplicados: {}
✅ Movimientos cargados: 25
```

### 4. Probar los Filtros
- Selecciona un cliente
- Selecciona un tipo de movimiento
- Haz clic en **"🔍 Aplicar Filtros"**

Deberías ver:
```
🔍 Aplicando filtros...
🔍 Cargando movimientos con filtros: {cliente_id: "123", tipo: "debito"}
✅ obtenerMovimientos - Datos obtenidos: 8 movimientos
✅ Movimientos cargados: 8
```

### 5. Limpiar Filtros
- Haz clic en **"🗑️ Limpiar"**

Deberías ver:
```
🗑️ Limpiando filtros...
🔍 Cargando movimientos con filtros: {}
✅ Movimientos cargados: 25
```

---

## 🔍 Diagnóstico de Problemas

### Si ves el error: "column ventas_1.total does not exist"

**Causa:** La consulta intentaba acceder a una columna `total` en la tabla `ventas`, pero la columna correcta es `total_ars`.

**Solución:** Ya corregido en `cuentaCorrienteService.js` - la consulta ahora usa `total_ars`.

### Si aún no ves movimientos:

#### 1. Verificar en la Consola
```javascript
// Pega esto en la consola del navegador
console.table(movimientos);
```

#### 2. Verificar la Base de Datos
Ejecuta en Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM cuenta_corriente_movimientos;
```

Si retorna `0`, significa que **no hay datos en la tabla**.

#### 3. Crear Datos de Prueba
```sql
-- Insertar un movimiento de prueba
INSERT INTO cuenta_corriente_movimientos 
  (cliente_id, tipo, monto, descripcion, created_by)
VALUES 
  (
    (SELECT id FROM clientes LIMIT 1), 
    'debito', 
    1000.00, 
    'Movimiento de prueba', 
    'admin'
  );
```

#### 4. Verificar Permisos en Supabase
Asegúrate de que la tabla `cuenta_corriente_movimientos` tiene políticas RLS correctas:

```sql
-- Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'cuenta_corriente_movimientos';

-- Si no hay, crear política permisiva (solo para desarrollo)
ALTER TABLE cuenta_corriente_movimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" 
ON cuenta_corriente_movimientos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## 📊 Comparación: Antes vs Después

### ANTES ❌
- ❌ La carga inicial aplicaba filtros vacíos → resultados incorrectos
- ❌ El botón "Aplicar Filtros" no hacía nada
- ❌ No había debug para identificar problemas
- ❌ El mensaje de "sin datos" era genérico y confuso

### DESPUÉS ✅
- ✅ La carga inicial trae **TODOS** los movimientos
- ✅ El botón "Aplicar Filtros" ejecuta correctamente la consulta con filtros
- ✅ Console.log detallado para debug
- ✅ Mensajes contextuales según la situación (con filtros / sin datos)
- ✅ UI mejorada para estados de carga

---

## 📂 Archivos Modificados

1. ✏️ **frontend/src/utils/cuentaCorrienteService.js**
   - Agregado debug en `obtenerMovimientos()`

2. ✏️ **frontend/src/pages/CuentasMovimientos.jsx**
   - Modificado `cargarMovimientos()` para soportar carga sin filtros
   - Corregido `aplicarFiltros()`
   - Mejorado `limpiarFiltros()`
   - Mejorada UI de loading y empty state

3. 🆕 **frontend/DIAGNOSTICO_MOVIMIENTOS.sql**
   - Script completo de diagnóstico y reparación de base de datos

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Adicionales Sugeridas:

1. **Paginación**: Si hay muchos movimientos (>100), implementar paginación
2. **Exportar a Excel**: Agregar botón para exportar movimientos filtrados
3. **Gráficos**: Agregar visualización de ingresos/egresos por período
4. **Filtro por Rango de Montos**: Agregar filtros de monto mínimo/máximo
5. **Búsqueda de Texto**: Buscar en descripción de movimientos

---

## 📞 Soporte

Si sigues teniendo problemas:
1. Revisa los logs en la consola del navegador
2. Ejecuta el script `DIAGNOSTICO_MOVIMIENTOS.sql`
3. Verifica que los datos existen en la base de datos
4. Verifica las políticas RLS en Supabase

---

**Fecha de Reparación:** 25 de Diciembre de 2025  
**Desarrollador:** GitHub Copilot (Claude Sonnet 4.5)
