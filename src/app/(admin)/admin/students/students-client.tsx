"use client"

import { useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { StudentList } from "@/components/admin/students/student-list"
import { StudentForm } from "@/components/admin/students/student-form"

export function StudentsPageClient() {
  const [formOpen, setFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage your students and their training profiles."
        action={
          <Button onClick={() => setFormOpen(true)} size="md">
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      <StudentList key={refreshKey} />

      <StudentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
