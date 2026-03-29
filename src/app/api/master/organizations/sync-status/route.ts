import { requireMaster } from "@/lib/auth"
import { syncAllOrgStatuses } from "@/lib/org-status-sync"

// POST /api/master/organizations/sync-status — sync all org statuses based on subscriptions
export async function POST() {
  try {
    await requireMaster()

    const result = await syncAllOrgStatuses()

    return Response.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("[Master Org Sync Status]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
