"use client"

import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { Input, Textarea, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check, KeyRound } from "lucide-react"

interface StudentFormData {
  name: string
  email: string
  phone: string
  password: string
  birthDate: string
  gender: string
  weight: string
  height: string
  goals: string
  restrictions: string
  notes: string
}

interface StudentFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    name: string
    email: string
    phone: string
    birthDate: string
    gender: string
    weight: string
    height: string
    goals: string
    restrictions: string
    notes: string
  }
}

const INITIAL_FORM: StudentFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  birthDate: "",
  gender: "",
  weight: "",
  height: "",
  goals: "",
  restrictions: "",
  notes: "",
}

export function StudentForm({ open, onClose, onSuccess, editData }: StudentFormProps) {
  const isEdit = !!editData
  const [form, setForm] = useState<StudentFormData>(
    editData
      ? { ...INITIAL_FORM, ...editData, password: "" }
      : INITIAL_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nome e email são obrigatórios")
      return
    }

    setLoading(true)
    setError("")

    try {
      const url = isEdit
        ? `/api/admin/students/${editData.id}`
        : "/api/admin/students"
      const method = isEdit ? "PUT" : "POST"

      const body: Record<string, unknown> = { ...form }
      if (!body.password) delete body.password

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Algo deu errado")

      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword)
      } else {
        onSuccess()
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setError("")
    setGeneratedPassword("")
    setCopied(false)
    onClose()
  }

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(generatedPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePasswordDone = () => {
    onSuccess()
    handleClose()
  }

  // Success state — show generated password
  if (generatedPassword) {
    return (
      <Modal open={open} onClose={handlePasswordDone} title="Aluno Criado">
        <div className="space-y-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-300">Senha gerada automaticamente</p>
                <p className="text-xs text-neutral-500">Compartilhe com o aluno</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-black/30 px-3 py-2 text-sm text-white font-mono tracking-wider">
                {generatedPassword}
              </code>
              <button
                onClick={handleCopyPassword}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button fullWidth onClick={handlePasswordDone}>
            Pronto
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar Aluno" : "Novo Aluno"}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Personal Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-red-500" />
            <h3 className="text-sm font-medium text-neutral-300">Informações Pessoais</h3>
          </div>
          <div className="rounded-xl border border-neutral-800/50 bg-white/[0.02] p-4 space-y-3 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Nome *</label>
                <Input
                  placeholder="Nome completo"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Email *</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Telefone</label>
                <Input
                  placeholder="(85) 99999-9999"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">
                  {isEdit ? "Nova Senha" : "Senha"}
                </label>
                <Input
                  type="password"
                  placeholder={isEdit ? "Deixe em branco para manter" : "Auto-gerar se vazio"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Data de Nascimento</label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  className="[color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Sexo</label>
                <Select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="" className="bg-[#111]">Selecionar...</option>
                  <option value="MALE" className="bg-[#111]">Masculino</option>
                  <option value="FEMALE" className="bg-[#111]">Feminino</option>
                  <option value="OTHER" className="bg-[#111]">Outro</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-blue-500" />
            <h3 className="text-sm font-medium text-neutral-300">Informações Físicas</h3>
          </div>
          <div className="rounded-xl border border-neutral-800/50 bg-white/[0.02] p-4 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={form.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Altura (cm)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="175.0"
                  value={form.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Training Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-purple-500" />
            <h3 className="text-sm font-medium text-neutral-300">Informações de Treino</h3>
          </div>
          <div className="rounded-xl border border-neutral-800/50 bg-white/[0.02] p-4 space-y-3 backdrop-blur-sm">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Objetivos</label>
              <Textarea
                placeholder="Ex: Perder peso, ganhar massa muscular, melhorar resistência..."
                value={form.goals}
                onChange={(e) => handleChange("goals", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Restrições / Lesões</label>
              <Textarea
                placeholder="Ex: Lesão no joelho, dor lombar..."
                value={form.restrictions}
                onChange={(e) => handleChange("restrictions", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5">Observações</label>
              <Textarea
                placeholder="Observações adicionais..."
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? "Salvar Alterações" : "Criar Aluno"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
