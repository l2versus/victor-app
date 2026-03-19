"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

const phrases = [
  "Victor Oliveira — Personal Trainer",
  "Seu corpo. Sua evolução. Sua história.",
  "Cada repetição te aproxima do impossível.",
  "Disciplina supera talento quando talento não tem disciplina.",
  "Não espere a motivação. Crie o hábito.",
  "Resultados reais. Sem atalhos.",
]

export function TypingEffect({ className }: { className?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  const phrase = phrases[phraseIndex]

  const tick = useCallback(() => {
    if (!isDeleting) {
      if (charIndex < phrase.length) {
        setCharIndex((c) => c + 1)
      } else {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 2500)
        return
      }
    } else {
      if (charIndex > 0) {
        setCharIndex((c) => c - 1)
      } else {
        setIsDeleting(false)
        setPhraseIndex((p) => (p + 1) % phrases.length)
        return
      }
    }
  }, [charIndex, isDeleting, phrase.length])

  useEffect(() => {
    const speed = isDeleting ? 30 : 60
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [tick, isDeleting])

  return (
    <span className={cn("inline", className)}>
      {phrase.slice(0, charIndex)}
      <span className="animate-pulse text-red-500">|</span>
    </span>
  )
}
