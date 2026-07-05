/**
 * Service Worker — Ponto Qfam
 * Cache do app shell (arquivos estáticos do próprio site) para permitir
 * instalação como PWA. Chamadas para o Supabase e CDNs externos passam
 * direto pela rede, sem interferência deste worker.
 */
const CACHE_NAME = 'ponto-qfam-v2';
const APP_SHELL = [
  'chronos.js',
  'supabase-client.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegações (carregar uma página) passam direto pela rede: o Chrome não
  // permite reencaminhar um request de navegação via fetch() dentro do worker
  // (erro "'navigate' mode is unsupported"), e essas páginas dependem de dados
  // sempre atualizados (sessão/Supabase) — não faz sentido cacheá-las aqui.
  if (req.method !== 'GET' || req.mode === 'navigate') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
