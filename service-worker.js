const CACHE_NAME='bodyplan-v42';
const ASSETS=[
'./',
'./index.html?v=41?v=39',
'./manifest.json?v=39',
'./service-worker.js?v=39',
'./icons/icon-v42-192.png?v=39',
'./icons/icon-v42-512.png?v=39',
'./icons/icon-192.png?v=39',
'./icons/icon-512.png?v=39',
'./apple-touch-icon-v42.png?v=39',
'./apple-touch-icon.png?v=39',
'./favicon.png?v=39'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));});
