"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Building2,
  ArrowLeft,
  Users,
  UserCog,
  Salad,
  Info,
  Palette,
  Save,
  Loader2,
  Check,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TrainerItem {
  id: string
  user: { id: string; name: string; email: string; avatar: string | null; createdAt: string }
  _count: { students: number }
}

interface NutriItem {
  id: string
  user: { id: string; name: string; email: string; avatar: string | null; createdAt: string }
  _count: { students: number }
}

interface StudentItem {
  id: string
  status: string
  user: { name: string; email: string }
  createdAt: string
}

interface OrgDetail {
  id: string
  name: string
  slug: string
  status: string
  logo: string | null
  ownerEmail: string | null
  maxProfessionals: number
  maxStudents: number
  brandConfig: { primaryColor?: string; appName?: string; trainerName?: string } | null
  createdAt: string
  updatedAt: string
  trainers: TrainerItem[]
  nutritionists: NutriItem[]
  _count: { students: number }
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  TRIAL: { label: "Trial", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  SUSPENDED: { label: "Suspenso", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  CANCELLED: { label: "Cancelado", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
}

const tabs = [
  { key: "info", label: "Info", icon: Info },
  { key: "professionals", label: "Profissionais", icon: UserCog },
  { key: "students", label: "Alunos", icon: Users },
  { key: "brand", label: "Marca", icon: Palette },
] as const

type TabKey = (typeof tabs)[number]["key"]

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("info")

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch(`/api/master/organizations/${id}`)
      if (!res.ok) {
        router.push("/master/organizations")
        return
      }
      const data = await res.json()
      setOrg(data.organization)
      setStudents(data.recentStudents ?? [])
    } catch {
      router.push("/master/organizations")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchOrg()
  }, [fetchOrg])

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 pt-1 sm:pt-2">
        <div className="h-14 bg-white/[0.03] rounded-2xl animate-pulse" />
        <div className="h-10 bg-white/[0.03] rounded-xl animate-pulse w-80" />
        <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!org) return null

  const status = statusConfig[org.status] ?? statusConfig.CANCELLED

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <Link
          href="/master/organizations"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-violet-400 text-sm mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-lg font-bold border border-violet-500/10">
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                {org.name}
              </h1>
              <span
                className={`text-[9px] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}
              >
                {status.label}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">{org.slug}</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06] w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-violet-600/15 text-violet-400 border border-violet-500/20"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {activeTab === "info" && <TabInfo org={org} onUpdate={fetchOrg} />}
        {activeTab === "professionals" && <TabProfessionals org={org} />}
        {activeTab === "students" && <TabStudents org={org} students={students} />}
        {activeTab === "brand" && <TabBrand org={org} onUpdate={fetchOrg} />}
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/* TAB: INFO                              */
/* ═══════════════════════════════════════ */
function TabInfo({ org, onUpdate }: { org: OrgDetail; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: org.name,
    slug: org.slug,
    maxProfessionals: org.maxProfessionals,
    maxStudents: org.maxStudents,
  })
  const [saving, setSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/master/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setEditing(false)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(status: string) {
    setStatusSaving(true)
    try {
      await fetch(`/api/master/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      onUpdate()
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Details card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 hover:border-white/[0.1] transition-all duration-500">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">Detalhes</h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Editar
            </button>
          )}
        </div>
        <div className="space-y-4">
          <InfoRow label="Nome">
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
              />
            ) : (
              <span className="text-white/80 text-sm">{org.name}</span>
            )}
          </InfoRow>
          <InfoRow label="Slug">
            {editing ? (
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white font-mono focus:outline-none focus:border-violet-500/30 transition-all"
              />
            ) : (
              <span className="text-white/80 text-sm font-mono">{org.slug}</span>
            )}
          </InfoRow>
          <InfoRow label="Email do dono">
            <span className="text-white/80 text-sm">{org.ownerEmail ?? "—"}</span>
          </InfoRow>
          <InfoRow label="Criada em">
            <span className="text-white/80 text-sm">
              {format(new Date(org.createdAt), "dd/MM/yyyy '\u00e0s' HH:mm", { locale: ptBR })}
            </span>
          </InfoRow>

          {editing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-medium hover:from-violet-500 hover:to-violet-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setForm({ name: org.name, slug: org.slug, maxProfessionals: org.maxProfessionals, maxStudents: org.maxStudents })
                }}
                className="px-4 py-2 rounded-xl bg-white/[0.04] text-neutral-400 text-sm hover:bg-white/[0.06] transition-all"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Limits + Status card */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 hover:border-white/[0.1] transition-all duration-500">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-5">Limites</h3>
          <div className="space-y-4">
            <InfoRow label="Max Profissionais">
              {editing ? (
                <input
                  type="number"
                  value={form.maxProfessionals}
                  onChange={(e) => setForm((p) => ({ ...p, maxProfessionals: Number(e.target.value) }))}
                  min={1}
                  className="w-20 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                />
              ) : (
                <span className="text-white/80 text-sm">
                  {org.trainers.length + org.nutritionists.length} / {org.maxProfessionals}
                </span>
              )}
            </InfoRow>
            <InfoRow label="Max Alunos">
              {editing ? (
                <input
                  type="number"
                  value={form.maxStudents}
                  onChange={(e) => setForm((p) => ({ ...p, maxStudents: Number(e.target.value) }))}
                  min={1}
                  className="w-20 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                />
              ) : (
                <span className="text-white/80 text-sm">
                  {org._count.students} / {org.maxStudents}
                </span>
              )}
            </InfoRow>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 hover:border-white/[0.1] transition-all duration-500">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em] mb-4">Alterar Status</h3>
          <div className="flex flex-wrap gap-2">
            {(["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"] as const).map((s) => {
              const cfg = statusConfig[s]
              const isActive = org.status === s
              return (
                <button
                  key={s}
                  onClick={() => !isActive && handleStatusChange(s)}
                  disabled={isActive || statusSaving}
                  className={`text-[10px] font-medium px-3 py-1.5 rounded-lg uppercase tracking-wider border transition-all duration-200 ${
                    isActive
                      ? `${cfg.classes} ring-1 ring-offset-1 ring-offset-[#0a0a0a] ring-current`
                      : `border-white/[0.06] text-neutral-500 hover:${cfg.classes}`
                  } disabled:cursor-not-allowed`}
                >
                  {isActive && <Check className="w-3 h-3 inline mr-1" />}
                  {cfg.label}
                </button>
              )
            })}
            {statusSaving && <Loader2 className="w-4 h-4 animate-spin text-violet-400 self-center" />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/* TAB: PROFESSIONALS                     */
/* ═══════════════════════════════════════ */
function TabProfessionals({ org }: { org: OrgDetail }) {
  const allPros = [
    ...org.trainers.map((t) => ({ ...t, role: "TRAINER" as const })),
    ...org.nutritionists.map((n) => ({ ...n, role: "NUTRITIONIST" as const })),
  ]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.1] transition-all duration-500">
      <div className="flex items-center justify-between px-5 sm:px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <UserCog className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
            Profissionais ({allPros.length})
          </h3>
        </div>
        <button
          disabled
          className="text-xs text-neutral-600 px-3 py-1.5 rounded-lg border border-white/[0.06] cursor-not-allowed"
          title="Em breve"
        >
          + Adicionar Profissional
        </button>
      </div>

      {allPros.length === 0 ? (
        <div className="text-center py-12">
          <UserCog className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">Nenhum profissional vinculado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Nome</th>
                <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Fun{"\u00e7\u00e3"}o</th>
                <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Alunos</th>
                <th className="text-right py-3 px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">Desde</th>
              </tr>
            </thead>
            <tbody>
              {allPros.map((pro) => (
                <tr key={pro.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-xs font-semibold border border-violet-500/10">
                        {pro.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white/80 font-medium">{pro.user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-neutral-400 text-[11px] hidden sm:table-cell">{pro.user.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        pro.role === "TRAINER"
                          ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {pro.role === "TRAINER" ? "Trainer" : "Nutricionista"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-neutral-400">{pro._count.students}</td>
                  <td className="py-3 px-5 text-right text-neutral-500 text-[11px] hidden md:table-cell">
                    {format(new Date(pro.user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════ */
/* TAB: STUDENTS                          */
/* ═══════════════════════════════════════ */
function TabStudents({ org, students }: { org: OrgDetail; students: StudentItem[] }) {
  const studentStatusConfig: Record<string, { label: string; classes: string }> = {
    ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    INACTIVE: { label: "Inativo", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
    SUSPENDED: { label: "Suspenso", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  }

  return (
    <div className="space-y-4">
      {/* Count card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 hover:border-white/[0.1] transition-all duration-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{org._count.students}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total de alunos</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-semibold text-neutral-400">{org.maxStudents}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Limite</p>
          </div>
        </div>
        {/* Usage bar */}
        <div className="mt-4 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
            style={{ width: `${Math.min((org._count.students / org.maxStudents) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent students table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.1] transition-all duration-500">
        <div className="flex items-center gap-2 px-5 sm:px-6 py-5 border-b border-white/[0.06]">
          <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
            <Crown className="w-3 h-3 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
            Alunos Recentes
          </h3>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">Nenhum aluno cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Nome</th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Status</th>
                  <th className="text-right py-3 px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const sCfg = studentStatusConfig[s.status] ?? studentStatusConfig.INACTIVE
                  return (
                    <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600/15 to-violet-900/10 flex items-center justify-center text-violet-400 text-xs font-semibold border border-violet-500/10">
                            {s.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white/80 font-medium">{s.user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-400 text-[11px] hidden sm:table-cell">{s.user.email}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${sCfg.classes}`}>
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right text-neutral-500 text-[11px] hidden md:table-cell">
                        {format(new Date(s.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/* TAB: BRAND                             */
/* ═══════════════════════════════════════ */
function TabBrand({ org, onUpdate }: { org: OrgDetail; onUpdate: () => void }) {
  const brand = org.brandConfig ?? {}
  const [form, setForm] = useState({
    primaryColor: brand.primaryColor ?? "#7c3aed",
    appName: brand.appName ?? "",
    trainerName: brand.trainerName ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/master/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandConfig: form }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <Palette className="w-3 h-3 text-violet-500" />
        </div>
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-[0.06em]">
          Personaliza{"\u00e7\u00e3"}o da Marca
        </h3>
      </div>

      <div className="space-y-5">
        {/* Color picker */}
        <div>
          <label className="block text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            Cor Principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-white/[0.08] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
              className="w-28 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white font-mono focus:outline-none focus:border-violet-500/30 transition-all"
            />
            <div
              className="w-10 h-10 rounded-lg border border-white/[0.08]"
              style={{ backgroundColor: form.primaryColor }}
            />
          </div>
        </div>

        {/* App name */}
        <div>
          <label className="block text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            Nome do App
          </label>
          <input
            type="text"
            value={form.appName}
            onChange={(e) => setForm((p) => ({ ...p, appName: e.target.value }))}
            placeholder="Ex: Victor Personal"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
          />
        </div>

        {/* Trainer name */}
        <div>
          <label className="block text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-2">
            Nome do Personal
          </label>
          <input
            type="text"
            value={form.trainerName}
            onChange={(e) => setForm((p) => ({ ...p, trainerName: e.target.value }))}
            placeholder="Ex: Personal Trainer"
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:from-violet-500 hover:to-violet-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Marca
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ═══ HELPERS ═══ */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}
