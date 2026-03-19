"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ToggleLeft, ToggleRight, Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentForm } from "@/components/admin/students/student-form"

interface StudentDetailActionsProps {
  studentId: string
  status: "ACTIVE" | "INACTIVE" | "PENDING"
}

export function StudentDetailActions({ studentId, status }: StudentDetailActionsProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<Record<string, string> | null>(null)

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
    // Fetch current data
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
    </>
  )
}
