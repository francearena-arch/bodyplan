const CACHE_NAME='bodyplan-v36';
const ASSETS = ['./','./index.html?v=36','./manifest.json?v=36','./service-worker.js?v=36','./icons/icon-v36-192.png?v=36','./icons/icon-v36-512.png?v=36','./icons/icon-192.png?v=36','./icons/icon-512.png?v=36','./apple-touch-icon-v36.png?v=36','./apple-touch-icon.png?v=36','./favicon.png?v=36'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request,{cache:'no-store'}).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request))); });
