import { getSession } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { StudentsPageClient } from "./students-client"

export default async function StudentsPage() {
  const session = await getSession()
  if (!session) return null

  // Verify trainer profile exists
  try {
    await getTrainerProfile(session.userId)
  } catch {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-neutral-400 text-sm">Trainer profile not found.</p>
      </div>
    )
  }

  return <StudentsPageClient />
}
