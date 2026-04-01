import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { Lock, Crown, Dumbbell, Camera, Zap, Shield, Activity } from "lucide-react"
import Link from "next/link"
import { OverheadSquatLoader } from "@/components/student/overhead-squat-loader"

export default async function OverheadSquatPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasPosture = await checkFeature(student.id, "hasPostureCamera")

  if (!hasPosture) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-2xl bg-orange-600/20 flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Overhead Squat Assessment</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Protocolo NASM com análise por IA em tempo real.
            Exclusivo do <span className="text-amber-400 font-semibold">plano Elite</span>.
          </p>
        </div>
        <div className="bg-orange-600/10 border border-orange-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-300 text-sm font-semibold">
            <Crown className="w-4 h-4" />
            O que você ganha:
          </div>
          <ul className="text-sm text-neutral-400 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <Camera className="w-4 h-4 text-orange-500/70 shrink-0 mt-0.5" />
              <span>Análise em tempo real durante o agachamento</span>
            </li>
            <li className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-orange-500/70 shrink-0 mt-0.5" />
              <span><strong className="text-orange-300">5 checkpoints NASM</strong>: pés, joelhos, lombar, braços, calcanhares</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-orange-500/70 shrink-0 mt-0.5" />
              <span>Músculos hiperativos e hipoativos identificados</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-orange-500/70 shrink-0 mt-0.5" />
              <span>Exercícios corretivos personalizados por compensação</span>
            </li>
          </ul>
        </div>
        <Link href="/upgrade"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 active:scale-[0.97] transition-all shadow-lg shadow-amber-600/20">
          <Crown className="w-4 h-4" />
          Fazer upgrade para Elite
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <OverheadSquatLoader />
    </div>
  )
}
