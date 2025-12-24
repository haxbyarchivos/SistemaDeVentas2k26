# 💳 Módulo de Cuentas Corrientes - Guía de Implementación

## 📋 Resumen

Se ha implementado exitosamente el módulo de **Cuentas Corrientes** en el Sistema de Ventas 2K26. Este módulo permite gestionar los saldos de clientes, registrar pagos y visualizar el historial completo de movimientos financieros.

---

## 🚀 Pasos de Instalación

### 1. Configurar Base de Datos en Supabase

1. Accede al panel de **Supabase** → SQL Editor
2. Abre el archivo `SETUP_CUENTA_CORRIENTE.sql` ubicado en la carpeta `frontend/`
3. **Copia y pega** todo el contenido del script SQL en el editor
4. Haz clic en **"Run"** para ejecutar el script

**El script creará:**
- ✅ Tabla `cuenta_corriente_movimientos` para registrar transacciones
- ✅ Vista `vista_saldos_clientes` para consultar saldos consolidados
- ✅ Triggers automáticos que registran movimientos cuando una venta cambia de estado
- ✅ Funciones auxiliares para calcular saldos

### 2. Migración de Datos Históricos (Opcional)

Si ya tienes ventas existentes en estado "vendido" y deseas migrar esos datos a la cuenta corriente:

1. En el archivo `SETUP_CUENTA_CORRIENTE.sql`, busca la sección **"6. DATOS INICIALES"**
2. **Descomenta** las líneas marcadas (elimina los `/*` y `*/`)
3. Ejecuta solo esa sección en el SQL Editor

Esto creará automáticamente movimientos de débito para todas las ventas vendidas existentes.

---

## 🎨 Características Implementadas

### 💰 Módulo "Cuentas - Clientes"

Ubicación: **Sidebar → 💳 Cuentas → 💰 Saldos Clientes**

**Funcionalidades:**
- 📊 Vista consolidada de saldos por cliente
- 🔴 Visualización clara de deudas (en rojo)
- 🟢 Visualización de saldos a favor (en verde)
- 💵 Registro de pagos manuales
- 📋 Ver historial completo de movimientos por cliente
- 🔍 Búsqueda por nombre o CUIT

### 📊 Módulo "Cuentas - Movimientos"

Ubicación: **Sidebar → 💳 Cuentas → 📊 Movimientos**

**Funcionalidades:**
- 📜 Historial completo de todas las transacciones
- 🎯 Filtros avanzados:
  - Por cliente
  - Por tipo de movimiento (débito/crédito/ajuste)
  - Por rango de fechas
- 📈 Estadísticas generales:
  - Total a cobrar
  - Total a favor
  - Clientes con deuda
  - Cantidad de movimientos
- 🗑️ Eliminar movimientos manuales (no asociados a ventas)

---

## 🔄 Flujo Automático de Integración

### 1. Venta Realizada (Estado → "Vendido")
- ✅ El trigger SQL registra automáticamente un **movimiento de débito** (deuda)
- ✅ El monto es el total de la venta
- ✅ Se asocia al cliente y a la venta

### 2. Venta Cancelada (Estado → "Cancelado/Cancelada")
- ✅ Si antes estaba "Vendido", el trigger registra automáticamente un **movimiento de crédito** (anulación)
- ✅ El saldo del cliente se ajusta automáticamente

### 3. Pago Manual
- ✅ Se registra desde el módulo **Cuentas - Clientes**
- ✅ El usuario ingresa el monto y descripción
- ✅ El sistema registra un **movimiento de crédito** (reduce la deuda)
- ✅ No está asociado a ninguna venta específica

---

## 🎨 Estética y UX

