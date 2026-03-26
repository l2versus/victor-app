"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserCog,
  Search,
  Plus,
  Building2,
  Stethoscope,
  Dumbbell,
  Users,
  X,
  Copy,
  Check,
  Eye,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

/* ═══ TYPES ═══ */
interface Professional {
  id: string
  name: string
  email: string
  avatar: string | null
  active: boolean
  createdAt: string
  role: string
  registration: string | null
  specialty: string | null
  organizationId: string | null
  organizationName: string | null
  organizationSlug: string | null
  studentCount: number
}

interface OrgOption {
  id: string
  name: string
}

/* ═══ ANIMATIONS ═══ */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

const overlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalAnim = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
}

/* ═══ ROLE CONFIG ═══ */
const roleConfig: Record<string, { label: string; classes: string; icon: typeof Dumbbell }> = {
  ADMIN: {
    label: "Personal Trainer",
    classes: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: Dumbbell,
  },
  NUTRITIONIST: {
    label: "Nutricionista",
    classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Stethoscope,
  },
}

/* ═══ MAIN PAGE ═══ */
export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [orgFilter, setOrgFilter] = useState("")
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [showModal, setShowModal] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Load orgs for filter
  useEffect(() => {
    fetch("/api/master/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.recentOrgs) {
          setOrgs(d.recentOrgs.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch professionals
  const fetchProfessionals = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (roleFilter !== "all") params.set("role", roleFilter)
    if (orgFilter) params.set("orgId", orgFilter)

    fetch(`/api/master/professionals?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProfessionals(d.professionals || [])
        setTotal(d.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [debouncedSearch, roleFilter, orgFilter])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])

  // Also load all orgs from the professionals list (to have full org list)
  useEffect(() => {
    fetch("/api/master/professionals")
      .then((r) => r.json())
      .then((d) => {
        if (d.professionals) {
          const orgMap = new Map<string, string>()
          for (const p of d.professionals) {
            if (p.organizationId && p.organizationName) {
              orgMap.set(p.organizationId, p.organizationName)
            }
          }
          if (orgMap.size > 0) {
            setOrgs((prev) => {
              const merged = new Map<string, string>()
              for (const o of prev) merged.set(o.id, o.name)
              for (const [id, name] of orgMap) merged.set(id, name)
              return Array.from(merged, ([id, name]) => ({ id, name })).sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            })
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-1 sm:pt-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
              <UserCog className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Profissionais
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                {total} profissional{total !== 1 ? "is" : ""} cadastrado{total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-600/25 hover:shadow-violet-500/30 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Profissional</span>
            <span className="sm:hidden">Adicionar</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ FILTERS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Role dropdown */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-sm text-white/80 focus:outline-none focus:border-violet-500/40 cursor-pointer min-w-[170px]"
          >
            <option value="all" className="bg-neutral-900">Todos</option>
            <option value="ADMIN" className="bg-neutral-900">Personal Trainers</option>
            <option value="NUTRITIONIST" className="bg-neutral-900">Nutricionistas</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        </div>

        {/* Org dropdown */}
        <div className="relative">
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-sm text-white/80 focus:outline-none focus:border-violet-500/40 cursor-pointer min-w-[170px]"
          >
            <option value="" className="bg-neutral-900">Todas organizacoes</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id} className="bg-neutral-900">
                {o.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        </div>
      </motion.div>

      {/* ═══ TABLE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 sm:p-7 hover:border-white/[0.1] transition-all duration-500"
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <UserCog className="w-7 h-7 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm mb-1">Nenhum profissional cadastrado</p>
            <p className="text-neutral-600 text-xs">
              {debouncedSearch || roleFilter !== "all" || orgFilter
                ? "Tente alterar os filtros de busca"
                : "Clique em \"Adicionar Profissional\" para comecar"}
            </p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Profissional
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Cargo
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Organizacao
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Alunos
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden lg:table-cell">
                    Registro
                  </th>
                  <th className="text-right py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Criado em
                  </th>
                  <th className="text-right py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((pro, i) => {
                  const rc = roleConfig[pro.role] || roleConfig.ADMIN
                  const RoleIcon = rc.icon
                  return (
                    <motion.tr
                      key={pro.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      {/* Name + Email */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {pro.avatar ? (
                            <img
                              src={pro.avatar}
                              alt={pro.name}
                              className="w-9 h-9 rounded-xl object-cover border border-white/[0.06]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-xs font-semibold border border-violet-500/10">
                              {pro.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white/80 font-medium truncate max-w-[180px]">{pro.name}</p>
                            <p className="text-neutral-600 text-[11px] truncate max-w-[180px]">{pro.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider border ${rc.classes}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {rc.label}
                        </span>
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-3 hidden md:table-cell">
                        {pro.organizationName ? (
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="truncate max-w-[140px]">{pro.organizationName}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-700 text-xs">Sem org</span>
                        )}
                      </td>

                      {/* Students */}
                      <td className="py-3 px-3 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5 text-neutral-400">
                          <Users className="w-3.5 h-3.5 text-neutral-600" />
                          {pro.studentCount}
                        </div>
                      </td>

                      {/* Registration (CREF / CRN) */}
                      <td className="py-3 px-3 hidden lg:table-cell">
                        {pro.registration ? (
                          <span className="text-neutral-400 text-xs font-mono">{pro.registration}</span>
                        ) : (
                          <span className="text-neutral-700 text-xs">-</span>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="py-3 px-3 text-right text-neutral-500 text-[11px] hidden md:table-cell">
                        {format(new Date(pro.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        {pro.organizationSlug && (
                          <a
                            href={`/master/organizations`}
                            className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">Ver org</span>
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══ ADD PROFESSIONAL MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <AddProfessionalModal
            orgs={orgs}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchProfessionals()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══ ADD PROFESSIONAL MODAL ═══ */
function AddProfessionalModal({
  orgs,
  onClose,
  onSuccess,
}: {
  orgs: OrgOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    organizationId: "",
    role: "ADMIN",
    name: "",
    email: "",
    password: "",
    autoPassword: true,
    cref: "",
    crn: "",
    specialty: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const body: Record<string, string | undefined> = {
        name: form.name,
        email: form.email,
        role: form.role,
      }
      if (form.organizationId) body.organizationId = form.organizationId
      if (!form.autoPassword && form.password) body.password = form.password
      if (form.role === "ADMIN" && form.cref) body.cref = form.cref
      if (form.role === "NUTRITIONIST" && form.crn) body.crn = form.crn
      if (form.role === "NUTRITIONIST" && form.specialty) body.specialty = form.specialty

      const res = await fetch("/api/master/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar profissional")
        return
      }

      setCredentials(data.credentials)
    } catch {
      setError("Erro de conexao")
    } finally {
      setSaving(false)
    }
  }

  const copyCredentials = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Email: ${credentials.email}\nSenha: ${credentials.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const inputClasses =
    "w-full px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"

  const labelClasses = "block text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5"

  return (
    <>
      {/* Overlay */}
      <motion.div
        variants={overlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={credentials ? onSuccess : onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
      />

      {/* Modal */}
      <motion.div
        variants={modalAnim}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-x-4 top-[8vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-[71] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-neutral-950/95 backdrop-blur-2xl shadow-2xl shadow-black/50"
      >
        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {credentials ? "Profissional Criado" : "Adicionar Profissional"}
                </h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                  {credentials ? "Credenciais de acesso" : "Preencha os dados abaixo"}
                </p>
              </div>
            </div>
            <button
              onClick={credentials ? onSuccess : onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {credentials ? (
            /* ═══ SUCCESS — Show credentials ═══ */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-400">Profissional criado com sucesso!</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Email:</span>
                    <span className="text-white font-mono text-xs">{credentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Senha:</span>
                    <span className="text-white font-mono text-xs">{credentials.password}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={copyCredentials}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white/80 hover:bg-white/[0.05] transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar credenciais
                  </>
                )}
              </button>

              <button
                onClick={onSuccess}
                className="w-full px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          ) : (
            /* ═══ FORM ═══ */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Organization */}
              <div>
                <label className={labelClasses}>Organizacao</label>
                <div className="relative">
                  <select
                    value={form.organizationId}
                    onChange={(e) => update("organizationId", e.target.value)}
                    className={`${inputClasses} appearance-none pr-9 cursor-pointer`}
                  >
                    <option value="" className="bg-neutral-900">Sem organizacao</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id} className="bg-neutral-900">
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className={labelClasses}>Cargo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update("role", "ADMIN")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.role === "ADMIN"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:text-white hover:border-white/[0.1]"
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    Personal Trainer
                  </button>
                  <button
                    type="button"
                    onClick={() => update("role", "NUTRITIONIST")}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.role === "NUTRITIONIST"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-white/[0.06] bg-white/[0.02] text-neutral-500 hover:text-white hover:border-white/[0.1]"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Nutricionista
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={labelClasses}>Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelClasses}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelClasses}>Senha</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.autoPassword}
                      onChange={(e) => update("autoPassword", e.target.checked)}
                      className="rounded border-white/10 bg-white/[0.02] text-violet-600 focus:ring-violet-500/20"
                    />
                    Gerar senha automaticamente
                  </label>
                  {!form.autoPassword && (
                    <input
                      type="text"
                      placeholder="Senha de acesso"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={inputClasses}
                    />
                  )}
                </div>
              </div>

              {/* CREF (trainers) / CRN (nutritionists) */}
              {form.role === "ADMIN" ? (
                <div>
                  <label className={labelClasses}>CREF</label>
                  <input
                    type="text"
                    placeholder="000000-G/UF"
                    value={form.cref}
                    onChange={(e) => update("cref", e.target.value)}
                    className={inputClasses}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className={labelClasses}>CRN</label>
                    <input
                      type="text"
                      placeholder="CRN-0 00000"
                      value={form.crn}
                      onChange={(e) => update("crn", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Especialidade</label>
                    <input
                      type="text"
                      placeholder="Ex: Nutricao esportiva"
                      value={form.specialty}
                      onChange={(e) => update("specialty", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || !form.name || !form.email}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-violet-600/25"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Criar Profissional
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </>
  )
}
