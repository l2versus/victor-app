"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User, Mail, Phone, Calendar, Ruler, Weight, Target, Globe,
  AlertTriangle, LogOut, Dumbbell, Activity, Clock, Edit3, Check, X,
  Crown, Lock, MapPin, ChevronRight, Eye, EyeOff, Loader2,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PushNotificationToggle } from "@/components/student/push-notification-toggle"

/* ═══════════════════════════════════════ */
/*  Types                                 */
/* ═══════════════════════════════════════ */

interface Address {
  street: string | null
  number: string | null
  comp: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zip: string | null
}

interface ProfileProps {
  student: {
    id: string
    name: string
    email: string
    phone: string | null
    birthDate: string | null
    gender: string | null
    weight: number | null
    height: number | null
    goals: string | null
    restrictions: string | null
    memberSince: string
    address: Address
  }
  stats: {
    totalSessions: number
    avgRpe: number | null
    lastSession: string | null
  }
}

type ActiveSheet = null | "personal" | "measurements" | "address" | "password" | "email"

/* ═══════════════════════════════════════ */
/*  Main Component                        */
/* ═══════════════════════════════════════ */

export function ProfileClient({ student, stats }: ProfileProps) {
  const router = useRouter()
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const bmi = student.weight && student.height
    ? (() => {
        const heightM = student.height! > 3 ? student.height! / 100 : student.height!
        return (student.weight! / (heightM * heightM)).toFixed(1)
      })()
    : null

  const genderLabels: Record<string, string> = { MALE: "Masculino", FEMALE: "Feminino", OTHER: "Outro" }

  const addressSummary = [student.address.street, student.address.number, student.address.neighborhood, student.address.city]
    .filter(Boolean).join(", ") || "Não informado"

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  function closeSheet() {
    setActiveSheet(null)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-5">
        {/* ═══ AVATAR + NAME ═══ */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-red-600/20 animate-pulse-glow">
              {initials}
            </div>
            <div className="absolute inset-0 rounded-3xl border-2 border-red-500/20" />
          </div>
          <h1 className="text-xl font-bold text-white mb-0.5">{student.name}</h1>
          <p className="text-neutral-500 text-sm flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {student.email}
          </p>
          <p className="text-neutral-600 text-xs mt-1">
            Membro desde {format(new Date(student.memberSince), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* ═══ TRAINING STATS ═══ */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Dumbbell} value={stats.totalSessions.toString()} label="Sessões" accent="red" />
          <StatCard icon={Activity} value={stats.avgRpe ? `${stats.avgRpe}` : "—"} label="RPE Médio" accent="orange" />
          <StatCard
            icon={Clock}
            value={stats.lastSession
              ? formatDistanceToNow(new Date(stats.lastSession), { locale: ptBR, addSuffix: false })
              : "—"
            }
            label="Último Treino"
            accent="blue"
          />
        </div>

        {/* ═══ MEASUREMENTS (inline) ═══ */}
        <SectionCard
          icon={Ruler} iconColor="text-blue-400" iconBg="bg-blue-600/10"
          title="Medidas"
          onEdit={() => setActiveSheet("measurements")}
        >
          <div className="grid grid-cols-3 gap-3">
            <MeasurementDisplay label="Peso" value={student.weight ? `${student.weight}` : "—"} unit="kg" />
            <MeasurementDisplay label="Altura" value={student.height ? `${student.height}` : "—"} unit="cm" />
            <MeasurementDisplay
              label="IMC"
              value={bmi || "—"}
              unit=""
              className={bmi ? (parseFloat(bmi) < 18.5 ? "text-blue-400" : parseFloat(bmi) < 25 ? "text-emerald-400" : parseFloat(bmi) < 30 ? "text-amber-400" : "text-red-400") : "text-neutral-600"}
            />
          </div>
        </SectionCard>

        {/* ═══ PERSONAL INFO (clickable rows) ═══ */}
        <SectionCard
          icon={User} iconColor="text-red-500" iconBg="bg-red-600/10"
          title="Informações Pessoais"
          onEdit={() => setActiveSheet("personal")}
        >
          <div className="space-y-0">
            <InfoRow icon={Phone} label="Telefone" value={student.phone || "Não informado"} />
            <InfoRow icon={Calendar} label="Nascimento" value={student.birthDate ? format(new Date(student.birthDate), "dd/MM/yyyy") : "Não informado"} />
            <InfoRow icon={User} label="Sexo" value={student.gender ? genderLabels[student.gender] || student.gender : "Não informado"} />
          </div>
        </SectionCard>

        {/* ═══ ADDRESS ═══ */}
        <SectionCard
          icon={MapPin} iconColor="text-emerald-400" iconBg="bg-emerald-600/10"
          title="Endereço"
          onEdit={() => setActiveSheet("address")}
        >
          <p className="text-sm text-neutral-400 leading-relaxed">{addressSummary}</p>
          {student.address.zip && (
            <p className="text-xs text-neutral-600 mt-1">CEP: {student.address.zip}</p>
          )}
        </SectionCard>

        {/* ═══ GOALS & RESTRICTIONS ═══ */}
        {student.goals && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
            <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Objetivos
            </h4>
            <p className="text-sm text-neutral-400 leading-relaxed">{student.goals}</p>
          </div>
        )}
        {student.restrictions && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
            <h4 className="text-sm font-medium text-neutral-300 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              Restrições
            </h4>
            <p className="text-sm text-neutral-400 leading-relaxed">{student.restrictions}</p>
          </div>
        )}

        {/* ═══ SECURITY ACTIONS ═══ */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2 px-5 pt-5 pb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-600/10 flex items-center justify-center">
              <Lock className="w-3 h-3 text-amber-400" />
            </div>
            Conta e Segurança
          </h3>
          <ActionRow icon={Lock} label="Alterar Senha" onClick={() => setActiveSheet("password")} />
          <ActionRow icon={Mail} label="Alterar Email" sublabel={student.email} onClick={() => setActiveSheet("email")} />
        </div>

        {/* ═══ NOTIFICAÇÕES + UPGRADE + SITE + LOGOUT ═══ */}
        <div className="space-y-2">
          <PushNotificationToggle />
          <Link
            href="/upgrade"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-amber-500/20 bg-amber-600/[0.06] text-amber-300 text-sm font-semibold hover:bg-amber-600/[0.1] hover:border-amber-500/30 transition-all duration-300 active:scale-[0.98]"
          >
            <Crown className="w-4 h-4" />
            Ver Planos / Upgrade
          </Link>
          <a
            href="/?site=true"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 bg-white/[0.03] text-neutral-400 text-sm font-medium hover:bg-white/[0.06] hover:text-neutral-300 transition-all duration-300 active:scale-[0.98]"
          >
            <Globe className="w-4 h-4" />
            Visitar Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM SHEETS ═══ */}
      {activeSheet === "personal" && (
        <EditPersonalSheet student={student} onClose={closeSheet} />
      )}
      {activeSheet === "measurements" && (
        <EditMeasurementsSheet student={student} onClose={closeSheet} />
      )}
      {activeSheet === "address" && (
        <EditAddressSheet address={student.address} onClose={closeSheet} />
      )}
      {activeSheet === "password" && (
        <ChangePasswordSheet onClose={closeSheet} />
      )}
      {activeSheet === "email" && (
        <ChangeEmailSheet currentEmail={student.email} onClose={closeSheet} />
      )}
    </>
  )
}

