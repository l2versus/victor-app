"use client"

import { useState } from "react"
import { ClipboardList, Plus, Ruler, Trash2, ChevronDown, User, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  weight: number | null
  birthDate: string | null
  gender: string | null
}

interface Assessment {
  id: string
  studentId: string
  studentName: string
  type: string
  title: string | null
  data: Record<string, unknown>
  notes: string | null
  createdAt: string
}

interface Props {
  students: Student[]
  initialAssessments: Assessment[]
}

const SKINFOLD_SITES = [
  { key: "triceps", label: "Tricipital", emoji: "💪", desc: "Parte posterior do braço" },
  { key: "subscapular", label: "Subescapular", emoji: "🔙", desc: "Abaixo da escápula" },
  { key: "pectoral", label: "Peitoral", emoji: "🫁", desc: "Linha axilar/mamilo" },
  { key: "midaxillary", label: "Axilar Média", emoji: "📐", desc: "Linha axilar média" },
  { key: "suprailiac", label: "Suprailíaca", emoji: "📍", desc: "Acima da crista ilíaca" },
  { key: "abdominal", label: "Abdominal", emoji: "🎯", desc: "2cm lateral ao umbigo" },
  { key: "thigh", label: "Coxa", emoji: "🦵", desc: "Ponto médio anterior" },
]

