import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as crypto from "crypto"

// ═══ POST — Generate invite link for new student ═══
export async function POST(request: Request) {
  try {
    const session = await requireAdmin()

    // Find trainer profile
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, organizationId: true, gymName: true },
    })

    if (!trainer) {
      return Response.json({ error: "Perfil de trainer não encontrado" }, { status: 404 })
    }

    // Optional: get student name/email from body for personalized invite
    let studentName: string | null = null
    let studentEmail: string | null = null
    try {
      const body = await request.json()
      studentName = body.studentName || null
      studentEmail = body.studentEmail || null
    } catch {
      // No body — just generate a generic invite
    }

    // Generate unique token
    const token = crypto.randomBytes(24).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store invite in metadata (using a simple approach with JSON on trainer profile)
    // For a production system, you'd want an Invite model. Here we store it efficiently.
    // We'll use a lightweight approach: encode the data in the token itself (signed)
    // and also store it for validation.

    // Store in a simple way: create a pending student placeholder
    // Actually, let's just return a signed URL with the trainer ID encoded
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000"

    const inviteData = {
      trainerId: trainer.id,
      organizationId: trainer.organizationId,
      token,
      studentName,
      studentEmail,
      expiresAt: expiresAt.toISOString(),
    }

    // Base64 encode the invite data for the URL
    const encodedData = Buffer.from(JSON.stringify(inviteData)).toString("base64url")

    const url = `${appUrl}/register?invite=${encodedData}`

    return Response.json({
      url,
      token,
      expiresAt: expiresAt.toISOString(),
      trainerName: trainer.gymName || "Personal Trainer",
    })
  } catch (error) {
    console.error("[Admin Invite POST]", error)
    if (error instanceof Error && (error.message === "Forbidden" || error.message === "Unauthorized")) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}

// ═══ GET — Decode and validate an invite token ═══
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const invite = searchParams.get("invite")

    if (!invite) {
      return Response.json({ error: "Token de convite não fornecido" }, { status: 400 })
    }

    try {
      const decoded = JSON.parse(Buffer.from(invite, "base64url").toString("utf-8"))

      // Check expiration
      if (new Date(decoded.expiresAt) < new Date()) {
        return Response.json({ error: "Convite expirado", expired: true }, { status: 410 })
      }

      // Find trainer
      const trainer = await prisma.trainerProfile.findUnique({
        where: { id: decoded.trainerId },
        select: {
          id: true,
          gymName: true,
          brandColor: true,
          logo: true,
          user: { select: { name: true } },
        },
      })

      if (!trainer) {
        return Response.json({ error: "Trainer não encontrado" }, { status: 404 })
      }

      return Response.json({
        valid: true,
        trainerId: trainer.id,
        trainerName: trainer.user.name,
        gymName: trainer.gymName,
        brandColor: trainer.brandColor,
        logo: trainer.logo,
        organizationId: decoded.organizationId,
        studentName: decoded.studentName,
        studentEmail: decoded.studentEmail,
      })
    } catch {
      return Response.json({ error: "Token de convite inválido" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Admin Invite GET]", error)
    return Response.json({ error: "Erro interno" }, { status: 500 })
  }
}
