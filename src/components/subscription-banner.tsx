"use client"

import { AlertTriangle, Clock, CreditCard, Lock, Users, X } from "lucide-react"
import { useState } from "react"

export interface SubscriptionBannerProps {
  warnings: string[]
  isTrialEndingSoon?: boolean
  isPastDue?: boolean
  daysRemaining?: number
  pastDueGraceDaysLeft?: number
  studentCount?: number
  professionalCount?: number
  maxStudents?: number
  maxProfessionals?: number
}

export function SubscriptionBanner({
  warnings,
  isTrialEndingSoon,
  isPastDue,
  daysRemaining,
  pastDueGraceDaysLeft,
  studentCount,
  professionalCount,
  maxStudents,
  maxProfessionals,
}: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || warnings.length === 0) return null

  // Determine banner type for styling
  const isStudentLimit = studentCount !== undefined && maxStudents !== undefined && studentCount >= maxStudents
  const isProfessionalLimit = professionalCount !== undefined && maxProfessionals !== undefined && professionalCount >= maxProfessionals

  // Priority: past due > trial ending > limits
  let variant: string = "amber"
  let Icon = AlertTriangle
  let title = ""

  if (isPastDue) {
    variant = "amber"
    Icon = CreditCard
    title = `Pagamento pendente${pastDueGraceDaysLeft !== undefined ? ` — ${pastDueGraceDaysLeft} dia${pastDueGraceDaysLeft !== 1 ? "s" : ""} restantes` : ""}`
  } else if (isTrialEndingSoon) {
    variant = "amber"
    Icon = Clock
    title = `Periodo de teste expira em ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}`
  } else if (isStudentLimit || isProfessionalLimit) {
    variant = "amber"
    Icon = Users
    title = isStudentLimit
      ? `Limite de alunos atingido (${studentCount}/${maxStudents})`
      : `Limite de profissionais atingido (${professionalCount}/${maxProfessionals})`
  } else {
    // Generic warning
    title = warnings[0]
  }

  const bgColor = variant === "red"
    ? "bg-red-600/95"
    : "bg-amber-600/95"

  const textColor = variant === "red"
    ? "text-red-100"
    : "text-amber-100"

  return (
    <div className={`${bgColor} backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3 rounded-lg mb-4`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-5 h-5 text-white shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          {warnings.length > 1 && (
            <p className={`text-xs ${textColor} mt-0.5`}>
              {warnings.slice(1).join(" ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(isTrialEndingSoon || isPastDue) && (
          <a
            href="/admin/settings?tab=billing"
            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all whitespace-nowrap"
          >
            {isPastDue ? "Regularizar" : "Assinar agora"}
          </a>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-all"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Full-page restriction overlay for blocked accounts.
 * Used when checkOrgAccess returns allowed: false.
 */
export function SubscriptionRestrictionPage({
  reason,
  reasonCode,
  orgName,
  planName,
}: {
  reason: string
  reasonCode?: string
  orgName?: string
  planName?: string
}) {
  const isSuspended = reasonCode === "SUSPENDED"
  const isCancelled = reasonCode === "CANCELLED"
  const isTrialExpired = reasonCode === "TRIAL_EXPIRED"
  const isExpired = reasonCode === "EXPIRED"
  const isPastDueEnded = reasonCode === "PAST_DUE_GRACE_ENDED"
  const isNoSub = reasonCode === "NO_SUBSCRIPTION"

  return (
    <div className="min-h-[100dvh] bg-[#060606] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Locked icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-violet-600/20 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-violet-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          {isSuspended && "Conta Suspensa"}
          {isCancelled && "Conta Cancelada"}
          {isTrialExpired && "Periodo de Teste Expirado"}
          {isExpired && "Assinatura Expirada"}
          {isPastDueEnded && "Pagamento Pendente"}
          {isNoSub && "Sem Assinatura"}
        </h1>

        {/* Organization name */}
        {orgName && (
          <p className="text-sm text-zinc-400 mb-4">{orgName}</p>
        )}

        {/* Reason */}
        <p className="text-zinc-300 mb-6 leading-relaxed">{reason}</p>

        {/* Current plan info */}
        {planName && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Plano atual</p>
            <p className="text-lg font-semibold text-violet-400">{planName}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          {(isTrialExpired || isExpired || isNoSub || isPastDueEnded) && (
            <a
              href="/admin/settings?tab=billing"
              className="block w-full px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all"
            >
              {isTrialExpired || isNoSub ? "Escolher um plano" : "Renovar assinatura"}
            </a>
          )}

          {(isSuspended || isCancelled) && (
            <a
              href="mailto:contato@victorapp.com.br?subject=Reativar conta"
              className="block w-full px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all"
            >
              Entrar em contato
            </a>
          )}

          <a
            href="/login"
            className="block w-full px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-all"
          >
            Voltar ao login
          </a>
        </div>

        {/* Footer note */}
        <p className="text-xs text-zinc-600 mt-8">
          Precisa de ajuda? Fale com o suporte via WhatsApp ou email.
        </p>
      </div>
    </div>
  )
}
