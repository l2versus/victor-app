"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  Plus,
  Search,
  X,
  Users,
  UserCog,
  Copy,
  Check,
  Eye,
  Pause,
  Play,
  Salad,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrgItem {
  id: string
  name: string
  slug: string
  status: string
  logo: string | null
  ownerEmail: string | null
  maxProfessionals: number
  maxStudents: number
  createdAt: string
  _count: {
    students: number
    trainers: number
    nutritionists: number
  }
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Ativo", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  TRIAL: { label: "Trial", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  SUSPENDED: { label: "Suspenso", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  CANCELLED: { label: "Cancelado", classes: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20" },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrgs = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const url = q ? `/api/master/organizations?search=${encodeURIComponent(q)}` : "/api/master/organizations"
      const res = await fetch(url)
      const data = await res.json()
      setOrgs(data.organizations ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrgs()
  }, [fetchOrgs])

  function handleSearch(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchOrgs(value), 400)
  }

  async function handleToggleStatus(org: OrgItem) {
    const newStatus = org.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    await fetch(`/api/master/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchOrgs(search)
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-[28px] font-bold text-white tracking-[-0.02em]">
                Organiza{"\u00e7\u00f5"}es
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-[0.15em]">
                {total} cadastradas
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCreatedCreds(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:from-violet-500 hover:to-violet-600 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Organiza{"\u00e7\u00e3"}o</span>
          </button>
        </div>
      </motion.div>

      {/* ═══ SEARCH ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 focus:bg-white/[0.05] transition-all duration-300"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("")
                fetchOrgs()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ TABLE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.1] transition-all duration-500"
      >
        {loading ? (
          <div className="p-5 sm:p-7 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-neutral-600" />
            </div>
            <p className="text-neutral-400 text-sm mb-1">
              {search ? "Nenhuma organiza\u00e7\u00e3o encontrada" : "Nenhuma organiza\u00e7\u00e3o cadastrada"}
            </p>
            <p className="text-neutral-600 text-xs">
              {search ? "Tente buscar com outros termos" : 'Clique em "Nova Organiza\u00e7\u00e3o" para come\u00e7ar'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 sm:px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Organiza{"\u00e7\u00e3"}o
                  </th>
                  <th className="text-left py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Status
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Trainers
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">
                    Nutris
                  </th>
                  <th className="text-center py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    Alunos
                  </th>
                  <th className="text-right py-3 px-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">
                    Criada
                  </th>
                  <th className="text-right py-3 px-4 sm:px-5 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                    A{"\u00e7\u00f5"}es
                  </th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org, i) => {
                  const status = statusConfig[org.status] ?? statusConfig.CANCELLED
                  return (
                    <motion.tr
                      key={org.id}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center text-violet-400 text-sm font-semibold border border-violet-500/10 shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white/80 font-medium truncate max-w-[180px]">{org.name}</p>
                            <p className="text-neutral-600 text-[11px]">{org.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider border ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400 hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <UserCog className="w-3 h-3 text-neutral-600" />
                          {org._count.trainers}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400 hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <Salad className="w-3 h-3 text-neutral-600" />
                          {org._count.nutritionists}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-400">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="w-3 h-3 text-neutral-600" />
                          {org._count.students}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500 text-[11px] hidden md:table-cell">
                        {formatDistanceToNow(new Date(org.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </td>
                      <td className="py-3 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/master/organizations/${org.id}`}
                            className="p-2 rounded-lg text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-200"
                            title="Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {org.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleToggleStatus(org)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                org.status === "SUSPENDED"
                                  ? "text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  : "text-amber-500/60 hover:text-amber-400 hover:bg-amber-500/10"
                              }`}
                              title={org.status === "SUSPENDED" ? "Ativar" : "Suspender"}
                            >
                              {org.status === "SUSPENDED" ? (
                                <Play className="w-4 h-4" />
                              ) : (
                                <Pause className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══ CREATE MODAL ═══ */}
      <AnimatePresence>
        {showModal && (
          <CreateOrgModal
            onClose={() => setShowModal(false)}
            onCreated={(creds) => {
              setCreatedCreds(creds)
              fetchOrgs(search)
            }}
            createdCreds={createdCreds}
            copiedField={copiedField}
            onCopy={handleCopy}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══ CREATE ORGANIZATION MODAL ═══ */
function CreateOrgModal({
  onClose,
  onCreated,
  createdCreds,
  copiedField,
  onCopy,
}: {
  onClose: () => void
  onCreated: (creds: { email: string; password: string }) => void
  createdCreds: { email: string; password: string } | null
  copiedField: string | null
  onCopy: (text: string, field: string) => void
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    ownerEmail: "",
    ownerName: "",
    maxProfessionals: 3,
    maxStudents: 50,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  function handleNameChange(name: string) {
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setForm((prev) => ({ ...prev, name, slug }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const res = await fetch("/api/master/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar organiza\u00e7\u00e3o")
        return
      }

      onCreated(data.credentials)
    } catch {
      setError("Erro de conex\u00e3o")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {createdCreds ? "Organiza\u00e7\u00e3o Criada" : "Nova Organiza\u00e7\u00e3o"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCreds ? (
          /* ═══ SUCCESS — Show credentials ═══ */
          <div className="p-6 space-y-5">
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
              <p className="text-emerald-400 text-sm font-medium mb-1">Organiza{"\u00e7\u00e3"}o criada com sucesso!</p>
              <p className="text-neutral-500 text-xs">Salve as credenciais abaixo. A senha n{"\u00e3"}o poder{"\u00e1"} ser recuperada.</p>
            </div>

            <div className="space-y-3">
              <CredentialRow
                label="Email"
                value={createdCreds.email}
                copied={copiedField === "email"}
                onCopy={() => onCopy(createdCreds.email, "email")}
              />
              <CredentialRow
                label="Senha"
                value={createdCreds.password}
                copied={copiedField === "password"}
                onCopy={() => onCopy(createdCreds.password, "password")}
              />
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-violet-600/10 text-violet-400 text-sm font-medium border border-violet-500/15 hover:bg-violet-600/20 transition-all duration-200"
            >
              Fechar
            </button>
          </div>
        ) : (
          /* ═══ FORM ═══ */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <FormField label="Nome da Organiza\u00e7\u00e3o" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Victor Personal"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
                required
              />
            </FormField>

            <FormField label="Slug (URL)">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="victor-personal"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all font-mono text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nome do Dono" required>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                  placeholder="Victor Silva"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
                  required
                />
              </FormField>
              <FormField label="Email do Dono" required>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))}
                  placeholder="victor@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/30 transition-all"
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Max Profissionais">
                <input
                  type="number"
                  value={form.maxProfessionals}
                  onChange={(e) => setForm((p) => ({ ...p, maxProfessionals: Number(e.target.value) }))}
                  min={1}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                />
              </FormField>
              <FormField label="Max Alunos">
                <input
                  type="number"
                  value={form.maxStudents}
                  onChange={(e) => setForm((p) => ({ ...p, maxStudents: Number(e.target.value) }))}
                  min={1}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-violet-500/30 transition-all"
                />
              </FormField>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:from-violet-500 hover:to-violet-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Criar Organiza{"\u00e7\u00e3"}o
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ═══ CREDENTIAL ROW ═══ */
function CredentialRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-white text-sm font-mono truncate">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="p-2 rounded-lg text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all shrink-0"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

/* ═══ FORM FIELD WRAPPER ═══ */
function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5">
        {label}
        {required && <span className="text-violet-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
