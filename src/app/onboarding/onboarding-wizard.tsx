"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User, Phone, Calendar, Ruler, Weight, Camera, Loader2,
  Heart, AlertTriangle, Bone, Pill, HelpCircle,
  ChevronRight, ChevronLeft, Check, Shield, Dumbbell,
  Target, Clock, Zap, Activity,
} from "lucide-react"

/* ═══════════════════════════════════════ */
/*  Types                                 */
/* ═══════════════════════════════════════ */

interface InitialProfile {
  name: string
  email: string
  phone: string
  avatar: string
  birthDate: string
  gender: string
  weight: string
  height: string
}

interface Injury {
  region: string
  type: string
  severity: "mild" | "moderate" | "severe"
  status: "current" | "past"
}

interface Props {
  initialProfile: InitialProfile
  existingScreening: Record<string, unknown> | null
}

const STEPS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "parq", label: "Saúde", icon: Heart },
  { id: "injuries", label: "Lesões", icon: Bone },
  { id: "training", label: "Treino", icon: Dumbbell },
  { id: "terms", label: "Termos", icon: Shield },
] as const

const BODY_REGIONS = [
  { id: "neck", label: "Pescoço" },
  { id: "shoulder_left", label: "Ombro Esq." },
  { id: "shoulder_right", label: "Ombro Dir." },
  { id: "upper_back", label: "Coluna Torácica" },
  { id: "lower_back", label: "Lombar" },
  { id: "elbow_left", label: "Cotovelo Esq." },
  { id: "elbow_right", label: "Cotovelo Dir." },
  { id: "wrist_left", label: "Punho Esq." },
  { id: "wrist_right", label: "Punho Dir." },
  { id: "hip_left", label: "Quadril Esq." },
  { id: "hip_right", label: "Quadril Dir." },
  { id: "knee_left", label: "Joelho Esq." },
  { id: "knee_right", label: "Joelho Dir." },
  { id: "ankle_left", label: "Tornozelo Esq." },
  { id: "ankle_right", label: "Tornozelo Dir." },
]

/* ═══════════════════════════════════════ */
/*  Main Wizard                           */
/* ═══════════════════════════════════════ */