### Paleta de Colores
- 🔴 **Rojo (#ff4d4d)**: Deudas, débitos
- 🟢 **Verde (#4dff4d)**: Pagos, créditos, saldos a favor
- 🔵 **Azul (#4da6ff)**: Referencias a ventas, información general
- ⚫ **Gris (#999)**: Datos secundarios

### Menú Colapsable
El sidebar ahora incluye un menú **"💳 Cuentas"** que se expande para mostrar:
- 💰 Saldos Clientes
- 📊 Movimientos

---

## 📂 Archivos Creados

```
frontend/
├── SETUP_CUENTA_CORRIENTE.sql         # Script SQL para Supabase
├── CUENTA_CORRIENTE_README.md         # Este archivo de documentación
└── src/
    ├── utils/
    │   └── cuentaCorrienteService.js  # Servicios para lógica de cuenta corriente
    └── pages/
        ├── CuentasClientes.jsx        # Vista de saldos consolidados
        └── CuentasMovimientos.jsx     # Vista de historial de movimientos
```

### Archivos Modificados

```
frontend/src/
├── components/
│   └── Sidebar.jsx                    # Agregado menú colapsable "Cuentas"
└── routes/
    └── AppRoutes.jsx                  # Agregadas rutas /cuentas/clientes y /cuentas/movimientos
```

---

## 🧪 Cómo Probar el Módulo

### Test 1: Crear una venta y verificar débito
1. Ve a **Ventas** y cambia el estado de una venta a "Vendido"
2. Ve a **Cuentas → Saldos Clientes**
3. Verifica que el cliente tenga el saldo en rojo (deuda)
4. Ve a **Cuentas → Movimientos**
5. Verifica que se haya creado un movimiento de tipo "DÉBITO"

### Test 2: Registrar un pago
1. Ve a **Cuentas → Saldos Clientes**
2. Haz clic en el botón **"💵 Pago"** de un cliente
3. Ingresa un monto y descripción
4. Confirma el pago
5. Verifica que el saldo del cliente se haya reducido

### Test 3: Cancelar una venta
1. Ve a **Ventas** y cambia una venta "Vendido" a "Cancelada"
2. Ve a **Cuentas → Movimientos**
3. Verifica que se haya creado un movimiento de tipo "CRÉDITO" (anulación)
4. Ve a **Cuentas → Saldos Clientes**
5. Verifica que el saldo del cliente se haya ajustado

---

## 🔧 Servicios Disponibles (API Interna)

### En `cuentaCorrienteService.js`:

```javascript
import { 
  obtenerSaldosClientes,      // Obtiene vista consolidada de saldos
  obtenerMovimientos,          // Obtiene movimientos con filtros
  registrarPago,               // Registra un pago manual
  registrarAjuste,             // Registra un ajuste manual
  obtenerSaldoCliente,         // Calcula saldo de un cliente específico
  obtenerHistorialCliente,     // Obtiene historial de un cliente
  eliminarMovimiento,          // Elimina movimiento manual
  obtenerEstadisticas          // Obtiene estadísticas generales
} from '../utils/cuentaCorrienteService';
```

---

## ⚠️ Consideraciones Importantes

### 1. Row Level Security (RLS)
El script SQL incluye comentarios para habilitar **RLS** si lo necesitas. Por defecto está deshabilitado para facilitar el desarrollo.

### 2. Eliminación de Movimientos
- ✅ **Puedes eliminar:** Pagos manuales y ajustes
- ❌ **No puedes eliminar:** Movimientos asociados a ventas (deben gestionarse desde el módulo de Ventas)

### 3. Integridad de Datos
- Los triggers se ejecutan automáticamente al cambiar el estado de una venta
- No es necesario hacer nada adicional en el código de React para registrar movimientos de ventas

### 4. Performance
- Se han creado índices en la base de datos para optimizar consultas
- La vista `vista_saldos_clientes` se actualiza automáticamente

---

## 📞 Soporte

Si encuentras algún problema o necesitas agregar funcionalidades adicionales, revisa:

1. **SQL Errors:** Verifica que el script SQL se ejecutó correctamente en Supabase
2. **Console Errors:** Abre la consola del navegador (F12) para ver errores de JavaScript
3. **Supabase Logs:** Revisa los logs en el panel de Supabase para ver errores de base de datos

---

## ✅ Checklist de Verificación

- [ ] Script SQL ejecutado en Supabase sin errores
- [ ] Menú "Cuentas" visible en el Sidebar
- [ ] Página "Saldos Clientes" carga correctamente
- [ ] Página "Movimientos" carga correctamente
- [ ] Al cambiar venta a "Vendido" se registra débito
- [ ] Al cambiar venta a "Cancelada" se registra crédito de anulación
- [ ] Puedo registrar pagos manuales
- [ ] Los saldos se actualizan correctamente
- [ ] Los filtros de movimientos funcionan

---

## 🎉 ¡Listo!

El módulo de Cuentas Corrientes está completamente implementado y listo para usar. Disfruta de una gestión financiera eficiente y automatizada. 🚀
