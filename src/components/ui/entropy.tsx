'use client'
import { useEffect, useRef } from 'react'

interface EntropyProps {
  className?: string
  color?: string
  count?: number
  linkDistance?: number
  mouseRadius?: number
}

export function Entropy({
  className = "",
  color = "#ff2222",
  count = 160,
  linkDistance = 180,
  mouseRadius = 150,
}: EntropyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    const ctx = maybeCtx

    let W = 0, H = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect()
      if (!rect) return
      W = rect.width
      H = rect.height
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = `${W}px`
      canvas!.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    // Mobile: 50% particles, 70% link distance
    const isMobile = W < 768
    const N = isMobile ? Math.round(count * 0.5) : count
    const maxLink = isMobile ? linkDistance * 0.7 : linkDistance

    interface P {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; baseSpeed: number
    }
    const particles: P[] = []

    for (let i = 0; i < N; i++) {
      const speed = 0.4 + Math.random() * 1.2
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        size: 1.2 + Math.random() * 2.5,
        alpha: 0.5 + Math.random() * 0.5,
        baseSpeed: speed,
      })
    }

    // Mouse / touch
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
    }
    function onMouseLeave() { mouseRef.current = { ...mouseRef.current, active: false } }
    function onTouchMove(e: TouchEvent) {
      const rect = canvas!.getBoundingClientRect()
      const t = e.touches[0]
      mouseRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true }
    }
    function onTouchEnd() { mouseRef.current = { ...mouseRef.current, active: false } }

    canvas.addEventListener('mousemove', onMouseMove, { passive: true })
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd)

    // Custom cursor: draw crosshair circle at mouse position
    function drawCursor(mx: number, my: number) {
      // Outer ring
      ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(mx, my, 18, 0, Math.PI * 2)
      ctx.stroke()

      // Inner dot
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`
      ctx.beginPath()
      ctx.arc(mx, my, 3, 0, Math.PI * 2)
      ctx.fill()

      // Cross lines
      ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`
      ctx.lineWidth = 1
      const len = 8
      ctx.beginPath()
      ctx.moveTo(mx - len, my); ctx.lineTo(mx - 5, my)
      ctx.moveTo(mx + 5, my); ctx.lineTo(mx + len, my)
      ctx.moveTo(mx, my - len); ctx.lineTo(mx, my - 5)
      ctx.moveTo(mx, my + 5); ctx.lineTo(mx, my + len)
      ctx.stroke()

      // Glow around cursor
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mouseRadius * 0.6)
      grad.addColorStop(0, `rgba(${r},${g},${b},0.08)`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(mx, my, mouseRadius * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }

    let raf: number

    function animate() {
      ctx.clearRect(0, 0, W, H)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const mActive = mouseRef.current.active

      // Update
      for (const p of particles) {
        if (mActive) {
          const dx = p.x - mx, dy = p.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius && dist > 0) {
            const force = (mouseRadius - dist) / mouseRadius * 3
            p.vx += (dx / dist) * force * 0.4
            p.vy += (dy / dist) * force * 0.4
          }
        }

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.985
        p.vy *= 0.985

        // Keep speed alive (prevents particles from stopping)
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed < p.baseSpeed * 0.3) {
          p.vx += (Math.random() - 0.5) * p.baseSpeed * 0.5
          p.vy += (Math.random() - 0.5) * p.baseSpeed * 0.5
        }

        // Wrap
        if (p.x < -20) p.x = W + 20
        if (p.x > W + 20) p.x = -20
        if (p.y < -20) p.y = H + 20
        if (p.y > H + 20) p.y = -20
      }

      // Lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b2 = particles[j]
          const dx = a.x - b2.x, dy = a.y - b2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxLink) {
            const lineAlpha = (1 - dist / maxLink) * 0.45
            ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha})`
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b2.x, b2.y)
            ctx.stroke()
          }
        }
      }

      // Lines from mouse to nearby particles
      if (mActive) {
        for (const p of particles) {
          const dx = p.x - mx, dy = p.y - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouseRadius * 2) {
            const lineAlpha = (1 - dist / (mouseRadius * 2)) * 0.6
            ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(mx, my)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
          }
        }
      }

      // Draw particles with glow
      for (const p of particles) {
        // Outer glow
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.2})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.9})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Bright center
        ctx.fillStyle = `rgba(255,255,255,${p.alpha * 0.3})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Custom crosshair cursor
      if (mActive) {
        drawCursor(mx, my)
      }

      raf = requestAnimationFrame(animate)
    }

    animate()

    const ro = new ResizeObserver(() => { resize() })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [color, count, linkDistance, mouseRadius])

  return (
    <div className={`absolute inset-0 ${className}`} style={{ cursor: 'none' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'none' }} />
    </div>
  )
}
