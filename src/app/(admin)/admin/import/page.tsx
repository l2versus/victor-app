import { getSession } from "@/lib/auth"
import { getTrainerProfile } from "@/lib/admin"
import { ImportClient } from "./import-client"

export default async function ImportPage() {
  const session = await getSession()
  if (!session) return null

  try {
    await getTrainerProfile(session.userId)
  } catch {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-neutral-400 text-sm">Perfil de treinador não encontrado.</p>
      </div>
    )
  }

  return <ImportClient />
}
