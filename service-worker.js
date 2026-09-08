const CACHE_NAME='bodyplan-v2-alpha1';
const ASSETS=[
'./',
'./index.html?v=44',
'./manifest.json?v=44',
'./service-worker.js?v=44',
'./icons/icon-v44-192.png',
'./icons/icon-v44-512.png',
'./apple-touch-icon-v44.png',
'./favicon.png',
'./alpha.html',
'./alpha.css',
'./alpha.js',
'./exercise-seed.json',
'./starter-plan.json',
'./legacy-plans.json'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));});
