"use client"

import { useState, useEffect, Suspense } from "react"
import { X, Play, AlertTriangle, Dumbbell, Target, ShieldAlert, ChevronDown, Box, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { find3DModel, getSketchfabEmbedUrl } from "@/lib/exercise-3d-models"
import dynamic from "next/dynamic"

const Machine3DGuide = dynamic(
  () => import("@/components/student/machine-3d-guide").then(m => ({ default: m.Machine3DGuide })),
  { ssr: false }
)

const MachineViewer = dynamic(
  () => import("./machine-3d-inline-viewer"),
  { ssr: false, loading: () => <div className="w-full h-75 rounded-2xl bg-[#080808] flex items-center justify-center"><RotateCcw className="w-5 h-5 text-neutral-700 animate-spin" /></div> }
)

// ─── Muscle Data: Synergists & Antagonists ───────────────────────────────────

const MUSCLE_DATA: Record<string, { synergists: string[]; antagonists: string[]; tips: string[]; avoid: string[] }> = {
  "Peito": {
    synergists: ["Tríceps", "Deltóide Anterior"],
    antagonists: ["Costas", "Bíceps"],
    tips: ["Escápulas retraídas e deprimidas", "Arco torácico natural", "Cotovelos a 45-75° do tronco"],
    avoid: ["Bounce no peito", "Cotovelos a 90° (lesão ombro)", "Levantar glúteo do banco"],
  },
  "Costas": {
    synergists: ["Bíceps", "Deltóide Posterior", "Antebraço"],
    antagonists: ["Peito", "Deltóide Anterior"],
    tips: ["Inicie com retração escapular", "Puxe com os cotovelos, não mãos", "Segure 1s na contração"],
    avoid: ["Usar impulso do corpo", "Arredondar coluna", "Puxar com bíceps apenas"],
  },
  "Ombros": {
    synergists: ["Tríceps", "Trapézio"],
    antagonists: ["Grande Dorsal"],
    tips: ["Core ativado o tempo todo", "Não eleve além de 90° com carga pesada", "Rotação externa na elevação"],
    avoid: ["Encolher trapézio", "Usar impulso das pernas", "Extensão cervical"],
  },
  "Bíceps": {
    synergists: ["Braquial", "Braquiorradial", "Antebraço"],
    antagonists: ["Tríceps"],
    tips: ["Cotovelos fixos ao lado do corpo", "Supinação completa no topo", "Fase excêntrica lenta (3s)"],
    avoid: ["Balançar o tronco", "Extensão incompleta", "Carga excessiva com compensação"],
  },
  "Tríceps": {
    synergists: ["Peitoral", "Deltóide Anterior"],
    antagonists: ["Bíceps"],
    tips: ["Extensão completa sem travar cotovelo", "Cotovelos apontando para frente", "Ênfase na contração"],
    avoid: ["Abrir cotovelos", "Usar ombro para compensar", "Velocidade excessiva"],
  },
  "Quadríceps": {
    synergists: ["Glúteos", "Core"],
    antagonists: ["Isquiotibiais"],
    tips: ["Joelhos alinhados com os pés", "Descer até 90° ou mais", "Pressão nos calcanhares"],
    avoid: ["Joelhos passarem muito dos pés", "Valgo de joelho (joelhos para dentro)", "Arredondar lombar"],
  },
  "Posterior": {
    synergists: ["Glúteos", "Eretores da espinha"],
    antagonists: ["Quadríceps"],
    tips: ["Hip hinge: quadril vai para trás", "Joelhos levemente flexionados", "Sinta o alongamento antes de subir"],
    avoid: ["Arredondar as costas", "Usar impulso", "Hiperextensão lombar no topo"],
  },
  "Glúteos": {
    synergists: ["Isquiotibiais", "Core", "Quadríceps"],
    antagonists: ["Flexores do quadril"],
    tips: ["Squeeze no topo por 2s", "Pés afastados na largura do quadril", "Ative glúteo antes de empurrar"],
    avoid: ["Hiperextensão lombar", "Não completar extensão do quadril", "Joelhos colapsando"],
  },
  "Abdômen": {
    synergists: ["Oblíquos", "Transverso", "Flexores do quadril"],
    antagonists: ["Eretores da espinha"],
    tips: ["Expire na contração", "Mantenha lombar no solo (crunch)", "Controle o movimento"],
    avoid: ["Puxar pescoço com as mãos", "Usar impulso", "Prender respiração"],
  },
  "Panturrilha": {
    synergists: ["Sóleo", "Tibial posterior"],
    antagonists: ["Tibial anterior"],
    tips: ["Extensão completa na ponta dos pés", "Pause 2s no topo", "Amplitude total"],
    avoid: ["Movimentos rápidos e parciais", "Bouncing no final", "Joelhos travados"],
  },
}

function getMuscleInfo(muscle: string) {
  // Try exact match first, then partial
  const exact = MUSCLE_DATA[muscle]
  if (exact) return exact
  const partial = Object.entries(MUSCLE_DATA).find(([key]) => muscle.includes(key) || key.includes(muscle))
  return partial?.[1] || null
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ExerciseDetailModalProps {
  exercise: {
    id: string
    name: string
    muscle: string
    equipment: string
    instructions: string | null
    imageUrl: string | null
    gifUrl: string | null
    videoUrl: string | null
    sets: number
    reps: string
    loadKg: number | null
    technique: string
    suggestedMachine: string | null
    machineBrand?: string | null
    machine3dModel?: string | null
  }
  onClose: () => void
}

// Machine brand origins
const BRAND_ORIGINS: Record<string, { origin: string; flag: string; desc: string }> = {
  "Hammer Strength": { origin: "EUA", flag: "🇺🇸", desc: "Referência mundial em placas — design biomecânico convergente" },
  "Hammer Strength MTS": { origin: "EUA", flag: "🇺🇸", desc: "Linha selectorizada premium — Multi-Adjustable" },
  "Hoist": { origin: "EUA", flag: "🇺🇸", desc: "Engenharia de precisão — ROC-IT cam system" },
  "Hoist ROC-IT": { origin: "EUA", flag: "🇺🇸", desc: "Range of Control — curva de resistência natural" },
  "Nautilus": { origin: "EUA", flag: "🇺🇸", desc: "Inventora da resistência variável — cam espiral" },
  "Nautilus Impact": { origin: "EUA", flag: "🇺🇸", desc: "Linha comercial de alto tráfego" },
  "Nautilus Inspiration": { origin: "EUA", flag: "🇺🇸", desc: "Linha premium selectorizada" },
  "Life Fitness": { origin: "EUA", flag: "🇺🇸", desc: "Maior fabricante mundial — presente em 100+ países" },
  "Life Fitness Insignia": { origin: "EUA", flag: "🇺🇸", desc: "Linha top de linha — biomecânica avançada" },
  "Cybex Prestige": { origin: "EUA", flag: "🇺🇸", desc: "Engenharia ortopédica — foco em segurança articular" },
  "Matrix": { origin: "Taiwan", flag: "🇹🇼", desc: "Design inovador — Johnson Health Tech" },
  "Panatta": { origin: "Itália", flag: "🇮🇹", desc: "Design italiano — Free Weight & Plate Loaded premium" },
  "Panatta Monolith": { origin: "Itália", flag: "🇮🇹", desc: "Linha profissional bodybuilding — estrutura monolítica" },
  "Panatta Inspiration": { origin: "Itália", flag: "🇮🇹", desc: "Selectorizada premium italiana" },
  "Stark Strong": { origin: "Brasil", flag: "🇧🇷", desc: "Fabricação nacional — custo-benefício profissional" },
  "ICG": { origin: "Alemanha", flag: "🇩🇪", desc: "Indoor Cycling Group — bikes premium" },
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  const muscleInfo = getMuscleInfo(exercise.muscle)
  const model3D = find3DModel(exercise.name)
  const heroImage = exercise.gifUrl || exercise.imageUrl
  const [machineBrand, setMachineBrand] = useState<string | null>(exercise.machineBrand || null)
  const brandInfo = machineBrand ? BRAND_ORIGINS[machineBrand] : null

  // Auto-match machine 3D: machine3dModel (slug real) > match by name in index.json
  // suggestedMachine é o NOME da máquina, não o slug do .glb
  const [machine3DSlug, setMachine3DSlug] = useState<string | null>(exercise.machine3dModel || null)
  const hasMachine3D = !!machine3DSlug

  // Try to auto-match exercise name to a machine in index.json
  useEffect(() => {
    if (machine3DSlug) return // already have a match
    fetch("/api/machines")
      .then(r => r.json())
      .then((index: Record<string, { name: string; brand?: string | null }>) => {
        const exName = exercise.name.toLowerCase()
        for (const [slug, info] of Object.entries(index)) {
          const mName = info.name.toLowerCase()
          // Match if exercise name contains machine name or vice versa
          if (exName.includes(mName) || mName.includes(exName) ||
              // Match by key words (brand + type)
              (info.brand && exName.includes(info.brand.toLowerCase()))) {
            setMachine3DSlug(slug)
            if (info.brand && !machineBrand) setMachineBrand(info.brand)
            break
          }
        }
      })
      .catch(() => {})
  }, [exercise.name, machine3DSlug, machineBrand])

  // Default tab: machine 3D > video > info
  const defaultTab = hasMachine3D ? "machine" : exercise.videoUrl ? "video" : "info"
  const [tab, setTab] = useState<"info" | "video" | "3d" | "machine">(defaultTab)

  // Update tab when machine3DSlug resolves async
  useEffect(() => {
    if (machine3DSlug && tab === "info") setTab("machine")
  }, [machine3DSlug, tab])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal — mobile bottom sheet style */}
      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0a0a0a] border border-white/[0.08] overflow-hidden flex flex-col animate-slide-up"
        style={{ maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image — compact on mobile */}
        {heroImage ? (
          <div className="relative w-full h-32 sm:h-48 shrink-0">
            <img src={heroImage} alt={exercise.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {/* Exercise name overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white drop-shadow-lg">{exercise.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/20">{exercise.muscle}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px] border border-white/10">{exercise.equipment}</span>
                {exercise.technique !== "NORMAL" && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-semibold border border-purple-500/20">{exercise.technique}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative shrink-0 px-5 pt-5 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{exercise.name}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/20">{exercise.muscle}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[10px] border border-white/10">{exercise.equipment}</span>
            </div>
          </div>
        )}

        {/* Tabs — sticky */}
        <div className="flex gap-1 px-4 py-2 shrink-0 border-b border-white/[0.04] sticky top-0 bg-[#0a0a0a] z-10">
          {[
            { key: "info" as const, label: "Detalhes", icon: Target },
            ...(exercise.videoUrl ? [{ key: "video" as const, label: "Vídeo", icon: Play }] : []),
            ...(hasMachine3D ? [{ key: "machine" as const, label: "Máquina", icon: Dumbbell }] : []),
            ...(model3D ? [{ key: "3d" as const, label: "3D Músculos", icon: Box }] : []),
          ].map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all",
                  tab === t.key
                    ? "bg-red-600/15 text-red-400 border border-red-500/20"
                    : "text-neutral-500 hover:text-neutral-300 border border-transparent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* TAB: Info */}
          {tab === "info" && (
            <div className="p-5 space-y-5">
              {/* Prescription */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-bold text-white">{exercise.sets}×{exercise.reps}</p>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Séries × Reps</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-bold text-white">{exercise.loadKg || "—"}<span className="text-xs text-neutral-500">kg</span></p>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Carga</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-lg font-bold text-white">{exercise.suggestedMachine || exercise.equipment}</p>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Equipamento</p>
                </div>
              </div>

              {/* Machine Brand & Origin */}
              {exercise.machineBrand && (
                <div className="rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600/10 border border-red-500/10 flex items-center justify-center shrink-0">
                      <span className="text-lg">{brandInfo?.flag || "🏭"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{exercise.machineBrand}</p>
                        {brandInfo && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-400 font-medium uppercase tracking-wider">{brandInfo.origin}</span>
                        )}
                      </div>
                      {brandInfo && (
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{brandInfo.desc}</p>
                      )}
                    </div>
                  </div>
                  {exercise.suggestedMachine && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex items-center gap-2">
                      <span className="text-amber-400 text-xs">📍</span>
                      <p className="text-xs text-amber-300/70">Localização: <span className="text-amber-300 font-medium">{exercise.suggestedMachine}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {exercise.instructions && (
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Como Executar
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{exercise.instructions}</p>
                </div>
              )}

              {/* Muscle Info — Synergists & Antagonists */}
              {muscleInfo && (
                <>
                  {/* Synergists */}
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                      Músculos Sinergistas
                    </h3>
                    <p className="text-[10px] text-neutral-600 mb-2">Trabalham junto com {exercise.muscle}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-[11px] font-medium border border-red-500/15">
                        {exercise.muscle} (principal)
                      </span>
                      {muscleInfo.synergists.map(m => (
                        <span key={m} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium border border-blue-500/15">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Antagonists */}
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-orange-400">↔</span>
                      Músculos Antagonistas
                    </h3>
                    <p className="text-[10px] text-neutral-600 mb-2">Músculo oposto — equilibre no treino</p>
                    <div className="flex flex-wrap gap-1.5">
                      {muscleInfo.antagonists.map(m => (
                        <span key={m} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-[11px] font-medium border border-orange-500/15">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      Dicas de Execução
                    </h3>
                    <div className="space-y-1.5">
                      {muscleInfo.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                          <p className="text-xs text-emerald-300/80 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What NOT to do */}
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      O Que NÃO Fazer
                    </h3>
                    <div className="space-y-1.5">
                      {muscleInfo.avoid.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <span className="text-red-400 text-xs mt-0.5">✕</span>
                          <p className="text-xs text-red-300/80 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: Video */}
          {tab === "video" && exercise.videoUrl && (
            <div className="p-4">
              <div className="rounded-2xl overflow-hidden bg-black border border-white/[0.08]">
                {exercise.videoUrl.includes("youtube") || exercise.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYTId(exercise.videoUrl)}?rel=0`}
                    className="w-full aspect-video"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : exercise.videoUrl.includes("instagram") ? (
                  <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-4 text-sm text-pink-400 hover:text-pink-300">
                    <Play className="w-5 h-5" />
                    Ver vídeo no Instagram
                  </a>
                ) : (
                  <video src={exercise.videoUrl} controls playsInline loop autoPlay muted className="w-full aspect-video" preload="auto" />
                )}
              </div>
              <p className="text-center text-[10px] text-neutral-600 mt-2">Vídeo demonstrativo — observe a técnica</p>
            </div>
          )}

          {/* TAB: Machine 3D */}
          {tab === "machine" && machine3DSlug && (
            <div className="p-4 space-y-4">
              <MachineViewer
                slug={machine3DSlug}
                machineName={machine3DSlug}
                onBrandLoaded={(b) => { if (b && !machineBrand) setMachineBrand(b) }}
              />

              {/* Brand info card below 3D */}
              {exercise.machineBrand && brandInfo && (
                <div className="rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-600/10 border border-red-500/10 flex items-center justify-center shrink-0">
                      <span className="text-lg">{brandInfo.flag}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{exercise.machineBrand}</p>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-400 font-medium uppercase tracking-wider">{brandInfo.origin}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{brandInfo.desc}</p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-center text-[10px] text-neutral-600">Toque na tela para girar • Pinça para zoom • Fullscreen no canto superior</p>
            </div>
          )}

          {/* TAB: 3D Muscles */}
          {tab === "3d" && model3D && (
            <div className="p-4">
              <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#111]">
                <iframe
                  src={getSketchfabEmbedUrl(model3D.sketchfabId)}
                  className="w-full aspect-[4/3]"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-white font-medium">{model3D.title}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Músculos: {model3D.muscles.join(", ")}
                </p>
                <p className="text-[9px] text-neutral-700 mt-1">{model3D.credit}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function extractYTId(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] || url
}
