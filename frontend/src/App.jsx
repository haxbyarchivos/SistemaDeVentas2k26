import { useEffect, useState } from 'react';
import AppRoutes from "./routes/AppRoutes";
import versionInfo from './version.json';

function App() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Verificar versión al cargar (especialmente importante para iOS PWA)
    const checkVersion = async () => {
      try {
        // Agregar timestamp para evitar caché
        const response = await fetch(`/src/version.json?t=${Date.now()}`);
        const serverVersion = await response.json();
        
        const localVersion = `${versionInfo.version}.${versionInfo.build}`;
        const remoteVersion = `${serverVersion.version}.${serverVersion.build}`;
        
        console.log('Versión local:', localVersion);
        console.log('Versión servidor:', remoteVersion);
        
        // Si la versión del servidor es diferente, mostrar prompt
        if (localVersion !== remoteVersion) {
          setShowUpdatePrompt(true);
        }
      } catch (error) {
        console.log('No se pudo verificar versión:', error);
      }
    };

    // Verificar al cargar
    checkVersion();
    
    // Verificar cada 10 minutos
    const interval = setInterval(checkVersion, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Limpiar todo el caché y recargar
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Forzar recarga completa desde el servidor (bypass caché)
    window.location.reload(true);
  };

  return (
    <>
      {showUpdatePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          backgroundColor: '#4da6ff',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <span>🔄 Nueva versión disponible</span>
          <button 
            onClick={handleUpdate}
            style={{
              backgroundColor: 'white',
              color: '#4da6ff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Actualizar
          </button>
        </div>
      )}
      <AppRoutes />
    </>
  );
}

export default App;
