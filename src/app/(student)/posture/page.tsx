import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { Camera, Lock, Crown } from "lucide-react"
import { PostureLoader } from "@/components/student/posture-loader"
import Link from "next/link"

export default async function PosturePage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasPosture = await checkFeature(student.id, "hasPostureCamera")

  if (!hasPosture) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center space-y-6 py-12">
          <div className="w-20 h-20 rounded-2xl bg-amber-600/20 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">Correcao de Postura</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              A analise de postura em tempo real por camera e uma feature exclusiva do
              <span className="text-amber-400 font-semibold"> plano Elite</span>.
            </p>
          </div>

          <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Crown className="w-4 h-4" />
              Plano Elite inclui:
            </div>
            <ul className="text-sm text-neutral-400 space-y-1.5 text-left">
              <li>• Correcao de postura por camera em tempo real</li>
              <li>• 33 pontos do corpo detectados pela IA</li>
              <li>• Feedback visual instantaneo (verde/amarelo/vermelho)</li>
              <li>• 3 exercicios: Agachamento, Rosca, Prancha</li>
              <li>• Mais exercicios em breve!</li>
            </ul>
          </div>

          <Link
            href="/#planos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Fazer upgrade para Elite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-400" />
          Correcao de Postura
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Selecione o exercicio, posicione-se de lado e clique para analisar.
        </p>
      </div>

      <PostureLoader />
    </div>
  )
}
