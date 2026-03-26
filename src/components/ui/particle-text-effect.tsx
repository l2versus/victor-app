"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  density: number
  size: number
  color: string
}

interface ParticleTextEffectProps {
  words: string[]
  className?: string
  particleColor?: string
  fontSize?: number
  particleDensity?: number
}

export function ParticleTextEffect({
  words,
  className = "",
  particleColor = "#ffffff",
  fontSize = 40,
  particleDensity = 3,
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 100 })
  const animationRef = useRef<number>(0)
  const wordIndexRef = useRef(0)
  const transitionRef = useRef(0)

  const createParticles = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const word = words[wordIndexRef.current % words.length]

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = particleColor
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(word, width / 2, height / 2)

      const imageData = ctx.getImageData(0, 0, width, height)
      const particles: Particle[] = []

      for (let y = 0; y < height; y += particleDensity) {
        for (let x = 0; x < width; x += particleDensity) {
          const index = (y * width + x) * 4
          if (imageData.data[index + 3] > 128) {
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              baseX: x,
              baseY: y,
              density: Math.random() * 30 + 1,
              size: Math.random() * 1.5 + 0.5,
              color: particleColor,
            })
          }
        }
      }

      return particles
    },
    [words, particleColor, fontSize, particleDensity]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
      particlesRef.current = createParticles(ctx, canvas.width, canvas.height)
    }

    resizeCanvas()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
    }

    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.touches[0].clientX - rect.left
      mouseRef.current.y = e.touches[0].clientY - rect.top
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    canvas.addEventListener("touchmove", handleTouchMove)
    canvas.addEventListener("touchend", handleMouseLeave)
    window.addEventListener("resize", resizeCanvas)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current
      const mouse = mouseRef.current

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const forceDirectionX = dx / dist
        const forceDirectionY = dy / dist
        const maxDist = mouse.radius
        const force = (maxDist - dist) / maxDist
        const directionX = forceDirectionX * force * p.density
        const directionY = forceDirectionY * force * p.density

        if (dist < mouse.radius) {
          p.x -= directionX
          p.y -= directionY
        } else {
          if (p.x !== p.baseX) {
            const dxBase = p.x - p.baseX
            p.x -= dxBase / 10
          }
          if (p.y !== p.baseY) {
            const dyBase = p.y - p.baseY
            p.y -= dyBase / 10
          }
        }

        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }

      // Word transition
      transitionRef.current++
      if (transitionRef.current > 300) {
        transitionRef.current = 0
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        particlesRef.current = createParticles(ctx, canvas.width, canvas.height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleMouseLeave)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [createParticles, words])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
