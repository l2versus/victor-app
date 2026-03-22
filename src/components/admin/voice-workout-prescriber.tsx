"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Loader2, CheckCircle2, Wand2, RotateCcw, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParsedExercise {
  exerciseName: string
  exerciseId?: string
  exercise?: { id: string; name: string; muscle: string; equipment: string }
  sets: number
  reps: string
  restSeconds: number
  notes: string | null
  supersetGroup: string | null
}

interface ParsedWorkout {
  name: string
  type: string
  notes: string | null
  exercises: ParsedExercise[]
}

interface Props {
  onWorkoutParsed: (workout: ParsedWorkout) => void
  onClose: () => void
}

export function VoiceWorkoutPrescriber({ onWorkoutParsed, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [interimText, setInterimText] = useState("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [supported, setSupported] = useState(true)
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null)
  const [duration, setDuration] = useState(0)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "pt-BR"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + " "
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        setTranscription(prev => prev + final)
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return
      console.error("Speech recognition error:", event.error)
      if (event.error === "not-allowed") {
        setError("Permissão de microfone negada. Habilite nas configurações do navegador.")
      }
    }

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isRecording && recognitionRef.current) {
        try { recognitionRef.current.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update isRecording ref for onend handler
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start() } catch { /* ignore */ }
        }
      }
    }
  }, [isRecording])

  function startRecording() {
    if (!recognitionRef.current) return
    setError("")
    setTranscription("")
    setInterimText("")
    setParsedWorkout(null)
    setDuration(0)

    try {
      recognitionRef.current.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error(err)
      setError("Erro ao iniciar gravação")
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setInterimText("")
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function processTranscription() {
    const text = transcription.trim()
    if (!text || text.length < 10) {
      setError("Transcrição muito curta. Fale o treino completo.")
      return
    }

    setProcessing(true)
    setError("")

    try {
      const res = await fetch("/api/admin/ai/voice-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: text }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Erro ao processar")
        return
      }

      const { workout } = await res.json()
      setParsedWorkout(workout)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setProcessing(false)
    }
  }

  function confirmWorkout() {
    if (parsedWorkout) {
      onWorkoutParsed(parsedWorkout)
    }
  }

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (!supported) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-900/10 p-4">
        <p className="text-sm text-amber-300 font-medium mb-1">Navegador sem suporte a voz</p>
        <p className="text-xs text-amber-200/60">Use Chrome ou Edge para prescrição por voz.</p>
        <button onClick={onClose}
          className="mt-3 px-4 py-2 rounded-xl bg-white/5 text-xs text-neutral-400 hover:bg-white/10 transition-colors">
          Fechar
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/30 to-zinc-950/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Prescrever por Voz</p>
            <p className="text-[10px] text-neutral-500">Fale o treino e a IA monta a ficha</p>
          </div>
        </div>
        <button onClick={onClose}
          className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1">
          Fechar
        </button>
      </div>

      {/* Instructions */}
      {!isRecording && !transcription && !parsedWorkout && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            <span className="text-white font-medium">Como usar:</span> Aperte gravar e fale naturalmente. Exemplo:
          </p>
          <p className="text-[11px] text-red-300/70 mt-1.5 italic leading-relaxed">
            &quot;Treino A, Peito e Tríceps. Supino reto, 4 séries de 10, 60 segundos. Crucifixo inclinado, 3 séries de 12. Tríceps corda, 3 de 15, bi-set com tríceps testa...&quot;
          </p>
        </div>
      )}

      {/* Recording controls */}
      {!parsedWorkout && (
        <div className="flex flex-col items-center gap-3">
          {/* Mic button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={processing}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95",
              isRecording
                ? "bg-red-600 shadow-lg shadow-red-600/40 animate-pulse"
                : "bg-white/[0.06] border border-white/[0.1] hover:bg-red-600/20 hover:border-red-500/30"
            )}
          >
            {processing ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-neutral-400" />
            )}
          </button>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-mono">{formatDuration(duration)}</span>
              <span className="text-[10px] text-neutral-500">Gravando...</span>
            </div>
          )}

          {!isRecording && !transcription && (
            <p className="text-xs text-neutral-500">Toque para gravar</p>
          )}
        </div>
      )}

      {/* Live transcription */}
      {(transcription || interimText) && !parsedWorkout && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 max-h-40 overflow-y-auto">
          <p className="text-[9px] text-neutral-600 uppercase tracking-wider mb-1.5">Transcrição</p>
          <p className="text-sm text-neutral-200 leading-relaxed">
            {transcription}
            {interimText && <span className="text-neutral-500 italic">{interimText}</span>}
          </p>
        </div>
      )}

      {/* Process button */}
      {transcription && !isRecording && !parsedWorkout && !processing && (
        <div className="flex gap-2">
          <button onClick={processTranscription}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">
            <Wand2 className="w-4 h-4" />
            Montar Ficha com IA
          </button>
          <button onClick={() => { setTranscription(""); setDuration(0) }}
            className="px-4 py-3 rounded-xl bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Processing */}
      {processing && (
        <div className="flex items-center justify-center gap-2 py-3">
          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
          <p className="text-xs text-neutral-400">IA montando a ficha...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Parsed workout preview */}
      {parsedWorkout && (
        <div className="space-y-3">
          <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300">
              Ficha montada: <span className="font-bold">{parsedWorkout.name}</span> ({parsedWorkout.type}) — {parsedWorkout.exercises.length} exercícios
            </p>
          </div>

          {/* Exercise preview list */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {parsedWorkout.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-bold text-red-400 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {ex.exercise?.name || ex.exerciseName}
                    {!ex.exerciseId && <span className="text-amber-400 ml-1">(não encontrado)</span>}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {ex.sets}x{ex.reps} · {ex.restSeconds}s
                    {ex.supersetGroup && <span className="text-purple-400 ml-1">Bi-set {ex.supersetGroup}</span>}
                    {ex.notes && <span className="text-neutral-600 ml-1">· {ex.notes}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Confirm / Redo */}
          <div className="flex gap-2">
            <button onClick={confirmWorkout}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
              Usar esta ficha
            </button>
            <button onClick={() => { setParsedWorkout(null); setTranscription(""); setDuration(0) }}
              className="px-4 py-3 rounded-xl bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
