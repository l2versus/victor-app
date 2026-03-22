// Victor App — Service Worker v5 (offline workout cache)
const CACHE_NAME = "vo-app-v5"
const WORKOUT_CACHE = "vo-workouts-v1"
const STATIC_ASSETS = ["/login"]

// API routes to cache for offline use
const CACHEABLE_API = [
  "/api/student/today",
  "/api/student/sessions",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {/* ignore precache failures on iOS */})
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== WORKOUT_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Workout API: Network-first, cache for offline
  if (CACHEABLE_API.some((path) => url.pathname.startsWith(path)) && event.request.method === "GET") {
    event.respondWith(
      caches.open(WORKOUT_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request)
          // Cache successful responses
          if (response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        } catch {
          // Offline — serve from cache
          const cached = await cache.match(event.request)
          if (cached) return cached
          return new Response(
            JSON.stringify({ offline: true, error: "Sem conexão. Mostrando dados salvos." }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          )
        }
      })
    )
    return
  }

  // Static assets: Cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|glb)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }).catch(() => new Response("", { status: 408 }))
      })
    )
    return
  }

  // Everything else: Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// ─── Background Sync: queue offline set logs ──────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-workout-sets") {
    event.waitUntil(syncOfflineSets())
  }
})

async function syncOfflineSets() {
  try {
    const cache = await caches.open(WORKOUT_CACHE)
    const offlineQueue = await cache.match("offline-sets-queue")
    if (!offlineQueue) return

    const sets = await offlineQueue.json()
    for (const setData of sets) {
      try {
        await fetch(setData.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setData.body),
        })
      } catch {
        // Re-queue failed items
        return
      }
    }
    // Clear queue on success
    await cache.delete("offline-sets-queue")
  } catch {
    // Ignore sync errors
  }
}

// ─── Web Push ────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "Victor App", body: event.data.text(), url: "/today" }
  }

  const { title = "Victor App", body = "", icon, badge, url = "/today", tag } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/icon-192x192.png",
      badge: badge ?? "/favicon-16.png",
      tag: tag ?? "victor-app",
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url ?? "/today"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})
