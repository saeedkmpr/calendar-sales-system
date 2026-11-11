// Lightweight pass-through Service Worker for PWA & Android APK compatibility
// Always fetches live data and latest updates directly from network (no stale cache).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            '<!DOCTYPE html><html lang="ml"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - CalendarSales</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;background:#0f172a;color:#fff;padding:24px;"><div><h2 style="margin-bottom:8px;">ഇന്റർനെറ്റ് കണക്ഷൻ ലഭ്യമല്ല</h2><p style="color:#94a3b8;margin-bottom:20px;">ദയവായി മൊബൈൽ ഡാറ്റയോ വൈ-ഫൈയോ ഓൺ ചെയ്ത് വീണ്ടും ശ്രമിക്കുക.</p><button onclick="location.reload()" style="padding:10px 24px;border:none;border-radius:8px;background:#059669;color:#fff;font-weight:bold;font-size:15px;cursor:pointer;">വീണ്ടും ശ്രമിക്കുക</button></div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
      )
    );
  }
});