export function AssessmentsManager({ students, initialAssessments }: Props) {
  const [assessments, setAssessments] = useState(initialAssessments)
  const [showForm, setShowForm] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [saving, setSaving] = useState(false)
  const [folds, setFolds] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  async function handleSave() {
    if (!selectedStudent) return

    const data: Record<string, number> = {}
    let allFilled = true
    for (const site of SKINFOLD_SITES) {
      const val = parseFloat(folds[site.key] || "")
      if (isNaN(val) || val <= 0) {
        allFilled = false
        break
      }
      data[site.key] = val
    }

    if (!allFilled) {
      alert("Preencha todas as 7 dobras com valores válidos (mm)")
      return
    }

    // Add student context for calculation
    if (selectedStudentData?.weight) data.weight = selectedStudentData.weight
    if (selectedStudentData?.gender) (data as Record<string, unknown>).gender = selectedStudentData.gender
    if (selectedStudentData?.birthDate) {
      const age = Math.floor((Date.now() - new Date(selectedStudentData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      data.age = age
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          type: "SKINFOLD",
          data,
          notes: notes || null,
        }),
      })

      if (!res.ok) throw new Error("Failed")

      const { assessment } = await res.json()
      setAssessments(prev => [{
        id: assessment.id,
        studentId: assessment.studentId,
        studentName: selectedStudentData?.name || "",
        type: assessment.type,
        title: assessment.title,
        data: assessment.data,
        notes: assessment.notes,
        createdAt: assessment.createdAt,
      }, ...prev])

      setShowForm(false)
      setFolds({})
      setNotes("")
      setSelectedStudent("")
    } catch {
      alert("Erro ao salvar avaliação")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta avaliação?")) return
    try {
      await fetch(`/api/admin/assessments/${id}`, { method: "DELETE" })
      setAssessments(prev => prev.filter(a => a.id !== id))
    } catch {
      alert("Erro ao excluir")
    }
  }

  const skinfoldAssessments = assessments.filter(a => a.type === "SKINFOLD")

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-400" />
            Avaliações
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Dobras cutâneas · Protocolo Pollock 7 dobras
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Avaliação
        </button>
      </div>

      {/* New Assessment Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-500/20 bg-red-600/[0.04] p-4 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Ruler className="w-4 h-4 text-red-400" />
            Dobras Cutâneas — Pollock 7
          </h2>

          {/* Student select */}
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Aluno</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-red-500/40"
            >
              <option value="">Selecione o aluno...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <>
              {/* Student info */}
              {selectedStudentData && (
                <div className="flex gap-3 text-[10px] text-neutral-500">
                  {selectedStudentData.weight && <span>Peso: {selectedStudentData.weight}kg</span>}
                  {selectedStudentData.gender && <span>Sexo: {selectedStudentData.gender === "MALE" ? "M" : "F"}</span>}
                  {selectedStudentData.birthDate && (
                    <span>Idade: {Math.floor((Date.now() - new Date(selectedStudentData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos</span>
                  )}
                </div>
              )}

              {/* 7 skinfold inputs */}
              <div className="grid grid-cols-2 gap-2">
                {SKINFOLD_SITES.map(site => (
                  <div key={site.key} className="relative">
                    <label className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5 block">
                      {site.emoji} {site.label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      placeholder="mm"
                      value={folds[site.key] || ""}
                      onChange={e => setFolds(prev => ({ ...prev, [site.key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-red-500/40"
                    />
                    <span className="absolute right-2 top-[1.6rem] text-[9px] text-neutral-600">mm</span>
                  </div>
                ))}
              </div>

              {/* Sum preview */}
              {Object.keys(folds).length > 0 && (
                <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-400">
                  Soma parcial: <span className="text-white font-bold">
                    {SKINFOLD_SITES.reduce((sum, s) => sum + (parseFloat(folds[s.key] || "0") || 0), 0).toFixed(1)}mm
                  </span>
                  {" · "}{Object.values(folds).filter(v => v && parseFloat(v) > 0).length}/7 dobras
                </div>
              )}

              {/* Notes */}
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações (opcional)..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-neutral-700 focus:outline-none focus:border-red-500/40 resize-none"
              />

              {/* Save */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Calculando..." : "Salvar e Calcular % Gordura"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setFolds({}); setNotes("") }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-neutral-400 text-sm hover:bg-white/[0.08] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Assessment History */}
      {skinfoldAssessments.length === 0 && !showForm && (
        <div className="text-center py-16">
          <Ruler className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Nenhuma avaliação registrada</p>
          <p className="text-neutral-600 text-xs mt-1">Clique em &quot;Nova Avaliação&quot; para começar</p>
        </div>
      )}

      <div className="space-y-2">
        {skinfoldAssessments.map(a => {
          const d = a.data
          const isExpanded = expandedId === a.id
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-xl border transition-all",
                isExpanded
                  ? "border-red-500/20 bg-red-600/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Ruler className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-neutral-600" />
                    <p className="text-sm font-medium text-white truncate">{a.studentName}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {d.bodyFatPercent != null && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        (d.bodyFatPercent as number) < 15 ? "bg-emerald-600/20 text-emerald-400" :
                        (d.bodyFatPercent as number) < 25 ? "bg-amber-600/20 text-amber-400" :
                        "bg-red-600/20 text-red-400"
                      )}>
                        {String(d.bodyFatPercent)}% gordura
                      </span>
                    )}
                    {typeof d.classification === "string" && (
                      <span className="text-[10px] text-neutral-500">{d.classification}</span>
                    )}
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-neutral-600 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-white/[0.04] pt-3">
                  {/* Results grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <ResultCard label="% Gordura" value={`${d.bodyFatPercent}%`} />
                    <ResultCard label="Massa Gorda" value={`${d.fatMassKg}kg`} />
                    <ResultCard label="Massa Magra" value={`${d.leanMassKg}kg`} />
                  </div>

                  {/* Folds detail */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {SKINFOLD_SITES.map(site => (
                      <div key={site.key} className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
                        <p className="text-[8px] text-neutral-600 uppercase">{site.label}</p>
                        <p className="text-xs font-bold text-white">{String(d[site.key] ?? "-")}mm</p>
                      </div>
                    ))}
                    <div className="px-2 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-center">
                      <p className="text-[8px] text-red-400 uppercase">Soma</p>
                      <p className="text-xs font-bold text-red-400">{String(d.sum7 ?? "-")}mm</p>
                    </div>
                  </div>

                  {/* Protocol info */}
                  <div className="flex items-center justify-between text-[9px] text-neutral-600">
                    <span>{String(d.protocol || "Pollock 7")} · {String(d.formula || "Siri")}</span>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="flex items-center gap-1 text-red-500/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>

                  {a.notes && (
                    <p className="text-[10px] text-neutral-500 italic">{a.notes}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
      <p className="text-[9px] text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
    </div>
  )
}
