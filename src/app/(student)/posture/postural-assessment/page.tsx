import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Lock, Crown, PersonStanding, Camera, Activity, Zap, Shield } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const PosturalAssessmentWizard = dynamic(
  () => import("@/components/student/postural-assessment-wizard").then(m => ({ default: m.PosturalAssessmentWizard })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-2">
        <PersonStanding className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
        <p className="text-xs text-neutral-600">Carregando avaliação postural...</p>
      </div>
    </div>
  )}
)

export default async function PosturalAssessmentPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasPosture = await checkFeature(student.id, "hasPostureCamera")

  if (!hasPosture) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Avaliação Postural por IA</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Análise de 12 desvios posturais com inteligência artificial.
            Exclusivo do <span className="text-amber-400 font-semibold">plano Elite</span>.
          </p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-blue-300 text-sm font-semibold">
            <Crown className="w-4 h-4" />
            O que você ganha:
          </div>
          <ul className="text-sm text-neutral-400 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <Camera className="w-4 h-4 text-blue-500/70 shrink-0 mt-0.5" />
              <span>Avaliação postural completa por câmera (frontal + lateral)</span>
            </li>
            <li className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-500/70 shrink-0 mt-0.5" />
              <span><strong className="text-blue-300">12 desvios</strong> analisados: cifose, escoliose, lordose, joelhos, etc.</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-500/70 shrink-0 mt-0.5" />
              <span>Score postural 0-100 com exercícios corretivos personalizados</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-500/70 shrink-0 mt-0.5" />
              <span>Histórico de evolução — compare meses de progresso</span>
            </li>
          </ul>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 active:scale-[0.97] transition-all shadow-lg shadow-amber-600/20"
        >
          <Crown className="w-4 h-4" />
          Fazer upgrade para Elite
        </Link>
      </div>
    )
  }

  // Load history
  const history = await prisma.posturalAssessment.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      overallScore: true,
      severeCount: true,
      moderateCount: true,
      mildCount: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-3">
      <PosturalAssessmentWizard
        history={history.map(h => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
