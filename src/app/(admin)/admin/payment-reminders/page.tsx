"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Bell, Send, AlertTriangle, DollarSign, Clock,
  User, Zap, CheckCircle, RefreshCw, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

type OverduePayment = {
  id: string
  studentName: string
  studentEmail: string
  studentPhone: string | null
  amount: number
  dueDate: string
  daysOverdue: number
  method: string
  lastReminder: { id: string; sentAt: string; message: string } | null
}

export default function PaymentRemindersPage() {
  const [payments, setPayments] = useState<OverduePayment[]>([])
  const [totalOverdue, setTotalOverdue] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [autoSending, setAutoSending] = useState(false)
  const [customMessage, setCustomMessage] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payment-reminders")
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
        setTotalOverdue(data.totalOverdue)
        setTotalAmount(data.totalAmount)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function sendReminder(paymentId: string) {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return
    setSending(paymentId)

    const message = customMessage[paymentId] ||
      `Oi ${payment.studentName.split(" ")[0]}! 👋 Seu pagamento de R$ ${payment.amount.toFixed(2)} venceu há ${payment.daysOverdue} dias. Regularize para continuar aproveitando o app! 💪`

    try {
      await fetch("/api/admin/payment-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, channel: "APP", message }),
      })
      fetchData()
    } catch { /* ignore */ }
    setSending(null)
  }

  async function sendAutoReminders() {
    setAutoSending(true)
    try {
      const res = await fetch("/api/admin/payment-reminders", { method: "PUT" })
      if (res.ok) {
        const data = await res.json()
        alert(`Enviados: ${data.sent} | Já lembrados: ${data.skipped} | Total atrasados: ${data.total}`)
        fetchData()
      }
    } catch { /* ignore */ }
    setAutoSending(false)
  }

  return (
    <div className="space-y-6">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Cobranças
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Lembretes automáticos para pagamentos atrasados</p>
        </div>
        <button
          onClick={sendAutoReminders}
          disabled={autoSending || payments.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-amber-600/20 disabled:opacity-40"
        >
          {autoSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Cobrar Todos
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 mb-2" />
          <p className="text-2xl font-black text-red-400">{totalOverdue}</p>
          <p className="text-[10px] text-neutral-500">Pagamentos atrasados</p>
        </div>
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4">
          <DollarSign className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-black text-amber-400">R$ {totalAmount.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500">Total a receber</p>
        </div>
      </div>

      {/* Payment list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
          <p className="text-green-400 text-sm font-medium">Nenhum pagamento atrasado!</p>
          <p className="text-neutral-600 text-xs mt-1">Todos os alunos estão em dia 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const isSending = sending === p.id
            const severity = p.daysOverdue > 30 ? "critical" : p.daysOverdue > 14 ? "warning" : "mild"

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-xl border p-4 space-y-3",
                  severity === "critical" ? "bg-red-500/5 border-red-500/20" :
                  severity === "warning" ? "bg-amber-500/5 border-amber-500/20" :
                  "bg-white/[0.02] border-white/[0.06]"
                )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center text-red-300 text-[10px] font-bold">
                      {p.studentName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.studentName}</p>
                      <p className="text-[10px] text-neutral-500">{p.studentEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">R$ {p.amount.toFixed(2)}</p>
                    <p className={cn(
                      "text-[10px] font-semibold",
                      severity === "critical" ? "text-red-400" : severity === "warning" ? "text-amber-400" : "text-neutral-400"
                    )}>
                      {p.daysOverdue} dias atrasado
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Vencimento: {new Date(p.dueDate).toLocaleDateString("pt-BR")}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{p.method}</span>
                </div>

                {p.lastReminder && (
                  <div className="rounded-lg bg-white/[0.03] px-3 py-2 text-[10px] text-neutral-400">
                    <span className="text-neutral-500">Último lembrete:</span> {new Date(p.lastReminder.sentAt).toLocaleDateString("pt-BR")} — &quot;{p.lastReminder.message.slice(0, 60)}...&quot;
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Mensagem personalizada (opcional)"
                    value={customMessage[p.id] || ""}
                    onChange={e => setCustomMessage({ ...customMessage, [p.id]: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 min-h-[44px]"
                  />
                  <button
                    onClick={() => sendReminder(p.id)}
                    disabled={isSending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-amber-600/20 disabled:opacity-40 shrink-0"
                  >
                    {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Cobrar
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
