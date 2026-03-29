import { requireMaster } from "@/lib/auth"
import { BotsStudioClient } from "./bots-studio-client"

export default async function BotsPage() {
  await requireMaster()
  return <BotsStudioClient />
}
