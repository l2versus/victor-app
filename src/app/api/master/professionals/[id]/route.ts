import { requireMaster } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()

    const { id } = await params
    const body = await request.json()
    const { organizationId, active, name } = body

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!user) {
      return Response.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    if (!["ADMIN", "NUTRITIONIST"].includes(user.role)) {
      return Response.json({ error: "Usuário não é um profissional" }, { status: 400 })
    }

    // Update user fields
    if (active !== undefined || name !== undefined) {
      await prisma.user.update({
        where: { id },
        data: {
          ...(active !== undefined && { active: Boolean(active) }),
          ...(name !== undefined && { name: String(name) }),
        },
      })
    }

    // Update org association
    if (organizationId !== undefined) {
      const newOrgId = organizationId === "" || organizationId === null ? null : String(organizationId)

      // Validate org if provided
      if (newOrgId) {
        const org = await prisma.organization.findUnique({ where: { id: newOrgId } })
        if (!org) {
          return Response.json({ error: "Organização não encontrada" }, { status: 404 })
        }
      }

      if (user.role === "ADMIN") {
        await prisma.trainerProfile.update({
          where: { userId: id },
          data: { organizationId: newOrgId },
        })
      } else {
        await prisma.nutritionistProfile.update({
          where: { userId: id },
          data: { organizationId: newOrgId },
        })
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Master Professionals PATCH]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireMaster()

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!user) {
      return Response.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    // Soft delete: just deactivate
    await prisma.user.update({
      where: { id },
      data: { active: false },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[Master Professionals DELETE]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
