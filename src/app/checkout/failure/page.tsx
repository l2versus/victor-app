"use client"

import { XCircle, RefreshCw, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          Pagamento nao aprovado
        </h1>

        <p className="text-zinc-400">
          Houve um problema com seu pagamento. Voce pode tentar novamente
          ou entrar em contato com Victor.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/#planos"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Link>

          <a
            href="https://wa.me/5585996985823?text=Oi%20Victor!%20Tive%20um%20problema%20no%20pagamento%20do%20app."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com Victor no WhatsApp
          </a>

          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
