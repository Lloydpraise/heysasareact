const CACHE_NAME = 'heysasa-static-v3'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]
const STATIC_ASSET = /\.(?:js|css|png|jpe?g|svg|webp|woff2?|ico)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL)
        const appShell = await cache.match('/')
        const assetPaths = Array.from(
          (await appShell.text()).matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g),
          (match) => match[1],
        ).filter((path) => path.startsWith('/assets/'))
        await cache.addAll([...new Set(assetPaths)])
      })
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('heysasa-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/')),
    )
    return
  }

  if (!STATIC_ASSET.test(url.pathname)) return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseToCache = response.clone()
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache)),
          )
        }
        return response
      })
    }),
  )
})
