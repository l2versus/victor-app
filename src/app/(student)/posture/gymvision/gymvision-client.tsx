"use client"

import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Camera, X, Loader2, ArrowLeft, Scan, CheckCircle2, ChevronRight, Dumbbell, Zap } from "lucide-react"
import { classifyMachine, type ScanResult, GYM_MACHINES } from "@/lib/gymvision"
import Link from "next/link"

type ScanState = "idle" | "camera" | "scanning" | "result"

export function GymVisionClient() {
  const [state, setState] = useState<ScanState>("idle")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    setState("camera")
    setError("")
    setResult(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setError("Permissão de câmera negada. Habilite nas configurações.")
      setState("idle")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setState("idle")
  }, [])

  async function scanMachine() {
    if (!videoRef.current || !canvasRef.current) return
    setState("scanning")

    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Capture current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Classify (placeholder — will use real TF.js model)
    const todayExercises = ["squat", "leg press", "leg extension", "pec deck"] // TODO: fetch from API
    const scanResult = await classifyMachine(canvas, todayExercises)

    setResult(scanResult)
    setState("result")
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/posture" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            GymVision
          </h1>
          <p className="text-[11px] text-neutral-500">Aponte a câmera para identificar a máquina</p>
        </div>
      </div>

      {/* Idle state — instructions */}
      {state === "idle" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-cyan-600/[0.06] border border-cyan-500/15 p-4 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
              <Zap className="w-4 h-4" />
              Como funciona
            </div>
            <ol className="text-xs text-neutral-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Aponte a câmera traseira para uma máquina da academia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Toque em <strong className="text-white">Escanear</strong> para identificar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Veja se está no seu treino de hoje e quais músculos trabalha</span>
              </li>
            </ol>
          </div>

          {/* Machine catalog preview */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-xs text-neutral-400 font-medium mb-2 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              {GYM_MACHINES.length} máquinas reconhecidas
            </p>
            <div className="flex flex-wrap gap-1">
              {GYM_MACHINES.slice(0, 12).map(m => (
                <span key={m.id} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500 border border-white/5">
                  {m.icon} {m.name}
                </span>
              ))}
              {GYM_MACHINES.length > 12 && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-500">
                  +{GYM_MACHINES.length - 12} mais
                </span>
              )}
            </div>
          </div>

          <button
            onClick={startCamera}
            className="w-full py-3.5 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 active:scale-[0.97] transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Abrir Câmera
          </button>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>
      )}

      {/* Camera view */}
      {(state === "camera" || state === "scanning") && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan crosshair overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-cyan-400/50 rounded-2xl relative">
                {/* Corner markers */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                {state === "scanning" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-cyan-400/60 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 active:scale-90 transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scanning indicator */}
            {state === "scanning" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 text-white text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Identificando máquina...
              </div>
            )}
          </div>

          {/* Scan button */}
          <button
            onClick={scanMachine}
            disabled={state === "scanning"}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
              state === "scanning"
                ? "bg-cyan-600/50 text-cyan-200 cursor-wait"
                : "bg-cyan-600 text-white hover:bg-cyan-500 active:scale-[0.97] shadow-lg shadow-cyan-600/20",
            )}
          >
            {state === "scanning" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
            ) : (
              <><Scan className="w-4 h-4" /> Escanear Máquina</>
            )}
          </button>
        </div>
      )}

      {/* Result */}
      {state === "result" && result && (
        <div className="space-y-3">
          {/* Machine card */}
          <div className={cn(
            "rounded-2xl border p-4 space-y-3",
            result.isInWorkout
              ? "bg-emerald-600/[0.06] border-emerald-500/20"
              : "bg-white/[0.02] border-white/[0.08]",
          )}>
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span className="text-3xl">{result.machine.icon}</span>
              {result.isInWorkout ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No seu treino!
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white/5 text-neutral-400 text-xs">
                  Não está no treino
                </span>
              )}
            </div>

            {/* Machine info */}
            <div>
              <h2 className="text-lg font-bold text-white">{result.machine.name}</h2>
              <p className="text-xs text-neutral-500">{result.machine.nameEn} • {result.machine.category}</p>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all"
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>

            {/* Muscles */}
            <div>
              <p className="text-[10px] text-neutral-500 mb-1">Músculos trabalhados:</p>
              <div className="flex flex-wrap gap-1">
                {result.machine.muscles.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-600/10 text-cyan-300 border border-cyan-500/20">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Reference images from dataset */}
            {result.referenceImages && result.referenceImages.length > 0 && (
              <div>
                <p className="text-[10px] text-neutral-500 mb-1">
                  Referências do catálogo ({result.datasetCount || 0} imagens):
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {result.referenceImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Ref ${i + 1}`}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Next machine suggestion */}
            {!result.isInWorkout && result.nextMachine && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20">
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300">
                  Sua próxima máquina: <strong>{result.nextMachine}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="flex-1 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" />
              Escanear outra
            </button>
            <Link
              href="/posture"
              className="py-3 px-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neutral-400 text-sm text-center hover:text-white transition-colors"
            >
              Voltar
            </Link>
          </div>

          {/* Dataset info */}
          <p className="text-[9px] text-neutral-600 text-center">
            Classificação por histograma de cores (144 imagens Panatta). Modelo TF.js em desenvolvimento.
          </p>
        </div>
      )}
    </div>
  )
}
