const cacheName = "version-1",
  urlsToCache = [
    "index.html",
    "/main.js",
    "/expense.js",
    "/parser.js",
    "/template.csv",
  ],
  self = this;
"serviceWorker" in navigator &&
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((e) => console.log("Success: ", e.scope))
      .catch((e) => console.log("Failure: ", e));
  }),
  this.addEventListener("install", (e) => {
    console.log("[Service Worker] Install");
    e.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);
        console.log("[Service Worker] Caching all: app shell and content");
        await cache.addAll(urlsToCache);
      })()
    );
  }),
  this.addEventListener("fetch", (e) => {
    e.respondWith(
      (async () => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) {
          return r;
        }
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        // cache.put(e.request, response);
        return response;
      })()
    );
  }),
  this.addEventListener("activate", (e) => {
    e.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key === cacheName) {
              return;
            }
            return caches.delete(key);
          })
        );
      })
    );
  });
