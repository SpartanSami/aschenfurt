/* Service Worker – macht das Spiel nach dem ersten Besuch komplett offline spielbar */
"use strict";

const CACHE = "aschenfurt-v4";
const DATEIEN = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./css/style.css?v=4",
  "./js/util.js?v=4",
  "./js/data_world.js?v=4",
  "./js/data_npcs.js?v=4",
  "./js/data_fall1.js?v=4",
  "./js/data_fall2.js?v=4",
  "./js/data_fall3.js?v=4",
  "./js/data_finale.js?v=4",
  "./js/engine.js?v=4",
  "./js/ui.js?v=4",
  "./js/main.js?v=4",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request, { ignoreSearch: false }).then((hit) =>
      hit || caches.match(e.request, { ignoreSearch: true }).then((hit2) =>
        hit2 || fetch(e.request).then((resp) => {
          if (resp.ok && e.request.method === "GET" && new URL(e.request.url).origin === location.origin) {
            const kopie = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, kopie));
          }
          return resp;
        })
      )
    ).catch(() => caches.match("./index.html"))
  );
});
