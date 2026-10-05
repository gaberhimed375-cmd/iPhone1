"use strict";

const CACHE_PREFIX = "pocket-arcade-";
const CACHE_NAME = `${CACHE_PREFIX}v13`;
const APP_FILES = [
  "./",
  "./index.html",
  "./matching.html",
  "./shooter.html",
  "./zombie.html",
  "./runner.html",
  "./hide-and-seek.html",
  "./arcade.css",
  "./arcade-ui.js",
  "./manifest.webmanifest",
  "./register-sw.js",
  "./icon.svg",
  "./sprites.svg"
];
const APP_PATHS = new Set(
  APP_FILES.map((file) => new URL(file, self.registration.scope).pathname)
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const canonicalRequest = new Request(`${url.origin}${url.pathname}`);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && APP_PATHS.has(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(canonicalRequest, copy));
          }
          return response;
        })
        .catch(async () => {
          const exact = await caches.match(canonicalRequest);
          return exact || caches.match("./index.html");
        })
    );
    return;
  }

  if (!APP_PATHS.has(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(canonicalRequest).then((cached) => {
      const refreshed = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(canonicalRequest, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || refreshed;
    })
  );
});
