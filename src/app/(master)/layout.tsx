import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MasterSidebar } from "@/components/master/master-sidebar"
import { MasterMobileNav } from "@/components/master/master-mobile-nav"

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "MASTER") redirect("/login")

  // Single-session protection: if another device logged in, kick this one
  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  return (
    <div className="flex h-[100dvh] bg-[#060606] relative overflow-hidden">
      {/* Top accent line — violet */}
      <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-600/30 to-transparent z-20 pointer-events-none" />

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:block">
        <MasterSidebar userName={session.email} />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-auto relative z-10 pb-20 lg:pb-0">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="lg:hidden">
        <MasterMobileNav />
      </div>
    </div>
  )
}
