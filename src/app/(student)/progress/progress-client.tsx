"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Camera, Plus, X, ChevronLeft, ChevronRight, Trash2,
  Scale, Percent, StickyNote, ImageIcon, Share2, Loader2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Photo = {
  id: string
  imageUrl: string
  category: string
  weight: number | null
  bodyFat: number | null
  notes: string | null
  createdAt: string
}

const CATEGORIES = [
  { value: "FRONT", label: "Frente", icon: "🧍" },
  { value: "BACK", label: "Costas", icon: "🔙" },
  { value: "SIDE_LEFT", label: "Lateral Esq", icon: "◀️" },
  { value: "SIDE_RIGHT", label: "Lateral Dir", icon: "▶️" },
]

export function ProgressClient({ photos: initialPhotos }: { photos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [showUpload, setShowUpload] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<[string | null, string | null]>([null, null])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ category: "FRONT", weight: "", bodyFat: "", notes: "" })
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const filtered = selectedCategory ? photos.filter(p => p.category === selectedCategory) : photos

  async function handleUpload() {
    if (!preview) return
    setUploading(true)
    try {
      const res = await fetch("/api/student/progress-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: preview,
          category: form.category,
          weight: form.weight ? Number(form.weight) : null,
          bodyFat: form.bodyFat ? Number(form.bodyFat) : null,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPhotos([{ ...data.photo, createdAt: new Date().toISOString() }, ...photos])
        setShowUpload(false)
        setPreview(null)
        setForm({ category: "FRONT", weight: "", bodyFat: "", notes: "" })
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  async function deletePhoto(id: string) {
    await fetch(`/api/student/progress-photos?id=${id}`, { method: "DELETE" })
    setPhotos(photos.filter(p => p.id !== id))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function shareTransformation() {
    if (!comparePhotos || sharing) return
    setSharing(true)
    try {
      const [before, after] = comparePhotos
      const daysBetween = Math.round(
        (new Date(after.createdAt).getTime() - new Date(before.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const weightDiff = before.weight && after.weight ? after.weight - before.weight : null

      let content = "🔄 Minha Transformação!"
      if (daysBetween > 0) content += `\n📅 ${daysBetween} dias de evolução`
      if (weightDiff !== null) {
        const sign = weightDiff > 0 ? "+" : ""
        content += `\n⚖️ ${sign}${weightDiff.toFixed(1)} kg`
      }
      if (before.bodyFat && after.bodyFat) {
        const fatDiff = after.bodyFat - before.bodyFat
        const sign = fatDiff > 0 ? "+" : ""
        content += `\n📊 ${sign}${fatDiff.toFixed(1)}% gordura`
      }

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl: after.imageUrl,
          type: "TRANSFORMATION",
          metadata: {
            beforePhotoId: before.id,
            afterPhotoId: after.id,
            beforeImageUrl: before.imageUrl,
            afterImageUrl: after.imageUrl,
            beforeDate: before.createdAt,
            afterDate: after.createdAt,
            beforeWeight: before.weight,
            afterWeight: after.weight,
            beforeBodyFat: before.bodyFat,
            afterBodyFat: after.bodyFat,
            daysBetween,
          },
        }),
      })
      if (res.ok) {
        setShared(true)
        setTimeout(() => setShared(false), 3000)
      }
    } catch { /* ignore */ }
    setSharing(false)
  }

  function toggleSelect(id: string) {
    if (!compareMode) return
    if (selected[0] === id) setSelected([null, selected[1]])
    else if (selected[1] === id) setSelected([selected[0], null])
    else if (!selected[0]) setSelected([id, selected[1]])
    else if (!selected[1]) setSelected([selected[0], id])
  }

  const comparePhotos = compareMode && selected[0] && selected[1]
    ? [photos.find(p => p.id === selected[0])!, photos.find(p => p.id === selected[1])!]
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-400" />
            Fotos de Progresso
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">{photos.length} fotos registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCompareMode(!compareMode); setSelected([null, null]) }}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-medium min-h-[44px] transition-all",
              compareMode ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" : "bg-white/[0.04] text-neutral-400 border border-white/[0.06]"
            )}
          >
            {compareMode ? "Sair Comparação" : "Comparar"}
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-red-600/20"
          >
            {showUpload ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Compare view */}
      {comparePhotos && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Comparação</p>
            <button
              onClick={shareTransformation}
              disabled={sharing || shared}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all min-h-[44px]",
                shared
                  ? "bg-green-600/20 text-green-400"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20 hover:from-red-500 hover:to-red-600"
              )}
            >
              {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {sharing ? "Postando..." : shared ? "Postado!" : "Compartilhar"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {comparePhotos.map((p, i) => (
              <div key={p.id} className="space-y-2">
                <div className="relative">
                  <img src={p.imageUrl} alt={`Foto ${i + 1}`} className="w-full aspect-[3/4] object-cover rounded-xl" />
                  <span className={cn(
                    "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    i === 0 ? "bg-neutral-900/70 text-neutral-300" : "bg-red-600/80 text-white"
                  )}>
                    {i === 0 ? "Antes" : "Depois"}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-neutral-500">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  {p.weight && <p className="text-xs text-white font-semibold">{p.weight} kg</p>}
                  {p.bodyFat && <p className="text-[10px] text-neutral-400">{p.bodyFat}% gordura</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 space-y-4">
              <input type="file" ref={fileRef} accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full aspect-[3/4] object-cover rounded-xl" />
                  <button onClick={() => setPreview(null)} className="absolute top-2 right-2 p-2 rounded-full bg-black/50">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/[0.1] flex flex-col items-center justify-center gap-3 text-neutral-500 hover:border-red-500/30 transition-colors">
                  <Camera className="w-10 h-10" />
                  <span className="text-sm">Tirar foto ou selecionar</span>
                </button>
              )}
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => setForm({ ...form, category: c.value })}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[11px] font-medium border transition-all text-center",
                      form.category === c.value ? "bg-red-600/20 text-red-400 border-red-500/20" : "bg-white/[0.04] text-neutral-500 border-white/[0.06]"
                    )}>
                    <span className="block text-sm mb-0.5">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input type="number" step="0.1" placeholder="Peso (kg)" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                </div>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input type="number" step="0.1" placeholder="% Gordura" value={form.bodyFat} onChange={e => setForm({ ...form, bodyFat: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
                </div>
              </div>
              <input type="text" placeholder="Observação (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/30 min-h-[44px]" />
              <button onClick={handleUpload} disabled={!preview || uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold disabled:opacity-40 min-h-[44px] shadow-lg shadow-red-600/20">
                {uploading ? "Salvando..." : "Salvar Foto"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setSelectedCategory(null)}
          className={cn("shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
            !selectedCategory ? "bg-red-600/20 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]")}>
          Todas
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setSelectedCategory(selectedCategory === c.value ? null : c.value)}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
              selectedCategory === c.value ? "bg-red-600/20 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-neutral-500 border border-white/[0.06]")}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Nenhuma foto ainda</p>
          <p className="text-neutral-600 text-xs mt-1">Tire sua primeira foto para acompanhar a evolução!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map(photo => {
            const isSelected = selected.includes(photo.id)
            return (
              <motion.div
                key={photo.id}
                layout
                onClick={() => toggleSelect(photo.id)}
                className={cn(
                  "relative group rounded-xl overflow-hidden aspect-[3/4] border-2 transition-all",
                  isSelected ? "border-blue-500" : "border-transparent",
                  compareMode && "cursor-pointer"
                )}
              >
                <img src={photo.imageUrl} alt={photo.category} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-[9px] text-white/80">
                    {new Date(photo.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </p>
                  {photo.weight && <p className="text-[10px] text-white font-semibold">{photo.weight}kg</p>}
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[8px] text-white/70 uppercase tracking-wider font-bold">
                  {CATEGORIES.find(c => c.value === photo.category)?.icon}
                </div>
                {!compareMode && (
                  <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id) }}
                    className="absolute top-1 right-1 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                )}
                {compareMode && isSelected && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {selected[0] === photo.id ? "1" : "2"}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
