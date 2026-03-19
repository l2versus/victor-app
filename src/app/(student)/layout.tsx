import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudentNav } from "@/components/student/nav"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* ═══ Living Background ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Ember orbs */}
        <div
          className="absolute top-[-5%] right-[-10%] w-[300px] h-[300px] bg-red-600/[0.04] rounded-full blur-[100px]"
          style={{ animation: "student-orb-1 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[20%] left-[-5%] w-[250px] h-[250px] bg-red-800/[0.03] rounded-full blur-[80px]"
          style={{ animation: "student-orb-2 10s ease-in-out infinite 2s" }}
        />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />
      </div>

      {/* ═══ Content ═══ */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
        {children}
      </main>

      {/* ═══ Navigation ═══ */}
      <StudentNav />
    </div>
  )
}
