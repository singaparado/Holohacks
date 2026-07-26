// Service worker. Lives at the root so it can cover both the marketing
// homepage and the /app/ tool.
//
// IMPORTANT FIX: previous version never cleaned up old cached versions,
// so once a browser cached a page, it kept serving that frozen copy
// forever, even after new files were deployed. This version bumps the
// cache name AND deletes any old caches on activation, and takes control
// of open tabs immediately instead of waiting for a full close-and-reopen.

const CACHE_NAME = "holohacks-v4";
const SHELL = ["/", "/app/", "/app/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // don't wait for old tabs to close, activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key); // wipe every old cache
        })
      )
    ).then(() => self.clients.claim()) // take control of already-open tabs now
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
