const CACHE_NAME='bodyplan-2-beta3';
const ASSETS=[
'./','./index.html','./app.css','./app.js',
'./exercise-seed.json','./starter-plan.json',
'./manifest.json','./apple-touch-icon.png',
'./icons/icon-192.png','./icons/icon-512.png',
'./assets/heatmap-front.png','./assets/heatmap-back.png'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return r;}).catch(()=>caches.match(event.request)));
});
