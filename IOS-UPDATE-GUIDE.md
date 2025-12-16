# Actualización de la PWA en iPhone

## 🍎 Para iOS/iPhone (Web App)

La app ahora detecta automáticamente cuando hay una nueva versión disponible.

### Primera vez después de esta actualización:

1. **Cierra completamente la app** (desliza hacia arriba desde el dock)
2. **Elimina la app de la pantalla de inicio** (mantén presionado → Eliminar App)
3. **Vuelve a Safari** y entra a la URL
4. **Agrégala nuevamente** a la pantalla de inicio (botón compartir → "Agregar a pantalla de inicio")

### Después de la primera configuración:

Ya **NO necesitarás hacer esto de nuevo**. La app:

- ✅ Verificará automáticamente si hay nueva versión al abrirla
- ✅ Mostrará una barra azul en la parte superior con botón "Actualizar"
- ✅ Se verificará cada 10 minutos mientras esté abierta
- ✅ Al tocar "Actualizar", se recargará con la última versión

### 🔍 Verificar que funciona:

1. Abre la app
2. Ve a **Configuración** (menú lateral)
3. Mira la **versión** al final de la página
4. Debería decir: **Versión: 1.0.0.6** o superior

Si dice 1.0.0 sin el número de build, sigue los pasos de "Primera vez" arriba.

### 📱 Cómo funciona la actualización automática:

```
Al abrir la app → Verifica versión del servidor
                ↓
     ¿Hay nueva versión?
                ↓
       Muestra barra azul: "🔄 Nueva versión disponible [Actualizar]"
                ↓
   Usuario toca "Actualizar"
                ↓
   Limpia caché y recarga → ✓ App actualizada
```

## 🐛 Solución de Problemas

### Si sigue mostrando versión antigua:

1. Cierra la app completamente
2. Abre Safari y ve a: Ajustes → Safari → Avanzado → Datos de sitios web
3. Busca el sitio y elimina sus datos
4. Elimina la app de la pantalla de inicio
5. Agrégala de nuevo

### Si la barra de actualización no aparece:

- Espera 10 minutos con la app abierta (verifica automáticamente cada 10 min)
- O cierra y vuelve a abrir la app
- Verifica tu conexión a internet
