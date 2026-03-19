import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudentNav } from "@/components/student/nav"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">
        {children}
      </main>
      <StudentNav />
    </div>
  )
}
