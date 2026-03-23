import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminMobileNav } from "@/components/admin/mobile-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")

  // Single-session protection: if another device logged in, kick this one
  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  return (
    <div className="flex h-[100dvh] bg-[#060606] relative overflow-hidden">
      {/* ═══ PREMIUM BACKGROUND — Ironberg gym + cinematic layers ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Ironberg gym photo — base layer */}
        <img
          src="/img/ironberg.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.08) saturate(0.2)" }}
        />

        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/60 via-[#060606]/80 to-[#060606]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060606]/90 via-transparent to-[#060606]/70" />

        {/* Ember glow accents */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 60%)',
            top: '-15%', right: '-8%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 60%)',
            bottom: '10%', left: '-5%',
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
      </div>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:block">
        <AdminSidebar userName={session.email} />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-auto relative z-10 pb-20 lg:pb-0">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="lg:hidden">
        <AdminMobileNav />
      </div>
    </div>
  )
}
