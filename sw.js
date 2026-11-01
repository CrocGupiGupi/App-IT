// Cambia V al publicar para forzar la renovación de la caché.
const V = 'estudio-it-v8';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icon.svg', 'content/fields.json',
  'fonts/overpass-latin-wght-normal.woff2', 'fonts/overpass-latin-wght-italic.woff2', 'fonts/overpass-mono-latin-wght-normal.woff2'];

// El temario sale de los course.json, así un campo nuevo no obliga a tocar este fichero.
async function contentUrls() {
  const json = u => fetch(u).then(r => r.json());
  const ids = await json('content/fields.json');
  const courses = await Promise.all(ids.map(id => json(`content/${id}/course.json`)));
  return courses.flatMap((c, i) => {
    const dir = `content/${ids[i]}/`;
    return ['course.json', 'quiz.json', ...c.lessons.map(l => l.file)].map(f => dir + f);
  });
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(SHELL);
    // Un fichero que falle no impide instalar: quiz.json es opcional y el resto se guarda al abrirlo.
    await Promise.allSettled((await contentUrls()).map(u => c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: sirve de caché y actualiza en segundo plano.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