export function OnboardingWizard({ initialProfile, existingScreening }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Profile State ──
  const [name, setName] = useState(initialProfile.name)
  const [phone, setPhone] = useState(initialProfile.phone)
  const [birthDate, setBirthDate] = useState(initialProfile.birthDate)
  const [gender, setGender] = useState(initialProfile.gender)
  const [weight, setWeight] = useState(initialProfile.weight)
  const [height, setHeight] = useState(initialProfile.height)
  const [avatar, setAvatar] = useState(initialProfile.avatar)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── PAR-Q State ──
  const [parqHeartCondition, setParqHeartCondition] = useState(false)
  const [parqChestPain, setParqChestPain] = useState(false)
  const [parqDizziness, setParqDizziness] = useState(false)
  const [parqBoneJoint, setParqBoneJoint] = useState(false)
  const [parqMedication, setParqMedication] = useState(false)
  const [parqOtherReason, setParqOtherReason] = useState(false)

  // ── Injuries State ──
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [medicalNotes, setMedicalNotes] = useState("")

  // ── Training Profile State ──
  const [level, setLevel] = useState("BEGINNER")
  const [goal, setGoal] = useState("HEALTH")
  const [frequency, setFrequency] = useState("3")
  const [equipment, setEquipment] = useState("FULL_GYM")
  const [sessionMinutes, setSessionMinutes] = useState("60")
  const [experienceMonths, setExperienceMonths] = useState("0")

  // ── Terms State ──
  const [liabilityAccepted, setLiabilityAccepted] = useState(false)
  const [lgpdAccepted, setLgpdAccepted] = useState(false)

  const parqHasRisk = parqHeartCondition || parqChestPain || parqDizziness || parqBoneJoint || parqMedication || parqOtherReason

  function canAdvance(): boolean {
    if (step === 0) return !!name.trim() && !!gender && !!birthDate
    if (step === 4) return liabilityAccepted && lgpdAccepted
    return true
  }

  function handleNext() {
    if (!canAdvance()) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      setError("")
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1)
      setError("")
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const compressed = await compressImage(file, 400, 0.7)
      setAvatar(compressed)
    } catch {
      // ignore
    }
    setUploadingAvatar(false)
  }

  function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height: h } = img
        if (width > h) { if (width > maxSize) { h = (h * maxSize) / width; width = maxSize } }
        else { if (h > maxSize) { width = (width * maxSize) / h; h = maxSize } }
        canvas.width = width
        canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, h)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  function addInjury(region: string) {
    if (injuries.some((i) => i.region === region)) {
      setInjuries(injuries.filter((i) => i.region !== region))
    } else {
      setInjuries([...injuries, { region, type: "", severity: "mild", status: "current" }])
    }
  }

  function updateInjury(region: string, field: keyof Injury, value: string) {
    setInjuries(injuries.map((i) => i.region === region ? { ...i, [field]: value } : i))
  }

  async function handleSubmit() {
    if (!canAdvance()) return
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, birthDate, gender, weight, height, avatar,
          parqHeartCondition, parqChestPain, parqDizziness,
          parqBoneJoint, parqMedication, parqOtherReason,
          injuries, surgeries: [], restrictions: [],
          medicalNotes,
          level, goal, frequency, equipment, sessionMinutes, experienceMonths,
          liabilityAccepted, lgpdAccepted,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Erro ao salvar")
        setSaving(false)
        return
      }

      router.refresh()
      router.replace("/today")
    } catch {
      setError("Erro de conexão")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Vamos configurar seu perfil</h1>
        <p className="text-neutral-400 text-sm">
          Precisamos de algumas informações para personalizar sua experiência
        </p>
      </div>

      {/* ═══ STEP INDICATOR ═══ */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : isDone
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "bg-white/5 text-neutral-500"
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-neutral-500"}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ═══ STEP CONTENT ═══ */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm min-h-[400px]">
        {step === 0 && (
          <StepProfile
            name={name} setName={setName}
            phone={phone} setPhone={setPhone}
            birthDate={birthDate} setBirthDate={setBirthDate}
            gender={gender} setGender={setGender}
            weight={weight} setWeight={setWeight}
            height={height} setHeight={setHeight}
            avatar={avatar}
            uploadingAvatar={uploadingAvatar}
            avatarInputRef={avatarInputRef}
            onAvatarUpload={handleAvatarUpload}
          />
        )}
        {step === 1 && (
          <StepParQ
            values={{ parqHeartCondition, parqChestPain, parqDizziness, parqBoneJoint, parqMedication, parqOtherReason }}
            setters={{ setParqHeartCondition, setParqChestPain, setParqDizziness, setParqBoneJoint, setParqMedication, setParqOtherReason }}
            hasRisk={parqHasRisk}
          />
        )}
        {step === 2 && (
          <StepInjuries
            injuries={injuries}
            addInjury={addInjury}
            updateInjury={updateInjury}
            medicalNotes={medicalNotes}
            setMedicalNotes={setMedicalNotes}
          />
        )}
        {step === 3 && (
          <StepTraining
            level={level} setLevel={setLevel}
            goal={goal} setGoal={setGoal}
            frequency={frequency} setFrequency={setFrequency}
            equipment={equipment} setEquipment={setEquipment}
            sessionMinutes={sessionMinutes} setSessionMinutes={setSessionMinutes}
            experienceMonths={experienceMonths} setExperienceMonths={setExperienceMonths}
          />
        )}
        {step === 4 && (
          <StepTerms
            liabilityAccepted={liabilityAccepted}
            setLiabilityAccepted={setLiabilityAccepted}
            lgpdAccepted={lgpdAccepted}
            setLgpdAccepted={setLgpdAccepted}
            parqHasRisk={parqHasRisk}
          />
        )}
      </div>

      {/* ═══ ERROR ═══ */}
      {error && (
        <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ═══ NAVIGATION ═══ */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3.5 rounded-xl bg-white/5 text-neutral-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
          >
            Continuar <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance() || saving}
            className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Salvando..." : "Concluir"}
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Step 1 — Profile                      */
/* ═══════════════════════════════════════ */

function StepProfile({
  name, setName, phone, setPhone, birthDate, setBirthDate,
  gender, setGender, weight, setWeight, height, setHeight,
  avatar, uploadingAvatar, avatarInputRef, onAvatarUpload,
}: {
  name: string; setName: (v: string) => void
  phone: string; setPhone: (v: string) => void
  birthDate: string; setBirthDate: (v: string) => void
  gender: string; setGender: (v: string) => void
  weight: string; setWeight: (v: string) => void
  height: string; setHeight: (v: string) => void
  avatar: string
  uploadingAvatar: boolean
  avatarInputRef: React.RefObject<HTMLInputElement | null>
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold text-white mb-4">Dados Pessoais</h2>

        {/* Avatar */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initials || <User className="w-8 h-8" />
            )}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-600 border-2 border-[#030303] flex items-center justify-center text-white"
          >
            {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <InputField icon={User} label="Nome completo *" value={name} onChange={setName} placeholder="Seu nome" />
      <InputField icon={Phone} label="Telefone" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" />
      <InputField icon={Calendar} label="Data de nascimento *" value={birthDate} onChange={setBirthDate} type="date" />

      {/* Gender selector */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 block">Gênero *</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "MALE", label: "Masculino" },
            { value: "FEMALE", label: "Feminino" },
            { value: "OTHER", label: "Outro" },
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                gender === g.value
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputField icon={Weight} label="Peso (kg)" value={weight} onChange={setWeight} type="number" placeholder="75" />
        <InputField icon={Ruler} label="Altura (cm)" value={height} onChange={setHeight} type="number" placeholder="175" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Step 2 — PAR-Q                        */
/* ═══════════════════════════════════════ */

function StepParQ({
  values,
  setters,
  hasRisk,
}: {
  values: Record<string, boolean>
  setters: Record<string, (v: boolean) => void>
  hasRisk: boolean
}) {
  const questions = [
    { key: "parqHeartCondition", icon: Heart, text: "Algum médico já disse que você tem um problema no coração e que só deveria fazer atividade física supervisionada?" },
    { key: "parqChestPain", icon: AlertTriangle, text: "Você sente dor no peito quando faz atividade física?" },
    { key: "parqDizziness", icon: HelpCircle, text: "No último mês, você sentiu dor no peito quando não estava fazendo atividade física?" },
    { key: "parqBoneJoint", icon: Bone, text: "Você tem algum problema ósseo ou articular que poderia piorar com atividade física?" },
    { key: "parqMedication", icon: Pill, text: "Você toma algum medicamento para pressão arterial ou coração?" },
    { key: "parqOtherReason", icon: HelpCircle, text: "Conhece algum outro motivo pelo qual não deveria fazer atividade física?" },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-white">Questionário PAR-Q</h2>
        <p className="text-neutral-400 text-xs mt-1">Prontidão para Atividade Física</p>
      </div>

      <div className="space-y-3">
        {questions.map((q) => {
          const Icon = q.icon
          const value = values[q.key]
          const setter = setters[`set${q.key.charAt(0).toUpperCase()}${q.key.slice(1)}`]
          return (
            <button
              key={q.key}
              onClick={() => setter(!value)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                value
                  ? "bg-amber-600/10 border-amber-600/30"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  value ? "bg-amber-600/20 text-amber-400" : "bg-white/5 text-neutral-500"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-neutral-200 leading-relaxed flex-1">{q.text}</p>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  value ? "bg-amber-600 border-amber-600" : "border-neutral-600"
                }`}>
                  {value && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasRisk && (
        <div className="bg-amber-600/10 border border-amber-600/20 rounded-xl p-4 mt-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Recomendação médica</p>
              <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
                Com base nas suas respostas, recomendamos que consulte um médico antes de iniciar
                atividade física intensa. Isso não impede o uso do app, mas exercícios serão adaptados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Step 3 — Injuries                     */
/* ═══════════════════════════════════════ */

function StepInjuries({
  injuries,
  addInjury,
  updateInjury,
  medicalNotes,
  setMedicalNotes,
}: {
  injuries: Injury[]
  addInjury: (region: string) => void
  updateInjury: (region: string, field: keyof Injury, value: string) => void
  medicalNotes: string
  setMedicalNotes: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-white">Lesões e Restrições</h2>
        <p className="text-neutral-400 text-xs mt-1">Toque nas regiões que possuem lesão (opcional)</p>
      </div>

      {/* Body region grid */}
      <div className="grid grid-cols-3 gap-2">
        {BODY_REGIONS.map((r) => {
          const selected = injuries.some((i) => i.region === r.id)
          return (
            <button
              key={r.id}
              onClick={() => addInjury(r.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all ${
                selected
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "bg-white/5 text-neutral-400 border border-transparent hover:bg-white/10"
              }`}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      {/* Injury details */}
      {injuries.length > 0 && (
        <div className="space-y-3 mt-3">
          {injuries.map((injury) => {
            const regionLabel = BODY_REGIONS.find((r) => r.id === injury.region)?.label || injury.region
            return (
              <div key={injury.region} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
                <p className="text-sm font-medium text-red-400">{regionLabel}</p>
                <input
                  type="text"
                  placeholder="Tipo de lesão (ex: tendinite, hérnia...)"
                  value={injury.type}
                  onChange={(e) => updateInjury(injury.region, "type", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600/50"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={injury.severity}
                    onChange={(e) => updateInjury(injury.region, "severity", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Grave</option>
                  </select>
                  <select
                    value={injury.status}
                    onChange={(e) => updateInjury(injury.region, "status", e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="current">Atual</option>
                    <option value="past">Passada</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Medical notes */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 block">Observações médicas (opcional)</label>
        <textarea
          value={medicalNotes}
          onChange={(e) => setMedicalNotes(e.target.value)}
          placeholder="Cirurgias, tratamentos, restrições específicas..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600/50 resize-none"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Step 4 — Training Profile             */
/* ═══════════════════════════════════════ */

function StepTraining({
  level, setLevel, goal, setGoal,
  frequency, setFrequency, equipment, setEquipment,
  sessionMinutes, setSessionMinutes, experienceMonths, setExperienceMonths,
}: {
  level: string; setLevel: (v: string) => void
  goal: string; setGoal: (v: string) => void
  frequency: string; setFrequency: (v: string) => void
  equipment: string; setEquipment: (v: string) => void
  sessionMinutes: string; setSessionMinutes: (v: string) => void
  experienceMonths: string; setExperienceMonths: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-white">Perfil de Treino</h2>
        <p className="text-neutral-400 text-xs mt-1">Nos ajuda a personalizar seus treinos</p>
      </div>

      {/* Level */}
      <OptionGroup
        label="Nível de experiência"
        icon={Activity}
        options={[
          { value: "BEGINNER", label: "Iniciante", desc: "< 6 meses" },
          { value: "INTERMEDIATE", label: "Intermediário", desc: "6m - 2 anos" },
          { value: "ADVANCED", label: "Avançado", desc: "> 2 anos" },
        ]}
        value={level}
        onChange={setLevel}
      />

      {/* Goal */}
      <OptionGroup
        label="Objetivo principal"
        icon={Target}
        options={[
          { value: "HYPERTROPHY", label: "Hipertrofia" },
          { value: "FAT_LOSS", label: "Emagrecimento" },
          { value: "HEALTH", label: "Saúde" },
          { value: "PERFORMANCE", label: "Performance" },
          { value: "REHABILITATION", label: "Reabilitação" },
        ]}
        value={goal}
        onChange={setGoal}
      />

      {/* Equipment */}
      <OptionGroup
        label="Equipamento disponível"
        icon={Dumbbell}
        options={[
          { value: "FULL_GYM", label: "Academia completa" },
          { value: "HOME_GYM", label: "Home gym" },
          { value: "BODYWEIGHT", label: "Peso corporal" },
        ]}
        value={equipment}
        onChange={setEquipment}
      />

      {/* Frequency */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Dias por semana
        </label>
        <div className="grid grid-cols-6 gap-2">
          {["2", "3", "4", "5", "6", "7"].map((d) => (
            <button
              key={d}
              onClick={() => setFrequency(d)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                frequency === d
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {d}x
            </button>
          ))}
        </div>
      </div>

      {/* Session time */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Tempo por sessão
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["30", "45", "60", "90"].map((m) => (
            <button
              key={m}
              onClick={() => setSessionMinutes(m)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                sessionMinutes === m
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {m}min
            </button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Experiência com musculação
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "0", label: "Nenhuma" },
            { value: "6", label: "6 meses" },
            { value: "12", label: "1 ano" },
            { value: "24", label: "2+ anos" },
          ].map((o) => (
            <button
              key={o.value}
              onClick={() => setExperienceMonths(o.value)}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                experienceMonths === o.value
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "bg-white/5 text-neutral-400 hover:bg-white/10"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Step 5 — Terms & Liability            */
/* ═══════════════════════════════════════ */

function StepTerms({
  liabilityAccepted, setLiabilityAccepted,
  lgpdAccepted, setLgpdAccepted,
  parqHasRisk,
}: {
  liabilityAccepted: boolean; setLiabilityAccepted: (v: boolean) => void
  lgpdAccepted: boolean; setLgpdAccepted: (v: boolean) => void
  parqHasRisk: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-white">Termos e Responsabilidade</h2>
        <p className="text-neutral-400 text-xs mt-1">Para sua segurança e proteção</p>
      </div>

      {parqHasRisk && (
        <div className="bg-amber-600/10 border border-amber-600/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-300 text-sm font-medium">Atenção</p>
              <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
                Você sinalizou condições de saúde no questionário PAR-Q. Recomendamos buscar
                orientação médica antes de iniciar qualquer programa de exercícios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liability */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          Termo de Responsabilidade
        </h3>
        <div className="text-xs text-neutral-400 leading-relaxed space-y-2 max-h-32 overflow-y-auto pr-2">
          <p>Declaro que todas as informações fornecidas são verdadeiras e completas.</p>
          <p>Estou ciente de que a prática de exercícios físicos envolve riscos inerentes, incluindo mas não limitado a lesões musculares, articulares e cardiovasculares.</p>
          <p>Entendo que este aplicativo não substitui o acompanhamento de um profissional de educação física ou médico.</p>
          <p>Assumo total responsabilidade pela minha decisão de praticar exercícios com base nas orientações fornecidas pelo aplicativo.</p>
          <p>Em caso de qualquer desconforto, dor ou sintoma anormal durante o exercício, me comprometo a interromper imediatamente e buscar orientação médica.</p>
        </div>
        <button
          onClick={() => setLiabilityAccepted(!liabilityAccepted)}
          className="flex items-center gap-3 w-full pt-2 border-t border-white/[0.06]"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            liabilityAccepted ? "bg-emerald-600 border-emerald-600" : "border-neutral-600"
          }`}>
            {liabilityAccepted && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-neutral-200">Li e aceito o termo de responsabilidade</span>
        </button>
      </div>

      {/* LGPD */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Privacidade e Dados (LGPD)
        </h3>
        <div className="text-xs text-neutral-400 leading-relaxed space-y-2">
          <p>Seus dados de saúde serão utilizados exclusivamente para personalizar seus treinos e recomendações.</p>
          <p>A inteligência artificial utiliza suas informações de lesões, restrições e objetivos para gerar treinos seguros e adequados ao seu perfil.</p>
          <p>Você pode solicitar a exclusão dos seus dados a qualquer momento nas configurações do app.</p>
        </div>
        <button
          onClick={() => setLgpdAccepted(!lgpdAccepted)}
          className="flex items-center gap-3 w-full pt-2 border-t border-white/[0.06]"
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            lgpdAccepted ? "bg-emerald-600 border-emerald-600" : "border-neutral-600"
          }`}>
            {lgpdAccepted && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-neutral-200">Autorizo o uso dos meus dados pela IA</span>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════ */
/*  Shared Components                     */
/* ═══════════════════════════════════════ */

function InputField({
  icon: Icon, label, value, onChange, type = "text", placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string
  onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-neutral-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600/50 transition-colors"
      />
    </div>
  )
}

function OptionGroup({
  label, icon: Icon, options, value, onChange,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: { value: string; label: string; desc?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-neutral-400 text-xs font-medium mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`py-2.5 px-2 rounded-xl text-center transition-all ${
              value === o.value
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                : "bg-white/5 text-neutral-400 hover:bg-white/10"
            }`}
          >
            <span className="text-xs font-medium block">{o.label}</span>
            {o.desc && <span className="text-[10px] opacity-60 block mt-0.5">{o.desc}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
