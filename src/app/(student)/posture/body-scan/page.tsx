import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Scan, Lock, Crown, Activity, Clock, ChevronRight, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BodyScanLoader } from "@/components/student/body-scan-loader"
import { ScanEvolutionChart } from "@/components/student/scan-evolution-chart"
import Link from "next/link"

const SHAPE_LABELS: Record<string, string> = {
  V_SHAPE: "Formato V",
  TRAPEZOID: "Trapezoide",
  X_SHAPE: "Formato X",
  RECTANGLE: "Retângulo",
  PEAR: "Formato Pera",
}

const SHAPE_COLORS: Record<string, string> = {
  V_SHAPE: "text-red-400",
  TRAPEZOID: "text-amber-400",
  X_SHAPE: "text-purple-400",
  RECTANGLE: "text-blue-400",
  PEAR: "text-green-400",
}

function DeltaBadge({ current, previous, lowerIsBetter = false }: {
  current: number
  previous: number
  lowerIsBetter?: boolean
}) {
  const diff = current - previous
  const pct = previous !== 0 ? ((diff / previous) * 100).toFixed(1) : "0"
  const improved = lowerIsBetter ? diff < 0 : diff > 0
  const neutral = Math.abs(diff) < 0.01

  if (neutral) return <Minus className="w-3.5 h-3.5 text-neutral-500" />
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-bold ${improved ? "text-green-400" : "text-red-400"}`}>
      {improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {diff > 0 ? "+" : ""}{pct}%
    </span>
  )
}

export default async function BodyScanPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasPosture = await checkFeature(student.id, "hasPostureCamera")

  if (!hasPosture) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 rounded-2xl bg-amber-600/20 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Avaliação Corporal IA</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Análise de proporções corporais por câmera cruzada com seus objetivos.
              Exclusivo do <span className="text-amber-400 font-semibold">plano Elite</span>.
            </p>
          </div>
          <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-4 space-y-2 text-left">
            {[
              "IA detecta ombros, quadril, pernas em tempo real",
              "Coach IA analisa suas proporções + objetivos da anamnese",
              "Diz exatamente o que falta e quais músculos focar",
              "Histórico de scans + gráfico de evolução das proporções",
              "Diagnóstico diário baseado no último scan",
            ].map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-neutral-400">
                <ChevronRight className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 active:scale-[0.97] transition-all shadow-lg shadow-amber-600/20"
          >
            <Crown className="w-4 h-4" />
            Fazer upgrade para Elite
          </Link>
        </div>
      </div>
    )
  }

  // Load all scan history (up to 20 for chart)
  const scans = await prisma.bodyScan.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const latestScan = scans[0] ?? null
  const previousScan = scans[1] ?? null

  // Chart data (oldest first)
  const chartData = [...scans].reverse().map(s => ({
    date: new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    shoulderHip: (s.ratios as Record<string, number>).shoulderHip ?? 0,
    waistHip: (s.ratios as Record<string, number>).waistHip ?? 0,
  }))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Scan className="w-5 h-5 text-red-400" />
            Avaliação Corporal IA
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Posicione-se a ~2m • corpo inteiro visível • roupas ajustadas
          </p>
        </div>
        <Link href="/posture" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Postura
        </Link>
      </div>

      {/* ── Foco de Hoje ─────────────────────────────────────────────────── */}
      {latestScan?.aiAnalysis && (
        <div className="bg-gradient-to-br from-red-950/50 to-zinc-900/60 border border-red-600/25 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600/25 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              </div>
              <p className="text-xs font-bold text-red-300">Diagnóstico do Coach</p>
            </div>
            <p className="text-[10px] text-neutral-600">
              Scan {new Date(latestScan.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <p className="text-sm text-neutral-200 leading-relaxed">{latestScan.aiAnalysis}</p>

          {/* Current shape badge */}
          {latestScan.bodyShape && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <Activity className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-[10px] text-neutral-500">Formato atual:</span>
              <span className={`text-[10px] font-semibold ${SHAPE_COLORS[latestScan.bodyShape] ?? "text-neutral-400"}`}>
                {SHAPE_LABELS[latestScan.bodyShape] ?? latestScan.bodyShape}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Comparison with previous scan ────────────────────────────────── */}
      {latestScan && previousScan && (() => {
        const curr = latestScan.ratios as Record<string, number>
        const prev = previousScan.ratios as Record<string, number>
        return (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Evolução desde o último scan
              <span className="text-neutral-600 font-normal ml-auto">
                {Math.round((new Date(latestScan.createdAt).getTime() - new Date(previousScan.createdAt).getTime()) / 86400000)} dias
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Ombro/Quadril", key: "shoulderHip", lower: false },
                { label: "Ombro/Cintura", key: "shoulderWaist", lower: false },
                { label: "Cintura/Quadril", key: "waistHip", lower: true },
                { label: "Perna/Tronco", key: "legTorso", lower: false },
              ].map(({ label, key, lower }) => (
                <div key={key} className="bg-white/[0.02] rounded-xl p-2.5 space-y-0.5">
                  <p className="text-[10px] text-neutral-600">{label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white">{curr[key]?.toFixed(2) ?? "—"}</span>
                    <DeltaBadge current={curr[key] ?? 0} previous={prev[key] ?? 0} lowerIsBetter={lower} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── Evolution chart ───────────────────────────────────────────────── */}
      {chartData.length >= 2 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Evolução das proporções
          </p>
          <ScanEvolutionChart data={chartData} />
          <div className="flex items-center gap-4 text-[10px] text-neutral-600">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-red-500 rounded" />Ombro/Quadril</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-blue-500 rounded" />Cintura/Quadril</div>
          </div>
        </div>
      )}

      {/* ── New scan section ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
          <Scan className="w-3.5 h-3.5" />
          {latestScan ? "Novo scan" : "Primeiro scan"}
        </p>
        <BodyScanLoader
          weight={student.weight ?? undefined}
          height={student.height ?? undefined}
          gender={student.gender ?? undefined}
          birthDate={student.birthDate?.toISOString() ?? undefined}
        />
      </div>

      {/* ── History ───────────────────────────────────────────────────────── */}
      {scans.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Histórico ({scans.length} scans)
          </p>
          <div className="space-y-2">
            {scans.slice(0, 5).map((scan, i) => {
              const r = scan.ratios as Record<string, number>
              return (
                <div
                  key={scan.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-red-600/15" : "bg-white/[0.03]"}`}>
                      <Activity className={`w-4 h-4 ${i === 0 ? "text-red-400" : "text-neutral-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white">
                          {scan.bodyShape ? SHAPE_LABELS[scan.bodyShape] ?? scan.bodyShape : "Scan"}
                        </p>
                        {i === 0 && (
                          <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(scan.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[10px] text-neutral-600">Ombro/Quadril</p>
                    <p className="text-xs font-mono text-neutral-300">{r.shoulderHip?.toFixed(2) ?? "—"}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
