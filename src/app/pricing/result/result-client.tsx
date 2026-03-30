"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react"

function ResultContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") || "unknown"

  if (status === "approved") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/30">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white">
          Assinatura Ativa!
        </h1>
        <p className="mb-8 text-neutral-400">
          Seu pagamento foi aprovado com sucesso. Voce ja pode acessar todos os
          recursos do seu plano.
        </p>
        <div className="space-y-3">
          <a
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
          >
            Acessar o App
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-neutral-600">
            Verifique seu email para receber as credenciais de acesso.
          </p>
        </div>
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/30">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white">
          Pagamento em Processamento
        </h1>
        <p className="mb-6 text-neutral-400">
          Seu pagamento esta sendo processado. Isso pode levar alguns minutos
          (Pix) ou ate 2 dias uteis (boleto).
        </p>
        <div className="mx-auto max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-300">
            O que fazer agora?
          </h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              Se pagou via Pix, a confirmacao e quase instantanea
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              Voce recebera um email quando o pagamento for confirmado
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              Nao e necessario pagar novamente
            </li>
          </ul>
        </div>
        <a
          href="/pricing"
          className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors"
        >
          Voltar para os planos
        </a>
      </div>
    )
  }

  // failure or unknown
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-2 ring-red-500/30">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="mb-2 text-3xl font-bold text-white">
        Pagamento nao Processado
      </h1>
      <p className="mb-8 text-neutral-400">
        Nao foi possivel processar seu pagamento. Isso pode acontecer por saldo
        insuficiente, dados incorretos ou problema temporario.
      </p>
      <div className="space-y-3">
        <a
          href="/pricing"
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar Novamente
        </a>
        <p className="text-xs text-neutral-600">
          Se o problema persistir, tente outro metodo de pagamento ou entre em
          contato pelo WhatsApp.
        </p>
      </div>
    </div>
  )
}

export function ResultClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-lg">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-red-500" />
            </div>
          }
        >
          <ResultContent />
        </Suspense>
      </div>
    </div>
  )
}