/* ═══════════════════════════════════════ */
/*  Section Card                          */
/* ═══════════════════════════════════════ */

function SectionCard({ icon: Icon, iconColor, iconBg, title, onEdit, children }: {
  icon: typeof User; iconColor: string; iconBg: string; title: string; onEdit: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-3 h-3 ${iconColor}`} />
          </div>
          {title}
        </h3>
        <button
          onClick={onEdit}
          className="text-neutral-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Bottom Sheet Wrapper                  */
/* ═══════════════════════════════════════ */

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-9999 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-neutral-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="px-6 pt-6 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 pb-28 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Sheet: Edit Personal Info             */
/* ═══════════════════════════════════════ */

function EditPersonalSheet({ student, onClose }: { student: ProfileProps["student"]; onClose: () => void }) {
  const [name, setName] = useState(student.name)
  const [phone, setPhone] = useState(student.phone || "")
  const [birthDate, setBirthDate] = useState(student.birthDate ? student.birthDate.split("T")[0] : "")
  const [gender, setGender] = useState(student.gender || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (!name.trim()) { setError("Nome é obrigatório"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, birthDate: birthDate || null, gender: gender || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro ao salvar") }
      setSuccess(true)
      setTimeout(onClose, 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    } finally { setSaving(false) }
  }

  return (
    <BottomSheet title="Informações Pessoais" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
        <FormField label="Telefone" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" type="tel" />
        <FormField label="Data de nascimento" value={birthDate} onChange={setBirthDate} type="date" />
        <div>
          <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block">Sexo</label>
          <div className="grid grid-cols-3 gap-2">
            {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  gender === g
                    ? "bg-red-600/20 border-red-500/40 text-red-400 border"
                    : "bg-white/[0.04] border border-white/[0.08] text-neutral-400 hover:bg-white/[0.06]"
                }`}
              >
                {g === "MALE" ? "Masculino" : g === "FEMALE" ? "Feminino" : "Outro"}
              </button>
            ))}
          </div>
        </div>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Dados atualizados!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </BottomSheet>
  )
}

