const CACHE = "cadence-v1.1.0"; // Bumped version
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/modules/state.js", // Added module files
  "./js/modules/utils.js", // Added module files
  "./favicon.svg",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
];

// ... (install and activate handlers remain same)

// Stale-While-Revalidate strategy for shell assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isShell =
    path.endsWith(".html") ||
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith("/") ||
    path.endsWith("manifest.json") ||
    event.request.mode === "navigate";

  if (isShell) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        // Return cached version if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // ... (rest of the fetch logic for other assets)
