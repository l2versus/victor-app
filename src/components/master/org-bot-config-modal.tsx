"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Select } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  Bot,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  DollarSign,
  Shield,
  Eye,
} from "lucide-react"

// ═══ Types ═══

interface PlanConfig {
  name: string
  price: number
  features: string[]
}

interface OrgBotConfig {
  botName: string
  botPersonality: string
  botGreeting: string
  botLanguageStyle: "formal" | "informal" | "tecnico"
  prices: {
    plans: PlanConfig[]
  }
  customRules: string[]
  whatsappNumber: string
  workingHours: string
  offHoursMessage: string
}

interface OrgBotConfigModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}

const DEFAULT_CONFIG: OrgBotConfig = {
  botName: "",
  botPersonality: "",
  botGreeting: "",
  botLanguageStyle: "informal",
  prices: { plans: [] },
  customRules: [],
  whatsappNumber: "",
  workingHours: "08:00-18:00",
  offHoursMessage: "Estamos fora do horario de atendimento. Retornaremos em breve!",
}

// ═══ Component ═══

export function OrgBotConfigModal({
  open,
  onClose,
  organizationId,
  organizationName,
}: OrgBotConfigModalProps) {
  const [config, setConfig] = useState<OrgBotConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Load existing config
  useEffect(() => {
    if (!open) return

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/master/organizations/${organizationId}/bot-config`)
        if (res.ok) {
          const data = await res.json()
          if (data.botConfig) {
            setConfig({ ...DEFAULT_CONFIG, ...data.botConfig })
          } else {
            setConfig(DEFAULT_CONFIG)
          }
        }
      } catch {
        toast.error("Erro", "Nao foi possivel carregar a configuracao")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, organizationId])

  const updateField = useCallback(
    <K extends keyof OrgBotConfig>(field: K, value: OrgBotConfig[K]) => {
      setConfig((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // ═══ Plan management ═══

  const addPlan = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      prices: {
        plans: [...prev.prices.plans, { name: "", price: 0, features: [] }],
      },
    }))
  }, [])

  const removePlan = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      prices: {
        plans: prev.prices.plans.filter((_, i) => i !== index),
      },
    }))
  }, [])

  const updatePlan = useCallback(
    (index: number, field: keyof PlanConfig, value: string | number | string[]) => {
      setConfig((prev) => ({
        ...prev,
        prices: {
          plans: prev.prices.plans.map((p, i) =>
            i === index ? { ...p, [field]: value } : p
          ),
        },
      }))
    },
    []
  )

  const addPlanFeature = useCallback(
    (planIndex: number) => {
      const plans = [...config.prices.plans]
      plans[planIndex] = {
        ...plans[planIndex],
        features: [...plans[planIndex].features, ""],
      }
      setConfig((prev) => ({ ...prev, prices: { plans } }))
    },
    [config.prices.plans]
  )

  const updatePlanFeature = useCallback(
    (planIndex: number, featureIndex: number, value: string) => {
      const plans = [...config.prices.plans]
      const features = [...plans[planIndex].features]
      features[featureIndex] = value
      plans[planIndex] = { ...plans[planIndex], features }
      setConfig((prev) => ({ ...prev, prices: { plans } }))
    },
    [config.prices.plans]
  )

  const removePlanFeature = useCallback(
    (planIndex: number, featureIndex: number) => {
      const plans = [...config.prices.plans]
      plans[planIndex] = {
        ...plans[planIndex],
        features: plans[planIndex].features.filter((_, i) => i !== featureIndex),
      }
      setConfig((prev) => ({ ...prev, prices: { plans } }))
    },
    [config.prices.plans]
  )

  // ═══ Custom rules management ═══

  const addRule = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      customRules: [...prev.customRules, ""],
    }))
  }, [])

  const updateRule = useCallback((index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      customRules: prev.customRules.map((r, i) => (i === index ? value : r)),
    }))
  }, [])

  const removeRule = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index),
    }))
  }, [])

  // ═══ Save ═══

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/master/organizations/${organizationId}/bot-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botConfig: config }),
      })

      if (res.ok) {
        toast.success("Salvo!", "Configuracao do bot atualizada")
        onClose()
      } else {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }))
        toast.error("Erro", data.error || "Nao foi possivel salvar")
      }
    } catch {
      toast.error("Erro de conexao", "Nao foi possivel conectar ao servidor")
    } finally {
      setSaving(false)
    }
  }, [config, organizationId, onClose])

  return (
    <Modal open={open} onClose={onClose} title={`Bot Config — ${organizationName}`} className="max-w-2xl">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-1/2 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Identidade do Bot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Nome do bot</label>
                <Input
                  placeholder="Ex: Dr. Joao"
                  value={config.botName}
                  onChange={(e) => updateField("botName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Estilo de linguagem</label>
                <Select
                  value={config.botLanguageStyle}
                  onChange={(e) =>
                    updateField(
                      "botLanguageStyle",
                      e.target.value as "formal" | "informal" | "tecnico"
                    )
                  }
                >
                  <option value="formal">Formal</option>
                  <option value="informal">Informal</option>
                  <option value="tecnico">Tecnico</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Personalidade</label>
              <Input
                placeholder="Ex: Profissional e acolhedor"
                value={config.botPersonality}
                onChange={(e) => updateField("botPersonality", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Saudacao inicial</label>
              <Textarea
                placeholder="Ex: Ola! Sou o Dr. Joao, seu personal trainer..."
                value={config.botGreeting}
                onChange={(e) => updateField("botGreeting", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </section>

          {/* WhatsApp / Hours */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              WhatsApp e Horario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Numero WhatsApp</label>
                <Input
                  placeholder="5511999999999"
                  value={config.whatsappNumber}
                  onChange={(e) => updateField("whatsappNumber", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Horario de atendimento</label>
                <Input
                  placeholder="08:00-18:00"
                  value={config.workingHours}
                  onChange={(e) => updateField("workingHours", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Mensagem fora do horario</label>
              <Textarea
                placeholder="Estamos fora do horario..."
                value={config.offHoursMessage}
                onChange={(e) => updateField("offHoursMessage", e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </section>

          {/* Plans */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Planos ({config.prices.plans.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={addPlan}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {config.prices.plans.length === 0 && (
              <p className="text-xs text-neutral-600 text-center py-4">
                Nenhum plano configurado. Clique em &ldquo;Adicionar&rdquo; para criar.
              </p>
            )}

            {config.prices.plans.map((plan, planIdx) => (
              <div
                key={planIdx}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-400">
                    Plano {planIdx + 1}
                  </span>
                  <button
                    onClick={() => removePlan(planIdx)}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nome do plano"
                    value={plan.name}
                    onChange={(e) => updatePlan(planIdx, "name", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Preco"
                    value={plan.price || ""}
                    onChange={(e) =>
                      updatePlan(planIdx, "price", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">Funcionalidades</span>
                    <button
                      onClick={() => addPlanFeature(planIdx)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      + Adicionar
                    </button>
                  </div>
                  {plan.features.map((feat, featIdx) => (
                    <div key={featIdx} className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder="Ex: Acesso ao app"
                        value={feat}
                        onChange={(e) =>
                          updatePlanFeature(planIdx, featIdx, e.target.value)
                        }
                      />
                      <button
                        onClick={() => removePlanFeature(planIdx, featIdx)}
                        className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Custom Rules */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Regras Customizadas ({config.customRules.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={addRule}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {config.customRules.length === 0 && (
              <p className="text-xs text-neutral-600 text-center py-4">
                Nenhuma regra customizada. Clique em &ldquo;Adicionar&rdquo; para criar.
              </p>
            )}

            {config.customRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Ex: Nunca mencionar concorrentes"
                  value={rule}
                  onChange={(e) => updateRule(idx, e.target.value)}
                />
                <button
                  onClick={() => removeRule(idx)}
                  className="shrink-0 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </section>

          {/* Preview */}
          <section className="space-y-3">
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Esconder" : "Visualizar"} saudacao
            </button>

            {showPreview && (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                    <MessageSquare className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-violet-400 mb-1">
                      {config.botName || "Bot"}
                    </p>
                    <p className="text-sm text-neutral-300">
                      {config.botGreeting || "(Saudacao nao configurada)"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={saving}
              onClick={handleSave}
              className={cn(
                "bg-violet-600 hover:bg-violet-500 active:bg-violet-700",
                "focus-visible:ring-violet-500"
              )}
            >
              Salvar Configuracao
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
