const CACHE_NAME = 'crackit-bhai-app-v4';
const APP_SHELL = [
    './index.html',
    './manifest.webmanifest',
    './favicon.ico',
    './app-icon.svg',
    './app-icon-192.png',
    './app-icon-512.png',
    './patwari-practice.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('crackit-bhai-app-') && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        const requestUrl = new URL(event.request.url);
        const appUrl = new URL('./index.html', self.registration.scope);
        if (requestUrl.pathname !== appUrl.pathname) return;

        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok) {
                        return caches.open(CACHE_NAME)
                            .then(cache => cache.put(appUrl.href, response.clone()))
                            .then(() => response);
                    }
                    return response;
                })
                .catch(async () => {
                    const cachedPage = await caches.match(appUrl.href);
                    if (cachedPage) return cachedPage;
                    return Response.error();
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => cachedResponse || fetch(event.request))
    );
});
