"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { FadeIn } from "@/components/ui/motion"

// ═══════════════════════════════════════
// Color options
// ═══════════════════════════════════════
const COLOR_OPTIONS = [
  { name: "Vermelho", value: "#dc2626" },
  { name: "Azul", value: "#2563eb" },
  { name: "Verde", value: "#16a34a" },
  { name: "Roxo", value: "#9333ea" },
  { name: "Laranja", value: "#ea580c" },
  { name: "Dourado", value: "#ca8a04" },
]

const STEP_LABELS = ["Identidade", "Visual", "Primeiros Alunos"]

// ═══════════════════════════════════════
// Progress dots
// ═══════════════════════════════════════
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEP_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < step
                  ? "bg-red-500 scale-100"
                  : i === step
                    ? "bg-white scale-110 ring-2 ring-red-500/50"
                    : "bg-white/20 scale-100"
              }`}
            />
            <span
              className={`text-[11px] font-medium transition-colors duration-300 ${
                i <= step ? "text-white/80" : "text-white/30"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`w-12 h-px transition-colors duration-300 -mt-5 ${
                i < step ? "bg-red-500/60" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════
// Main Onboarding Page
// ═══════════════════════════════════════
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form state
  const [gymName, setGymName] = useState("")
  const [trainerName, setTrainerName] = useState("")
  const [cref, setCref] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoPreview, setLogoPreview] = useState("")
  const [brandColor, setBrandColor] = useState("#dc2626")
  const [uploading, setUploading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  // Pre-fill trainer name from settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.name) setTrainerName(data.user.name)
        if (data.profile?.cref) setCref(data.profile.cref)
        if (data.profile?.brandColor) setBrandColor(data.profile.brandColor)
        if (data.profile?.logo) {
          setLogoUrl(data.profile.logo)
          setLogoPreview(data.profile.logo)
        }
      })
      .catch(() => {})
  }, [])

  // ─── Logo upload ───
  async function handleLogoUpload(file: File) {
    setUploading(true)
    try {
      const { upload } = await import("@vercel/blob/client")
      const blob = await upload(`logos/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })
      setLogoUrl(blob.url)
      setLogoPreview(blob.url)
    } catch {
      // Fallback to base64
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setLogoUrl(result)
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  // ─── Save all and complete ───
  async function handleComplete(redirectTo?: string) {
    setSaving(true)
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trainerName,
          cref,
          logo: logoUrl || undefined,
          brandColor,
          gymName: gymName || undefined,
          onboardingComplete: true,
        }),
      })
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.push("/admin/dashboard")
      }
    } catch {
      setSaving(false)
    }
  }

  const canAdvanceStep1 = trainerName.trim().length > 0

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative">
      {/* Background overlay for onboarding — darker for readability */}
      <div className="fixed inset-0 bg-black/40 z-0" />

      <div className="w-full max-w-lg relative z-10">
        <FadeIn direction="none">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight font-[family-name:var(--font-geist-sans)]">
              Bem-vindo ao seu app
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Vamos configurar tudo em 3 passos rápidos
            </p>
          </div>

          {/* Progress */}
          <ProgressBar step={step} />
        </FadeIn>

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 1: Identidade ═══ */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-lg font-semibold text-white mb-6">
                  Identidade
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">
                      Nome da academia
                    </label>
                    <input
                      type="text"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="Ex: Victor Personal"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">
                      Seu nome <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      placeholder="Ex: Victor Oliveira"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">
                      CREF
                    </label>
                    <input
                      type="text"
                      value={cref}
                      onChange={(e) => setCref(e.target.value)}
                      placeholder="Ex: 123456-G/CE"
                      className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  disabled={!canAdvanceStep1}
                  className="mt-8 w-full py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Próximo
                </button>
              </motion.div>
            )}

            {/* ═══ STEP 2: Visual ═══ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-lg font-semibold text-white mb-6">
                  Visual
                </h2>

                {/* Logo upload */}
                <div className="mb-6">
                  <label className="block text-sm text-white/60 mb-3">
                    Logo da academia
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/[0.12] bg-white/[0.04] flex items-center justify-center hover:border-white/20 transition-colors overflow-hidden shrink-0"
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logotipo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : uploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg
                          className="w-6 h-6 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="text-sm text-white/40">
                      JPG, PNG ou WebP
                      <br />
                      Recomendado: 256x256
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                    }}
                  />
                </div>

                {/* Brand color */}
                <div className="mb-6">
                  <label className="block text-sm text-white/60 mb-3">
                    Cor primária
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setBrandColor(c.value)}
                        title={c.name}
                        className={`w-10 h-10 rounded-full transition-all duration-200 ${
                          brandColor === c.value
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#111] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-8">
                  <p className="text-xs text-white/40 mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    )}
                    <span
                      className="text-lg font-bold"
                      style={{ color: brandColor }}
                    >
                      {gymName || trainerName || "Sua Academia"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 py-3 rounded-xl font-semibold text-white/60 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-all"
                  >
                    Próximo
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 3: Primeiros Alunos ═══ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-lg font-semibold text-white mb-2">
                  Primeiros Alunos
                </h2>
                <p className="text-sm text-white/40 mb-6">
                  Como deseja adicionar seus alunos?
                </p>

                <div className="space-y-3 mb-8">
                  {/* Option 1 */}
                  <button
                    onClick={() => handleComplete("/admin/students")}
                    disabled={saving}
                    className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          Cadastrar manualmente
                        </p>
                        <p className="text-white/40 text-xs">
                          Adicione alunos um por um
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Option 2 */}
                  <button
                    onClick={() => handleComplete("/admin/import")}
                    disabled={saving}
                    className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          Importar do MFIT
                        </p>
                        <p className="text-white/40 text-xs">
                          Traga seus alunos de outro app
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Option 3 */}
                  <button
                    onClick={() => handleComplete()}
                    disabled={saving}
                    className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-white/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          Fazer depois
                        </p>
                        <p className="text-white/40 text-xs">
                          Ir direto para o painel
                        </p>
                      </div>
                      <svg
                        className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl font-semibold text-white/60 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                  >
                    Voltar
                  </button>
                </div>

                {saving && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-white/50 text-sm">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
