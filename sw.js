// Minimal service worker. Its only job right now is to exist,
// which is one of the requirements browsers check before
// offering "Add to Home Screen" / "Install app".
const CACHE_NAME = "holohacks-v1";
const SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  // Never cache API calls — those always need to hit the server live.
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
