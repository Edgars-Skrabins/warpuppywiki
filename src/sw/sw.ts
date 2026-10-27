import { APP_CACHE, CACHE_PREFIX, TILE_CACHE, TILE_CACHE_CAP, classify, type Strategy } from "./strategy";
import { keysToDelete } from "./trim";

declare const self: ServiceWorkerGlobalScope;

function isStorable(response: Response): boolean {
  return response.status === 200 && response.type === "basic";
}

async function store(cacheName: string, request: Request, response: Response): Promise<void> {
  if (!isStorable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

async function networkFirst(event: FetchEvent): Promise<Response> {
  try {
    const response = await fetch(event.request);
    event.waitUntil(store(APP_CACHE, event.request, response.clone()));
    return response;
  } catch (error) {
    const cached = await caches.match(event.request, { cacheName: APP_CACHE });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(event: FetchEvent, cacheName: string): Promise<Response> {
  const cached = await caches.match(event.request, { cacheName });
  if (cached) return cached;
  const response = await fetch(event.request);
  event.waitUntil(store(cacheName, event.request, response.clone()));
  return response;
}

async function trimTiles(): Promise<void> {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  await Promise.all(keysToDelete(keys, TILE_CACHE_CAP).map((key) => cache.delete(key)));
}

async function tiles(event: FetchEvent): Promise<Response> {
  const response = await cacheFirst(event, TILE_CACHE);
  event.waitUntil(trimTiles());
  return response;
}

async function respond(event: FetchEvent, strategy: Strategy): Promise<Response> {
  try {
    switch (strategy) {
      case "network-first":
        return await networkFirst(event);
      case "cache-first":
        return await cacheFirst(event, APP_CACHE);
      case "tiles":
        return await tiles(event);
      case "passthrough":
        return await fetch(event.request);
    }
  } catch {
    return fetch(event.request);
  }
}

async function deleteOldCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith("wpw-") && !name.startsWith(CACHE_PREFIX))
      .map((name) => caches.delete(name)),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  let strategy: Strategy;
  try {
    strategy = classify(event.request.url, self.registration.scope);
  } catch {
    return;
  }
  if (strategy === "passthrough") return;
  event.respondWith(respond(event, strategy));
});
