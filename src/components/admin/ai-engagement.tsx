"use client"

import { useState } from "react"
import {
  MessageSquare, Loader2, Send, Users, Clock,
  Sparkles, Copy, Check, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type EngagementMessage = {
  studentId: string
  studentName: string
  daysSince: number
  message: string
}

export function AIEngagement() {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<EngagementMessage[]>([])
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/ai/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "inactive" }),
      })

      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      } else {
        setError("Nenhum aluno precisa de mensagem no momento")
      }
    } catch {
      setError("Falha na conexao com IA")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate(studentId: string) {
    try {
      const res = await fetch("/api/admin/ai/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, type: "inactive" }),
      })

      const data = await res.json()
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.studentId === studentId ? { ...m, message: data.message } : m
          )
        )
      }
    } catch {
      // silently fail
    }
  }

  function handleCopy(studentId: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(studentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-800/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            Mensagens de Engajamento
          </h3>
        </div>

        <p className="text-neutral-500 text-sm mb-4">
          Gere mensagens motivacionais personalizadas para alunos que estao ha dias sem treinar.
        </p>

        <Button onClick={handleGenerate} disabled={loading} fullWidth>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando mensagens...
            </>
          ) : messages.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regerar Mensagens
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Mensagens
            </>
          )}
        </Button>

        {error && <p className="text-amber-400 text-sm text-center mt-3">{error}</p>}
      </div>

      {/* Messages List */}
      {messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.studentId}
              className="rounded-2xl border border-neutral-800 bg-[#111] p-4 hover:border-neutral-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-800/20 flex items-center justify-center text-amber-400 text-sm font-bold border border-amber-500/10">
                    {msg.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{msg.studentName}</p>
                    <p className="text-neutral-600 text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {msg.daysSince} dias sem treinar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRegenerate(msg.studentId)}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                    title="Regerar"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCopy(msg.studentId, msg.message)}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                    title="Copiar"
                  >
                    {copiedId === msg.studentId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-xl p-3 border border-neutral-800/50">
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
