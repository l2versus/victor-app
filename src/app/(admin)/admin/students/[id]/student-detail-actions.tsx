"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { ToggleLeft, ToggleRight, Pencil, Loader2, Trash2, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/admin/students/student-form"

interface StudentDetailActionsProps {
  studentId: string
  studentName: string
  status: "ACTIVE" | "INACTIVE" | "PENDING"
}

export function StudentDetailActions({ studentId, studentName, status }: StudentDetailActionsProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<Record<string, string> | null>(null)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: "PATCH" })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setToggling(false)
    }
  }

  const handleEditClick = async () => {
    const res = await fetch(`/api/admin/students/${studentId}`)
    if (!res.ok) return
    const { student } = await res.json()

    setEditData({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.user.phone || "",
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      gender: student.gender || "",
      weight: student.weight?.toString() || "",
      height: student.height?.toString() || "",
      goals: student.goals || "",
      restrictions: student.restrictions
        ? typeof student.restrictions === "string"
          ? student.restrictions
          : JSON.stringify(student.restrictions)
        : "",
      notes: student.notes || "",
    })
    setEditOpen(true)
  }

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "confirmar" || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" })
      if (res.ok) {
        setShowDeleteModal(false)
        router.push("/admin/students")
      }
    } catch { /* ignore */ }
    setDeleting(false)
  }

  const isActive = status === "ACTIVE"

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleEditClick}>
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </Button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20"
          } disabled:opacity-50`}
        >
          {toggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isActive ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          {isActive ? "Desativar" : "Ativar"}
        </button>
        <button
          onClick={() => { setShowDeleteModal(true); setConfirmText("") }}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir
        </button>
      </div>

      {editData && (
        <StudentForm
          open={editOpen}
          onClose={() => {
            setEditOpen(false)
            setEditData(null)
          }}
          onSuccess={() => router.refresh()}
          editData={editData as unknown as Parameters<typeof StudentForm>[0]["editData"]}
        />
      )}

      {/* Delete Confirmation Modal — double check with "confirmar" text */}
      {showDeleteModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div
            className="w-full max-w-sm bg-[#111] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-600/15 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Excluir aluno permanentemente?</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Essa ação é <span className="text-red-400 font-semibold">irreversível</span>. Todos os dados de{" "}
                <span className="text-white font-semibold">{studentName}</span> serão apagados permanentemente:
              </p>
              <ul className="text-[11px] text-neutral-500 mt-2 space-y-0.5 text-left pl-4">
                <li>• Treinos e histórico de sessões</li>
                <li>• Fotos de progresso e medidas</li>
                <li>• Mensagens e notificações</li>
                <li>• Assinatura e pagamentos</li>
                <li>• Posts e stories na comunidade</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div>
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium block mb-1.5">
                Digite <span className="text-red-400 font-bold">confirmar</span> para excluir
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="confirmar"
                autoFocus
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-red-500/50 text-center"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-sm font-medium hover:bg-white/[0.08] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText.toLowerCase() !== "confirmar" || deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-500 transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.getElementById("modal-portal") || document.body
      )}
    </>
  )
}
