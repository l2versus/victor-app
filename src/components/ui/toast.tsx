"use client"

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

// Convenience helpers
export function toast(opts: Omit<Toast, "id">) {
  const event = new CustomEvent("victor-toast", { detail: opts })
  window.dispatchEvent(event)
}

toast.success = (title: string, description?: string) =>
  toast({ type: "success", title, description })
toast.error = (title: string, description?: string) =>
  toast({ type: "error", title, description })
toast.warning = (title: string, description?: string) =>
  toast({ type: "warning", title, description })
toast.info = (title: string, description?: string) =>
  toast({ type: "info", title, description })

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
}

const ICON_STYLES: Record<ToastType, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-blue-400",
}

const DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Listen for global events (so toast() works outside React tree)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Omit<Toast, "id">
      addToast(detail)
    }
    window.addEventListener("victor-toast", handler)
    return () => window.removeEventListener("victor-toast", handler)
  }, [addToast])

  return (
    <ToastContext value={{ toast: addToast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[t.type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), DURATION)
    return () => clearTimeout(timer)
  }, [t.id, onDismiss])

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
        "animate-in slide-in-from-right-full fade-in duration-300",
        STYLES[t.type]
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", ICON_STYLES[t.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{t.title}</p>
        {t.description && (
          <p className="text-xs text-neutral-400 mt-0.5">{t.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="shrink-0 text-neutral-500 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
