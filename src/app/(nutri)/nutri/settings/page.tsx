"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Settings, Save, Check, AlertCircle, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface NutriProfileData {
  id: string
  name: string
  email: string
  bio: string
  crn: string
  specialty: string
  logo: string
  brandColor: string
  onboardingComplete: boolean
}

const PRESET_COLORS = [
  "#10b981", "#059669", "#14b8a6", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#eab308",
]

export default function NutriSettingsPage() {
  const [profile, setProfile] = useState<NutriProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  /* form state */
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [crn, setCrn] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [logo, setLogo] = useState("")
  const [brandColor, setBrandColor] = useState("#10b981")
  const [logoPreview, setLogoPreview] = useState("")

  /* ── fetch ── */
  useEffect(() => {
    fetch("/api/nutri/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile as NutriProfileData
          setProfile(p)
          setName(p.name)
          setEmail(p.email)
          setBio(p.bio)
          setCrn(p.crn)
          setSpecialty(p.specialty)
          setLogo(p.logo)
          setBrandColor(p.brandColor)
          if (p.logo) setLogoPreview(p.logo)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* ── save ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch("/api/nutri/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, crn, specialty, logo, brandColor }),
      })
      if (!res.ok) {
        const data = await res.json()
        setToast({ type: "error", message: data.error || "Erro ao salvar" })
        return
      }
      setToast({ type: "success", message: "Configuracoes salvas com sucesso!" })
      setTimeout(() => setToast(null), 4000)
    } catch {
      setToast({ type: "error", message: "Erro de conexao" })
    } finally {
      setSaving(false)
    }
  }

  /* ── logo file handler ── */
  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", message: "Logo deve ter no maximo 2MB" })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setLogoPreview(dataUrl)
      setLogo(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="h-16 rounded-2xl bg-white/[0.02] animate-pulse" />
        <div className="h-96 rounded-2xl bg-white/[0.02] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
              Configuracoes
            </h1>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
              Perfil e preferencias
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
            toast.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          )}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </motion.div>
      )}

      {/* ═══ FORM ═══ */}
      <motion.form
        onSubmit={handleSave}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="space-y-6"
      >
        {/* Profile section */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 space-y-5">
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-medium">
            Informacoes Pessoais
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* name */}
            <div>
              <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* email (readonly) */}
            <div>
              <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] text-neutral-600 text-sm cursor-not-allowed"
              />
            </div>

            {/* CRN */}
            <div>
              <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                CRN
              </label>
              <input
                type="text"
                value={crn}
                onChange={(e) => setCrn(e.target.value)}
                placeholder="Ex: CRN-3 12345"
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* specialty */}
            <div>
              <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
                Especialidade
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Nutricao Esportiva"
                className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* bio */}
          <div>
            <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale um pouco sobre voce e sua experiencia..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Brand section */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 space-y-5">
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-medium">
            Identidade Visual
          </p>

          {/* logo */}
          <div>
            <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-2">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logotipo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-5 h-5 text-neutral-700" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Escolher arquivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFile}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-neutral-700 mt-1.5">PNG, JPG ou SVG. Max 2MB.</p>
              </div>
            </div>
          </div>

          {/* brand color */}
          <div>
            <label className="block text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-2">
              Cor Principal
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBrandColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-xl border-2 transition-all duration-200 hover:scale-110",
                    brandColor === color
                      ? "border-white/60 ring-2 ring-white/20 scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              {/* custom color input */}
              <div className="relative">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                  title="Cor personalizada"
                />
                <div
                  className="w-8 h-8 rounded-xl border-2 border-dashed border-white/[0.15] flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  <span className="text-xs font-bold">+</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <div
                className="w-5 h-5 rounded-md border border-white/[0.1]"
                style={{ backgroundColor: brandColor }}
              />
              <span className="text-[11px] text-neutral-500 font-mono">{brandColor}</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Alteracoes"}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
