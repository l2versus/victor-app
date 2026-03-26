"use client"

import { useState } from "react"
import {
  Brain, Loader2, FileText, AlertTriangle, Shield,
  Stethoscope, ClipboardList, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"

export function AIAnamnesisAnalyzer({ studentId, assessmentId }: { studentId?: string; assessmentId?: string }) {
  const [rawText, setRawText] = useState("")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState("")
  const [error, setError] = useState("")

  async function handleAnalyze() {
    if (!rawText && !assessmentId) return
    setLoading(true)
    setError("")
    setAnalysis("")

    try {
      const res = await fetch("/api/admin/ai/analyze-anamnesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, assessmentId, rawText }),
      })

      const data = await res.json()
      if (data.analysis) {
        setAnalysis(data.analysis)
      } else {
        setError("Erro ao analisar anamnese")
      }
    } catch {
      setError("Falha na conexao com IA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
          </div>
          Análise de Anamnese com IA
        </h3>

        {!assessmentId && (
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> Dados da anamnese
            </label>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui os dados da anamnese do aluno: histórico médico, lesões, medicamentos, hábitos, etc..."
              rows={6}
            />
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={(!rawText && !assessmentId) || loading}
          fullWidth
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analisar com IA
            </>
          )}
        </Button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Result */}
      {analysis && (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#111] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-bold">Resultado da Análise</h3>
          </div>

          <div className="prose prose-invert prose-sm max-w-none">
            {analysis.split("\n").map((line, i) => {
              if (line.startsWith("## ") || line.startsWith("### ")) {
                const icon = line.includes("ABSOLUT") ? (
                  <Shield className="w-4 h-4 text-red-400 inline mr-1" />
                ) : line.includes("RELATIV") ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-400 inline mr-1" />
                ) : line.includes("ATENCAO") ? (
                  <FileText className="w-4 h-4 text-blue-400 inline mr-1" />
                ) : line.includes("RECOMEND") ? (
                  <Stethoscope className="w-4 h-4 text-emerald-400 inline mr-1" />
                ) : null

                return (
                  <h4
                    key={i}
                    className="text-white font-semibold text-sm mt-4 mb-2 flex items-center gap-1 border-b border-neutral-800 pb-1"
                  >
                    {icon}
                    {line.replace(/^#+\s*/, "")}
                  </h4>
                )
              }

              if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                  <div key={i} className="flex items-start gap-2 text-neutral-300 text-sm mb-1 pl-2">
                    <span className="text-emerald-500 mt-1.5 shrink-0">•</span>
                    <span>{line.replace(/^[-*]\s*/, "")}</span>
                  </div>
                )
              }

              if (line.trim() === "") return <div key={i} className="h-2" />

              return (
                <p key={i} className="text-neutral-400 text-sm leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
