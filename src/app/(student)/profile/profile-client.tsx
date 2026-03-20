"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User, Mail, Phone, Calendar, Ruler, Weight, Target, Globe,
  AlertTriangle, LogOut, Dumbbell, Activity, Clock, Edit3, Check, X,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

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
  }
  stats: {
    totalSessions: number
    avgRpe: number | null
    lastSession: string | null
  }
}

export function ProfileClient({ student, stats }: ProfileProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(student.phone || "")
  const [weight, setWeight] = useState(student.weight?.toString() || "")
  const [height, setHeight] = useState(student.height?.toString() || "")
  const [saving, setSaving] = useState(false)

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const bmi = student.weight && student.height
    ? (student.weight / Math.pow(student.height / 100, 2)).toFixed(1)
    : null

  const genderLabels: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Feminino",
    OTHER: "Outro",
  }

  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, weight, height }),
      })
      if (!res.ok) throw new Error("Erro ao salvar")
      setEditing(false)
      router.refresh()
    } catch {
      setSaveError("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
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

      {/* ═══ SAVE ERROR ═══ */}
      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-sm">
          <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setSaveError(null)} />
          <span>{saveError}</span>
        </div>
      )}

      {/* ═══ MEASUREMENTS ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <Ruler className="w-3 h-3 text-blue-400" />
            </div>
            Medidas
          </h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-neutral-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={() => { setEditing(false); setPhone(student.phone || ""); setWeight(student.weight?.toString() || ""); setHeight(student.height?.toString() || "") }}
                className="text-neutral-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-emerald-400 hover:text-emerald-300 transition-colors p-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MeasurementTile
            label="Peso"
            value={editing ? weight : (student.weight ? `${student.weight}` : "—")}
            unit="kg"
            editing={editing}
            onChange={setWeight}
          />
          <MeasurementTile
            label="Altura"
            value={editing ? height : (student.height ? `${student.height}` : "—")}
            unit="cm"
            editing={editing}
            onChange={setHeight}
          />
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">IMC</p>
            <p className={`text-lg font-bold ${
              bmi ? (parseFloat(bmi) < 18.5 ? "text-blue-400" : parseFloat(bmi) < 25 ? "text-emerald-400" : parseFloat(bmi) < 30 ? "text-amber-400" : "text-red-400") : "text-neutral-600"
            }`}>{bmi || "—"}</p>
          </div>
        </div>

        {editing && (
          <div className="mt-3">
            <label className="text-[10px] text-neutral-600 uppercase tracking-wider">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(85) 99999-9999"
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* ═══ PERSONAL INFO ═══ */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-red-600/10 flex items-center justify-center">
            <User className="w-3 h-3 text-red-500" />
          </div>
          Informações Pessoais
        </h3>

        <InfoRow icon={Phone} label="Telefone" value={student.phone || "Não informado"} />
        <InfoRow icon={Calendar} label="Nascimento" value={student.birthDate ? format(new Date(student.birthDate), "dd/MM/yyyy") : "Não informado"} />
        <InfoRow icon={User} label="Sexo" value={student.gender ? genderLabels[student.gender] || student.gender : "Não informado"} />
      </div>

      {/* ═══ GOALS & RESTRICTIONS ═══ */}
      <div className="grid grid-cols-1 gap-3">
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
      </div>

      {/* ═══ UPGRADE + SITE + LOGOUT ═══ */}
      <div className="space-y-2">
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
  )
}

/* ═══ Sub-components ═══ */

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

function MeasurementTile({ label, value, unit, editing, onChange }: { label: string; value: string; unit: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
      <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">{label}</p>
      {editing ? (
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-center text-lg font-bold text-white bg-transparent border-b border-white/10 focus:border-red-500/50 outline-none transition-colors"
        />
      ) : (
        <p className="text-lg font-bold text-white">{value}</p>
      )}
      <p className="text-[9px] text-neutral-600 mt-0.5">{unit}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
      <Icon className="w-4 h-4 text-neutral-600 shrink-0" />
      <span className="text-xs text-neutral-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-neutral-300 truncate">{value}</span>
    </div>
  )
}
