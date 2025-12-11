# Sistema de Temas

Este archivo explica cómo usar el sistema de temas centralizado del proyecto.

## 📁 Archivo de configuración
`src/utils/theme.js` - Contiene todos los colores del sistema

## 🎨 Uso en componentes

### Opción 1: Con hook (en componentes React)
```javascript
import { useTheme } from '../utils/theme'

function MiComponente() {
  const theme = useTheme()
  
  return (
    <div style={{ backgroundColor: theme.cardBg, color: theme.text }}>
      Contenido
    </div>
  )
}
```

### Opción 2: Sin hook (para estilos inline o fuera de componentes)
```javascript
import { getTheme } from '../utils/theme'

const theme = getTheme()

const styles = {
  container: {
    backgroundColor: theme.background,
    color: theme.text
  }
}
```

### Opción 3: Import directo del tema oscuro
```javascript
import theme from '../utils/theme'

// Esto siempre devuelve el tema oscuro
const styles = {
  background: theme.cardBg
}
```

## 🔧 Cómo cambiar colores

1. Abrí `src/utils/theme.js`
2. Modificá los valores en el objeto `themes.dark` o `themes.light`
3. Los cambios se aplicarán automáticamente en todos los componentes que usen el sistema

## 📝 Variables disponibles

### Fondos
- `background` - Fondo principal (#0a0a0a)
- `backgroundAlt` - Fondo alternativo (#121212)
- `cardBg` - Fondo de cards (#1a1a1a)
- `cardBgHover` - Hover de cards (#262626)
- `modalBg` - Fondo de modales

### Textos
- `text` - Texto principal (#ffffff)
- `textMuted` - Texto secundario (#999)
- `textDisabled` - Texto deshabilitado (#666)

### Bordes
- `border` - Borde estándar (#333)
- `borderLight` - Borde claro
- `borderDark` - Borde oscuro

### Estados
- `success` / `successBg` - Verde (#10b981)
- `warning` / `warningBg` - Naranja (#f59e0b)
- `error` / `errorBg` - Rojo (#ef4444)
- `info` / `infoBg` - Azul (#4da6ff)

### Botones
- `btnPrimary` - Botón primario
- `btnDanger` - Botón peligroso (#c41e3a)
- `btnGhost` - Botón transparente

### Sidebar
- `sidebarBg` - Fondo del sidebar
- `sidebarItemActive` - Item activo
- `sidebarItemHover` - Item hover

### Inputs
- `inputBg` - Fondo de input
- `inputBorder` - Borde de input
- `inputText` - Texto del input

### Tablas
- `tableHeader` - Header de tabla
- `tableBorder` - Borde de tabla
- `tableRowHover` - Fila hover

## 🚀 Migración gradual

**Importante**: No todos los componentes usan este sistema todavía. Los colores están hardcodeados en muchos lugares.

Para migrar un componente:
1. Reemplazar colores hardcodeados (`#1a1a1a`) por variables del tema
2. Importar y usar `useTheme()` o `getTheme()`
3. Probar que funcione correctamente

Ejemplo de migración:
```javascript
// ❌ ANTES (hardcodeado)
<div style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>

// ✅ DESPUÉS (usando tema)
import { useTheme } from '../utils/theme'
const theme = useTheme()
<div style={{ backgroundColor: theme.cardBg, color: theme.text }}>
```

## 💡 Modo claro

El modo claro está **definido** en `themes.light` pero **NO implementado** todavía.

Para activarlo en el futuro:
1. Migrar todos los componentes a usar el sistema de temas
2. El toggle en Configuración ya cambiará automáticamente entre modos
3. No hay que hacer nada más, el hook `useTheme()` detecta el cambio

## ⚠️ Notas importantes

- **NO borres** los colores hardcodeados por ahora, migra de a poco
- El modo oscuro es el **predeterminado**
- Si querés cambiar un color globalmente, cambialo en `theme.js`
- Para agregar nuevos colores, agregálos tanto en `dark` como en `light`
