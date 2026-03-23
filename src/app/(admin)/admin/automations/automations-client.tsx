"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Zap, Cake, UserMinus, CreditCard, Dumbbell,
  Play, CheckCircle, AlertCircle, Loader2, MessageCircle,
} from "lucide-react"

type AutomationType = "birthday" | "inactive" | "payment_due" | "workout_reminder"

type Result = {
  sent: number
  failed: number
  students: string[]
}

const AUTOMATIONS: {
  id: AutomationType
  title: string
  description: string
  icon: typeof Zap
  color: string
  iconColor: string
}[] = [
  {
    id: "workout_reminder",
    title: "Lembrete de Treino",
    description: "Envia mensagem para alunos que tem treino hoje mas ainda nao comecaram",
    icon: Dumbbell,
    color: "from-red-600/15 to-red-800/5 border-red-500/15",
    iconColor: "text-red-400",
  },
  {
    id: "birthday",
    title: "Aniversariantes do Dia",
    description: "Envia parabens automatico para alunos que fazem aniversario hoje",
    icon: Cake,
    color: "from-purple-600/15 to-purple-800/5 border-purple-500/15",
    iconColor: "text-purple-400",
  },
  {
    id: "inactive",
    title: "Resgate de Inativos",
    description: "Envia mensagem para alunos que nao treinam ha 7+ dias",
    icon: UserMinus,
    color: "from-yellow-600/15 to-yellow-800/5 border-yellow-500/15",
    iconColor: "text-yellow-400",
  },
  {
    id: "payment_due",
    title: "Cobranca Pendente",
    description: "Lembra alunos com pagamentos atrasados gentilmente",
    icon: CreditCard,
    color: "from-green-600/15 to-green-800/5 border-green-500/15",
    iconColor: "text-green-400",
  },
]

export function AutomationsClient() {
  const [running, setRunning] = useState<AutomationType | null>(null)
  const [results, setResults] = useState<Record<string, Result>>({})

  async function runAutomation(type: AutomationType) {
    setRunning(type)
    try {
      const res = await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        const data = await res.json()
        setResults(prev => ({ ...prev, [type]: data.results }))
      }
    } catch { /* ignore */ }
    setRunning(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-red-400" />
          Automacoes WhatsApp
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Envie mensagens automaticas via WhatsApp + notificacao no app
        </p>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-green-400" />
        <div className="flex-1">
          <p className="text-sm text-white">WhatsApp Cloud API (Meta Oficial)</p>
          <p className="text-[10px] text-neutral-500">Gratuito ate 1.000 msgs/mes. Nao cai.</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AUTOMATIONS.map((auto, i) => {
          const result = results[auto.id]
          const isRunning = running === auto.id

          return (
            <motion.div
              key={auto.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border bg-gradient-to-br p-5 space-y-4 ${auto.color}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${auto.iconColor}`}>
                  <auto.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{auto.title}</h3>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{auto.description}</p>
                </div>
              </div>

              {result && (
                <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 space-y-1">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" /> {result.sent} enviados
                    </span>
                    {result.failed > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" /> {result.failed} falhas
                      </span>
                    )}
                  </div>
                  {result.students.length > 0 ? (
                    <p className="text-[10px] text-neutral-500 truncate">
                      {result.students.join(", ")}
                    </p>
                  ) : (
                    <p className="text-[10px] text-neutral-500">Nenhum aluno nesta automacao</p>
                  )}
                </div>
              )}

              <button
                onClick={() => runAutomation(auto.id)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] border border-white/[0.06] text-white text-xs font-semibold hover:bg-white/[0.1] transition-colors min-h-[44px] disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRunning ? "Executando..." : "Executar agora"}
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
        <p className="text-[11px] text-neutral-600 leading-relaxed">
          Cada mensagem e personalizada com o nome do aluno. WhatsApp + notificacao no app.
          Para automatizar diariamente, configure um cron job externo chamando POST /api/admin/automations.
        </p>
      </div>
    </div>
  )
}
