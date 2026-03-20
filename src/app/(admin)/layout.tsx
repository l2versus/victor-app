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
      {/* ═══ LIVING BACKGROUND — Ironberg Alive ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Primary ember — visible, breathing */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.03) 50%, transparent 70%)',
            top: '-20%', right: '-10%',
            animation: 'drift 20s ease-in-out infinite',
          }}
        />
        {/* Secondary ember — warm pulse */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, rgba(139,0,0,0.04) 50%, transparent 70%)',
            bottom: '-10%', left: '-5%',
            animation: 'drift 25s ease-in-out infinite reverse',
          }}
        />
        {/* Tertiary — subtle warmth center */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(255,80,50,0.06) 0%, transparent 60%)',
            top: '40%', left: '30%',
            animation: 'drift 18s ease-in-out infinite 3s',
          }}
        />

        {/* Mesh gradient overlay — depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060606]/30 to-[#060606]/60" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Noise grain for texture */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Top accent — red glow line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060606] to-transparent" />
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
