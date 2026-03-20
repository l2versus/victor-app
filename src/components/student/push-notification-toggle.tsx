"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type State = "unsupported" | "denied" | "prompt" | "subscribed" | "unsubscribed" | "loading"

export function PushNotificationToggle() {
  const [state, setState] = useState<State>("loading")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }

    const perm = Notification.permission
    if (perm === "denied") { setState("denied"); return }

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      setState(sub ? "subscribed" : "prompt")
    }).catch(() => setState("prompt"))
  }, [])

  async function subscribe() {
    setState("loading")
    try {
      const perm = await Notification.requestPermission()
      if (perm !== "granted") { setState("denied"); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
        ) as Uint8Array<ArrayBuffer>,
      })

      const json = sub.toJSON()
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      })

      setState("subscribed")
    } catch {
      setState("prompt")
    }
  }

  async function unsubscribe() {
    setState("loading")
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState("unsubscribed")
    } catch {
      setState("subscribed")
    }
  }

  if (state === "unsupported") return null

  return (
    <button
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={state === "loading" || state === "denied"}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 active:scale-[0.98]",
        state === "subscribed"
          ? "border-emerald-500/20 bg-emerald-600/6 text-emerald-300 hover:bg-emerald-600/10"
          : state === "denied"
            ? "border-white/5 bg-white/2 text-neutral-600 cursor-not-allowed"
            : "border-white/10 bg-white/3 text-neutral-400 hover:bg-white/6 hover:text-neutral-300"
      )}
    >
      {state === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : state === "subscribed" ? (
        <Bell className="w-4 h-4 shrink-0 text-emerald-400" />
      ) : (
        <BellOff className="w-4 h-4 shrink-0" />
      )}
      <span className="text-sm font-medium">
        {state === "subscribed"
          ? "Notificações ativas"
          : state === "denied"
            ? "Notificações bloqueadas (ajuste nas config. do browser)"
            : state === "loading"
              ? "Aguardando..."
              : "Ativar notificações push"}
      </span>
      {state === "subscribed" && (
        <span className="ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        </span>
      )}
    </button>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