/* ═══════════════════════════════════════ */
/*  Sheet: Edit Measurements              */
/* ═══════════════════════════════════════ */

function EditMeasurementsSheet({ student, onClose }: { student: ProfileProps["student"]; onClose: () => void }) {
  const [weight, setWeight] = useState(student.weight?.toString() || "")
  const [height, setHeight] = useState(student.height?.toString() || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, height }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro ao salvar") }
      setSuccess(true)
      setTimeout(onClose, 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    } finally { setSaving(false) }
  }

  return (
    <BottomSheet title="Medidas" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Peso (kg)" value={weight} onChange={setWeight} placeholder="75" type="number" step="0.1" />
          <FormField label="Altura (cm)" value={height} onChange={setHeight} placeholder="175" type="number" step="0.1" />
        </div>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Medidas atualizadas!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </BottomSheet>
  )
}

/* ═══════════════════════════════════════ */
/*  Sheet: Edit Address                   */
/* ═══════════════════════════════════════ */

function EditAddressSheet({ address, onClose }: { address: Address; onClose: () => void }) {
  const [zip, setZip] = useState(address.zip || "")
  const [street, setStreet] = useState(address.street || "")
  const [number, setNumber] = useState(address.number || "")
  const [comp, setComp] = useState(address.comp || "")
  const [neighborhood, setNeighborhood] = useState(address.neighborhood || "")
  const [city, setCity] = useState(address.city || "")
  const [state, setState] = useState(address.state || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)

  async function lookupCep() {
    const cleaned = zip.replace(/\D/g, "")
    if (cleaned.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setStreet(data.logradouro || "")
        setNeighborhood(data.bairro || "")
        setCity(data.localidade || "")
        setState(data.uf || "")
      }
    } catch { /* ignore */ }
    finally { setLoadingCep(false) }
  }

  async function handleSave() {
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressZip: zip, addressStreet: street, addressNumber: number,
          addressComp: comp, addressNeighborhood: neighborhood,
          addressCity: city, addressState: state,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro ao salvar") }
      setSuccess(true)
      setTimeout(onClose, 600)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar")
    } finally { setSaving(false) }
  }

  return (
    <BottomSheet title="Endereço" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <FormField label="CEP" value={zip} onChange={setZip} placeholder="00000-000" />
          </div>
          <div className="flex items-end">
            <button
              onClick={lookupCep}
              disabled={loadingCep}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
            >
              {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </button>
          </div>
        </div>
        <FormField label="Rua" value={street} onChange={setStreet} placeholder="Nome da rua" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Número" value={number} onChange={setNumber} placeholder="123" />
          <FormField label="Complemento" value={comp} onChange={setComp} placeholder="Apto, Bloco" />
        </div>
        <FormField label="Bairro" value={neighborhood} onChange={setNeighborhood} placeholder="Bairro" />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="Cidade" value={city} onChange={setCity} placeholder="Cidade" />
          </div>
          <FormField label="UF" value={state} onChange={setState} placeholder="CE" />
        </div>
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Endereço atualizado!" />}
        <SaveButton saving={saving} onClick={handleSave} />
      </div>
    </BottomSheet>
  )
}

