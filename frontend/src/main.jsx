import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrar Service Worker para control de caché
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registrado:', registration);
        
        // Verificar actualizaciones cada 5 minutos
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
        
        // Si hay actualización disponible, recargar
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible');
              // Opcional: mostrar notificación al usuario
              if (confirm('Hay una nueva versión disponible. ¿Recargar?')) {
                newWorker.postMessage('skipWaiting');
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('Error registrando Service Worker:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
