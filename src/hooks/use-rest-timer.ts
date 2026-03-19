"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface UseRestTimerReturn {
  remaining: number
  total: number
  isRunning: boolean
  progress: number // 0 to 1
  start: (seconds: number) => void
  skip: () => void
}

export function useRestTimer(onComplete?: () => void): UseRestTimerReturn {
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const endTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const tick = useCallback(() => {
    const now = Date.now()
    const left = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    setRemaining(left)

    if (left <= 0) {
      setIsRunning(false)
      // Haptic feedback on complete
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([30, 50, 30])
      }
      onCompleteRef.current?.()
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback((seconds: number) => {
    setTotal(seconds)
    setRemaining(seconds)
    setIsRunning(true)
    endTimeRef.current = Date.now() + seconds * 1000
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const skip = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setIsRunning(false)
    setRemaining(0)
    onCompleteRef.current?.()
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const progress = total > 0 ? 1 - remaining / total : 0

  return { remaining, total, isRunning, progress, start, skip }
}
