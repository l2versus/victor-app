"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Filter, Users, ArrowRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"

interface StudentUser {
  name: string
  email: string
  phone: string | null
  active: boolean
  avatar: string | null
}

interface StudentSession {
  startedAt: string
}

interface Student {
  id: string
  status: "ACTIVE" | "INACTIVE" | "PENDING"
  goals: string | null
  createdAt: string
  user: StudentUser
  sessions: StudentSession[]
}

interface StudentsResponse {
  students: Student[]
  total: number
  page: number
  pages: number
}

const STATUS_OPTIONS = [
  { value: "", label: "All Students" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
]

export function StudentList() {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  const fetchStudents = useCallback(async (s: string, st: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set("search", s)
      if (st) params.set("status", st)
      params.set("page", String(p))
      params.set("limit", "20")

      const res = await fetch(`/api/admin/students?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data: StudentsResponse = await res.json()
      setStudents(data.students)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents(search, status, page)
  }, [status, page, fetchStudents]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchStudents(value, status, 1)
    }, 400)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  const formatLastSession = (sessions: StudentSession[]) => {
    if (!sessions || sessions.length === 0) return "No sessions"
    const date = new Date(sessions[0].startedAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white/[0.03] border-neutral-800 hover:border-neutral-700 focus:border-red-500/50 transition-all duration-300"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="flex h-10 rounded-xl border border-neutral-800 bg-white/[0.03] pl-10 pr-8 py-2 text-sm text-white transition-all duration-300 hover:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none cursor-pointer min-w-[160px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-neutral-500">
          {total} student{total !== 1 ? "s" : ""} found
          {status && ` (${STATUS_OPTIONS.find(o => o.value === status)?.label})`}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && students.length === 0 && (
        <EmptyState
          icon={Users}
          title={search ? "No students found" : "No students yet"}
          description={
            search
              ? "Try adjusting your search or filters."
              : "Add your first student to start building training plans."
          }
        />
      )}

      {/* Student Cards Grid */}
      {!loading && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/admin/students/${student.id}`}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#111] p-5 transition-all duration-300 hover:border-neutral-700 hover:bg-[#151515] hover:shadow-lg hover:shadow-red-600/5 hover:scale-[1.02]"
            >
              {/* Ambient glow on hover */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-red-600/10 to-red-800/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                {/* Avatar + Name Row */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center text-red-400 text-sm font-bold border border-red-500/10 shrink-0 group-hover:border-red-500/25 group-hover:shadow-md group-hover:shadow-red-600/10 transition-all duration-300">
                    {student.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate group-hover:text-red-50 transition-colors">
                      {student.user.name}
                    </p>
                    <p className="text-neutral-500 text-xs truncate">
                      {student.user.email}
                    </p>
                  </div>
                  <Badge status={student.status.toLowerCase() as "active" | "inactive" | "pending"} />
                </div>

                {/* Info Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">
                    {formatLastSession(student.sessions)}
                  </span>
                  {student.goals && (
                    <span className="text-neutral-600 truncate max-w-[140px] pl-2">
                      {student.goals}
                    </span>
                  )}
                </div>

                {/* View arrow */}
                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:border-neutral-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>
          <span className="text-xs text-neutral-500 px-3">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:border-neutral-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
