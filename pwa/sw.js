'use strict';
// Keshlanadigan narsa: faqat ilova qobig'i. Narx va balans so'rovlariga tegilmaydi.
const CACHE = 'hamyon-v34';
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    // avval tarmoq (yangilanish olish uchun), bo'lmasa kesh (oflayn).
    // Faqat muvaffaqiyatli (2xx) javob keshga yoziladi: 404/5xx yoki wifi-portal sahifasi oflayn nusxani buzmasligi uchun.
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put('index.html', c)); } return res; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r)));
});
