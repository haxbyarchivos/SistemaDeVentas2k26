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
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const serverVersion = await response.json();
        
        const localVersion = `${versionInfo.version}.${versionInfo.build}`;
        const remoteVersion = `${serverVersion.version}.${serverVersion.build}`;
        
        console.log('🔍 Verificación de versión:');
        console.log('   Local:', localVersion);
        console.log('   Servidor:', remoteVersion);
        
        // Si la versión del servidor es diferente, mostrar prompt
        if (localVersion !== remoteVersion) {
          console.log('🔄 Nueva versión disponible!');
          setShowUpdatePrompt(true);
        } else {
          console.log('✅ App actualizada');
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
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            🔄 Nueva versión disponible
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>
            Toca "Actualizar" para cargar la última versión
          </div>
          <button 
            onClick={handleUpdate}
            style={{
              backgroundColor: 'white',
              color: '#4da6ff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              marginTop: '4px'
            }}
          >
            Actualizar Ahora
          </button>
        </div>
      )}
      <AppRoutes />
    </>
  );
}

export default App;
