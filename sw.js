// Minimal service worker, lives at the root so it can cover both the
// marketing homepage and the /app/ tool. Its main job is just existing,
// which is one of the requirements browsers check before offering
// "Add to Home Screen" / "Install app" for the /app/ page.
const CACHE_NAME = "holohacks-v3";
const SHELL = ["/", "/app/", "/app/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
