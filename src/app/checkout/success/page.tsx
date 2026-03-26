"use client"

import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { BRAND } from "@/lib/branding"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          Pagamento Confirmado!
        </h1>

        <p className="text-zinc-400">
          Sua assinatura foi ativada com sucesso! {BRAND.trainerFirstName} vai entrar em contato
          pelo WhatsApp para enviar suas credenciais de acesso e montar seu treino.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
          <h3 className="text-sm font-semibold text-zinc-300">Proximos passos:</h3>
          <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
            <li>{BRAND.trainerFirstName} vai te enviar login e senha pelo WhatsApp</li>
            <li>Acesse o app e faca login</li>
            <li>Altere sua senha no perfil</li>
            <li>Seu treino personalizado sera montado em ate 24h</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Acessar o App
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Voltar para o site
          </Link>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600">
            Duvidas? Fale com {BRAND.trainerFirstName} no WhatsApp: {BRAND.whatsappFormatted}
          </p>
        </div>
      </div>
    </div>
  )
}
