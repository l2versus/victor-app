// Victor App — Service Worker v4
const CACHE_NAME = "vo-app-v4"

self.addEventListener("install", (event) => {
  // Only precache truly static assets — skip pages that may redirect (auth)
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/login"]).catch(() => {/* ignore precache failures on iOS */})
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  // Network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

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
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})
