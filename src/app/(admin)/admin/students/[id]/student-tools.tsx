"use client"

import { useState, useCallback } from "react"
import { Eye, TrendingUp, Download, X, Dumbbell, Smartphone, ChevronDown, Loader2, MessageCircle, ExternalLink } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const DAY_NAMES_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

type Exercise = {
  id: string; name: string; muscle: string; equipment: string
  instructions: string | null; imageUrl: string | null
  sets: number; reps: string; restSeconds: number
  loadKg: number | null; notes: string | null; technique: string
}

type WeekPlan = {
  dayOfWeek: number; templateName: string; templateType: string
  exercises: Exercise[]
}

type EvolutionEntry = {
  exerciseId: string; exerciseName: string
  history: { date: string; maxLoad: number; volume: number }[]
}

type InsightsData = { weekPlans: WeekPlan[]; evolution: EvolutionEntry[] }

export function StudentTools({ studentId, studentName, studentPhone }: { studentId: string; studentName: string; studentPhone?: string | null }) {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<"preview" | "evolution" | null>(null)

  const fetchData = useCallback(async () => {
    if (data) return data
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}/insights`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        return d as InsightsData
      }
    } catch { /* ignore */ }
    setLoading(false)
    return null
  }, [studentId, data])

  const openModal = async (type: "preview" | "evolution") => {
    await fetchData()
    setLoading(false)
    setModal(type)
  }

  const handlePDF = async () => {
    const d = await fetchData()
    setLoading(false)
    if (!d) return
    generatePDF(d.weekPlans, studentName)
  }

  const openWhatsApp = () => {
    if (!studentPhone) return
    const clean = studentPhone.replace(/[\s\-\(\)]/g, "")
    const number = clean.startsWith("+") ? clean.slice(1) : clean.startsWith("55") ? clean : `55${clean}`
    window.open(`https://wa.me/${number}`, "_blank")
  }

  const [impersonating, setImpersonating] = useState(false)

  const handleImpersonate = async () => {
    setImpersonating(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}/impersonate`, { method: "POST" })
      const data = await res.json()
      if (res.ok && data.token) {
        window.open(`/impersonate?token=${data.token}`, "_blank")
      } else {
        alert(`Erro ao navegar como aluno: ${data.error || data.detail || res.status}`)
      }
    } catch (e) {
      alert(`Erro de conexão: ${e instanceof Error ? e.message : "tente novamente"}`)
    }
    setImpersonating(false)
  }

  return (
    <>
      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <ToolButton icon={Eye} label="Visão do Aluno" color="blue" onClick={() => openModal("preview")} loading={loading && modal === null} />
        <ToolButton icon={ExternalLink} label="Navegar como Aluno" color="blue" onClick={handleImpersonate} loading={impersonating} />
        <ToolButton icon={TrendingUp} label="Evolução" color="emerald" onClick={() => openModal("evolution")} loading={loading && modal === null} />
        <ToolButton icon={Download} label="Baixar PDF" color="amber" onClick={handlePDF} loading={loading && modal === null} />
        <ToolButton icon={MessageCircle} label={studentPhone ? "WhatsApp" : "Sem tel."} color="green" onClick={openWhatsApp} loading={false} />
      </div>

      {/* ═══ PREVIEW MODAL ═══ */}
      {modal === "preview" && data && (
        <ModalOverlay onClose={() => setModal(null)} title="Visão do Aluno" subtitle={studentName}>
          <StudentPreview plans={data.weekPlans} />
        </ModalOverlay>
      )}

      {/* ═══ EVOLUTION MODAL ═══ */}
      {modal === "evolution" && data && (
        <ModalOverlay onClose={() => setModal(null)} title="Evolução de Cargas" subtitle={studentName}>
          <LoadEvolution evolution={data.evolution} />
        </ModalOverlay>
      )}
    </>
  )
}

/* ═══ TOOL BUTTON ═══ */
function ToolButton({ icon: Icon, label, color, onClick, loading }: {
  icon: typeof Eye; label: string; color: "blue" | "emerald" | "amber" | "green"
  onClick: () => void; loading: boolean
}) {
  const colors = {
    blue: "from-blue-600/15 to-blue-800/5 border-blue-500/15 text-blue-400 hover:border-blue-500/30",
    emerald: "from-emerald-600/15 to-emerald-800/5 border-emerald-500/15 text-emerald-400 hover:border-emerald-500/30",
    amber: "from-amber-600/15 to-amber-800/5 border-amber-500/15 text-amber-400 hover:border-amber-500/30",
    green: "from-green-600/15 to-green-800/5 border-green-500/15 text-green-400 hover:border-green-500/30",
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-gradient-to-br border transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
    </button>
  )
}

/* ═══ MODAL OVERLAY ═══ */
function ModalOverlay({ onClose, title, subtitle, children }: {
  onClose: () => void; title: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl my-8 mx-4 rounded-2xl bg-[#0a0a0a] border border-white/[0.08] shadow-2xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.1] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70dvh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══ STUDENT PREVIEW — Phone mockup showing workouts ═══ */
function StudentPreview({ plans }: { plans: WeekPlan[] }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    if (plans.length === 0) return 0
    return plans[0].dayOfWeek
  })

  const currentPlan = plans.find(p => p.dayOfWeek === selectedDay)

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm">
        {/* Phone bezel */}
        <div className="rounded-[2rem] border-2 border-neutral-700 bg-[#050505] p-1.5 shadow-2xl shadow-black/50">
          <div className="flex justify-center mb-1">
            <div className="w-20 h-1.5 rounded-full bg-neutral-800" />
          </div>

          <div className="rounded-[1.5rem] bg-[#050505] overflow-hidden min-h-[500px]">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 py-2">
              <span className="text-[10px] text-neutral-400 font-medium">
                {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, "0")}
              </span>
              <Smartphone className="w-3 h-3 text-neutral-500" />
            </div>

            {/* Day selector */}
            <div className="flex gap-1 px-4 py-2">
              {Array.from({ length: 7 }, (_, i) => {
                const hasPlan = plans.some(p => p.dayOfWeek === i)
                const isSelected = i === selectedDay
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[8px] font-medium transition-all ${
                      isSelected
                        ? hasPlan ? "bg-red-600/15 border border-red-500/25 text-white" : "bg-blue-600/10 border border-blue-500/20 text-white"
                        : hasPlan ? "text-neutral-500 bg-white/[0.03] border border-transparent" : "text-neutral-700 border border-transparent"
                    }`}
                  >
                    {DAY_NAMES[i]}
                    {hasPlan && <div className="w-1 h-1 rounded-full bg-red-500" />}
                  </button>
                )
              })}
            </div>

            {/* Workout content */}
            <div className="px-4 py-3 space-y-3">
              {currentPlan ? (
                <>
                  <div className="text-center mb-3">
                    <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">{currentPlan.templateType}</p>
                    <h3 className="text-sm font-bold text-white">{currentPlan.templateName}</h3>
                    <p className="text-[9px] text-neutral-500">{currentPlan.exercises.length} exercícios</p>
                  </div>

                  {currentPlan.exercises.map((ex, i) => (
                    <div key={ex.id} className="flex gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-red-600/15 flex items-center justify-center text-[8px] font-bold text-red-400 shrink-0">{i + 1}</span>
                          <p className="text-[11px] font-semibold text-white truncate">{ex.name}</p>
                        </div>
                        <div className="mt-1 text-[9px] text-neutral-500 space-y-0.5">
                          <p>Séries: <span className="text-neutral-300">{ex.sets}×{ex.reps}</span>
                            {ex.loadKg ? <> · Carga: <span className="text-neutral-300">{ex.loadKg}kg</span></> : null}
                          </p>
                          {ex.instructions && (
                            <p className="text-neutral-600 line-clamp-2">{ex.instructions}</p>
                          )}
                        </div>
                      </div>
                      {ex.imageUrl ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-neutral-900">
                          <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-white/[0.06] bg-white/[0.02] shrink-0 flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-neutral-700" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 mx-auto mb-3 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xs text-neutral-400">Dia de descanso</p>
                  <p className="text-[10px] text-neutral-600">{DAY_NAMES_FULL[selectedDay]} — sem treino</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ LOAD EVOLUTION — Charts per exercise ═══ */
function LoadEvolution({ evolution }: { evolution: EvolutionEntry[] }) {
  const [selectedEx, setSelectedEx] = useState<string | null>(
    evolution.length > 0 ? evolution[0].exerciseId : null
  )

  const selected = evolution.find(e => e.exerciseId === selectedEx)

  if (evolution.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">Sem dados de evolução ainda</p>
        <p className="text-neutral-600 text-xs mt-1">Os gráficos aparecem após o aluno completar sessões</p>
      </div>
    )
  }

  const chartData = selected?.history.map(h => ({
    date: h.date.slice(5),
    kg: h.maxLoad,
  })) || []

  const firstLoad = selected?.history[0]?.maxLoad || 0
  const lastLoad = selected?.history[selected.history.length - 1]?.maxLoad || 0
  const progress = firstLoad > 0 ? Math.round(((lastLoad - firstLoad) / firstLoad) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="relative">
        <select
          value={selectedEx || ""}
          onChange={e => setSelectedEx(e.target.value)}
          className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white outline-none focus:border-neutral-600 appearance-none cursor-pointer [color-scheme:dark] [&>option]:bg-[#111] [&>option]:text-white"
        >
          {evolution.map(e => (
            <option key={e.exerciseId} value={e.exerciseId}>{e.exerciseName} ({e.history.length} sessões)</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      </div>

      {/* Stats */}
      {selected && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-white">{lastLoad}<span className="text-xs text-neutral-500">kg</span></p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Carga Atual</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold text-white">{firstLoad}<span className="text-xs text-neutral-500">kg</span></p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Inicial</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className={`text-lg font-bold ${progress > 0 ? "text-emerald-400" : progress < 0 ? "text-red-400" : "text-neutral-400"}`}>
              {progress > 0 ? "+" : ""}{progress}%
            </p>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Progresso</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-3">Carga Máxima (kg)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#999" }}
                itemStyle={{ color: "#ef4444" }}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: "#ef4444", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                name="Carga (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-neutral-500 text-sm">Precisa de pelo menos 2 sessões para gerar o gráfico</p>
        </div>
      )}
    </div>
  )
}

/* ═══ PDF GENERATOR — with exercise photos ═══ */
function generatePDF(plans: WeekPlan[], studentName: string) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const doc = printWindow.document
  doc.open()

  const style = doc.createElement("style")
  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 32px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
    .day-block { margin-bottom: 28px; page-break-inside: avoid; }
    .day-title { font-size: 14px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px; border-bottom: 2px solid #dc2626; margin-bottom: 12px; }
    .template-name { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .ex-card { display: flex; gap: 12px; padding: 10px; margin-bottom: 8px; border: 1px solid #eee; border-radius: 10px; page-break-inside: avoid; }
    .ex-card:nth-child(even) { background: #fafafa; }
    .ex-img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .ex-placeholder { width: 70px; height: 70px; border-radius: 8px; flex-shrink: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 24px; }
    .ex-info { flex: 1; min-width: 0; }
    .ex-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .ex-num { width: 22px; height: 22px; background: #dc2626; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .ex-name { font-weight: 600; font-size: 13px; }
    .ex-detail { color: #666; font-size: 11px; margin-top: 2px; }
    .ex-sets { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: #333; }
    .ex-sets-val { color: #dc2626; font-weight: 600; }
    .instructions { color: #888; font-size: 10px; margin-top: 4px; line-height: 1.4; }
    .footer { margin-top: 32px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 16px; } .ex-card { break-inside: avoid; } }
  `

  doc.close()
  doc.head.appendChild(style)
  doc.title = `Treino — ${studentName}`

  const body = doc.body

  const h1 = doc.createElement("h1")
  h1.textContent = "Programa de Treino"
  body.appendChild(h1)

  const sub = doc.createElement("p")
  sub.className = "subtitle"
  sub.textContent = `${studentName} · Gerado em ${new Date().toLocaleDateString("pt-BR")}`
  body.appendChild(sub)

  for (const p of plans) {
    const block = doc.createElement("div")
    block.className = "day-block"

    const dayTitle = doc.createElement("div")
    dayTitle.className = "day-title"
    dayTitle.textContent = DAY_NAMES_FULL[p.dayOfWeek]
    block.appendChild(dayTitle)

    const tName = doc.createElement("div")
    tName.className = "template-name"
    tName.textContent = p.templateName
    block.appendChild(tName)

    p.exercises.forEach((ex, i) => {
      const card = doc.createElement("div")
      card.className = "ex-card"

      // Exercise image
      if (ex.imageUrl) {
        const img = doc.createElement("img")
        img.className = "ex-img"
        img.src = ex.imageUrl
        img.alt = ex.name
        card.appendChild(img)
      } else {
        const ph = doc.createElement("div")
        ph.className = "ex-placeholder"
        ph.textContent = "\uD83C\uDFCB\uFE0F"
        card.appendChild(ph)
      }

      // Exercise info
      const info = doc.createElement("div")
      info.className = "ex-info"

      const header = doc.createElement("div")
      header.className = "ex-header"
      const num = doc.createElement("div")
      num.className = "ex-num"
      num.textContent = String(i + 1)
      header.appendChild(num)
      const name = doc.createElement("div")
      name.className = "ex-name"
      name.textContent = ex.name
      header.appendChild(name)
      info.appendChild(header)

      const detail = doc.createElement("div")
      detail.className = "ex-detail"
      detail.textContent = `${ex.muscle} · ${ex.equipment}${ex.technique !== "NORMAL" ? ` · ${ex.technique}` : ""}`
      info.appendChild(detail)

      // Sets info using safe DOM
      const sets = doc.createElement("div")
      sets.className = "ex-sets"

      const addSetInfo = (label: string, value: string) => {
        const span = doc.createElement("span")
        span.textContent = label + " "
        const strong = doc.createElement("span")
        strong.className = "ex-sets-val"
        strong.textContent = value
        span.appendChild(strong)
        sets.appendChild(span)
      }

      addSetInfo("Séries:", `${ex.sets}x${ex.reps}`)
      if (ex.loadKg) addSetInfo("Carga:", `${ex.loadKg}kg`)
      addSetInfo("Descanso:", `${ex.restSeconds}s`)
      info.appendChild(sets)

      if (ex.instructions) {
        const instrDiv = doc.createElement("div")
        instrDiv.className = "instructions"
        instrDiv.textContent = ex.instructions
        info.appendChild(instrDiv)
      }
      if (ex.notes) {
        const notesDiv = doc.createElement("div")
        notesDiv.className = "instructions"
        notesDiv.textContent = `\uD83D\uDCDD ${ex.notes}`
        info.appendChild(notesDiv)
      }

      card.appendChild(info)
      block.appendChild(card)
    })

    body.appendChild(block)
  }

  const footer = doc.createElement("div")
  footer.className = "footer"
  footer.textContent = "Victor Personal · Gerado automaticamente"
  body.appendChild(footer)

  // Wait for images to load before printing
  setTimeout(() => printWindow.print(), 1500)
}
