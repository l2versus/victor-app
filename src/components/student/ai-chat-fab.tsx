"use client"

import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRef, useState, useEffect, useCallback } from "react"
import { Sparkles } from "lucide-react"

const STORAGE_KEY = "ai-fab-pos"
const FAB_SIZE = 56 // w-14 = 56px
const MARGIN = 12

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function getDefaultPos() {
  if (typeof window === "undefined") return { x: 0, y: 0 }
  return {
    x: window.innerWidth - FAB_SIZE - MARGIN,
    y: window.innerHeight - FAB_SIZE - 100, // above nav
  }
}

function loadPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (typeof p.x === "number" && typeof p.y === "number") return p
    }
  } catch { /* ignore */ }
  return getDefaultPos()
}

export function AiChatFab() {
  const pathname = usePathname()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(loadPos)
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const startTouch = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  // Hide on chat page
  if (pathname === "/chat") return null

  // Keep position in bounds on resize
  useEffect(() => {
    function onResize() {
      setPos((p: { x: number; y: number }) => ({
        x: clamp(p.x, MARGIN, window.innerWidth - FAB_SIZE - MARGIN),
        y: clamp(p.y, MARGIN, window.innerHeight - FAB_SIZE - MARGIN),
      }))
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragging.current = true
    hasMoved.current = false
    startTouch.current = { x: touch.clientX, y: touch.clientY, posX: pos.x, posY: pos.y }
  }, [pos])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - startTouch.current.x
    const dy = touch.clientY - startTouch.current.y

    // Only start dragging after 8px movement (prevents accidental drags on tap)
    if (!hasMoved.current && Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    hasMoved.current = true

    const newX = clamp(startTouch.current.posX + dx, MARGIN, window.innerWidth - FAB_SIZE - MARGIN)
    const newY = clamp(startTouch.current.posY + dy, MARGIN, window.innerHeight - FAB_SIZE - MARGIN)
    setPos({ x: newX, y: newY })
  }, [])

  const handleTouchEnd = useCallback(() => {
    dragging.current = false
    if (hasMoved.current) {
      // Snap to nearest edge (left or right)
      setPos((p: { x: number; y: number }) => {
        const midX = window.innerWidth / 2
        const snapped = {
          x: p.x + FAB_SIZE / 2 < midX ? MARGIN : window.innerWidth - FAB_SIZE - MARGIN,
          y: p.y,
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped)) } catch { /* ignore */ }
        return snapped
      })
    } else {
      // It was a tap — navigate to chat
      router.push("/chat")
    }
  }, [router])

  return (
    <div
      ref={ref}
      className="fixed z-40 touch-none select-none"
      style={{ left: pos.x, top: pos.y, transition: dragging.current ? "none" : "left 0.3s ease, top 0.3s ease" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        // Desktop click (touch handled via touchEnd)
        if (!hasMoved.current) router.push("/chat")
      }}
      role="button"
      aria-label="Chat com IA"
    >
      {/* Outer pulse ring */}
      <span className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" style={{ animationDuration: "3s" }} />

      {/* Glow */}
      <span className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-red-500/30 to-red-900/20 blur-md" />

      {/* Button */}
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-xl shadow-red-900/40 border border-red-500/30 transition-transform duration-150 active:scale-95">
        <Sparkles className="w-5.5 h-5.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
      </span>

      {/* Label pill */}
      <span className="absolute -top-1 -left-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-semibold text-white tracking-wide uppercase whitespace-nowrap pointer-events-none">
        IA
      </span>
    </div>
  )
}
