const CACHE_NAME = 'stockcontrol-v2';

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        self.registration.scope,
        self.registration.scope + 'index.html',
        self.registration.scope + 'manifest.json',
        self.registration.scope + 'icon-192.png',
        self.registration.scope + 'icon-512.png',
      ]).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'StockControl', {
    body: data.body || 'Alerta de estoque!',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'stockcontrol',
    renotify: true
  }));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      clients.openWindow(self.registration.scope);
    })
  );
});
