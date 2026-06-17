const CACHE_NAME='bodyplan-v40';
const ASSETS=[
'./',
'./index.html?v=40',
'./manifest.json?v=40',
'./service-worker.js?v=40',
'./icons/icon-v40-192.png?v=40',
'./icons/icon-v40-512.png?v=40',
'./icons/icon-192.png?v=40',
'./icons/icon-512.png?v=40',
'./apple-touch-icon-v40.png?v=40',
'./apple-touch-icon.png?v=40',
'./favicon.png?v=40'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));});
