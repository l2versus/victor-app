import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { Camera, Lock, Crown, Zap, Shield, Eye, Activity, Scan, PersonStanding, ChevronRight } from "lucide-react"
import { PostureLoader } from "@/components/student/posture-loader"
import { TOTAL_EXERCISES_WITH_POSTURE, ALL_EXERCISE_GROUPS as EXERCISE_GROUPS } from "@/lib/posture-rules-all"
import Link from "next/link"

export default async function PosturePage({ searchParams }: { searchParams: Promise<{ exercise?: string }> }) {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")
  const params = await searchParams
  const initialExercise = params.exercise || null

  const student = await getStudentProfile(session.userId)
  const hasPosture = await checkFeature(student.id, "hasPostureCamera")

  if (!hasPosture) {
    return (
      <div>
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 rounded-2xl bg-amber-600/20 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">Correção de Postura por IA</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Análise biomecânica em tempo real com inteligência artificial.
              Exclusivo do <span className="text-amber-400 font-semibold">plano Elite</span>.
            </p>
          </div>

          <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Crown className="w-4 h-4" />
              O que você ganha no Elite:
            </div>
            <ul className="text-sm text-neutral-400 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span>Análise corporal com IA em tempo real pelo Victor App</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span><strong className="text-amber-300">{TOTAL_EXERCISES_WITH_POSTURE} exercícios</strong> com regras biomecânicas profissionais</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span>Feedback visual instantâneo (verde / amarelo / vermelho)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span>Prevenção de lesões — correção baseada em fisiologia do exercício</span>
              </li>
              <li className="flex items-start gap-2">
                <Camera className="w-4 h-4 text-amber-500/70 shrink-0 mt-0.5" />
                <span>100% offline após carregar — nenhuma imagem sai do seu celular</span>
              </li>
            </ul>
          </div>

          {/* Muscle groups preview */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {EXERCISE_GROUPS.map(g => (
              <span
                key={g.id}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-neutral-500 border border-white/5"
              >
                {g.icon} {g.label} ({g.exercises.length})
              </span>
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

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-400" />
          Correção de Postura
        </h1>
        <p className="text-[11px] text-neutral-500 mt-1">
          {TOTAL_EXERCISES_WITH_POSTURE} exercícios • Selecione, posicione-se e clique para analisar.
        </p>
      </div>

      {/* Body Scan link */}
      <Link
        href="/posture/body-scan"
        className="flex items-center justify-between p-3 rounded-xl bg-red-600/[0.06] border border-red-500/15 hover:bg-red-600/[0.10] active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
            <Scan className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Avaliação Corporal IA</p>
            <p className="text-[10px] text-neutral-500">Análise de proporções por câmera</p>
          </div>
        </div>
        <Activity className="w-4 h-4 text-neutral-600" />
      </Link>

      {/* Postural Assessment link */}
      <Link
        href="/posture/postural-assessment"
        className="flex items-center justify-between p-3 rounded-xl bg-blue-600/[0.06] border border-blue-500/15 hover:bg-blue-600/[0.10] active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <PersonStanding className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Avaliação Postural</p>
            <p className="text-[10px] text-neutral-500">12 desvios analisados • frontal + lateral</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-600" />
      </Link>

      <PostureLoader initialExercise={initialExercise} />
    </div>
  )
}
