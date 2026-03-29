import { requireMaster } from "@/lib/auth"

// TODO: Create MasterCost model in Prisma schema to enable cost tracking
// For now, returns empty array / stubs until the schema is ready

export async function GET() {
  try {
    await requireMaster()
    return Response.json([])
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMaster()
    await request.json()
    return Response.json({ error: "MasterCost model not yet in schema" }, { status: 501 })
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}

export async function PUT(request: Request) {
  try {
    await requireMaster()
    await request.json()
    return Response.json({ error: "MasterCost model not yet in schema" }, { status: 501 })
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireMaster()
    return Response.json({ error: "MasterCost model not yet in schema" }, { status: 501 })
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
}
