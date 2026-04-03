import { requireAuth } from "@/lib/auth"
import { getStudentProfile } from "@/lib/student"
import { checkFeature } from "@/lib/subscription"
import { redirect } from "next/navigation"
import { Lock, Crown, Sparkles, MessageSquare, Brain, Dumbbell, Apple, ArrowLeft } from "lucide-react"
import Link from "next/link"
import ChatClient from "./chat-client"

export default async function ChatPage() {
  const session = await requireAuth()
  if (session.role !== "STUDENT") redirect("/login")

  const student = await getStudentProfile(session.userId)
  const hasAI = await checkFeature(student.id, "hasAI")

  if (!hasAI) {
    return (
      <div className="flex flex-col h-[calc(100dvh-8rem)]">
        {/* Header — same style as chat */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/today"
            className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight">Assistente IA</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                <span className="text-[10px] text-neutral-500">Bloqueado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade prompt */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 px-4 max-w-sm">
            <div className="w-20 h-20 rounded-2xl bg-red-600/20 border border-red-500/20 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-red-400" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Chat com IA exclusivo dos planos Pro e Full
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Tire dúvidas sobre treino, nutrição e postura com inteligência artificial treinada pelo seu personal.
              </p>
            </div>

            <div className="bg-red-600/10 border border-red-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
                <Crown className="w-4 h-4" />
                O que você desbloqueia:
              </div>
              <ul className="text-sm text-neutral-400 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span>IA que conhece seu histórico de treinos, cargas e evolução</span>
                </li>
                <li className="flex items-start gap-2">
                  <Dumbbell className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Dúvidas sobre execução, séries, descanso e periodização</span>
                </li>
                <li className="flex items-start gap-2">
                  <Apple className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Orientações de nutrição e suplementação personalizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                  <span>Respostas instantâneas 24h por dia, 7 dias por semana</span>
                </li>
              </ul>
            </div>

            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:from-red-500 hover:to-red-600 active:scale-[0.97] transition-all shadow-lg shadow-red-900/30"
            >
              <Crown className="w-4 h-4" />
              Fazer Upgrade — R$34,90/mês
            </Link>

            <p className="text-[10px] text-neutral-600">
              Cancele a qualquer momento. Sem fidelidade.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <ChatClient />
}
