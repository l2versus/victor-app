"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Dumbbell,
  Loader2,
  Download,
  ArrowRight,
  Eye,
  Sparkles,
  Copy,
  Check,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"

type ImportStep = "upload" | "preview" | "importing" | "results"

interface ParsedStudent {
  name: string
  email?: string | null
  phone?: string | null
  birthDate?: string | null
  gender?: string | null
  weight?: number | null
  height?: number | null
  goals?: string | null
  restrictions?: string[] | null
  notes?: string | null
}

interface ParsedWorkout {
  studentName: string
  workoutName: string
  workoutType?: string | null
  exercises: {
    name: string
    muscle?: string | null
    sets?: number | null
    reps?: string | null
    load?: number | null
    rest?: number | null
    notes?: string | null
  }[]
}

interface PreviewData {
  students: ParsedStudent[]
  workouts: ParsedWorkout[]
  warnings: string[]
}

interface ImportResults {
  studentsCreated: number
  studentsSkipped: number
  workoutsCreated: number
  exercisesMatched: number
  exercisesCreated: number
  errors: string[]
  warnings: string[]
  credentials: { name: string; email: string; password: string }[]
}

export function ImportClient() {
  const [step, setStep] = useState<ImportStep>("upload")
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [copiedCreds, setCopiedCreds] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readFile = useCallback((file: File) => {
    setError("")

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo 5MB.")
      return
    }

    const validTypes = [
      "text/csv",
      "text/plain",
      "application/csv",
      "text/tab-separated-values",
    ]
    const validExtensions = [".csv", ".txt", ".tsv"]
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError("Formato não suportado. Use CSV ou TXT.")
      return
    }

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text || text.trim().length < 10) {
        setError("Arquivo parece estar vazio ou corrompido.")
        return
      }
      setFileContent(text)
    }
    reader.onerror = () => setError("Erro ao ler o arquivo.")
    reader.readAsText(file, "UTF-8")
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) readFile(file)
    },
    [readFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) readFile(file)
    },
    [readFile]
  )

  const handlePreview = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/import/mfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, fileName, preview: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao processar arquivo")
      setPreview(data.parsed)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setStep("importing")
    setError("")
    try {
      const res = await fetch("/api/admin/import/mfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent, fileName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao importar")
      setResults(data.results)
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      setStep("preview")
    }
  }

  const handleReset = () => {
    setStep("upload")
    setFileName("")
    setFileContent("")
    setPreview(null)
    setResults(null)
    setError("")
    setCopiedCreds(false)
  }

  const loadSampleData = () => {
    const sampleCsv = `Nome,Email,Telefone,Data Nascimento,Sexo,Peso(kg),Altura(cm),Objetivo,Restrições,Treino,Tipo Treino,Exercício,Séries,Repetições,Carga(kg),Descanso(s),Observação
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino A - Peito/Tríceps","Push","Supino Reto com Barra",4,"8-10",80,90,"Controlar a descida"
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino A - Peito/Tríceps","Push","Supino Inclinado com Halteres",4,"10-12",30,90,"Não passar de 90 graus"
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino A - Peito/Tríceps","Push","Crossover",3,"12-15",25,60,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino A - Peito/Tríceps","Push","Tríceps Pulley",3,"10-12",30,60,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino A - Peito/Tríceps","Push","Tríceps Testa",3,"10-12",20,60,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino B - Costas/Bíceps","Pull","Puxada Frontal",4,"8-10",60,90,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino B - Costas/Bíceps","Pull","Remada Curvada",4,"8-10",50,90,"Manter lombar neutra"
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino B - Costas/Bíceps","Pull","Remada Unilateral",3,"10-12",28,60,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino B - Costas/Bíceps","Pull","Rosca Direta com Barra",3,"10-12",25,60,""
"Rafael Souza","rafael.souza@gmail.com","(85) 98877-6655","1995-03-12","M",82,178,"Hipertrofia e definição","Tendinite no ombro esquerdo","Treino B - Costas/Bíceps","Pull","Rosca Martelo",3,"10-12",14,60,""
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino A - Inferior","Legs","Leg Press 45°",4,"12-15",120,90,"Amplitude reduzida"
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino A - Inferior","Legs","Cadeira Extensora",3,"15",30,60,"Evitar extensão total"
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino A - Inferior","Legs","Mesa Flexora",3,"12-15",25,60,""
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino A - Inferior","Legs","Elevação Pélvica",3,"15",40,60,"Foco no glúteo"
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino B - Superior","Upper","Puxada Frontal",3,"12",35,60,""
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino B - Superior","Upper","Remada Baixa",3,"12",30,60,""
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino B - Superior","Upper","Supino Máquina",3,"12",20,60,""
"Fernanda Lima","fernanda.lima@hotmail.com","(85) 99765-4321","1990-07-22","F",63,165,"Emagrecimento e tonificação","Hérnia de disco L5-S1; Condromalácia patelar grau 2","Treino B - Superior","Upper","Elevação Lateral",3,"15",6,60,"Sem compensar com trapézio"
"Pedro Henrique Costa","","(85) 99888-1122","2000-11-05","M",95,185,"Força e hipertrofia","","Treino A - Full Body","Full Body","Agachamento Livre",5,"5",100,180,"Progressão linear"
"Pedro Henrique Costa","","(85) 99888-1122","2000-11-05","M",95,185,"Força e hipertrofia","","Treino A - Full Body","Full Body","Supino Reto com Barra",5,"5",90,180,""
"Pedro Henrique Costa","","(85) 99888-1122","2000-11-05","M",95,185,"Força e hipertrofia","","Treino A - Full Body","Full Body","Barra Fixa",4,"6-8",,90,"Adicionar carga quando fizer 8"
"Pedro Henrique Costa","","(85) 99888-1122","2000-11-05","M",95,185,"Força e hipertrofia","","Treino A - Full Body","Full Body","Desenvolvimento com Halteres",4,"8-10",28,90,""
"Pedro Henrique Costa","","(85) 99888-1122","2000-11-05","M",95,185,"Força e hipertrofia","","Treino A - Full Body","Full Body","Levantamento Terra",3,"5",120,180,"Cinto obrigatório"`
    setFileContent(sampleCsv)
    setFileName("exemplo-mfit-export.csv")
    setError("")
  }

  const copyCredentials = () => {
    if (!results?.credentials.length) return
    const text = results.credentials
      .map((c) => `${c.name}\nEmail: ${c.email}\nSenha: ${c.password}\n`)
      .join("\n---\n\n")
    navigator.clipboard.writeText(text)
    setCopiedCreds(true)
    setTimeout(() => setCopiedCreds(false), 2000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar do MFIT"
        description="Migre seus alunos e treinos do MFIT automaticamente com IA."
      />

      {/* Upload Step */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Instructions */}
          <Card className="border-neutral-800/50">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
                <Sparkles className="h-5 w-5 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">
                  Como funciona
                </h3>
                <ol className="space-y-1.5 text-[13px] text-neutral-400">
                  <li className="flex gap-2">
                    <span className="font-mono text-red-400/80">1.</span>
                    Exporte seus dados do MFIT (CSV, relatório, ou copie do app)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono text-red-400/80">2.</span>
                    Faça upload do arquivo aqui
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono text-red-400/80">3.</span>
                    Nossa IA analisa e organiza todos os dados automaticamente
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono text-red-400/80">4.</span>
                    Revise o preview e confirme a importação
                  </li>
                </ol>
                <button
                  onClick={loadSampleData}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/20 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Carregar exemplo (3 alunos com treinos)
                </button>
              </div>
            </div>
          </Card>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
              dragOver
                ? "border-red-500 bg-red-500/5"
                : fileContent
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-neutral-700 bg-[#111] hover:border-neutral-600 hover:bg-white/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {fileContent ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <FileText className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {(fileContent.length / 1024).toFixed(1)}KB de texto
                    extraído
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2"
                >
                  Trocar arquivo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                  <Upload className="h-7 w-7 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    CSV, TXT — Exportado do MFIT
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Paste Area */}
          <Card>
            <p className="text-xs text-neutral-500 mb-2">
              Ou cole o conteúdo copiado do MFIT diretamente:
            </p>
            <textarea
              value={fileContent && !fileName.endsWith(".csv") ? "" : ""}
              onChange={(e) => {
                setFileContent(e.target.value)
                setFileName("colado-mfit.txt")
              }}
              placeholder="Cole aqui os dados exportados do MFIT (tabela de alunos, treinos, etc)..."
              className="w-full h-32 rounded-xl border border-neutral-800 bg-black/40 px-4 py-3 text-[13px] text-neutral-300 placeholder:text-neutral-600 focus:border-red-500/50 focus:outline-none resize-none"
            />
          </Card>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Action */}
          <div className="flex justify-end">
            <Button
              onClick={handlePreview}
              disabled={!fileContent || loading}
              size="md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Analisar e Pré-visualizar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && preview && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {preview.students.length}
                </p>
                <p className="text-xs text-neutral-400">
                  Alunos encontrados
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Dumbbell className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {preview.workouts.length}
                </p>
                <p className="text-xs text-neutral-400">
                  Treinos encontrados
                </p>
              </div>
            </Card>
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400 mb-2">
                    Avisos da análise
                  </p>
                  <ul className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-yellow-400/70">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Students Table */}
          {preview.students.length > 0 && (
            <Card>
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-400" />
                Alunos para importar
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">
                        Nome
                      </th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">
                        Email
                      </th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">
                        Telefone
                      </th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">
                        Objetivo
                      </th>
                      <th className="text-right py-2 px-3 text-neutral-500 font-medium">
                        Peso
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.students.map((s, i) => (
                      <tr
                        key={i}
                        className="border-b border-neutral-800/50 last:border-0"
                      >
                        <td className="py-2.5 px-3 text-white font-medium">
                          {s.name}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {s.email || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400">
                          {s.phone || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400 max-w-[200px] truncate">
                          {s.goals || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-400 text-right">
                          {s.weight ? `${s.weight}kg` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Workouts */}
          {preview.workouts.length > 0 && (
            <Card>
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-neutral-400" />
                Treinos para importar
              </h3>
              <div className="space-y-3">
                {preview.workouts.map((w, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-neutral-800/50 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">
                        {w.workoutName}
                      </p>
                      <span className="text-xs text-neutral-500">
                        {w.studentName} — {w.exercises.length} exercícios
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {w.exercises.map((ex, j) => (
                        <span
                          key={j}
                          className="inline-flex rounded-lg bg-white/5 px-2 py-1 text-[11px] text-neutral-400"
                        >
                          {ex.name}
                          {ex.sets && ex.reps
                            ? ` · ${ex.sets}x${ex.reps}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              onClick={handleReset}
              size="md"
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              Voltar
            </Button>
            <Button onClick={handleImport} size="md">
              <ArrowRight className="h-4 w-4" />
              Confirmar Importação
            </Button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === "importing" && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-2xl bg-red-600/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-red-400 animate-spin" />
            </div>
            <div className="absolute -inset-4 rounded-3xl border border-red-500/10 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-white mb-2">
            Importando dados...
          </p>
          <p className="text-xs text-neutral-500 max-w-sm">
            Criando contas dos alunos, mapeando exercícios e montando treinos.
            Isso pode levar alguns segundos.
          </p>
        </Card>
      )}

      {/* Results Step */}
      {step === "results" && results && (
        <div className="space-y-6">
          {/* Success Banner */}
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Importação concluída!
                </p>
                <p className="text-xs text-emerald-400/60 mt-0.5">
                  {results.studentsCreated} alunos criados · {results.workoutsCreated} treinos importados · {results.exercisesMatched} exercícios mapeados
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-white">{results.studentsCreated}</p>
              <p className="text-[11px] text-neutral-500 mt-1">Alunos criados</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-white">{results.studentsSkipped}</p>
              <p className="text-[11px] text-neutral-500 mt-1">Já existiam</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-white">{results.workoutsCreated}</p>
              <p className="text-[11px] text-neutral-500 mt-1">Treinos criados</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-2xl font-bold text-white">{results.exercisesCreated}</p>
              <p className="text-[11px] text-neutral-500 mt-1">Novos exercícios</p>
            </Card>
          </div>

          {/* Credentials */}
          {results.credentials.length > 0 && (
            <Card className="border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-400" />
                  Credenciais dos alunos importados
                </h3>
                <button
                  onClick={copyCredentials}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  {copiedCreds ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar tudo
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-black/40 overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Nome</th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Email</th>
                      <th className="text-left py-2 px-3 text-neutral-500 font-medium">Senha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.credentials.map((c, i) => (
                      <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                        <td className="py-2 px-3 text-white">{c.name}</td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-xs">{c.email}</td>
                        <td className="py-2 px-3 text-neutral-400 font-mono text-xs">{c.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-neutral-600 mt-3">
                Salve estas credenciais! Envie para cada aluno para que possam acessar o app.
              </p>
            </Card>
          )}

          {/* Warnings */}
          {results.warnings.length > 0 && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <h3 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Avisos ({results.warnings.length})
              </h3>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {results.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-400/70">{w}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Errors */}
          {results.errors.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Erros ({results.errors.length})
              </h3>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {results.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-400/70">{e}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              onClick={handleReset}
              size="md"
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              Nova Importação
            </Button>
            <Button
              onClick={() => (window.location.href = "/admin/students")}
              size="md"
            >
              <Users className="h-4 w-4" />
              Ver Alunos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
