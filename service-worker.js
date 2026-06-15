const CACHE_NAME='bodyplan-v38';
const ASSETS=[
'./',
'./index.html?v=38',
'./manifest.json?v=38',
'./service-worker.js?v=38',
'./icons/icon-v38-192.png?v=38',
'./icons/icon-v38-512.png?v=38',
'./icons/icon-192.png?v=38',
'./icons/icon-512.png?v=38',
'./apple-touch-icon-v38.png?v=38',
'./apple-touch-icon.png?v=38',
'./favicon.png?v=38'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));});
