// Service worker de la app R.U. Lucense (PWA).
// Regla de oro: solo guarda ficheros estáticos (los de /assets/ llevan hash y no cambian) y la página
// «Sin conexión». Nunca guarda páginas ni respuestas de la API: llevan datos de cada soci@.
const CACHE = 'rul-estaticos-v1';
const PRECARGA = ['/offline.html', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const MAX_ASSETS = 120;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function recortar(cache) {
  const ks = await cache.keys();
  const assets = ks.filter((r) => new URL(r.url).pathname.startsWith('/assets/'));
  for (const r of assets.slice(0, Math.max(0, assets.length - MAX_ASSETS))) await cache.delete(r);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: siempre a la red (datos al día); sin red, la página «Sin conexión».
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }

  // Ficheros con hash: primero la caché, y si no está, a la red y se guarda.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia).then(() => recortar(c)));
        }
        return res;
      })),
    );
  }
});
