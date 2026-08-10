/**
 * Service Worker — Ponto Lab
 * Cache do app shell (arquivos estáticos do próprio site) para permitir
 * instalação como PWA. Chamadas para o Supabase e CDNs externos passam
 * direto pela rede, sem interferência deste worker.
 */
const CACHE_NAME = 'ponto-lab-v2';
const APP_SHELL = [
  'index.html',
  'ponto.html',
  'historico.html',
  'perfil.html',
  'admin.html',
  'chronos.js',
  'supabase-client.js',
  'notices.json',
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

  // Para páginas HTML, usamos estratégia network-first com fallback para cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // Se a resposta for válida, armazena no cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, retorna do cache
          return caches.match(req)
            .then(response => response || caches.match('/index.html'));
        })
    );
  } else if (req.method === 'GET' && new URL(req.url).origin === self.location.origin) {
    // Para outros recursos do mesmo domínio: network-first (sempre baixa a
    // versão mais recente quando online; usa o cache apenas como fallback).
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  } else {
    // Para requisições externas, passa direto
    return;
  }
});
