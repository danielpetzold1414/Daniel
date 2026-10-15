// WorkTracker Service Worker – macht die App offline nutzbar.
// Bei jeder neuen App-Version die Nummer erhöhen, damit Handys die neue Version laden.
const CACHE = "worktracker-v3";
const DATEIEN = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const istSeite = e.request.mode === "navigate" || e.request.url.endsWith("/app.js");
  if (istSeite) {
    // App-Seite: erst online versuchen (für Updates), sonst gespeicherte Version
    e.respondWith(
      fetch(e.request).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request.mode === "navigate" ? "./index.html" : e.request, k)); return r; })
        .catch(() => caches.match(e.request.mode === "navigate" ? "./index.html" : e.request))
    );
  } else {
    // Bibliotheken, Icons, Schriften: aus dem Speicher, sonst laden und merken
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok || r.type === "opaque") { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); }
        return r;
      }))
    );
  }
});
