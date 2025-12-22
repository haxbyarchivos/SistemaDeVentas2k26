// Service Worker para control de caché
// Estrategia: Network First (prioriza red, fallback a caché)

const CACHE_NAME = 'coloplastic-v1';
const CACHE_VERSION = '1.0.0.10'; // Actualizar con cada deploy

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando service worker...');
  self.skipWaiting(); // Activar inmediatamente
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia Network First con bypass de caché para archivos críticos
self.addEventListener('fetch', (event) => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // NUNCA cachear version.json - siempre desde red
  if (url.pathname.includes('version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => new Response('{"version":"1.0.0","build":"0"}', {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde caché
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Sirviendo desde caché:', event.request.url);
            return cachedResponse;
          }
          // Si tampoco hay en caché, mostrar página offline
          return new Response('Sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Escuchar mensajes para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