/* ═══════════════════════════════════════ */
/*  Sheet: Change Password                */
/* ═══════════════════════════════════════ */

function ChangePasswordSheet({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (!currentPassword) { setError("Digite sua senha atual"); return }
    if (newPassword.length < 6) { setError("A nova senha deve ter no mínimo 6 caracteres"); return }
    if (newPassword !== confirmPassword) { setError("As senhas não coincidem"); return }

    setSaving(true); setError("")
    try {
      const res = await fetch("/api/student/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao alterar senha")
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar senha")
    } finally { setSaving(false) }
  }

  return (
    <BottomSheet title="Alterar Senha" onClose={onClose}>
      <div className="space-y-4">
        <PasswordField label="Senha atual" value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
        <PasswordField label="Nova senha" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} />
        <FormField label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repita a nova senha" />
        {newPassword && (
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  newPassword.length >= level * 3
                    ? level <= 1 ? "bg-red-500" : level <= 2 ? "bg-amber-500" : level <= 3 ? "bg-yellow-400" : "bg-emerald-400"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
        )}
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Senha alterada com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} label="Alterar Senha" />
      </div>
    </BottomSheet>
  )
}

/* ═══════════════════════════════════════ */
/*  Sheet: Change Email                   */
/* ═══════════════════════════════════════ */

function ChangeEmailSheet({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    if (!newEmail) { setError("Digite o novo email"); return }
    if (!password) { setError("Digite sua senha para confirmar"); return }

    setSaving(true); setError("")
    try {
      const res = await fetch("/api/student/profile/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao alterar email")
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar email")
    } finally { setSaving(false) }
  }

  return (
    <BottomSheet title="Alterar Email" onClose={onClose}>
      <div className="space-y-4">
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-neutral-500 mb-1">Email atual</p>
          <p className="text-sm text-neutral-300">{currentEmail}</p>
        </div>
        <FormField label="Novo email" value={newEmail} onChange={setNewEmail} placeholder="novo@email.com" type="email" />
        <PasswordField label="Confirme sua senha" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        {error && <ErrorBanner message={error} />}
        {success && <SuccessBanner message="Email alterado com sucesso!" />}
        <SaveButton saving={saving} onClick={handleSave} label="Alterar Email" />
      </div>
    </BottomSheet>
  )
}

/* ═══════════════════════════════════════ */
/*  Shared Sub-Components                 */
/* ═══════════════════════════════════════ */

function StatCard({ icon: Icon, value, label, accent }: { icon: typeof Dumbbell; value: string; label: string; accent: "red" | "orange" | "blue" }) {
  const colors = {
    red: "text-red-500/70 bg-red-600/10",
    orange: "text-orange-500/70 bg-orange-600/10",
    blue: "text-blue-500/70 bg-blue-600/10",
  }
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 text-center hover:border-white/[0.1] transition-all duration-300">
      <div className={`w-8 h-8 rounded-xl ${colors[accent]} flex items-center justify-center mx-auto mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[9px] text-neutral-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

function MeasurementDisplay({ label, value, unit, className }: { label: string; value: string; unit: string; className?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${className || "text-white"}`}>{value}</p>
      {unit && <p className="text-[9px] text-neutral-600 mt-0.5">{unit}</p>}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.03] last:border-0">
      <Icon className="w-4 h-4 text-neutral-600 shrink-0" />
      <span className="text-xs text-neutral-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-neutral-300 truncate">{value}</span>
    </div>
  )
}

function ActionRow({ icon: Icon, label, sublabel, onClick }: { icon: typeof Lock; label: string; sublabel?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors border-t border-white/[0.04] active:bg-white/[0.05]"
    >
      <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
      <div className="flex-1 text-left">
        <p className="text-sm text-neutral-300">{label}</p>
        {sublabel && <p className="text-xs text-neutral-600 truncate">{sublabel}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-700" />
    </button>
  )
}

function FormField({ label, value, onChange, placeholder, type = "text", step }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string
}) {
  return (
    <div>
      <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-neutral-700"
      />
    </div>
  )
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void
}) {
  return (
    <div>
      <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function SaveButton({ saving, onClick, label = "Salvar" }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      {saving ? "Salvando..." : label}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-sm">
      <Check className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
