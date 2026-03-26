"use client"

import { Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutPendingPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          Pagamento pendente
        </h1>

        <p className="text-zinc-400">
          Seu pagamento está sendo processado. Assim que for confirmado,
          sua conta será ativada automaticamente e você receberá um email
          com as credenciais de acesso.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
          <h3 className="text-sm font-semibold text-zinc-300">PIX ou boleto?</h3>
          <p className="text-sm text-zinc-400">
            Pagamentos via PIX sao confirmados em segundos. Boletos podem levar
            ate 2 dias uteis para compensar.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Voltar ao site
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            Duvidas? Fale com Victor no WhatsApp: (85) 9.9698-5823
          </p>
        </div>
      </div>
    </div>
  )
}
