"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Cpu, Pencil, Check, X, Loader2, Save } from "lucide-react"

type Machine = { slug: string; file: string; name: string; addedAt: string }

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/machines")
      if (res.ok) {
        const data = await res.json()
        setMachines(data.machines)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMachines() }, [fetchMachines])

  async function handleSave(slug: string) {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/machines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: editName }),
      })
      if (res.ok) {
        setMachines(prev => prev.map(m => m.slug === slug ? { ...m, name: editName.trim() } : m))
        setEditing(null)
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  const isUUID = (s: string) => /^[0-9a-f]{8}-/.test(s)

  return (
    <div className="space-y-6">
      <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar
      </button>

      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          Equipamentos Ironberg 3D
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {machines.length} modelos 3D · Renomeie clicando no ícone de edição
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {machines.map(m => {
            const needsRename = isUUID(m.name)
            const isEditing = editing === m.slug

            return (
              <div
                key={m.slug}
                className={`rounded-xl border p-4 transition-all ${
                  needsRename
                    ? "border-amber-500/20 bg-amber-500/[0.03]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 3D icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    needsRename ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                  }`}>
                    3D
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSave(m.slug)}
                          autoFocus
                          className="flex-1 rounded-lg border border-blue-500/30 bg-white/[0.05] px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500/50"
                          placeholder="Nome do equipamento (ex: Leg Press 45°)"
                        />
                        <button
                          onClick={() => handleSave(m.slug)}
                          disabled={saving}
                          className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center hover:bg-blue-600/30 transition-colors"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="w-8 h-8 rounded-lg bg-white/[0.05] text-neutral-500 flex items-center justify-center hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${needsRename ? "text-amber-300" : "text-white"}`}>
                          {m.name}
                        </p>
                        {needsRename && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase">
                            Renomear
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-neutral-600 truncate mt-0.5">
                      {m.file} · {m.addedAt}
                    </p>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => { setEditing(m.slug); setEditName(needsRename ? "" : m.name) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
