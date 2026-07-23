const VERSION='V1.6';
const CACHE=`applus-${VERSION}-revision-images`;
const CORE=['./','index.html','app.css','rewards.css','developer.css','notifications.css','cards.css','page-help.css','my-cards.css','whats-new.css','simple-overrides.css','reward-apps.css','badge-celebration.css','badge-fix.css','mate-v2.css','academy-challenge.css','explosive-badges.css','quiz-slides.css','academy-training.css','epa.css','revision-packs.css','documents-compact.css','brick-plans.css','accessibility.css','learner-notes.css','guided-demo.css','brick-plans.js','app.js','courses.js','academy-questions.js','advanced-academy.js','functional-skills-20.js','academy-training.js','epa.js','revision-packs.js','revision-images.js','trade-revision.js','accessibility.js','learner-notes.js','guided-demo.js','english-bond-reference.jpg','revision-images/masonry.webp','revision-images/carpentry.webp','revision-images/joinery.webp','revision-images/safety.webp','revision-images/maths-measure.webp','revision-images/maths-data.webp','revision-images/english-writing.webp','revision-images/english-speaking.webp','manifest.json','version.json','logo.png','icon-192.png','icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('index.html',copy))}
      return response;
    }).catch(()=>caches.match('index.html')));
    return;
  }

  const networkFirst=['app.js','app.css','brick-plans.js','brick-plans.css','guided-demo.js','guided-demo.css','courses.js','academy-questions.js','epa.js','epa.css','revision-packs.js','revision-packs.css','revision-images.js','trade-revision.js','accessibility.js','accessibility.css','learner-notes.js','learner-notes.css','manifest.json','version.json','service-worker.js','index.html'];
  if(networkFirst.some(name=>url.pathname.endsWith(name))){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
      return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
    return response;
  })));
});
