import { getSession, validateSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NutriSidebar } from "@/components/nutri/nutri-sidebar"
import { NutriMobileNav } from "@/components/nutri/nutri-mobile-nav"

export default async function NutriLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "NUTRITIONIST") redirect("/login")

  // Single-session protection: if another device logged in, kick this one
  const valid = await validateSession(session)
  if (!valid) redirect("/login?expired=1")

  return (
    <div className="flex h-[100dvh] bg-[#060606] relative overflow-hidden">
      {/* ═══ PREMIUM BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle dark background */}
        <div className="absolute inset-0 bg-[#060606]" />

        {/* Emerald ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/[0.04] rounded-full blur-3xl" />

        {/* Minimal vignette — darken only edges for text readability */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(6,6,6,0.6) 100%)"
        }} />

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-600/30 to-transparent" />
      </div>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden lg:block">
        <NutriSidebar userName={session.email} />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-auto relative z-10 pb-20 lg:pb-0">
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="lg:hidden">
        <NutriMobileNav />
      </div>
    </div>
  )
}
