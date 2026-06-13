/* Service Worker de PC Simulador Fútbol
   Estrategia: precarga del "app shell" + cache-first para recursos propios.
   Sube el número de versión (CACHE) cuando publiques cambios para forzar la actualización. */
const CACHE = "pcfutbol-v1";
const ASSETS = [
  ".",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png",
  "favicon-64.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Recursos de otro origen (logos remotos, API de fútbol): red directa, sin cachear.
  if (url.origin !== self.location.origin) return;

  // Navegaciones: intenta red y cae a la versión cacheada (offline).
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("index.html").then(r => r || caches.match(".")))
    );
    return;
  }

  // Resto de recursos propios: cache-first con actualización en segundo plano.
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
